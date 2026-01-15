import { IsInt, IsOptional, IsString, IsDateString, Min } from 'class-validator';

/**
 * DTO for recording intake/output (REQ-FR-036)
 */
export class RecordIODto {
  @IsDateString()
  recordDate: string;

  @IsDateString()
  recordTime: string;

  // Intake
  @IsOptional()
  @IsInt()
  @Min(0)
  oralIntake?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ivIntake?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tubeFeeding?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  otherIntake?: number;

  // Output
  @IsOptional()
  @IsInt()
  @Min(0)
  urineOutput?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stoolOutput?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  vomitOutput?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  drainageOutput?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  otherOutput?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
