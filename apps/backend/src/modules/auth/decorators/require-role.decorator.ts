import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for required roles
 */
export const REQUIRE_ROLES_KEY = 'require_roles';

/**
 * Decorator to require specific roles (any of the roles satisfies the requirement)
 * Usage: @RequireRole('ADMIN', 'HEAD_NURSE')
 */
export const RequireRole = (...roles: string[]) =>
  SetMetadata(REQUIRE_ROLES_KEY, roles);
