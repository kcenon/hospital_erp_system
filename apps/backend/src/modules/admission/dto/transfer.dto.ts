import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class TransferDto {
  @IsNotEmpty()
  @IsUUID()
  toBedId: string;

  @IsNotEmpty()
  @IsDateString()
  transferDate: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'transferTime must be in HH:mm format',
  })
  transferTime: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
