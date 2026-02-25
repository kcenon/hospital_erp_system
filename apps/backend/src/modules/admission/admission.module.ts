import { Module } from '@nestjs/common';
import { AdmissionController } from './admission.controller';
import { AdmissionService } from './admission.service';
import { AdmissionRepository } from './admission.repository';
import { AdmissionNumberGenerator } from './admission-number.generator';
import { RoomModule } from '../room';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RoomModule, AuthModule],
  controllers: [AdmissionController],
  providers: [AdmissionService, AdmissionRepository, AdmissionNumberGenerator],
  exports: [AdmissionService, AdmissionRepository],
})
export class AdmissionModule {}
