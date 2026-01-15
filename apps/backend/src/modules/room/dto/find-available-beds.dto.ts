import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoomType, BedStatus } from '@prisma/client';

export class FindAvailableBedsDto {
  @ApiPropertyOptional({ description: 'Filter by building ID' })
  @IsOptional()
  @IsString()
  buildingId?: string;

  @ApiPropertyOptional({ description: 'Filter by floor ID' })
  @IsOptional()
  @IsString()
  floorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by room type',
    enum: ['GENERAL', 'ICU', 'ISOLATION', 'PRIVATE', 'SEMI_PRIVATE'],
  })
  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @ApiPropertyOptional({
    description: 'Filter by bed status',
    enum: ['EMPTY', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
  })
  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
