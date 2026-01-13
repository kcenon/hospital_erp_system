import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for resource access check
 */
export const CHECK_RESOURCE_ACCESS_KEY = 'check_resource_access';

/**
 * Resource access configuration
 */
export interface ResourceAccessConfig {
  resourceType: string;
  action: string;
  resourceIdParam?: string; // Parameter name to extract resource ID from (default: 'id')
}

/**
 * Decorator to enable resource-level access checking
 * Usage: @CheckResourceAccess({ resourceType: 'patient', action: 'update', resourceIdParam: 'id' })
 */
export const CheckResourceAccess = (config: ResourceAccessConfig) =>
  SetMetadata(CHECK_RESOURCE_ACCESS_KEY, config);
