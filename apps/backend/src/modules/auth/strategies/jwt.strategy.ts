import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService, TokenBlacklistService } from '../services';
import { TokenPayload, AuthenticatedUser } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  /**
   * Validate JWT payload, check blacklist, and verify session
   */
  async validate(payload: TokenPayload): Promise<AuthenticatedUser> {
    // Check if all user tokens are revoked (password change, account deactivation)
    if (payload.iat) {
      const isRevoked = await this.tokenBlacklistService.isUserTokenRevoked(
        payload.sub,
        payload.iat,
      );
      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    const isSessionValid = await this.sessionService.isValid(payload.sessionId);

    if (!isSessionValid) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    await this.sessionService.refresh(payload.sessionId);

    return {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };
  }
}
