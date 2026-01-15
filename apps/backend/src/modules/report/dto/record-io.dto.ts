import { IsInt, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for recording intake/output (REQ-FR-036)
 */
export class RecordIODto {
  @ApiProperty({ description: 'Date of the record', example: '2024-01-15' })
  @IsDateString()
  recordDate: string;

  @ApiProperty({ description: 'Time of the record', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  recordTime: string;

  // Intake
  @ApiPropertyOptional({ description: 'Oral intake in mL', example: 500, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  oralIntake?: number;

  @ApiPropertyOptional({ description: 'IV intake in mL', example: 1000, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ivIntake?: number;

  @ApiPropertyOptional({ description: 'Tube feeding in mL', example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  tubeFeeding?: number;

  @ApiPropertyOptional({ description: 'Other intake in mL', example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  otherIntake?: number;

  // Output
  @ApiPropertyOptional({ description: 'Urine output in mL', example: 800, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  urineOutput?: number;

  @ApiPropertyOptional({ description: 'Stool output in mL', example: 200, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stoolOutput?: number;

  @ApiPropertyOptional({ description: 'Vomit output in mL', example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  vomitOutput?: number;

  @ApiPropertyOptional({ description: 'Drainage output in mL', example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  drainageOutput?: number;

  @ApiPropertyOptional({ description: 'Other output in mL', example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  otherOutput?: number;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Patient drinking well' })
  @IsOptional()
  @IsString()
  notes?: string;
}
