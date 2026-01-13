import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma';
import { SessionService, JwtTokenService } from './';
import {
  TokenPair,
  DeviceInfo,
  CreateSessionInput,
} from '../interfaces';
import {
  LoginResponseDto,
  TokenResponseDto,
  UserInfoDto,
  ChangePasswordDto,
} from '../dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  /**
   * Validate user credentials
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is deactivated');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        `Account is locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      return null;
    }

    await this.handleSuccessfulLogin(user);

    return user;
  }

  /**
   * Login and generate tokens
   */
  async login(
    user: User,
    deviceInfo: DeviceInfo,
    ipAddress: string,
  ): Promise<LoginResponseDto> {
    const roles = await this.getUserRoles(user.id);
    const permissions = await this.getUserPermissions(user.id);

    const sessionInput: CreateSessionInput = {
      userId: user.id,
      username: user.username,
      roles: roles.map((r) => r.code),
      deviceInfo,
      ipAddress,
    };

    const sessionId = await this.sessionService.create(sessionInput);

    const tokenPair = this.jwtTokenService.generateTokenPair({
      sub: user.id,
      username: user.username,
      roles: roles.map((r) => r.code),
      permissions: permissions.map((p) => p.code),
      sessionId,
    });

    this.logger.log(`User ${user.username} logged in successfully`);

    return new LoginResponseDto({
      user: new UserInfoDto({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email ?? undefined,
        department: user.department ?? undefined,
        position: user.position ?? undefined,
        roles: roles.map((r) => r.code),
        permissions: permissions.map((p) => p.code),
      }),
      tokens: new TokenResponseDto({
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: 'Bearer',
      }),
    });
  }

  /**
   * Logout and invalidate session
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionService.destroy(sessionId);
    this.logger.log(`Session ${sessionId} destroyed`);
  }

  /**
   * Logout from all sessions
   */
  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.destroyAllForUser(userId);
    this.logger.log(`All sessions destroyed for user ${userId}`);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const payload = this.jwtTokenService.verifyRefreshToken(refreshToken);

    const isSessionValid = await this.sessionService.isValid(payload.sessionId);
    if (!isSessionValid) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const roles = await this.getUserRoles(user.id);
    const permissions = await this.getUserPermissions(user.id);

    await this.sessionService.refresh(payload.sessionId);

    const newTokenPair = this.jwtTokenService.generateTokenPair({
      sub: user.id,
      username: user.username,
      roles: roles.map((r) => r.code),
      permissions: permissions.map((p) => p.code),
      sessionId: payload.sessionId,
    });

    this.logger.log(`Tokens refreshed for user ${user.username}`);

    return newTokenPair;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ForbiddenException(
        'New password must be different from current password',
      );
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Password changed for user ${user.username}`);
  }

  /**
   * Get user roles
   */
  private async getUserRoles(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return userRoles
      .filter((ur) => ur.role.isActive)
      .map((ur) => ur.role);
  }

  /**
   * Get user permissions through roles
   */
  private async getUserPermissions(userId: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: {
          userRoles: {
            some: { userId },
          },
          isActive: true,
        },
      },
      include: { permission: true },
    });

    const uniquePermissions = new Map(
      rolePermissions.map((rp) => [rp.permission.id, rp.permission]),
    );

    return Array.from(uniquePermissions.values());
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(user: User): Promise<void> {
    const failedCount = user.failedLoginCount + 1;
    const updateData: { failedLoginCount: number; lockedUntil?: Date } = {
      failedLoginCount: failedCount,
    };

    if (failedCount >= this.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCK_DURATION_MINUTES);
      updateData.lockedUntil = lockUntil;

      this.logger.warn(
        `User ${user.username} account locked due to ${failedCount} failed attempts`,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }
}
