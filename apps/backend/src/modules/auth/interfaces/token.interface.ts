/**
 * Token Payload for Access Token
 * Contains user information embedded in JWT
 */
export interface TokenPayload {
  sub: string;
  username: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

/**
 * Token Payload for Refresh Token
 * Minimal payload for security
 */
export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  jti: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated User object attached to request
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

/**
 * Token pair returned after authentication
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
