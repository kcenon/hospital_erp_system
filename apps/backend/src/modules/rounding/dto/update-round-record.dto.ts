import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { RoundPatientStatus } from '@prisma/client';

export class UpdateRoundRecordDto {
  @IsOptional()
  @IsEnum(RoundPatientStatus)
  patientStatus?: RoundPatientStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  assessment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  plan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  orders?: string;
}
