import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RoomModule } from './modules/room/room.module';
import { PatientModule } from './modules/patient/patient.module';
import { AdmissionModule } from './modules/admission/admission.module';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  validate,
} from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      validate,
    }),
    PrismaModule,
    RoomModule,
    PatientModule,
    AdmissionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
