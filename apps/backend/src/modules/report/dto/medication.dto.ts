import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MedicationRoute, MedicationStatus } from '@prisma/client';

/**
 * DTO for scheduling medication
 */
export class ScheduleMedicationDto {
  @IsString()
  @MaxLength(255)
  medicationName: string;

  @IsString()
  @MaxLength(100)
  dosage: string;

  @IsEnum(MedicationRoute)
  route: MedicationRoute;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  frequency?: string;

  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for administering medication
 */
export class AdministerMedicationDto {
  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for holding medication
 */
export class HoldMedicationDto {
  @IsString()
  reason: string;
}

/**
 * DTO for refusing medication
 */
export class RefuseMedicationDto {
  @IsString()
  reason: string;
}

/**
 * DTO for querying medication history
 */
export class GetMedicationHistoryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(MedicationStatus)
  status?: MedicationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Medication response DTO
 */
export class MedicationResponseDto {
  id: string;
  admissionId: string;
  medicationName: string;
  dosage: string;
  route: MedicationRoute;
  frequency: string | null;
  scheduledTime: Date | null;
  administeredAt: Date | null;
  administeredBy: string | null;
  status: MedicationStatus;
  holdReason: string | null;
  notes: string | null;
  createdAt: Date;
}

/**
 * Paginated medication response
 */
export class PaginatedMedicationResponseDto {
  data: MedicationResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
