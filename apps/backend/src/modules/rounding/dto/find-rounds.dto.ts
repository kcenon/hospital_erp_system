import { IsOptional, IsEnum, IsDateString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoundStatus, RoundType } from '@prisma/client';

export class FindRoundsDto {
  @ApiPropertyOptional({
    description: 'Filter by floor ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by lead doctor ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  leadDoctorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by round status',
    enum: RoundStatus,
    example: 'SCHEDULED',
  })
  @IsOptional()
  @IsEnum(RoundStatus)
  status?: RoundStatus;

  @ApiPropertyOptional({ description: 'Filter by round type', enum: RoundType, example: 'MORNING' })
  @IsOptional()
  @IsEnum(RoundType)
  roundType?: RoundType;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date from (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  scheduledDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date to (ISO 8601)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  scheduledDateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
