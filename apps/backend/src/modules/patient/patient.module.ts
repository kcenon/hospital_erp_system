import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PatientRepository } from './patient.repository';
import { PatientNumberGenerator } from './patient-number.generator';
import { DataMaskingService } from './data-masking.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PatientController],
  providers: [PatientService, PatientRepository, PatientNumberGenerator, DataMaskingService],
  exports: [PatientService, PatientRepository, PatientNumberGenerator, DataMaskingService],
})
export class PatientModule {}
