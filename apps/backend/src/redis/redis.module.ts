import { Module, Global } from '@nestjs/common';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisShutdownService } from './redis-shutdown.service';

@Global()
@Module({
  imports: [
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('redis.url', 'redis://localhost:6379'),
      }),
    }),
  ],
  providers: [RedisShutdownService],
  exports: [IoRedisModule],
})
export class RedisModule {}
