import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis';
import { MetricsModule, MetricsInterceptor } from './metrics';
import { HealthModule } from './modules/health/health.module';
import { RoomModule } from './modules/room/room.module';
import { PatientModule } from './modules/patient/patient.module';
import { AdmissionModule } from './modules/admission/admission.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReportModule } from './modules/report/report.module';
import { RoundingModule } from './modules/rounding/rounding.module';
import { AdminModule } from './modules/admin/admin.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { appConfig, databaseConfig, redisConfig, jwtConfig, validate } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      validate,
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    PrismaModule,
    MetricsModule,
    HealthModule,
    AuthModule,
    RoomModule,
    PatientModule,
    AdmissionModule,
    ReportModule,
    RoundingModule,
    AdminModule,
    IntegrationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
