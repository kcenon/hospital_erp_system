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
import { AdmissionType } from '@prisma/client';

export class CreateAdmissionDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsUUID()
  bedId: string;

  @IsNotEmpty()
  @IsDateString()
  admissionDate: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'admissionTime must be in HH:mm format',
  })
  admissionTime: string;

  @IsNotEmpty()
  @IsEnum(AdmissionType)
  admissionType: AdmissionType;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsNotEmpty()
  @IsUUID()
  attendingDoctorId: string;

  @IsOptional()
  @IsUUID()
  primaryNurseId?: string;

  @IsOptional()
  @IsDateString()
  expectedDischargeDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
