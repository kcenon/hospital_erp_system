import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BedStatus } from '@prisma/client';

export class UpdateBedStatusDto {
  @ApiProperty({
    description: 'Bed status',
    enum: ['EMPTY', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
  })
  @IsEnum(BedStatus)
  status: BedStatus;

  @ApiPropertyOptional({ description: 'Current admission ID' })
  @IsOptional()
  @IsUUID('4')
  currentAdmissionId?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
