import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoundPatientStatus } from '@prisma/client';

export class CreateRoundRecordDto {
  @ApiProperty({
    description: 'Admission ID for the patient record',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  admissionId: string;

  @ApiPropertyOptional({
    description: 'Patient status during round',
    enum: RoundPatientStatus,
    example: 'STABLE',
  })
  @IsOptional()
  @IsEnum(RoundPatientStatus)
  patientStatus?: RoundPatientStatus;

  @ApiPropertyOptional({
    description: 'Chief complaint from patient',
    example: 'Persistent headache since yesterday',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chiefComplaint?: string;

  @ApiPropertyOptional({
    description: 'Clinical observation notes',
    example: 'Patient appears alert and oriented',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observation?: string;

  @ApiPropertyOptional({
    description: 'Clinical assessment',
    example: 'Condition improving, vitals stable',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  assessment?: string;

  @ApiPropertyOptional({
    description: 'Treatment plan',
    example: 'Continue current medication, follow up in 24 hours',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  plan?: string;

  @ApiPropertyOptional({
    description: 'Medical orders',
    example: 'CBC, BMP in AM; PT eval today',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  orders?: string;
}
