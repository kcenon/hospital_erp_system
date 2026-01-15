import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, AdmissionType, AdmissionStatus, Consciousness } from '@prisma/client';

export class LatestVitalsDto {
  @ApiPropertyOptional({
    description: 'Body temperature in Celsius',
    example: 36.5,
    nullable: true,
  })
  temperature: number | null;

  @ApiProperty({ description: 'Blood pressure reading', example: '120/80' })
  bloodPressure: string;

  @ApiPropertyOptional({ description: 'Pulse rate in BPM', example: 72, nullable: true })
  pulseRate: number | null;

  @ApiPropertyOptional({ description: 'Respiratory rate per minute', example: 16, nullable: true })
  respiratoryRate: number | null;

  @ApiPropertyOptional({ description: 'Oxygen saturation percentage', example: 98, nullable: true })
  oxygenSaturation: number | null;

  @ApiPropertyOptional({
    description: 'Consciousness level',
    enum: Consciousness,
    example: 'ALERT',
    nullable: true,
  })
  consciousness: Consciousness | null;

  @ApiProperty({ description: 'Time when vitals were measured', example: '2024-01-15T08:00:00Z' })
  measuredAt: Date;

  @ApiProperty({ description: 'Whether any vital sign is outside normal range', example: false })
  hasAlert: boolean;
}

export class PatientInfoDto {
  @ApiProperty({ description: 'Patient ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Patient number', example: 'PT-2024-001234' })
  patientNumber: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Patient age in years', example: 45 })
  age: number;

  @ApiProperty({ description: 'Patient gender', enum: Gender, example: 'MALE' })
  gender: Gender;

  @ApiProperty({ description: 'Patient date of birth', example: '1979-05-15' })
  birthDate: Date;
}

export class BedInfoDto {
  @ApiProperty({ description: 'Bed ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Room number', example: '301' })
  roomNumber: string;

  @ApiProperty({ description: 'Bed number', example: 'A' })
  bedNumber: string;

  @ApiPropertyOptional({ description: 'Room name', example: 'Private Room 301', nullable: true })
  roomName: string | null;
}

export class AdmissionInfoDto {
  @ApiPropertyOptional({ description: 'Primary diagnosis', example: 'Pneumonia', nullable: true })
  diagnosis: string | null;

  @ApiPropertyOptional({
    description: 'Chief complaint at admission',
    example: 'Difficulty breathing',
    nullable: true,
  })
  chiefComplaint: string | null;

  @ApiProperty({ description: 'Date of admission', example: '2024-01-10T14:30:00Z' })
  admissionDate: Date;

  @ApiProperty({ description: 'Number of days since admission', example: 5 })
  admissionDays: number;

  @ApiProperty({ description: 'Type of admission', enum: AdmissionType, example: 'EMERGENCY' })
  admissionType: AdmissionType;

  @ApiProperty({
    description: 'Current admission status',
    enum: AdmissionStatus,
    example: 'ACTIVE',
  })
  status: AdmissionStatus;

  @ApiProperty({
    description: 'Attending doctor ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  attendingDoctorId: string;
}

export class RoundingPatientDto {
  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  admissionId: string;

  @ApiProperty({ description: 'Patient information', type: PatientInfoDto })
  patient: PatientInfoDto;

  @ApiProperty({ description: 'Bed information', type: BedInfoDto })
  bed: BedInfoDto;

  @ApiProperty({ description: 'Admission information', type: AdmissionInfoDto })
  admission: AdmissionInfoDto;

  @ApiPropertyOptional({ description: 'Latest vital signs', type: LatestVitalsDto, nullable: true })
  latestVitals: LatestVitalsDto | null;

  @ApiPropertyOptional({
    description: 'Note from previous round',
    example: 'Patient responding well to treatment',
    nullable: true,
  })
  previousRoundNote: string | null;

  @ApiPropertyOptional({
    description: 'Existing record ID if patient already visited',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  existingRecordId: string | null;

  @ApiProperty({ description: 'Whether patient has been visited in this round', example: false })
  isVisited: boolean;
}

export class RoundingPatientListDto {
  @ApiProperty({ description: 'Round ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  roundId: string;

  @ApiProperty({ description: 'Round number', example: 'RND-20240115-001' })
  roundNumber: string;

  @ApiProperty({ description: 'List of patients for this round', type: [RoundingPatientDto] })
  patients: RoundingPatientDto[];

  @ApiProperty({ description: 'Total number of patients in this round', example: 15 })
  totalPatients: number;

  @ApiProperty({ description: 'Number of patients already visited', example: 5 })
  visitedCount: number;

  @ApiProperty({ description: 'Progress percentage (0-100)', example: 33.33 })
  progress: number;
}
