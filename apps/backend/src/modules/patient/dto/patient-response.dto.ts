import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class PatientDetailResponseDto {
  @ApiProperty({ description: 'Detail ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Social Security Number (masked)', nullable: true })
  ssn: string | null;

  @ApiPropertyOptional({ description: 'Medical history', nullable: true })
  medicalHistory: string | null;

  @ApiPropertyOptional({ description: 'Known allergies', nullable: true })
  allergies: string | null;

  @ApiPropertyOptional({ description: 'Insurance type', nullable: true })
  insuranceType: string | null;

  @ApiPropertyOptional({ description: 'Insurance number', nullable: true })
  insuranceNumber: string | null;

  @ApiPropertyOptional({ description: 'Insurance company', nullable: true })
  insuranceCompany: string | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;
}

export class PatientResponseDto {
  @ApiProperty({ description: 'Patient ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Patient number', example: 'P2025000001' })
  patientNumber: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Birth date' })
  birthDate: Date;

  @ApiProperty({ description: 'Gender', enum: ['MALE', 'FEMALE'] })
  gender: Gender;

  @ApiPropertyOptional({ description: 'Blood type', nullable: true })
  bloodType: string | null;

  @ApiPropertyOptional({ description: 'Phone number', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Address', nullable: true })
  address: string | null;

  @ApiPropertyOptional({ description: 'Emergency contact name', nullable: true })
  emergencyContactName: string | null;

  @ApiPropertyOptional({ description: 'Emergency contact phone', nullable: true })
  emergencyContactPhone: string | null;

  @ApiPropertyOptional({ description: 'Emergency contact relation', nullable: true })
  emergencyContactRelation: string | null;

  @ApiPropertyOptional({ description: 'Legacy patient ID', nullable: true })
  legacyPatientId: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Patient detail information',
    type: PatientDetailResponseDto,
  })
  detail?: PatientDetailResponseDto;
}

export class PaginatedPatientsResponseDto {
  @ApiProperty({ description: 'Patient list', type: [PatientResponseDto] })
  data: PatientResponseDto[];

  @ApiProperty({ description: 'Total count', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 5 })
  totalPages: number;
}
