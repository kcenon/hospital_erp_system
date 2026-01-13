import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SessionService } from './services';
import { SessionActivityInterceptor } from './interceptors';

@Module({
  imports: [
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
  controllers: [],
  providers: [SessionService, SessionActivityInterceptor],
  exports: [JwtModule, PassportModule, SessionService, SessionActivityInterceptor],
})
export class AuthModule {}
