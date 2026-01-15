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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Consciousness } from '@prisma/client';

/**
 * DTO for recording vital signs (REQ-FR-030)
 */
export class RecordVitalSignsDto {
  @ApiPropertyOptional({
    description: 'Body temperature in Celsius',
    example: 36.5,
    minimum: 30,
    maximum: 45,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Systolic blood pressure in mmHg',
    example: 120,
    minimum: 50,
    maximum: 250,
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(250)
  systolicBp?: number;

  @ApiPropertyOptional({
    description: 'Diastolic blood pressure in mmHg',
    example: 80,
    minimum: 30,
    maximum: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(150)
  diastolicBp?: number;

  @ApiPropertyOptional({
    description: 'Pulse rate in beats per minute',
    example: 72,
    minimum: 30,
    maximum: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  pulseRate?: number;

  @ApiPropertyOptional({
    description: 'Respiratory rate in breaths per minute',
    example: 16,
    minimum: 5,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  respiratoryRate?: number;

  @ApiPropertyOptional({
    description: 'Oxygen saturation percentage',
    example: 98,
    minimum: 50,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  @ApiPropertyOptional({ description: 'Blood glucose level in mg/dL', example: 100, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bloodGlucose?: number;

  @ApiPropertyOptional({ description: 'Pain score (0-10)', example: 3, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painScore?: number;

  @ApiPropertyOptional({
    description: 'Consciousness level',
    enum: Consciousness,
    example: 'ALERT',
  })
  @IsOptional()
  @IsEnum(Consciousness)
  consciousness?: Consciousness;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Patient reports feeling well' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Time when vitals were measured',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  measuredAt?: string;
}
