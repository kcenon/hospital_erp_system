import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Consciousness } from '@prisma/client';
import { VitalAlert } from '../value-objects';

/**
 * Response DTO for vital sign record
 */
export class VitalSignResponseDto {
  @ApiProperty({
    description: 'Vital sign record ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  admissionId: string;

  @ApiPropertyOptional({
    description: 'Body temperature in Celsius',
    example: 36.5,
    nullable: true,
  })
  temperature: number | null;

  @ApiPropertyOptional({
    description: 'Systolic blood pressure in mmHg',
    example: 120,
    nullable: true,
  })
  systolicBp: number | null;

  @ApiPropertyOptional({
    description: 'Diastolic blood pressure in mmHg',
    example: 80,
    nullable: true,
  })
  diastolicBp: number | null;

  @ApiPropertyOptional({
    description: 'Pulse rate in beats per minute',
    example: 72,
    nullable: true,
  })
  pulseRate: number | null;

  @ApiPropertyOptional({
    description: 'Respiratory rate in breaths per minute',
    example: 16,
    nullable: true,
  })
  respiratoryRate: number | null;

  @ApiPropertyOptional({ description: 'Oxygen saturation percentage', example: 98, nullable: true })
  oxygenSaturation: number | null;

  @ApiPropertyOptional({
    description: 'Blood glucose level in mg/dL',
    example: 100,
    nullable: true,
  })
  bloodGlucose: number | null;

  @ApiPropertyOptional({ description: 'Pain score (0-10)', example: 3, nullable: true })
  painScore: number | null;

  @ApiPropertyOptional({ description: 'Consciousness level', enum: Consciousness, nullable: true })
  consciousness: Consciousness | null;

  @ApiProperty({ description: 'Time when vitals were measured' })
  measuredAt: Date;

  @ApiProperty({
    description: 'User ID who recorded the vitals',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  measuredBy: string;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether any vital signs are outside normal range', example: false })
  hasAlert: boolean;

  @ApiPropertyOptional({ description: 'List of alerts for abnormal values', type: 'array' })
  alerts?: VitalAlert[];

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;
}

/**
 * Paginated response for vital sign history
 */
export class PaginatedVitalSignsResponseDto {
  @ApiProperty({ description: 'Array of vital sign records', type: [VitalSignResponseDto] })
  data: VitalSignResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}

/**
 * Response DTO for vital signs trend data (REQ-FR-032)
 */
export class VitalTrendResponseDto {
  @ApiProperty({ description: 'Array of measurement timestamps', type: [Date] })
  labels: Date[];

  @ApiProperty({ description: 'Temperature values array', type: [Number], nullable: true })
  temperature: (number | null)[];

  @ApiProperty({
    description: 'Systolic blood pressure values array',
    type: [Number],
    nullable: true,
  })
  systolicBp: (number | null)[];

  @ApiProperty({
    description: 'Diastolic blood pressure values array',
    type: [Number],
    nullable: true,
  })
  diastolicBp: (number | null)[];

  @ApiProperty({ description: 'Pulse rate values array', type: [Number], nullable: true })
  pulseRate: (number | null)[];

  @ApiProperty({ description: 'Respiratory rate values array', type: [Number], nullable: true })
  respiratoryRate: (number | null)[];

  @ApiProperty({ description: 'Oxygen saturation values array', type: [Number], nullable: true })
  oxygenSaturation: (number | null)[];
}
