import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  SessionService,
  JwtTokenService,
  AuthService,
  RbacService,
} from './services';
import { SessionActivityInterceptor } from './interceptors';
import { JwtStrategy, LocalStrategy } from './strategies';
import { LocalAuthGuard, PermissionGuard, ResourceAccessGuard } from './guards';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiration', '1h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    SessionService,
    JwtTokenService,
    AuthService,
    RbacService,
    SessionActivityInterceptor,
    JwtStrategy,
    LocalStrategy,
    LocalAuthGuard,
    PermissionGuard,
    ResourceAccessGuard,
  ],
  exports: [
    JwtModule,
    PassportModule,
    SessionService,
    JwtTokenService,
    AuthService,
    RbacService,
    SessionActivityInterceptor,
    PermissionGuard,
    ResourceAccessGuard,
  ],
})
export class AuthModule {}
