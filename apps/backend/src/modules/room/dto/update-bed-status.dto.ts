import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BedStatus } from '@prisma/client';

export class UpdateBedStatusDto {
  @IsEnum(BedStatus)
  status: BedStatus;

  @IsOptional()
  @IsUUID('4')
  currentAdmissionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
