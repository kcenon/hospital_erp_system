// User Management Types
export interface AdminUser {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: RoleBasic[];
}

export interface RoleBasic {
  id: string;
  code: string;
  name: string;
}

export interface Role extends RoleBasic {
  description?: string;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface CreateUserData {
  employeeId: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  roleIds: string[];
}

export interface CreateUserResponse extends AdminUser {
  temporaryPassword: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
}

export interface ListUsersParams {
  search?: string;
  department?: string;
  isActive?: boolean;
  roleId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsers {
  data: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
  message: string;
}

// Audit Types
export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
export type DeviceType = 'PC' | 'TABLET' | 'MOBILE';

export interface LoginHistory {
  id: string;
  userId: string | null;
  username: string;
  ipAddress: string;
  userAgent: string | null;
  deviceType: DeviceType | null;
  browser: string | null;
  os: string | null;
  loginAt: string;
  logoutAt: string | null;
  sessionId: string | null;
  success: boolean;
  failureReason: string | null;
}

export interface AccessLog {
  id: string;
  userId: string;
  username: string;
  userRole: string | null;
  ipAddress: string;
  resourceType: string;
  resourceId: string;
  action: AuditAction;
  requestPath: string | null;
  requestMethod: string | null;
  patientId: string | null;
  accessedFields: string[];
  success: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface ChangeLog {
  id: string;
  userId: string;
  username: string;
  ipAddress: string | null;
  tableSchema: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues: unknown;
  newValues: unknown;
  changedFields: string[];
  changeReason: string | null;
  createdAt: string;
}

export interface PaginatedAudit<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryLoginHistoryParams {
  userId?: string;
  username?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface QueryAccessLogsParams {
  userId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface QueryChangeLogsParams {
  userId?: string;
  tableName?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SuspiciousActivity {
  ipAddress: string;
  failedAttempts: number;
  usernames: string[];
}
