import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';

export class FindAdmissionsDto {
  @ApiPropertyOptional({ description: 'Filter by patient ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter by bed ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bedId?: string;

  @ApiPropertyOptional({ description: 'Filter by floor ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @ApiPropertyOptional({ description: 'Filter by attending doctor ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  attendingDoctorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by admission status',
    enum: ['ADMITTED', 'DISCHARGED', 'TRANSFERRED'],
  })
  @IsOptional()
  @IsEnum(AdmissionStatus)
  status?: AdmissionStatus;

  @ApiPropertyOptional({
    description: 'Filter admissions from this date',
    example: '2025-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  admissionDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter admissions until this date',
    example: '2025-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  admissionDateTo?: string;

  @ApiPropertyOptional({
    description: 'Search by patient name or admission number',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
