import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NoteType } from '@prisma/client';

/**
 * DTO for creating nursing note (SOAP format)
 */
export class CreateNursingNoteDto {
  @IsEnum(NoteType)
  noteType: NoteType;

  @IsOptional()
  @IsString()
  subjective?: string; // S: Patient's complaints

  @IsOptional()
  @IsString()
  objective?: string; // O: Observable findings

  @IsOptional()
  @IsString()
  assessment?: string; // A: Nursing assessment

  @IsOptional()
  @IsString()
  plan?: string; // P: Care plan

  @IsBoolean()
  isSignificant: boolean;
}

/**
 * DTO for querying nursing notes
 */
export class GetNursingNotesDto {
  @IsOptional()
  @IsEnum(NoteType)
  noteType?: NoteType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSignificant?: boolean;

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
 * Nursing note response DTO
 */
export class NursingNoteResponseDto {
  id: string;
  admissionId: string;
  noteType: NoteType;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  recordedAt: Date;
  recordedBy: string;
  isSignificant: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated nursing notes response
 */
export class PaginatedNursingNotesResponseDto {
  data: NursingNoteResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
