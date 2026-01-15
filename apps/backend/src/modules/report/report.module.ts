import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
import { DailyReportController } from './daily-report.controller';
import { DailyReportAggregatorService } from './daily-report-aggregator.service';
import { DailyReportRepository } from './daily-report.repository';
import { DailyReportScheduler } from './daily-report.scheduler';
import { RoomModule } from '../room/room.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RoomModule, AuthModule, ScheduleModule.forRoot()],
  controllers: [
    VitalSignController,
    IntakeOutputController,
    MedicationController,
    NursingNoteController,
    DailyReportController,
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
    DailyReportAggregatorService,
    DailyReportRepository,
    DailyReportScheduler,
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
    DailyReportAggregatorService,
    DailyReportRepository,
    DailyReportScheduler,
  ],
})
export class ReportModule {}
