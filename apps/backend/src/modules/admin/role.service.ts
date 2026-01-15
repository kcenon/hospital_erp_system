import { Injectable, Logger } from '@nestjs/common';
import { RoleRepository, RoleWithPermissions } from './role.repository';
import { RoleResponseDto, RoleWithPermissionsDto, PermissionDto } from './dto';
import { RoleNotFoundException } from './exceptions';

/**
 * Service for role operations
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-061
 */
@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(private readonly roleRepo: RoleRepository) {}

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
        (rp) =>
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
