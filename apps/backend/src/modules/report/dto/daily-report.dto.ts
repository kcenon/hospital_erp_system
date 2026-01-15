import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientStatus } from '@prisma/client';

/**
 * Vital signs statistics summary
 */
export class StatsSummaryDto {
  @ApiProperty({ description: 'Minimum value', example: 36.0 })
  min: number;

  @ApiProperty({ description: 'Maximum value', example: 37.2 })
  max: number;

  @ApiProperty({ description: 'Average value', example: 36.5 })
  avg: number;

  @ApiProperty({ description: 'Number of measurements', example: 12 })
  count: number;
}

/**
 * Blood pressure statistics
 */
export class BloodPressureStatsDto {
  @ApiPropertyOptional({
    description: 'Systolic blood pressure statistics',
    type: StatsSummaryDto,
    nullable: true,
  })
  systolic: StatsSummaryDto | null;

  @ApiPropertyOptional({
    description: 'Diastolic blood pressure statistics',
    type: StatsSummaryDto,
    nullable: true,
  })
  diastolic: StatsSummaryDto | null;
}

/**
 * Vitals summary for daily report
 */
export class VitalsSummaryDto {
  @ApiProperty({ description: 'Number of vital sign measurements', example: 12 })
  measurementCount: number;

  @ApiPropertyOptional({
    description: 'Temperature statistics',
    type: StatsSummaryDto,
    nullable: true,
  })
  temperature: StatsSummaryDto | null;

  @ApiProperty({ description: 'Blood pressure statistics', type: BloodPressureStatsDto })
  bloodPressure: BloodPressureStatsDto;

  @ApiPropertyOptional({
    description: 'Pulse rate statistics',
    type: StatsSummaryDto,
    nullable: true,
  })
  pulseRate: StatsSummaryDto | null;

  @ApiPropertyOptional({
    description: 'Respiratory rate statistics',
    type: StatsSummaryDto,
    nullable: true,
  })
  respiratoryRate: StatsSummaryDto | null;

  @ApiPropertyOptional({
    description: 'Oxygen saturation statistics',
    type: StatsSummaryDto,
    nullable: true,
  })
  oxygenSaturation: StatsSummaryDto | null;

  @ApiProperty({ description: 'Number of vital sign alerts', example: 2 })
  alertCount: number;
}

/**
 * Intake breakdown for daily report
 */
export class DailyIntakeBreakdownDto {
  @ApiProperty({ description: 'Oral intake in mL', example: 1500 })
  oral: number;

  @ApiProperty({ description: 'IV intake in mL', example: 2000 })
  iv: number;

  @ApiProperty({ description: 'Tube feeding in mL', example: 0 })
  tubeFeeding: number;

  @ApiProperty({ description: 'Other intake in mL', example: 0 })
  other: number;

  @ApiProperty({ description: 'Total intake in mL', example: 3500 })
  total: number;
}

/**
 * Output breakdown for daily report
 */
export class DailyOutputBreakdownDto {
  @ApiProperty({ description: 'Urine output in mL', example: 2000 })
  urine: number;

  @ApiProperty({ description: 'Stool output in mL', example: 300 })
  stool: number;

  @ApiProperty({ description: 'Vomit output in mL', example: 0 })
  vomit: number;

  @ApiProperty({ description: 'Drainage output in mL', example: 0 })
  drainage: number;

  @ApiProperty({ description: 'Other output in mL', example: 0 })
  other: number;

  @ApiProperty({ description: 'Total output in mL', example: 2300 })
  total: number;
}

/**
 * I/O balance summary
 */
export class IOBalanceSummaryDto {
  @ApiProperty({ description: 'Intake breakdown', type: DailyIntakeBreakdownDto })
  intake: DailyIntakeBreakdownDto;

  @ApiProperty({ description: 'Output breakdown', type: DailyOutputBreakdownDto })
  output: DailyOutputBreakdownDto;

  @ApiProperty({ description: 'I/O balance in mL', example: 1200 })
  balance: number;

  @ApiProperty({
    description: 'Balance status',
    enum: ['NORMAL', 'POSITIVE', 'NEGATIVE'],
    example: 'POSITIVE',
  })
  status: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
}

/**
 * Medication compliance summary
 */
export class MedicationComplianceDto {
  @ApiProperty({ description: 'Number of scheduled medications', example: 10 })
  scheduled: number;

  @ApiProperty({ description: 'Number of administered medications', example: 8 })
  administered: number;

  @ApiProperty({ description: 'Number of held medications', example: 1 })
  held: number;

  @ApiProperty({ description: 'Number of refused medications', example: 1 })
  refused: number;

  @ApiProperty({ description: 'Number of missed medications', example: 0 })
  missed: number;

