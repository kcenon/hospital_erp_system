import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../src/prisma';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { PatientModule } from '../../src/modules/patient/patient.module';
import { AdmissionModule } from '../../src/modules/admission/admission.module';
import { RoomModule } from '../../src/modules/room/room.module';
import { RoundingModule } from '../../src/modules/rounding/rounding.module';
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
      RedisModule,
      PrismaModule,
      AuthModule,
      PatientModule,
      AdmissionModule,
      RoomModule,
      RoundingModule,
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
