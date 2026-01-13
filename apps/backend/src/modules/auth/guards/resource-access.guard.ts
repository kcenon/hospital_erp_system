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
  CHECK_RESOURCE_ACCESS_KEY,
  ResourceAccessConfig,
} from '../decorators';

/**
 * ResourceAccessGuard for resource-level access control
 * Checks ownership/assignment for :own and :assigned permissions
 * Reference: SDS Section 7.2 (Authorization Design)
 */
@Injectable()
export class ResourceAccessGuard implements CanActivate {
  private readonly logger = new Logger(ResourceAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<ResourceAccessConfig>(
      CHECK_RESOURCE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no resource access check configured, allow access
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Resource access check failed: No user in request');
      throw new ForbiddenException('Authentication required');
    }

    const resourceIdParam = config.resourceIdParam || 'id';
    const resourceId = request.params[resourceIdParam];

    if (!resourceId) {
      this.logger.warn(
        `Resource access check failed: No ${resourceIdParam} in request params`,
      );
      throw new ForbiddenException('Resource ID required');
    }

    const canAccess = await this.rbacService.canAccessResource(
      user.id,
      config.resourceType,
      resourceId,
      config.action,
    );

    if (!canAccess) {
      this.rbacService.logPermissionDenial(
        user.id,
        `${config.resourceType}:${config.action}`,
        config.resourceType,
        resourceId,
      );
      throw new ForbiddenException(
        'You do not have access to this resource',
      );
    }

    return true;
  }
}
