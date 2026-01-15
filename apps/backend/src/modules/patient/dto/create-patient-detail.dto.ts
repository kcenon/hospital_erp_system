import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDetailDto {
  @ApiPropertyOptional({ description: 'Social Security Number' })
  @IsOptional()
  @IsString()
  ssn?: string;

  @ApiPropertyOptional({ description: 'Medical history' })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional({ description: 'Known allergies' })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({ description: 'Insurance type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceType?: string;

  @ApiPropertyOptional({ description: 'Insurance number' })
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance company', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insuranceCompany?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
