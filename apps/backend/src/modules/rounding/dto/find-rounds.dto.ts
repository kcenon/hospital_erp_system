import { IsOptional, IsEnum, IsDateString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RoundStatus, RoundType } from '@prisma/client';

export class FindRoundsDto {
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsOptional()
  @IsUUID()
  leadDoctorId?: string;

  @IsOptional()
  @IsEnum(RoundStatus)
  status?: RoundStatus;

  @IsOptional()
  @IsEnum(RoundType)
  roundType?: RoundType;

  @IsOptional()
  @IsDateString()
  scheduledDateFrom?: string;

  @IsOptional()
  @IsDateString()
  scheduledDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
