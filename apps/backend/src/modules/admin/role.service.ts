import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { RoleRepository, RoleWithPermissions } from './role.repository';
import { RoleResponseDto, RoleWithPermissionsDto, PermissionDto } from './dto';
import {
  RoleNotFoundException,
  DuplicateRoleCodeException,
  RoleHasUsersException,
  PermissionNotFoundException,
} from './exceptions';
import { RbacService } from '../auth/services';

/**
 * Service for role operations
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-061
 */
@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly rbacService: RbacService,
  ) {}

  /**
   * Get all roles
   */
  async listRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepo.findAll();
    return roles.map((role) => this.mapRoleToResponse(role));
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new RoleNotFoundException(id);
    }
    return this.mapRoleToResponse(role);
  }

  /**
   * Get role with permissions
   */
  async getRoleWithPermissions(id: string): Promise<RoleWithPermissionsDto> {
    const role = await this.roleRepo.findByIdWithPermissions(id);
    if (!role) {
      throw new RoleNotFoundException(id);
    }
    return this.mapRoleWithPermissionsToResponse(role);
  }

  /**
   * Get all roles with permissions
   */
  async listRolesWithPermissions(): Promise<RoleWithPermissionsDto[]> {
    const roles = await this.roleRepo.findAllWithPermissions();
    return roles.map((role) => this.mapRoleWithPermissionsToResponse(role));
  }

  /**
   * Create a new role
   */
  async createRole(data: {
    code: string;
    name: string;
    description?: string;
    level?: number;
  }): Promise<RoleResponseDto> {
    const existing = await this.roleRepo.findByCode(data.code);
    if (existing) {
      throw new DuplicateRoleCodeException(data.code);
    }

    const role = await this.roleRepo.create(data);
    this.logger.log(`Role created: ${role.code}`);
    return this.mapRoleToResponse(role);
  }

  /**
   * Update a role
   */
  async updateRole(
    id: string,
    data: { name?: string; description?: string; level?: number },
  ): Promise<RoleResponseDto> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new RoleNotFoundException(id);
    }

    const updated = await this.roleRepo.update(id, data);
    await this.rbacService.invalidateAllCaches();
    this.logger.log(`Role updated: ${updated.code}`);
    return this.mapRoleToResponse(updated);
  }

  /**
   * Delete a role (only if no users are assigned)
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new RoleNotFoundException(id);
    }

    const userCount = await this.roleRepo.countUsersWithRole(id);
    if (userCount > 0) {
      throw new RoleHasUsersException(id);
    }

    await this.roleRepo.delete(id);
    await this.rbacService.invalidateAllCaches();
    this.logger.log(`Role deleted: ${role.code}`);
  }

  /**
   * Add permission to a role
   */
  async addPermission(roleId: string, permissionId: string): Promise<RoleWithPermissionsDto> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    const permission = await this.roleRepo.findPermissionById(permissionId);
    if (!permission) {
      throw new PermissionNotFoundException(permissionId);
    }

    const hasPermission = await this.roleRepo.hasPermission(roleId, permissionId);
    if (hasPermission) {
      throw new ConflictException(`Role already has permission: ${permission.code}`);
    }

    await this.roleRepo.addPermission(roleId, permissionId);
    await this.rbacService.invalidateAllCaches();
    this.logger.log(`Permission ${permission.code} added to role ${role.code}`);

    return this.getRoleWithPermissions(roleId);
  }

  /**
   * Remove permission from a role
   */
  async removePermission(roleId: string, permissionId: string): Promise<RoleWithPermissionsDto> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    const permission = await this.roleRepo.findPermissionById(permissionId);
    if (!permission) {
      throw new PermissionNotFoundException(permissionId);
    }

    const hasPermission = await this.roleRepo.hasPermission(roleId, permissionId);
    if (!hasPermission) {
      throw new ConflictException(`Role does not have permission: ${permission.code}`);
    }

    await this.roleRepo.removePermission(roleId, permissionId);
    await this.rbacService.invalidateAllCaches();
    this.logger.log(`Permission ${permission.code} removed from role ${role.code}`);

    return this.getRoleWithPermissions(roleId);
  }

  /**
   * Map role entity to response DTO
   */
  private mapRoleToResponse(role: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    level: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): RoleResponseDto {
    return new RoleResponseDto({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description ?? undefined,
      level: role.level,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }

  /**
   * Map role with permissions to response DTO
   */
  private mapRoleWithPermissionsToResponse(role: RoleWithPermissions): RoleWithPermissionsDto {
    return new RoleWithPermissionsDto({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description ?? undefined,
      level: role.level,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map(
        (rp: {
          permission: {
            id: string;
            code: string;
            resource: string;
            action: string;
            description: string | null;
          };
        }) =>
          new PermissionDto({
            id: rp.permission.id,
            code: rp.permission.code,
            resource: rp.permission.resource,
            action: rp.permission.action,
            description: rp.permission.description ?? undefined,
          }),
      ),
    });
  }
}
