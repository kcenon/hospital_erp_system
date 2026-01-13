import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  TokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from '../interfaces';

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access token with user information
   */
  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: payload.sub,
      username: payload.username,
      roles: payload.roles,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };

    return this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiration', '1h'),
    });
  }

  /**
   * Generate refresh token with minimal payload
   */
  generateRefreshToken(
    payload: Omit<RefreshTokenPayload, 'jti' | 'iat' | 'exp'>,
  ): string {
    const tokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: payload.sub,
      sessionId: payload.sessionId,
      jti: uuidv4(),
    };

    return this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration', '7d'),
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({
      sub: payload.sub,
      sessionId: payload.sessionId,
    });

    const expiresIn = this.getExpirationSeconds(
      this.configService.get<string>('jwt.accessExpiration', '1h'),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return this.jwtService.verify<TokenPayload>(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Access token verification failed: ${message}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token and return payload
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Refresh token verification failed: ${message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for expired token handling)
   */
  decodeToken<T = TokenPayload>(token: string): T | null {
    try {
      return this.jwtService.decode(token) as T;
    } catch {
      return null;
    }
  }

  /**
   * Extract token from authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  /**
   * Convert expiration string to seconds
   */
  private getExpirationSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }
}
