import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionType } from '@prisma/client';

export class CreateAdmissionDto {
  @ApiProperty({
    description: 'Patient ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @ApiProperty({
    description: 'Bed ID to assign',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  bedId: string;

  @ApiProperty({ description: 'Admission date', example: '2025-01-15', format: 'date' })
  @IsNotEmpty()
  @IsDateString()
  admissionDate: string;

  @ApiProperty({ description: 'Admission time in HH:mm format', example: '14:30' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'admissionTime must be in HH:mm format',
  })
  admissionTime: string;

  @ApiProperty({
    description: 'Type of admission',
    enum: ['EMERGENCY', 'ELECTIVE', 'TRANSFER'],
    example: 'ELECTIVE',
  })
  @IsNotEmpty()
  @IsEnum(AdmissionType)
  admissionType: AdmissionType;

  @ApiPropertyOptional({ description: 'Primary diagnosis', example: 'Acute appendicitis' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Chief complaint', example: 'Severe abdominal pain' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiProperty({
    description: 'Attending doctor ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  attendingDoctorId: string;

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
    example: 'Patient requires special diet',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
