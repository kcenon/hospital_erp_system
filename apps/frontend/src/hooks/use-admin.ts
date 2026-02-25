import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserApi, adminRoleApi, adminAuditApi } from '@/services';
import type {
  ListUsersParams,
  CreateUserData,
  UpdateUserData,
  QueryLoginHistoryParams,
  QueryAccessLogsParams,
  QueryChangeLogsParams,
} from '@/types';

// User hooks
export function useAdminUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminUserApi.list(params),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminUserApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => adminUserApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      adminUserApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUserApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => adminUserApi.resetPassword(id),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      adminUserApi.assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      adminUserApi.removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

// Role hooks
export function useRoles() {
  return useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminRoleApi.list(),
  });
}

// Audit hooks
export function useLoginHistory(params: QueryLoginHistoryParams = {}) {
  return useQuery({
    queryKey: ['audit-login-history', params],
    queryFn: () => adminAuditApi.loginHistory(params),
  });
}

export function useAccessLogs(params: QueryAccessLogsParams = {}) {
  return useQuery({
    queryKey: ['audit-access-logs', params],
    queryFn: () => adminAuditApi.accessLogs(params),
  });
}

export function useChangeLogs(params: QueryChangeLogsParams = {}) {
  return useQuery({
    queryKey: ['audit-change-logs', params],
    queryFn: () => adminAuditApi.changeLogs(params),
  });
}
