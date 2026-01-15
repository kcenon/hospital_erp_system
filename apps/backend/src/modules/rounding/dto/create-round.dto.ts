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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoundType } from '@prisma/client';

export class CreateRoundDto {
  @ApiProperty({
    description: 'Floor ID for the round',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  floorId: string;

  @ApiProperty({ description: 'Type of round', enum: RoundType, example: 'MORNING' })
  @IsNotEmpty()
  @IsEnum(RoundType)
  roundType: RoundType;

  @ApiProperty({ description: 'Scheduled date for the round (ISO 8601)', example: '2024-01-15' })
  @IsNotEmpty()
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ description: 'Scheduled time in HH:mm format', example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'scheduledTime must be in HH:mm format',
  })
  scheduledTime?: string;

  @ApiProperty({
    description: 'Lead doctor ID for the round',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsUUID()
  leadDoctorId: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the round',
    example: 'Focus on post-op patients',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
