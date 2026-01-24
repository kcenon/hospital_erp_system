import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from '../../../prisma';
import { Permissions, getBasePermission } from '../constants';

/**
 * RbacService for Role-Based Access Control
 * Reference: SDS Section 4.1.3 (RbacService), Section 7.2 (Authorization Design)
 * Requirements: REQ-NFR-023
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly CACHE_PREFIX = 'rbac:permissions:';
  private readonly CACHE_TTL_SECONDS = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Check for wildcard permission (admin)
    if (userPermissions.includes(Permissions.ALL)) {
      return true;
    }

    // Check exact permission match
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check if user has broader permission (e.g., patient:update covers patient:update:own)
    const basePermission = getBasePermission(permission);
    if (permission !== basePermission && userPermissions.includes(basePermission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, role: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some((r) => r.code === role);
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some((r) => roles.includes(r.code));
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<{ id: string; code: string; name: string }[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return userRoles
      .filter((ur: { role: { isActive: boolean } }) => ur.role.isActive)
      .map((ur: { role: { id: string; code: string; name: string } }) => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
      }));
  }

  /**
   * Get user's permissions (with caching)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;

    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const permissions = await this.fetchUserPermissions(userId);

    // Cache the result
    await this.redis.setex(cacheKey, this.CACHE_TTL_SECONDS, JSON.stringify(permissions));

    return permissions;
  }

  /**
   * Check resource-level access (e.g., own patient only)
   */
  async canAccessResource(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Admin has full access
    if (userPermissions.includes(Permissions.ALL)) {
      return true;
    }

    const permission = `${resourceType}:${action}`;
    const ownPermission = `${resourceType}:${action}:own`;
    const assignedPermission = `${resourceType}:${action}:assigned`;

    // Check if user has full permission for this action
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check for :own permission
    if (userPermissions.includes(ownPermission)) {
      return this.checkOwnership(userId, resourceType, resourceId);
    }

    // Check for :assigned permission
    if (userPermissions.includes(assignedPermission)) {
      return this.checkAssignment(userId, resourceType, resourceId);
    }

    return false;
  }

  /**
   * Invalidate user's permission cache
   */
  async invalidateCache(userId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await this.redis.del(cacheKey);
    this.logger.debug(`Permission cache invalidated for user ${userId}`);
  }

  /**
   * Invalidate all permission caches (e.g., after role/permission changes)
   */
  async invalidateAllCaches(): Promise<void> {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.debug(`Invalidated ${keys.length} permission caches`);
    }
  }

  /**
   * Log permission denial for security monitoring
   */
  logPermissionDenial(
    userId: string,
    permission: string,
    resourceType?: string,
    resourceId?: string,
  ): void {
    this.logger.warn(
      `Permission denied: user=${userId}, permission=${permission}` +
        (resourceType ? `, resource=${resourceType}:${resourceId}` : ''),
    );
  }

  /**
   * Fetch user permissions from database
   */
  private async fetchUserPermissions(userId: string): Promise<string[]> {
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

    // Deduplicate permissions
    const uniquePermissions = new Map<string, string>(
      rolePermissions.map((rp: { permission: { id: string; code: string } }) => [
        rp.permission.id,
        rp.permission.code,
      ]),
    );

    return Array.from(uniquePermissions.values());
  }

  /**
   * Check if user owns the resource (e.g., attending doctor)
   */
  private async checkOwnership(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    switch (resourceType) {
      case 'patient':
        return this.checkPatientOwnership(userId, resourceId);
      case 'admission':
        return this.checkAdmissionOwnership(userId, resourceId);
      default:
        return false;
    }
  }

  /**
   * Check if user is assigned to the resource
   */
  private async checkAssignment(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    switch (resourceType) {
      case 'patient':
        return this.checkPatientAssignment(userId, resourceId);
      case 'admission':
        return this.checkAdmissionAssignment(userId, resourceId);
      default:
        return false;
    }
  }

  /**
   * Check if user is the attending doctor for a patient
   */
  private async checkPatientOwnership(userId: string, patientId: string): Promise<boolean> {
    const admission = await this.prisma.admission.findFirst({
      where: {
        patientId,
        status: 'ACTIVE',
        attendingDoctorId: userId,
      },
    });
    return !!admission;
  }

  /**
   * Check if user is the attending doctor for an admission
   */
  private async checkAdmissionOwnership(userId: string, admissionId: string): Promise<boolean> {
    const admission = await this.prisma.admission.findFirst({
      where: {
        id: admissionId,
        attendingDoctorId: userId,
      },
    });
    return !!admission;
  }

  /**
   * Check if user (nurse) is assigned to patient
   */
  private async checkPatientAssignment(userId: string, patientId: string): Promise<boolean> {
    const admission = await this.prisma.admission.findFirst({
      where: {
        patientId,
        status: 'ACTIVE',
        primaryNurseId: userId,
      },
    });
    return !!admission;
  }

  /**
   * Check if user (nurse) is assigned to admission
   */
  private async checkAdmissionAssignment(userId: string, admissionId: string): Promise<boolean> {
    const admission = await this.prisma.admission.findFirst({
      where: {
        id: admissionId,
        primaryNurseId: userId,
      },
    });
    return !!admission;
  }
}
