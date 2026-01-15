import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { SessionService, RbacService } from '../auth/services';
import { AuditService } from './audit.service';
import { UserAdminRepository, UserWithRoles } from './user-admin.repository';
import { RoleRepository } from './role.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  ListUsersDto,
  UserResponseDto,
  CreateUserResponseDto,
  ResetPasswordResponseDto,
  RoleBasicDto,
  PaginatedResultDto,
} from './dto';
import {
  UserNotFoundException,
  DuplicateUsernameException,
  DuplicateEmployeeIdException,
  RoleNotFoundException,
  RoleAlreadyAssignedException,
  RoleNotAssignedException,
  CannotDeactivateLastAdminException,
  CannotRemoveLastAdminRoleException,
} from './exceptions';

/**
 * Service for user administration operations
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-060~061
 */
@Injectable()
export class UserAdminService {
  private readonly logger = new Logger(UserAdminService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly TEMP_PASSWORD_LENGTH = 12;

  constructor(
    private readonly userRepo: UserAdminRepository,
    private readonly roleRepo: RoleRepository,
    private readonly sessionService: SessionService,
    private readonly rbacService: RbacService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new user account
   * Requirements: REQ-FR-060
   */
  async createUser(dto: CreateUserDto, adminId: string): Promise<CreateUserResponseDto> {
    await this.validateUniqueness(dto.username, dto.employeeId);
    await this.validateRoles(dto.roleIds);

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, this.SALT_ROUNDS);

    const user = await this.userRepo.create({
      employeeId: dto.employeeId,
      username: dto.username,
      passwordHash,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      department: dto.department,
      position: dto.position,
      roleIds: dto.roleIds,
      assignedBy: adminId,
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      resourceType: 'users',
      resourceId: user.id,
      changes: { new: this.sanitizeUserForAudit(user) },
    });

    this.logger.log(`User created: ${user.username} (ID: ${user.id}) by admin ${adminId}`);

    return new CreateUserResponseDto({
      ...this.mapUserToResponse(user),
      temporaryPassword: tempPassword,
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return this.mapUserToResponse(user);
  }

  /**
   * List users with pagination and filters
   */
  async listUsers(params: ListUsersDto): Promise<PaginatedResultDto<UserResponseDto>> {
    const { users, total } = await this.userRepo.findMany(params);
    const mappedUsers = users.map((u) => this.mapUserToResponse(u));
    return new PaginatedResultDto(mappedUsers, total, params.page || 1, params.limit || 20);
  }

  /**
   * Update user account
   */
  async updateUser(id: string, dto: UpdateUserDto, adminId: string): Promise<UserResponseDto> {
    const existing = await this.userRepo.findById(id);
    if (!existing) {
      throw new UserNotFoundException(id);
    }

    const updated = await this.userRepo.update(id, dto);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resourceType: 'users',
      resourceId: id,
      changes: {
        old: this.sanitizeUserForAudit(existing),
        new: this.sanitizeUserForAudit(updated),
      },
    });

    this.logger.log(`User updated: ${updated.username} (ID: ${id}) by admin ${adminId}`);

    return this.mapUserToResponse(updated);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id: string, adminId: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }

    const isAdmin = user.userRoles.some((ur) => ur.role.code === 'ADMIN');
    if (isAdmin) {
      const adminCount = await this.userRepo.countActiveAdmins();
      if (adminCount <= 1) {
        throw new CannotDeactivateLastAdminException();
      }
    }

    await this.userRepo.update(id, { isActive: false });
    await this.sessionService.destroyAllForUser(id);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resourceType: 'users',
      resourceId: id,
      changes: {
        old: { isActive: true },
        new: { isActive: false },
      },
    });

    this.logger.log(`User deactivated: ${user.username} (ID: ${id}) by admin ${adminId}`);
  }

  /**
   * Reset user password
   */
  async resetPassword(id: string, adminId: string): Promise<ResetPasswordResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, this.SALT_ROUNDS);

    await this.userRepo.update(id, {
      passwordHash,
      passwordChangedAt: null,
    });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resourceType: 'users',
      resourceId: id,
      changes: { new: { passwordReset: true } },
    });

    this.logger.log(`Password reset for user: ${user.username} (ID: ${id}) by admin ${adminId}`);

    return new ResetPasswordResponseDto(tempPassword);
  }

  /**
   * Assign a role to a user
   * Requirements: REQ-FR-061
   */
  async assignRole(userId: string, roleId: string, adminId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    const hasRole = await this.userRepo.hasRole(userId, roleId);
    if (hasRole) {
      throw new RoleAlreadyAssignedException(userId, roleId);
    }

    await this.userRepo.assignRole(userId, roleId, adminId);
    await this.rbacService.invalidateCache(userId);

    await this.auditService.log({
      action: AuditAction.CREATE,
      resourceType: 'user_roles',
      resourceId: userId,
      changes: { new: { userId, roleId, roleCode: role.code } },
    });

    this.logger.log(
      `Role ${role.code} assigned to user ${user.username} (ID: ${userId}) by admin ${adminId}`,
    );
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: string, roleId: string, adminId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    const hasRole = await this.userRepo.hasRole(userId, roleId);
    if (!hasRole) {
      throw new RoleNotAssignedException(userId, roleId);
    }

    if (role.code === 'ADMIN') {
      const adminRoleCount = await this.userRepo.countUsersWithAdminRole();
      if (adminRoleCount <= 1) {
        throw new CannotRemoveLastAdminRoleException();
      }
    }

    await this.userRepo.removeRole(userId, roleId);
    await this.rbacService.invalidateCache(userId);

    await this.auditService.log({
      action: AuditAction.DELETE,
      resourceType: 'user_roles',
      resourceId: userId,
      changes: { old: { userId, roleId, roleCode: role.code } },
    });

    this.logger.log(
      `Role ${role.code} removed from user ${user.username} (ID: ${userId}) by admin ${adminId}`,
    );
  }

  /**
   * Validate username and employee ID uniqueness
   */
  private async validateUniqueness(username: string, employeeId: string): Promise<void> {
    const existingByUsername = await this.userRepo.findByUsername(username);
    if (existingByUsername) {
      throw new DuplicateUsernameException(username);
    }

    const existingByEmployeeId = await this.userRepo.findByEmployeeId(employeeId);
    if (existingByEmployeeId) {
      throw new DuplicateEmployeeIdException(employeeId);
    }
  }

  /**
   * Validate that all role IDs exist
   */
  private async validateRoles(roleIds: string[]): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }

    const nonExistent = await this.roleRepo.getNonExistentRoleIds(roleIds);
    if (nonExistent.length > 0) {
      throw new RoleNotFoundException(nonExistent.join(', '));
    }
  }

  /**
   * Generate a secure temporary password
   * Uses crypto.randomInt() for unbiased uniform distribution
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < this.TEMP_PASSWORD_LENGTH; i++) {
      password += chars[randomInt(chars.length)];
    }
    return password;
  }

  /**
   * Map user entity to response DTO
   */
  private mapUserToResponse(user: UserWithRoles): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      employeeId: user.employeeId,
      username: user.username,
      name: user.name,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      department: user.department ?? undefined,
      position: user.position ?? undefined,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles
        .filter((ur) => ur.role.isActive)
        .map(
          (ur) =>
            new RoleBasicDto({
              id: ur.role.id,
              code: ur.role.code,
              name: ur.role.name,
            }),
        ),
    });
  }

  /**
   * Sanitize user data for audit logging (remove sensitive fields)
   */
  private sanitizeUserForAudit(user: UserWithRoles): Record<string, unknown> {
    return {
      id: user.id,
      employeeId: user.employeeId,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      position: user.position,
      isActive: user.isActive,
      roles: user.userRoles.map((ur) => ur.role.code),
    };
  }
}
