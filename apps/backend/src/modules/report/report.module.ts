import { Module } from '@nestjs/common';
import { VitalSignController } from './vital-sign.controller';
import { VitalSignService } from './vital-sign.service';
import { VitalSignRepository } from './vital-sign.repository';
import { IntakeOutputController } from './intake-output.controller';
import { IntakeOutputService } from './intake-output.service';
import { IntakeOutputRepository } from './intake-output.repository';
import { MedicationController } from './medication.controller';
import { MedicationService } from './medication.service';
import { MedicationRepository } from './medication.repository';
import { NursingNoteController } from './nursing-note.controller';
import { NursingNoteService } from './nursing-note.service';
import { NursingNoteRepository } from './nursing-note.repository';
import { RoomModule } from '../room/room.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RoomModule, AuthModule],
  controllers: [
    VitalSignController,
    IntakeOutputController,
    MedicationController,
    NursingNoteController,
  ],
  providers: [
    VitalSignService,
    VitalSignRepository,
    IntakeOutputService,
    IntakeOutputRepository,
    MedicationService,
    MedicationRepository,
    NursingNoteService,
    NursingNoteRepository,
  ],
  exports: [
    VitalSignService,
    VitalSignRepository,
    IntakeOutputService,
    IntakeOutputRepository,
    MedicationService,
    MedicationRepository,
    NursingNoteService,
    NursingNoteRepository,
  ],
})
export class ReportModule {}
