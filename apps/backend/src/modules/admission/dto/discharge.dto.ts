import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DischargeType } from '@prisma/client';

export class DischargeDto {
  @ApiProperty({ description: 'Discharge date', example: '2025-01-20', format: 'date' })
  @IsNotEmpty()
  @IsDateString()
  dischargeDate: string;

  @ApiProperty({ description: 'Discharge time in HH:mm format', example: '11:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'dischargeTime must be in HH:mm format',
  })
  dischargeTime: string;

  @ApiProperty({
    description: 'Type of discharge',
    enum: ['NORMAL', 'TRANSFER', 'AMA', 'DECEASED'],
    example: 'NORMAL',
  })
  @IsNotEmpty()
  @IsEnum(DischargeType)
  dischargeType: DischargeType;

  @ApiPropertyOptional({ description: 'Discharge diagnosis', example: 'Appendicitis, resolved' })
  @IsOptional()
  @IsString()
  dischargeDiagnosis?: string;

  @ApiPropertyOptional({
    description: 'Discharge summary',
    example: 'Patient recovered well after appendectomy',
  })
  @IsOptional()
  @IsString()
  dischargeSummary?: string;

  @ApiPropertyOptional({
    description: 'Follow-up instructions',
    example: 'Rest for 2 weeks, avoid heavy lifting',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  followUpInstructions?: string;

  @ApiPropertyOptional({
    description: 'Follow-up appointment date',
    example: '2025-02-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
