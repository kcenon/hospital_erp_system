import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoundType, RoundStatus, RoundPatientStatus } from '@prisma/client';

export class RoundRecordResponseDto {
  @ApiProperty({ description: 'Record ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Round ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  roundId: string;

  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  admissionId: string;

  @ApiProperty({ description: 'Order in which patient was visited', example: 1 })
  visitOrder: number;

  @ApiPropertyOptional({
    description: 'Patient status during round',
    enum: RoundPatientStatus,
    example: 'STABLE',
    nullable: true,
  })
  patientStatus: RoundPatientStatus | null;

  @ApiPropertyOptional({
    description: 'Chief complaint from patient',
    example: 'Persistent headache',
    nullable: true,
  })
  chiefComplaint: string | null;

  @ApiPropertyOptional({
    description: 'Clinical observation notes',
    example: 'Patient appears alert',
    nullable: true,
  })
  observation: string | null;

  @ApiPropertyOptional({
    description: 'Clinical assessment',
    example: 'Condition improving',
    nullable: true,
  })
  assessment: string | null;

  @ApiPropertyOptional({
    description: 'Treatment plan',
    example: 'Continue current medication',
    nullable: true,
  })
  plan: string | null;

  @ApiPropertyOptional({ description: 'Medical orders', example: 'CBC in AM', nullable: true })
  orders: string | null;

  @ApiPropertyOptional({
    description: 'Time when patient was visited',
    example: '2024-01-15T09:30:00Z',
    nullable: true,
  })
  visitedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Duration of visit in seconds',
    example: 300,
    nullable: true,
  })
  visitDuration: number | null;

  @ApiProperty({
    description: 'ID of user who recorded this',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  recordedBy: string;

  @ApiProperty({ description: 'Record creation timestamp', example: '2024-01-15T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp', example: '2024-01-15T09:30:00Z' })
  updatedAt: Date;
}

export class RoundResponseDto {
  @ApiProperty({ description: 'Round ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Round number', example: 'RND-20240115-001' })
  roundNumber: string;

  @ApiProperty({ description: 'Floor ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  floorId: string;

  @ApiProperty({ description: 'Type of round', enum: RoundType, example: 'MORNING' })
  roundType: RoundType;

  @ApiProperty({ description: 'Scheduled date for the round', example: '2024-01-15T00:00:00Z' })
  scheduledDate: Date;

  @ApiPropertyOptional({
    description: 'Scheduled time for the round',
    example: '2024-01-15T09:00:00Z',
    nullable: true,
  })
  scheduledTime: Date | null;

  @ApiPropertyOptional({
    description: 'Time when round started',
    example: '2024-01-15T09:05:00Z',
    nullable: true,
  })
  startedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Time when round completed',
    example: '2024-01-15T11:30:00Z',
    nullable: true,
  })
  completedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Time when round was paused',
    example: '2024-01-15T10:00:00Z',
    nullable: true,
  })
  pausedAt: Date | null;

  @ApiProperty({
    description: 'Current status of the round',
    enum: RoundStatus,
    example: 'SCHEDULED',
  })
  status: RoundStatus;

  @ApiProperty({ description: 'Lead doctor ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  leadDoctorId: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Focus on post-op patients',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({ description: 'Round creation timestamp', example: '2024-01-14T16:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Round last update timestamp', example: '2024-01-15T09:05:00Z' })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of user who created the round',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  createdBy: string;

  @ApiProperty({
    description: 'List of patient records for this round',
    type: [RoundRecordResponseDto],
  })
  records: RoundRecordResponseDto[];

  @ApiProperty({
    description: 'Valid status transitions from current state',
    enum: RoundStatus,
    isArray: true,
    example: ['IN_PROGRESS', 'CANCELLED'],
  })
  validTransitions: RoundStatus[];
}

export class PaginatedRoundsResponseDto {
  @ApiProperty({ description: 'List of rounds', type: [RoundResponseDto] })
  data: RoundResponseDto[];

  @ApiProperty({ description: 'Total number of rounds matching the filter', example: 50 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages: number;
}
