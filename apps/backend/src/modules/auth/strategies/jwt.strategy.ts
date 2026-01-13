import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../services';
import { TokenPayload, AuthenticatedUser } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  /**
   * Validate JWT payload and check session validity
   */
  async validate(payload: TokenPayload): Promise<AuthenticatedUser> {
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
