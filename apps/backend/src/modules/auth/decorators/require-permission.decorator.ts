import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for required permissions (all must be satisfied)
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions (all must be satisfied)
 * Usage: @RequirePermission('patient:read', 'patient:update')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
