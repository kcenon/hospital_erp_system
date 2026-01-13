import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { DischargeType } from '@prisma/client';

export class DischargeDto {
  @IsNotEmpty()
  @IsDateString()
  dischargeDate: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'dischargeTime must be in HH:mm format',
  })
  dischargeTime: string;

  @IsNotEmpty()
  @IsEnum(DischargeType)
  dischargeType: DischargeType;

  @IsOptional()
  @IsString()
  dischargeDiagnosis?: string;

  @IsOptional()
  @IsString()
  dischargeSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  followUpInstructions?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
