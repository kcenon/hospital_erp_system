import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '../../src/prisma';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { PatientModule } from '../../src/modules/patient/patient.module';
import { AdmissionModule } from '../../src/modules/admission/admission.module';
import { RoomModule } from '../../src/modules/room/room.module';
import { RoundingModule } from '../../src/modules/rounding/rounding.module';
import { ReportModule } from '../../src/modules/report/report.module';
import { AdminModule } from '../../src/modules/admin/admin.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { RedisModule } from '../../src/redis';
import { appConfig, databaseConfig, redisConfig, jwtConfig } from '../../src/config';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  module: TestingModule;
}

/**
 * Create a test application for integration tests
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig, databaseConfig, redisConfig, jwtConfig],
        envFilePath: ['.env.test', '.env'],
      }),
      EventEmitterModule.forRoot(),
      RedisModule,
      PrismaModule,
      AuthModule,
      PatientModule,
      AdmissionModule,
      RoomModule,
      RoundingModule,
      ReportModule,
      AdminModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();

  const prisma = moduleRef.get<PrismaService>(PrismaService);

  return {
    app,
    prisma,
    module: moduleRef,
  };
}

/**
 * Close test application and cleanup
 */
export async function closeTestApp(testApp: TestApp): Promise<void> {
  await testApp.app.close();
}
