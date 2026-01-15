import { Injectable, Logger } from '@nestjs/common';
import {
  AdmissionStatus,
  PatientStatus,
  DailyReport,
  VitalSign,
  MedicationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma';
import { VitalSignRepository } from './vital-sign.repository';
import { IntakeOutputRepository } from './intake-output.repository';
import { MedicationRepository } from './medication.repository';
import { NursingNoteRepository } from './nursing-note.repository';
import { DailyReportRepository } from './daily-report.repository';
import { VitalSigns } from './value-objects';
import {
  DailySummaryResponseDto,
  DailyReportResponseDto,
  PaginatedDailyReportsResponseDto,
  VitalsSummaryDto,
  IOBalanceSummaryDto,
  MedicationComplianceDto,
  SignificantNoteDto,
  DailyAlertDto,
  StatsSummary,
  ListDailyReportsDto,
} from './dto/daily-report.dto';
import { AdmissionNotFoundException } from './exceptions';

// Balance threshold for I/O alert status
const BALANCE_THRESHOLD = 500; // ml

/**
 * DailyReportAggregator Service
 *
 * Aggregates daily patient reports including vital signs summary,
 * I/O balance, medication compliance, and alerts.
 * Reference: SDS Section 4.5.3 (Daily Report Aggregation Service)
 * Requirements: REQ-FR-040
 */
@Injectable()
export class DailyReportAggregatorService {
  private readonly logger = new Logger(DailyReportAggregatorService.name);

  constructor(
    private readonly vitalRepo: VitalSignRepository,
    private readonly ioRepo: IntakeOutputRepository,
    private readonly medicationRepo: MedicationRepository,
    private readonly noteRepo: NursingNoteRepository,
    private readonly dailyReportRepo: DailyReportRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate daily summary for a patient (without saving)
   */
  async generateDailySummary(admissionId: string, date: Date): Promise<DailySummaryResponseDto> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    // Fetch all data in parallel
    const [vitals, ioSummary, medications, notes] = await Promise.all([
      this.getVitalsForDate(admissionId, date),
      this.ioRepo.getDailySummary(admissionId, date),
      this.getMedicationsForDate(admissionId, date),
      this.noteRepo.findSignificant(admissionId),
    ]);

    // Aggregate data
    const vitalsSummary = this.summarizeVitals(vitals);
    const ioBalance = this.calculateIOBalance(ioSummary);
    const medicationCompliance = this.calculateMedicationCompliance(medications);
    const alerts = this.collectAlerts(vitals, ioBalance);
    const significantNotes = this.formatSignificantNotes(notes, date);
    const patientStatus = this.assessPatientStatus(vitalsSummary, ioBalance, alerts);

    return {
      admissionId,
      date,
      vitalsSummary,
      ioBalance,
      medicationCompliance,
      significantNotes,
      alerts,
      patientStatus,
    };
  }

  /**
   * Get daily report by date (from database or generate)
   */
  async getReport(admissionId: string, date: Date): Promise<DailyReportResponseDto | null> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const report = await this.dailyReportRepo.findByAdmissionAndDate(admissionId, date);

    if (!report) {
      return null;
    }

    return this.toReportResponseDto(report);
  }

  /**
   * Generate and save daily report
   */
  async saveReport(
    admissionId: string,
    date: Date,
    userId?: string,
  ): Promise<DailyReportResponseDto> {
    const summary = await this.generateDailySummary(admissionId, date);

    const report = await this.dailyReportRepo.upsert({
      admissionId,
      reportDate: date,
      vitalsSummary: summary.vitalsSummary ?? null,
      totalIntake: summary.ioBalance?.intake.total ?? null,
      totalOutput: summary.ioBalance?.output.total ?? null,
      ioBalance: summary.ioBalance?.balance ?? null,
      medicationsGiven: summary.medicationCompliance.administered,
      medicationsHeld: summary.medicationCompliance.held,
      patientStatus: summary.patientStatus ?? null,
      alerts: summary.alerts.length > 0 ? summary.alerts : null,
      generatedBy: userId ?? null,
    });

    this.logger.log(
      `Daily report saved for admission ${admissionId}, date: ${date.toISOString().split('T')[0]}`,
    );

    return this.toReportResponseDto(report);
  }

  /**
   * List daily reports for an admission
   */
  async listReports(
    admissionId: string,
    dto: ListDailyReportsDto,
  ): Promise<PaginatedDailyReportsResponseDto> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const result = await this.dailyReportRepo.findByAdmission({
      admissionId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((report) => this.toReportResponseDto(report)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Batch generate reports for all active admissions
   */
  async generateAllDailyReports(date: Date): Promise<number> {
    const activeAdmissions = await this.prisma.admission.findMany({
      where: { status: AdmissionStatus.ACTIVE },
      select: { id: true },
    });

    let count = 0;
    for (const admission of activeAdmissions) {
      try {
        await this.saveReport(admission.id, date);
        count++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to generate report for admission ${admission.id}: ${message}`);
      }
    }

    this.logger.log(`Generated ${count} daily reports for ${date.toISOString().split('T')[0]}`);
    return count;
  }

  /**
   * Get vitals for a specific date
   */
  private async getVitalsForDate(admissionId: string, date: Date): Promise<VitalSign[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.vitalRepo.findByDateRange(admissionId, startOfDay, endOfDay);
  }

  /**
   * Get medications for a specific date
   */
  private async getMedicationsForDate(
    admissionId: string,
    date: Date,
  ): Promise<{ status: MedicationStatus }[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.medication.findMany({
      where: {
        admissionId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { status: true },
    });
  }

  /**
   * Summarize vital signs
   */
  private summarizeVitals(vitals: VitalSign[]): VitalsSummaryDto | null {
    if (vitals.length === 0) {
      return null;
    }

    const tempValues = vitals
      .map((v) => (v.temperature ? Number(v.temperature) : null))
      .filter((v): v is number => v !== null);
    const systolicValues = vitals.map((v) => v.systolicBp).filter((v): v is number => v !== null);
    const diastolicValues = vitals.map((v) => v.diastolicBp).filter((v): v is number => v !== null);
    const pulseValues = vitals.map((v) => v.pulseRate).filter((v): v is number => v !== null);
    const respValues = vitals.map((v) => v.respiratoryRate).filter((v): v is number => v !== null);
    const spo2Values = vitals.map((v) => v.oxygenSaturation).filter((v): v is number => v !== null);

    return {
      measurementCount: vitals.length,
      temperature: this.calculateStats(tempValues),
      bloodPressure: {
        systolic: this.calculateStats(systolicValues),
        diastolic: this.calculateStats(diastolicValues),
      },
      pulseRate: this.calculateStats(pulseValues),
      respiratoryRate: this.calculateStats(respValues),
      oxygenSaturation: this.calculateStats(spo2Values),
      alertCount: vitals.filter((v) => v.hasAlert).length,
    };
  }

  /**
   * Calculate statistics for an array of numbers
   */
  private calculateStats(values: number[]): StatsSummary | null {
    if (values.length === 0) {
      return null;
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      count: values.length,
    };
  }

  /**
   * Calculate I/O balance summary
   */
  private calculateIOBalance(
    ioSummary: {
      oralIntake: number;
      ivIntake: number;
      tubeFeeding: number;
      otherIntake: number;
      urineOutput: number;
      stoolOutput: number;
      vomitOutput: number;
      drainageOutput: number;
      otherOutput: number;
    } | null,
  ): IOBalanceSummaryDto | null {
    if (!ioSummary) {
      return null;
    }

    const intake = {
      oral: ioSummary.oralIntake,
      iv: ioSummary.ivIntake,
      tubeFeeding: ioSummary.tubeFeeding,
      other: ioSummary.otherIntake,
      total:
        ioSummary.oralIntake + ioSummary.ivIntake + ioSummary.tubeFeeding + ioSummary.otherIntake,
    };

    const output = {
      urine: ioSummary.urineOutput,
      stool: ioSummary.stoolOutput,
      vomit: ioSummary.vomitOutput,
      drainage: ioSummary.drainageOutput,
      other: ioSummary.otherOutput,
      total:
        ioSummary.urineOutput +
        ioSummary.stoolOutput +
        ioSummary.vomitOutput +
        ioSummary.drainageOutput +
        ioSummary.otherOutput,
    };

    const balance = intake.total - output.total;

    return {
      intake,
      output,
      balance,
      status: this.getBalanceStatus(balance),
    };
  }

  /**
   * Determine I/O balance status
   */
  private getBalanceStatus(balance: number): 'NORMAL' | 'POSITIVE' | 'NEGATIVE' {
    if (balance > BALANCE_THRESHOLD) {
      return 'POSITIVE';
    } else if (balance < -BALANCE_THRESHOLD) {
      return 'NEGATIVE';
    }
    return 'NORMAL';
  }

  /**
   * Calculate medication compliance
   */
  private calculateMedicationCompliance(
    medications: { status: MedicationStatus }[],
  ): MedicationComplianceDto {
    const scheduled = medications.length;
    const administered = medications.filter(
      (m) => m.status === MedicationStatus.ADMINISTERED,
    ).length;
    const held = medications.filter((m) => m.status === MedicationStatus.HELD).length;
    const refused = medications.filter((m) => m.status === MedicationStatus.REFUSED).length;
    const missed = medications.filter((m) => m.status === MedicationStatus.MISSED).length;

    return {
      scheduled,
      administered,
      held,
      refused,
      missed,
      complianceRate: scheduled > 0 ? Math.round((administered / scheduled) * 100) : 100,
    };
  }

  /**
   * Collect alerts from vitals and I/O
   */
  private collectAlerts(
    vitals: VitalSign[],
    ioBalance: IOBalanceSummaryDto | null,
  ): DailyAlertDto[] {
    const alerts: DailyAlertDto[] = [];

    // Collect vital alerts
    for (const vital of vitals) {
      if (vital.hasAlert) {
        const vitalObj = new VitalSigns(
          vital.temperature ? Number(vital.temperature) : null,
          vital.systolicBp,
          vital.diastolicBp,
          vital.pulseRate,
          vital.respiratoryRate,
          vital.oxygenSaturation,
          vital.bloodGlucose,
          vital.painScore,
          vital.consciousness,
        );
        const vitalAlerts = vitalObj.getAlerts();
        for (const alert of vitalAlerts) {
          alerts.push({
            type: alert.type,
            severity: alert.severity,
            value: alert.value,
            message: alert.message,
            recordedAt: vital.measuredAt,
          });
        }
      }
    }

    // Add I/O balance alert if abnormal
    if (ioBalance && ioBalance.status !== 'NORMAL') {
      alerts.push({
        type: ioBalance.status === 'POSITIVE' ? 'FLUID_OVERLOAD' : 'FLUID_DEFICIT',
        severity: Math.abs(ioBalance.balance) > 1000 ? 'HIGH' : 'MEDIUM',
        value: ioBalance.balance,
        message:
          ioBalance.status === 'POSITIVE'
            ? `Positive fluid balance: ${ioBalance.balance}ml`
            : `Negative fluid balance: ${ioBalance.balance}ml`,
        recordedAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Format significant nursing notes
   */
  private formatSignificantNotes(
    notes: {
      id: string;
      noteType: string;
      subjective: string | null;
      objective: string | null;
      assessment: string | null;
      recordedAt: Date;
    }[],
    date: Date,
  ): SignificantNoteDto[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return notes
      .filter((note) => note.recordedAt >= startOfDay && note.recordedAt <= endOfDay)
      .map((note) => ({
        id: note.id,
        noteType: note.noteType,
        summary: note.assessment || note.subjective || note.objective || '',
        recordedAt: note.recordedAt,
      }));
  }

  /**
   * Assess overall patient status based on data
   */
  private assessPatientStatus(
    vitalsSummary: VitalsSummaryDto | null,
    ioBalance: IOBalanceSummaryDto | null,
    alerts: DailyAlertDto[],
  ): PatientStatus | null {
    // If no data, cannot assess
    if (!vitalsSummary && !ioBalance) {
      return null;
    }

    // Check for critical alerts
    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
    if (criticalAlerts.length > 0) {
      return PatientStatus.CRITICAL;
    }

    // Check for high alerts
    const highAlerts = alerts.filter((a) => a.severity === 'HIGH');
    if (highAlerts.length >= 2) {
      return PatientStatus.DECLINING;
    }

    // Check alert count
    const alertCount = vitalsSummary?.alertCount ?? 0;
    if (alertCount >= 3) {
      return PatientStatus.DECLINING;
    }

    // Check I/O balance
    if (ioBalance && ioBalance.status !== 'NORMAL') {
      if (Math.abs(ioBalance.balance) > 1000) {
        return PatientStatus.DECLINING;
      }
    }

    // Default to stable if no concerning indicators
    if (alerts.length === 0) {
      return PatientStatus.STABLE;
    }

    return PatientStatus.STABLE;
  }

  /**
   * Convert DailyReport entity to response DTO
   */
  private toReportResponseDto(report: DailyReport): DailyReportResponseDto {
    return {
      id: report.id,
      admissionId: report.admissionId,
      reportDate: report.reportDate,
      vitalsSummary: report.vitalsSummary as VitalsSummaryDto | null,
      totalIntake: report.totalIntake,
      totalOutput: report.totalOutput,
      ioBalance: report.ioBalance,
      medicationsGiven: report.medicationsGiven,
      medicationsHeld: report.medicationsHeld,
      patientStatus: report.patientStatus,
      summary: report.summary,
      alerts: report.alerts as DailyAlertDto[] | null,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
    };
  }
}
