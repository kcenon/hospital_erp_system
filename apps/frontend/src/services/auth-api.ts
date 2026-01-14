import { apiPost } from '@/lib/api-client';
import type {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  ChangePasswordRequest,
} from '@/types';

const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  CHANGE_PASSWORD: '/api/v1/auth/change-password',
} as const;

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiPost<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
}

export async function logout(): Promise<void> {
  return apiPost<void>(AUTH_ENDPOINTS.LOGOUT);
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  return apiPost<RefreshTokenResponse>(AUTH_ENDPOINTS.REFRESH);
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  return apiPost<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, data);
}

export const authApi = {
  login,
  logout,
  refreshToken,
  changePassword,
};
