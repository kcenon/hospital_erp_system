import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for IntakeOutput record
 */
export class IntakeOutputResponseDto {
  @ApiProperty({ description: 'I/O record ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  admissionId: string;

  @ApiProperty({ description: 'Date of the record' })
  recordDate: Date;

  @ApiProperty({ description: 'Time of the record' })
  recordTime: Date;

  // Intake
  @ApiProperty({ description: 'Oral intake in mL', example: 500 })
  oralIntake: number;

  @ApiProperty({ description: 'IV intake in mL', example: 1000 })
  ivIntake: number;

  @ApiProperty({ description: 'Tube feeding in mL', example: 0 })
  tubeFeeding: number;

  @ApiProperty({ description: 'Other intake in mL', example: 0 })
  otherIntake: number;

  @ApiProperty({ description: 'Total intake in mL', example: 1500 })
  totalIntake: number;

  // Output
  @ApiProperty({ description: 'Urine output in mL', example: 800 })
  urineOutput: number;

  @ApiProperty({ description: 'Stool output in mL', example: 200 })
  stoolOutput: number;

  @ApiProperty({ description: 'Vomit output in mL', example: 0 })
  vomitOutput: number;

  @ApiProperty({ description: 'Drainage output in mL', example: 0 })
  drainageOutput: number;

  @ApiProperty({ description: 'Other output in mL', example: 0 })
  otherOutput: number;

  @ApiProperty({ description: 'Total output in mL', example: 1000 })
  totalOutput: number;

  // Balance
  @ApiProperty({ description: 'I/O balance (intake - output) in mL', example: 500 })
  balance: number;

  @ApiProperty({
    description: 'User ID who recorded',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  recordedBy: string;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;
}

/**
 * Intake breakdown sub-DTO
 */
export class IntakeBreakdownDto {
  @ApiProperty({ description: 'Oral intake in mL', example: 500 })
  oral: number;

  @ApiProperty({ description: 'IV intake in mL', example: 1000 })
  iv: number;

  @ApiProperty({ description: 'Tube feeding in mL', example: 0 })
  tubeFeeding: number;

  @ApiProperty({ description: 'Other intake in mL', example: 0 })
  other: number;

  @ApiProperty({ description: 'Total intake in mL', example: 1500 })
  total: number;
}

/**
 * Output breakdown sub-DTO
 */
export class OutputBreakdownDto {
  @ApiProperty({ description: 'Urine output in mL', example: 800 })
  urine: number;

  @ApiProperty({ description: 'Stool output in mL', example: 200 })
  stool: number;

  @ApiProperty({ description: 'Vomit output in mL', example: 0 })
  vomit: number;

  @ApiProperty({ description: 'Drainage output in mL', example: 0 })
  drainage: number;

  @ApiProperty({ description: 'Other output in mL', example: 0 })
  other: number;

  @ApiProperty({ description: 'Total output in mL', example: 1000 })
  total: number;
}

/**
 * Daily I/O Summary response
 */
export class IODailySummaryDto {
  @ApiProperty({ description: 'Date of the summary' })
  date: Date;

  @ApiProperty({ description: 'Intake breakdown', type: IntakeBreakdownDto })
  intake: {
    oral: number;
    iv: number;
    tubeFeeding: number;
    other: number;
    total: number;
  };

  @ApiProperty({ description: 'Output breakdown', type: OutputBreakdownDto })
  output: {
    urine: number;
    stool: number;
    vomit: number;
    drainage: number;
    other: number;
    total: number;
  };

  @ApiProperty({ description: 'I/O balance in mL', example: 500 })
  balance: number;

  @ApiProperty({
    description: 'Balance status',
    enum: ['NORMAL', 'POSITIVE', 'NEGATIVE'],
    example: 'NORMAL',
  })
  status: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
}

/**
 * I/O Balance for a date range
 */
export class IOBalanceDto {
  @ApiProperty({ description: 'Date of the balance record' })
  date: Date;

  @ApiProperty({ description: 'Total intake in mL', example: 1500 })
  totalIntake: number;

  @ApiProperty({ description: 'Total output in mL', example: 1000 })
  totalOutput: number;

  @ApiProperty({ description: 'Balance in mL', example: 500 })
  balance: number;

  @ApiProperty({
    description: 'Balance status',
    enum: ['NORMAL', 'POSITIVE', 'NEGATIVE'],
    example: 'NORMAL',
  })
  status: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
}

/**
 * Paginated I/O history response
 */
export class PaginatedIOResponseDto {
  @ApiProperty({ description: 'Array of I/O records', type: [IntakeOutputResponseDto] })
  data: IntakeOutputResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}
