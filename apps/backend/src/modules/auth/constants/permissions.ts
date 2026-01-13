/**
 * Permission constants and role-permission matrix
 * Reference: SDS Section 7.2 (Authorization Design), REQ-NFR-023
 */

/**
 * Resource types for permission definitions
 */
export const Resources = {
  PATIENT: 'patient',
  ROOM: 'room',
  ADMISSION: 'admission',
  VITAL: 'vital',
  REPORT: 'report',
  ROUND: 'round',
  MEDICATION: 'medication',
  USER: 'user',
  ROLE: 'role',
  AUDIT: 'audit',
} as const;

/**
 * Action types for permission definitions
 */
export const Actions = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  WRITE: 'write',
  ASSIGN: 'assign',
} as const;

/**
 * Permission code builder
 */
export const buildPermissionCode = (
  resource: string,
  action: string,
  scope?: 'own' | 'assigned',
): string => {
  const base = `${resource}:${action}`;
  return scope ? `${base}:${scope}` : base;
};

/**
 * All available permissions in the system
 */
export const Permissions = {
  // Patient permissions
  PATIENT_CREATE: 'patient:create',
  PATIENT_READ: 'patient:read',
  PATIENT_READ_ASSIGNED: 'patient:read:assigned',
  PATIENT_UPDATE: 'patient:update',
  PATIENT_UPDATE_OWN: 'patient:update:own',
  PATIENT_DELETE: 'patient:delete',

  // Room permissions
  ROOM_READ: 'room:read',
  ROOM_ASSIGN: 'room:assign',
  ROOM_CREATE: 'room:create',
  ROOM_UPDATE: 'room:update',
  ROOM_DELETE: 'room:delete',

  // Admission permissions
  ADMISSION_CREATE: 'admission:create',
  ADMISSION_READ: 'admission:read',
  ADMISSION_READ_ASSIGNED: 'admission:read:assigned',
  ADMISSION_UPDATE: 'admission:update',
  ADMISSION_UPDATE_OWN: 'admission:update:own',
  ADMISSION_DELETE: 'admission:delete',

  // Vital signs permissions
  VITAL_READ: 'vital:read',
  VITAL_WRITE: 'vital:write',

  // Report permissions
  REPORT_READ: 'report:read',
  REPORT_WRITE: 'report:write',

  // Rounding permissions
  ROUND_READ: 'round:read',
  ROUND_WRITE: 'round:write',

  // Medication permissions
  MEDICATION_READ: 'medication:read',
  MEDICATION_WRITE: 'medication:write',
  MEDICATION_ADMINISTER: 'medication:administer',

  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Role management permissions
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',

  // Audit permissions
  AUDIT_READ: 'audit:read',

  // Wildcard permission for admin
  ALL: '*',
} as const;

/**
 * Role codes
 */
export const RoleCodes = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  HEAD_NURSE: 'HEAD_NURSE',
  NURSE: 'NURSE',
  CLERK: 'CLERK',
} as const;

/**
 * Permission matrix defining which roles have which permissions
 * Reference: SDS Section 7.2.1
 */
export const PERMISSION_MATRIX: Record<string, string[]> = {
  [RoleCodes.ADMIN]: [Permissions.ALL],

  [RoleCodes.DOCTOR]: [
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE_OWN,
    Permissions.ROOM_READ,
    Permissions.ADMISSION_READ,
    Permissions.ADMISSION_UPDATE_OWN,
    Permissions.VITAL_READ,
    Permissions.VITAL_WRITE,
    Permissions.REPORT_READ,
    Permissions.REPORT_WRITE,
    Permissions.ROUND_READ,
    Permissions.ROUND_WRITE,
    Permissions.MEDICATION_READ,
    Permissions.MEDICATION_WRITE,
  ],

  [RoleCodes.HEAD_NURSE]: [
    Permissions.PATIENT_READ,
    Permissions.PATIENT_UPDATE,
    Permissions.ROOM_READ,
    Permissions.ROOM_ASSIGN,
    Permissions.ADMISSION_READ,
    Permissions.ADMISSION_UPDATE,
    Permissions.VITAL_READ,
    Permissions.VITAL_WRITE,
    Permissions.REPORT_READ,
    Permissions.REPORT_WRITE,
    Permissions.MEDICATION_READ,
    Permissions.MEDICATION_WRITE,
    Permissions.MEDICATION_ADMINISTER,
  ],

  [RoleCodes.NURSE]: [
    Permissions.PATIENT_READ_ASSIGNED,
    Permissions.ROOM_READ,
    Permissions.ADMISSION_READ_ASSIGNED,
    Permissions.VITAL_READ,
    Permissions.VITAL_WRITE,
    Permissions.REPORT_READ,
    Permissions.REPORT_WRITE,
    Permissions.MEDICATION_READ,
    Permissions.MEDICATION_ADMINISTER,
  ],

  [RoleCodes.CLERK]: [
    Permissions.PATIENT_READ,
    Permissions.PATIENT_CREATE,
    Permissions.PATIENT_UPDATE,
    Permissions.ROOM_READ,
    Permissions.ROOM_ASSIGN,
    Permissions.ADMISSION_READ,
    Permissions.ADMISSION_CREATE,
  ],
};

/**
 * Check if a permission has a scope modifier (own, assigned)
 */
export const hasScope = (permission: string): boolean => {
  return permission.endsWith(':own') || permission.endsWith(':assigned');
};

/**
 * Get the scope from a permission string
 */
export const getScope = (permission: string): 'own' | 'assigned' | null => {
  if (permission.endsWith(':own')) return 'own';
  if (permission.endsWith(':assigned')) return 'assigned';
  return null;
};

/**
 * Get the base permission without scope
 */
export const getBasePermission = (permission: string): string => {
  return permission.replace(/:own$|:assigned$/, '');
};

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions];
export type RoleCode = (typeof RoleCodes)[keyof typeof RoleCodes];
