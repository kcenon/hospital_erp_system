import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: 'Target bed ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  toBedId: string;

  @ApiProperty({ description: 'Transfer date', example: '2025-01-16', format: 'date' })
  @IsNotEmpty()
  @IsDateString()
  transferDate: string;

  @ApiProperty({ description: 'Transfer time in HH:mm format', example: '10:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'transferTime must be in HH:mm format',
  })
  transferTime: string;

  @ApiProperty({
    description: 'Reason for transfer',
    example: 'Patient requires ICU monitoring',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Notify family of room change',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
