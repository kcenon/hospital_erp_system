import { IsOptional, IsString, IsUUID, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdmissionDto {
  @ApiPropertyOptional({ description: 'Updated diagnosis', example: 'Acute appendicitis' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({
    description: 'Attending doctor ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  attendingDoctorId?: string;

  @ApiPropertyOptional({
    description: 'Primary nurse ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  primaryNurseId?: string;

  @ApiPropertyOptional({
    description: 'Expected discharge date',
    example: '2025-01-20',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  expectedDischargeDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Patient condition improving',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
