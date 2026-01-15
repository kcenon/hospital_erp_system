import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { RoundType } from '@prisma/client';

export class CreateRoundDto {
  @IsNotEmpty()
  @IsUUID()
  floorId: string;

  @IsNotEmpty()
  @IsEnum(RoundType)
  roundType: RoundType;

  @IsNotEmpty()
  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'scheduledTime must be in HH:mm format',
  })
  scheduledTime?: string;

  @IsNotEmpty()
  @IsUUID()
  leadDoctorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