  @ApiProperty({ description: 'Compliance rate as percentage', example: 80.0 })
  complianceRate: number;
}

/**
 * Alert item for daily report
 */
export class DailyAlertDto {
  @ApiProperty({ description: 'Type of alert', example: 'VITAL_SIGN' })
  type: string;

  @ApiProperty({
    description: 'Severity level',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    example: 'HIGH',
  })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ description: 'Value that triggered the alert', example: 38.5 })
  value: number;

  @ApiProperty({ description: 'Alert message', example: 'Temperature elevated: 38.5C' })
  message: string;

  @ApiProperty({ description: 'Time when the alert was recorded' })
  recordedAt: Date;
}

/**
 * Significant note summary
 */
export class SignificantNoteDto {
  @ApiProperty({ description: 'Note ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Type of note', example: 'PROGRESS' })
  noteType: string;

  @ApiProperty({ description: 'Note summary', example: 'Patient condition improving' })
  summary: string;

  @ApiProperty({ description: 'Time when the note was recorded' })
  recordedAt: Date;
}

/**
 * Daily summary response
 */
export class DailySummaryResponseDto {
  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  admissionId: string;

  @ApiProperty({ description: 'Date of the summary' })
  date: Date;

  @ApiPropertyOptional({ description: 'Vitals summary', type: VitalsSummaryDto, nullable: true })
  vitalsSummary: VitalsSummaryDto | null;

  @ApiPropertyOptional({
    description: 'I/O balance summary',
    type: IOBalanceSummaryDto,
    nullable: true,
  })
  ioBalance: IOBalanceSummaryDto | null;

  @ApiProperty({ description: 'Medication compliance summary', type: MedicationComplianceDto })
  medicationCompliance: MedicationComplianceDto;

  @ApiProperty({ description: 'List of significant notes', type: [SignificantNoteDto] })
  significantNotes: SignificantNoteDto[];

  @ApiProperty({ description: 'List of alerts', type: [DailyAlertDto] })
  alerts: DailyAlertDto[];

  @ApiPropertyOptional({ description: 'Patient status', enum: PatientStatus, nullable: true })
  patientStatus: PatientStatus | null;
}

/**
 * Daily report response (stored report)
 */
export class DailyReportResponseDto {
  @ApiProperty({ description: 'Report ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  admissionId: string;

  @ApiProperty({ description: 'Report date' })
  reportDate: Date;

  @ApiPropertyOptional({ description: 'Vitals summary', type: VitalsSummaryDto, nullable: true })
  vitalsSummary: VitalsSummaryDto | null;

  @ApiPropertyOptional({ description: 'Total intake in mL', example: 3500, nullable: true })
  totalIntake: number | null;

  @ApiPropertyOptional({ description: 'Total output in mL', example: 2300, nullable: true })
  totalOutput: number | null;

  @ApiPropertyOptional({ description: 'I/O balance in mL', example: 1200, nullable: true })
  ioBalance: number | null;

  @ApiPropertyOptional({ description: 'Number of medications given', example: 8, nullable: true })
  medicationsGiven: number | null;

  @ApiPropertyOptional({ description: 'Number of medications held', example: 1, nullable: true })
  medicationsHeld: number | null;

  @ApiPropertyOptional({ description: 'Patient status', enum: PatientStatus, nullable: true })
  patientStatus: PatientStatus | null;

  @ApiPropertyOptional({ description: 'Summary text', nullable: true })
  summary: string | null;

  @ApiPropertyOptional({ description: 'List of alerts', type: [DailyAlertDto], nullable: true })
  alerts: DailyAlertDto[] | null;

  @ApiProperty({ description: 'Time when the report was generated' })
  generatedAt: Date;

  @ApiPropertyOptional({ description: 'User ID who generated the report', nullable: true })
  generatedBy: string | null;
}

/**
 * Paginated daily reports response
 */
export class PaginatedDailyReportsResponseDto {
  @ApiProperty({ description: 'Array of daily reports', type: [DailyReportResponseDto] })
  data: DailyReportResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 30 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 2 })
  totalPages: number;
}

/**
 * DTO for generating/regenerating daily report
 */
export class GenerateDailyReportDto {
  @ApiProperty({ description: 'Date for the report', example: '2024-01-15' })
  @IsDateString()
  date: string;
}

/**
 * DTO for listing daily reports
 */
export class ListDailyReportsDto {
  @ApiPropertyOptional({ description: 'Start date filter', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
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
  @ApiProperty({ description: 'Number of reports generated', example: 5 })
  generatedCount: number;

  @ApiProperty({ description: 'Date for which reports were generated' })
  date: Date;

  @ApiProperty({ description: 'Time when generation completed' })
  generatedAt: Date;
}
