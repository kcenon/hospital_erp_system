import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../services';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_ANY_KEY,
  REQUIRE_ROLES_KEY,
} from '../decorators';

/**
 * PermissionGuard for enforcing RBAC permissions
 * Reference: SDS Section 7.2 (Authorization Design)
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const permissionsAny = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_ANY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const roles = this.reflector.getAllAndOverride<string[]>(REQUIRE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permission/role requirements, allow access
    if (!permissions && !permissionsAny && !roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Permission check failed: No user in request');
      throw new ForbiddenException('Authentication required');
    }

    // Check roles
    if (roles && roles.length > 0) {
      const hasRole = await this.rbacService.hasAnyRole(user.id, roles);
      if (!hasRole) {
        this.rbacService.logPermissionDenial(
          user.id,
          `role:${roles.join('|')}`,
        );
        throw new ForbiddenException('Insufficient role privileges');
      }
    }

    // Check all required permissions
    if (permissions && permissions.length > 0) {
      const hasAll = await this.rbacService.hasAllPermissions(
        user.id,
        permissions,
      );
      if (!hasAll) {
        this.rbacService.logPermissionDenial(
          user.id,
          permissions.join(','),
        );
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // Check any of the permissions
    if (permissionsAny && permissionsAny.length > 0) {
      const hasAny = await this.rbacService.hasAnyPermission(
        user.id,
        permissionsAny,
      );
      if (!hasAny) {
        this.rbacService.logPermissionDenial(
          user.id,
          `any:${permissionsAny.join('|')}`,
        );
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
