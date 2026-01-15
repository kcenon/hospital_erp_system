import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicationRoute, MedicationStatus } from '@prisma/client';

/**
 * DTO for scheduling medication
 */
export class ScheduleMedicationDto {
  @ApiProperty({
    description: 'Name of the medication',
    example: 'Amoxicillin 500mg',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  medicationName: string;

  @ApiProperty({ description: 'Dosage of the medication', example: '500mg', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  dosage: string;

  @ApiProperty({ description: 'Route of administration', enum: MedicationRoute, example: 'ORAL' })
  @IsEnum(MedicationRoute)
  route: MedicationRoute;

  @ApiPropertyOptional({
    description: 'Frequency of administration',
    example: 'TID (Three times daily)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  frequency?: string;

  @ApiPropertyOptional({
    description: 'Scheduled time for administration',
    example: '2024-01-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Take with food' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for administering medication
 */
export class AdministerMedicationDto {
  @ApiPropertyOptional({
    description: 'Time when medication was administered',
    example: '2024-01-15T08:15:00Z',
  })
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Patient tolerated well' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for holding medication
 */
export class HoldMedicationDto {
  @ApiProperty({
    description: 'Reason for holding the medication',
    example: 'Patient NPO for procedure',
  })
  @IsString()
  reason: string;
}

/**
 * DTO for refusing medication
 */
export class RefuseMedicationDto {
  @ApiProperty({
    description: 'Reason for patient refusal',
    example: 'Patient refuses due to nausea',
  })
  @IsString()
  reason: string;
}

/**
 * DTO for querying medication history
 */
export class GetMedicationHistoryDto {
  @ApiPropertyOptional({ description: 'Start date filter', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by medication status',
    enum: MedicationStatus,
    example: 'ADMINISTERED',
  })
  @IsOptional()
  @IsEnum(MedicationStatus)
  status?: MedicationStatus;

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
 * Medication response DTO
 */
export class MedicationResponseDto {
  @ApiProperty({
    description: 'Medication record ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  admissionId: string;

  @ApiProperty({ description: 'Name of the medication', example: 'Amoxicillin 500mg' })
  medicationName: string;

  @ApiProperty({ description: 'Dosage', example: '500mg' })
  dosage: string;

  @ApiProperty({ description: 'Route of administration', enum: MedicationRoute, example: 'ORAL' })
  route: MedicationRoute;

  @ApiPropertyOptional({ description: 'Frequency of administration', nullable: true })
  frequency: string | null;

  @ApiPropertyOptional({ description: 'Scheduled time for administration', nullable: true })
  scheduledTime: Date | null;

  @ApiPropertyOptional({ description: 'Time when medication was administered', nullable: true })
  administeredAt: Date | null;

  @ApiPropertyOptional({ description: 'User ID who administered the medication', nullable: true })
  administeredBy: string | null;

  @ApiProperty({
    description: 'Current status of the medication',
    enum: MedicationStatus,
    example: 'SCHEDULED',
  })
  status: MedicationStatus;

  @ApiPropertyOptional({ description: 'Reason for holding the medication', nullable: true })
  holdReason: string | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;
}

/**
 * Paginated medication response
 */
export class PaginatedMedicationResponseDto {
  @ApiProperty({ description: 'Array of medication records', type: [MedicationResponseDto] })
  data: MedicationResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}
