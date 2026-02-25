import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type {
  AdminUser,
  PaginatedUsers,
  CreateUserData,
  CreateUserResponse,
  UpdateUserData,
  ResetPasswordResponse,
  ListUsersParams,
  Role,
  LoginHistory,
  AccessLog,
  ChangeLog,
  PaginatedAudit,
  QueryLoginHistoryParams,
  QueryAccessLogsParams,
  QueryChangeLogsParams,
  SuspiciousActivity,
} from '@/types';

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const adminUserApi = {
  list: (params: ListUsersParams = {}): Promise<PaginatedUsers> => {
    return apiGet<PaginatedUsers>(`/admin/users${buildQueryString(params)}`);
  },

  getById: (id: string): Promise<AdminUser> => {
    return apiGet<AdminUser>(`/admin/users/${id}`);
  },

  create: (data: CreateUserData): Promise<CreateUserResponse> => {
    return apiPost<CreateUserResponse>('/admin/users', data);
  },

  update: (id: string, data: UpdateUserData): Promise<AdminUser> => {
    return apiPatch<AdminUser>(`/admin/users/${id}`, data);
  },

  deactivate: (id: string): Promise<void> => {
    return apiDelete<void>(`/admin/users/${id}`);
  },

  resetPassword: (id: string): Promise<ResetPasswordResponse> => {
    return apiPost<ResetPasswordResponse>(`/admin/users/${id}/reset-password`);
  },

  assignRole: (userId: string, roleId: string): Promise<{ message: string }> => {
    return apiPost<{ message: string }>(`/admin/users/${userId}/roles`, { roleId });
  },

  removeRole: (userId: string, roleId: string): Promise<void> => {
    return apiDelete<void>(`/admin/users/${userId}/roles/${roleId}`);
  },
};

export const adminRoleApi = {
  list: (): Promise<Role[]> => {
    return apiGet<Role[]>('/admin/roles');
  },
};

export const adminAuditApi = {
  loginHistory: (params: QueryLoginHistoryParams = {}): Promise<PaginatedAudit<LoginHistory>> => {
    return apiGet<PaginatedAudit<LoginHistory>>(
      `/admin/audit/login-history${buildQueryString(params)}`,
    );
  },

  accessLogs: (params: QueryAccessLogsParams = {}): Promise<PaginatedAudit<AccessLog>> => {
    return apiGet<PaginatedAudit<AccessLog>>(`/admin/audit/access-logs${buildQueryString(params)}`);
  },

  changeLogs: (params: QueryChangeLogsParams = {}): Promise<PaginatedAudit<ChangeLog>> => {
    return apiGet<PaginatedAudit<ChangeLog>>(`/admin/audit/change-logs${buildQueryString(params)}`);
  },

  suspiciousActivity: (startDate: string, endDate: string): Promise<SuspiciousActivity[]> => {
    return apiGet<SuspiciousActivity[]>(
      `/admin/audit/security/suspicious-activity?startDate=${startDate}&endDate=${endDate}`,
    );
  },

  failedLogins: (
    startDate: string,
    endDate: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedAudit<LoginHistory>> => {
    return apiGet<PaginatedAudit<LoginHistory>>(
      `/admin/audit/security/failed-logins?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
    );
  },
};
