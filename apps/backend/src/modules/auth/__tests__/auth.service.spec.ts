import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { PrismaService } from '../../../prisma';
import {
  createTestUser,
  createTestUserWithRoles,
  createTestRole,
  createLockedUser,
  createInactiveUser,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let sessionService: jest.Mocked<SessionService>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;

  const mockSessionService = {
    create: jest.fn(),
    isValid: jest.fn(),
    refresh: jest.fn(),
    destroy: jest.fn(),
    destroyAllForUser: jest.fn(),
  };

  const mockJwtTokenService = {
    generateTokenPair: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sessionService = module.get(SessionService);
    jwtTokenService = module.get(JwtTokenService);

    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const role = createTestRole({ code: 'DOCTOR' });
      const user = createTestUserWithRoles(undefined, [role]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.user.update.mockResolvedValue(user);

      const result = await service.validateUser(user.username, 'password123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(user.id);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({
          failedLoginCount: 0,
          lockedUntil: null,
        }),
      });
    });

    it('should return null when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const user = createTestUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.user.update.mockResolvedValue(user);

      const result = await service.validateUser(user.username, 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should increment failed login count on failure', async () => {
      const user = createTestUser({ failedLoginCount: 2 });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.user.update.mockResolvedValue(user);

      await service.validateUser(user.username, 'wrongpassword');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({
          failedLoginCount: 3,
        }),
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      const user = createTestUser({ failedLoginCount: 4 });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.user.update.mockResolvedValue(user);

      await service.validateUser(user.username, 'wrongpassword');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({
          failedLoginCount: 5,
          lockedUntil: expect.any(Date),
        }),
      });
    });

    it('should throw ForbiddenException when account is locked', async () => {
      const user = createLockedUser();
      prismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.validateUser(user.username, 'password')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is deactivated', async () => {
      const user = createInactiveUser();
      prismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.validateUser(user.username, 'password')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('login', () => {
    const deviceInfo = {
      deviceType: 'PC' as const,
      browser: 'Chrome',
      os: 'Windows',
      userAgent: 'Mozilla/5.0',
    };
    const ipAddress = '192.168.1.1';

    it('should return tokens when login is successful', async () => {
      const role = createTestRole({ code: 'DOCTOR' });
      const user = createTestUserWithRoles(undefined, [role]);
      const mockTokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      prismaService.userRole.findMany.mockResolvedValue(
        user.userRoles.map((ur) => ({ ...ur, role: { ...ur.role, isActive: true } })),
      );
      prismaService.rolePermission.findMany.mockResolvedValue([]);
      mockSessionService.create.mockResolvedValue('session-id');
      mockJwtTokenService.generateTokenPair.mockReturnValue(mockTokenPair);

      const result = await service.login(user, deviceInfo, ipAddress);

      expect(result.tokens.accessToken).toBe(mockTokenPair.accessToken);
      expect(result.tokens.refreshToken).toBe(mockTokenPair.refreshToken);
      expect(result.user.id).toBe(user.id);
      expect(mockSessionService.create).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should destroy session', async () => {
      const sessionId = 'session-id';

      await service.logout(sessionId);

      expect(mockSessionService.destroy).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('logoutAll', () => {
    it('should destroy all sessions for user', async () => {
      const userId = 'user-id';

      await service.logoutAll(userId);

      expect(mockSessionService.destroyAllForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('refreshTokens', () => {
    it('should return new access token', async () => {
      const user = createTestUser();
      const payload = {
        sub: user.id,
        sessionId: 'session-id',
        jti: 'jti-id',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };
      const mockTokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      mockJwtTokenService.verifyRefreshToken.mockReturnValue(payload);
      mockSessionService.isValid.mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.userRole.findMany.mockResolvedValue([]);
      prismaService.rolePermission.findMany.mockResolvedValue([]);
      mockSessionService.refresh.mockResolvedValue(undefined);
      mockJwtTokenService.generateTokenPair.mockReturnValue(mockTokenPair);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe(mockTokenPair.accessToken);
      expect(mockSessionService.refresh).toHaveBeenCalledWith(payload.sessionId);
    });

    it('should throw when refresh token is invalid', async () => {
      mockJwtTokenService.verifyRefreshToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when session is expired', async () => {
      const payload = {
        sub: 'user-id',
        sessionId: 'expired-session',
        jti: 'jti-id',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockJwtTokenService.verifyRefreshToken.mockReturnValue(payload);
      mockSessionService.isValid.mockResolvedValue(false);

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when user not found', async () => {
      const payload = {
        sub: 'nonexistent-user',
        sessionId: 'session-id',
        jti: 'jti-id',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockJwtTokenService.verifyRefreshToken.mockReturnValue(payload);
      mockSessionService.isValid.mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when user is inactive', async () => {
      const user = createInactiveUser();
      const payload = {
        sub: user.id,
        sessionId: 'session-id',
        jti: 'jti-id',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      mockJwtTokenService.verifyRefreshToken.mockReturnValue(payload);
      mockSessionService.isValid.mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = createTestUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.user.update.mockResolvedValue(user);

      await service.changePassword(user.id, {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({
          passwordHash: 'new-hash',
        }),
      });
    });

    it('should throw when current password is incorrect', async () => {
      const user = createTestUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.user.findUnique.mockResolvedValue(user);

      await expect(
        service.changePassword(user.id, {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when new password is same as current', async () => {
      const user = createTestUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prismaService.user.findUnique.mockResolvedValue(user);

      await expect(
        service.changePassword(user.id, {
          currentPassword: 'samepassword',
          newPassword: 'samepassword',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', {
          currentPassword: 'password',
          newPassword: 'newpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
