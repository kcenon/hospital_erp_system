import { Injectable, Logger } from '@nestjs/common';
import { Role, Permission, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma';

/**
 * Repository for role operations
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-061
 */
@Injectable()
export class RoleRepository {
  private readonly logger = new Logger(RoleRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find role by ID
   */
  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  /**
   * Find role by code
   */
  async findByCode(code: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { code },
    });
  }

  /**
   * Find role with permissions
   */
  async findByIdWithPermissions(id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * List all roles
   */
  async findAll(includeInactive: boolean = false): Promise<Role[]> {
    const where: Prisma.RoleWhereInput = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.role.findMany({
      where,
      orderBy: {
        level: 'asc',
      },
    });
  }

  /**
   * List all roles with permissions
   */
  async findAllWithPermissions(includeInactive: boolean = false): Promise<RoleWithPermissions[]> {
    const where: Prisma.RoleWhereInput = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.role.findMany({
      where,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    });
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * Check if roles exist by IDs
   */
  async rolesExist(roleIds: string[]): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: {
        id: { in: roleIds },
        isActive: true,
      },
    });
    return count === roleIds.length;
  }

  /**
   * Get non-existent role IDs
   */
  async getNonExistentRoleIds(roleIds: string[]): Promise<string[]> {
    const existingRoles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
      },
      select: { id: true },
    });

    const existingIds = new Set(existingRoles.map((r) => r.id));
    return roleIds.filter((id) => !existingIds.has(id));
  }
}

/**
 * Role with permissions type
 */
export type RoleWithPermissions = Role & {
  rolePermissions: {
    roleId: string;
    permissionId: string;
    permission: Permission;
  }[];
};
