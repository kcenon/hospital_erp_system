import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for permissions where any can satisfy the requirement
 */
export const PERMISSIONS_ANY_KEY = 'permissions_any';

/**
 * Decorator to require any of the specified permissions
 * Usage: @RequireAnyPermission('patient:update', 'patient:update:own')
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);
