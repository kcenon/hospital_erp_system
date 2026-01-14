import {
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  IsDateString,
} from 'class-validator';
import { Consciousness } from '@prisma/client';

/**
 * DTO for recording vital signs (REQ-FR-030)
 */
export class RecordVitalSignsDto {
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(250)
  systolicBp?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(150)
  diastolicBp?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  pulseRate?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  respiratoryRate?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bloodGlucose?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painScore?: number;

  @IsOptional()
  @IsEnum(Consciousness)
  consciousness?: Consciousness;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  measuredAt?: string;
}
