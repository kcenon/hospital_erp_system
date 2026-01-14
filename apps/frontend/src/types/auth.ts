// Auth-related type definitions

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  mustChangePassword?: boolean;
}

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'staff';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthErrorCode {
  code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'PASSWORD_EXPIRED' | 'UNAUTHORIZED';
  message: string;
}
