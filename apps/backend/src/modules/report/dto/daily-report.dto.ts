import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PatientStatus } from '@prisma/client';

/**
 * Vital signs statistics summary
 */
export interface StatsSummary {
  min: number;
  max: number;
  avg: number;
  count: number;
}

/**
 * Blood pressure statistics
 */
export interface BloodPressureStats {
  systolic: StatsSummary | null;
  diastolic: StatsSummary | null;
}

/**
 * Vitals summary for daily report
 */
export interface VitalsSummaryDto {
  measurementCount: number;
  temperature: StatsSummary | null;
  bloodPressure: BloodPressureStats;
  pulseRate: StatsSummary | null;
  respiratoryRate: StatsSummary | null;
  oxygenSaturation: StatsSummary | null;
  alertCount: number;
}

/**
 * Intake breakdown
 */
export interface IntakeBreakdownDto {
  oral: number;
  iv: number;
  tubeFeeding: number;
  other: number;
  total: number;
}

/**
 * Output breakdown
 */
export interface OutputBreakdownDto {
  urine: number;
  stool: number;
  vomit: number;
  drainage: number;
  other: number;
  total: number;
}

/**
 * I/O balance summary
 */
export interface IOBalanceSummaryDto {
  intake: IntakeBreakdownDto;
  output: OutputBreakdownDto;
  balance: number;
  status: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
}

/**
 * Medication compliance summary
 */
export interface MedicationComplianceDto {
  scheduled: number;
  administered: number;
  held: number;
  refused: number;
  missed: number;
  complianceRate: number;
}

/**
 * Alert item for daily report
 */
export interface DailyAlertDto {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  value: number;
  message: string;
  recordedAt: Date;
}

/**
 * Significant note summary
 */
export interface SignificantNoteDto {
  id: string;
  noteType: string;
  summary: string;
  recordedAt: Date;
}

/**
 * Daily summary response
 */
export class DailySummaryResponseDto {
  admissionId: string;
  date: Date;
  vitalsSummary: VitalsSummaryDto | null;
  ioBalance: IOBalanceSummaryDto | null;
  medicationCompliance: MedicationComplianceDto;
  significantNotes: SignificantNoteDto[];
  alerts: DailyAlertDto[];
  patientStatus: PatientStatus | null;
}

/**
 * Daily report response (stored report)
 */
export class DailyReportResponseDto {
  id: string;
  admissionId: string;
  reportDate: Date;
  vitalsSummary: VitalsSummaryDto | null;
  totalIntake: number | null;
  totalOutput: number | null;
  ioBalance: number | null;
  medicationsGiven: number | null;
  medicationsHeld: number | null;
  patientStatus: PatientStatus | null;
  summary: string | null;
  alerts: DailyAlertDto[] | null;
  generatedAt: Date;
  generatedBy: string | null;
}

/**
 * Paginated daily reports response
 */
export class PaginatedDailyReportsResponseDto {
  data: DailyReportResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO for generating/regenerating daily report
 */
export class GenerateDailyReportDto {
  @IsDateString()
  date: string;
}

/**
 * DTO for listing daily reports
 */
export class ListDailyReportsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Batch generation result
 */
export class BatchGenerationResultDto {
  generatedCount: number;
  date: Date;
  generatedAt: Date;
}
