import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionType, AdmissionStatus, DischargeType } from '@prisma/client';

export class TransferResponseDto {
  @ApiProperty({ description: 'Transfer ID', example: '550e8400-e29b-41d4-a716-446655440020' })
  id: string;

  @ApiProperty({
    description: 'Associated admission ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  admissionId: string;

  @ApiProperty({ description: 'Source bed ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  fromBedId: string;

  @ApiProperty({ description: 'Target bed ID', example: '550e8400-e29b-41d4-a716-446655440010' })
  toBedId: string;

  @ApiProperty({ description: 'Transfer date' })
  transferDate: Date;

  @ApiProperty({ description: 'Transfer time', example: '10:00' })
  transferTime: string;

  @ApiProperty({ description: 'Reason for transfer', example: 'Patient requires ICU monitoring' })
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'User ID who performed the transfer' })
  transferredBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

export class DischargeResponseDto {
  @ApiProperty({ description: 'Discharge ID', example: '550e8400-e29b-41d4-a716-446655440030' })
  id: string;

  @ApiProperty({
    description: 'Associated admission ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  admissionId: string;

  @ApiProperty({ description: 'Discharge date' })
  dischargeDate: Date;

  @ApiProperty({ description: 'Discharge time', example: '11:00' })
  dischargeTime: string;

  @ApiProperty({
    description: 'Type of discharge',
    enum: ['NORMAL', 'TRANSFER', 'AMA', 'DECEASED'],
  })
  dischargeType: DischargeType;

  @ApiPropertyOptional({ description: 'Discharge diagnosis', nullable: true })
  dischargeDiagnosis: string | null;

  @ApiPropertyOptional({ description: 'Discharge summary', nullable: true })
  dischargeSummary: string | null;

  @ApiPropertyOptional({ description: 'Follow-up instructions', nullable: true })
  followUpInstructions: string | null;

  @ApiPropertyOptional({ description: 'Follow-up appointment date', nullable: true })
  followUpDate: Date | null;

  @ApiProperty({ description: 'User ID who performed the discharge' })
  dischargedBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

export class AdmissionResponseDto {
  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Patient ID', example: '550e8400-e29b-41d4-a716-446655440100' })
  patientId: string;

  @ApiProperty({ description: 'Assigned bed ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  bedId: string;

  @ApiProperty({ description: 'Admission number', example: 'ADM2025000001' })
  admissionNumber: string;

  @ApiProperty({ description: 'Admission date' })
  admissionDate: Date;

  @ApiProperty({ description: 'Admission time', example: '14:30' })
  admissionTime: string;

  @ApiProperty({ description: 'Type of admission', enum: ['EMERGENCY', 'ELECTIVE', 'TRANSFER'] })
  admissionType: AdmissionType;

  @ApiPropertyOptional({ description: 'Primary diagnosis', nullable: true })
  diagnosis: string | null;

  @ApiPropertyOptional({ description: 'Chief complaint', nullable: true })
  chiefComplaint: string | null;

  @ApiProperty({ description: 'Attending doctor ID' })
  attendingDoctorId: string;

  @ApiPropertyOptional({ description: 'Primary nurse ID', nullable: true })
  primaryNurseId: string | null;

  @ApiProperty({ description: 'Admission status', enum: ['ADMITTED', 'DISCHARGED', 'TRANSFERRED'] })
  status: AdmissionStatus;

  @ApiPropertyOptional({ description: 'Expected discharge date', nullable: true })
  expectedDischargeDate: Date | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'User ID who created the admission' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Transfer history', type: [TransferResponseDto] })
  transfers?: TransferResponseDto[];

  @ApiPropertyOptional({
    description: 'Discharge information',
    type: DischargeResponseDto,
    nullable: true,
  })
  discharge?: DischargeResponseDto | null;
}

export class PaginatedAdmissionsResponseDto {
  @ApiProperty({ description: 'Admission list', type: [AdmissionResponseDto] })
  data: AdmissionResponseDto[];

  @ApiProperty({ description: 'Total count', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 5 })
  totalPages: number;
}
