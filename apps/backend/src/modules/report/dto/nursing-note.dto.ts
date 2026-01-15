import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType } from '@prisma/client';

/**
 * DTO for creating nursing note (SOAP format)
 */
export class CreateNursingNoteDto {
  @ApiProperty({ description: 'Type of nursing note', enum: NoteType, example: 'PROGRESS' })
  @IsEnum(NoteType)
  noteType: NoteType;

  @ApiPropertyOptional({
    description: 'Subjective - Patient complaints and symptoms',
    example: 'Patient reports mild headache',
  })
  @IsOptional()
  @IsString()
  subjective?: string; // S: Patient's complaints

  @ApiPropertyOptional({
    description: 'Objective - Observable findings',
    example: 'Vital signs stable, patient appears comfortable',
  })
  @IsOptional()
  @IsString()
  objective?: string; // O: Observable findings

  @ApiPropertyOptional({
    description: 'Assessment - Nursing assessment',
    example: 'Mild tension headache, likely due to stress',
  })
  @IsOptional()
  @IsString()
  assessment?: string; // A: Nursing assessment

  @ApiPropertyOptional({
    description: 'Plan - Care plan',
    example: 'Continue monitoring, administer PRN analgesic if needed',
  })
  @IsOptional()
  @IsString()
  plan?: string; // P: Care plan

  @ApiProperty({ description: 'Whether the note is significant for handoff', example: false })
  @IsBoolean()
  isSignificant: boolean;
}

/**
 * DTO for querying nursing notes
 */
export class GetNursingNotesDto {
  @ApiPropertyOptional({ description: 'Filter by note type', enum: NoteType, example: 'PROGRESS' })
  @IsOptional()
  @IsEnum(NoteType)
  noteType?: NoteType;

  @ApiPropertyOptional({ description: 'Filter by significant notes only', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSignificant?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
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

/**
 * Nursing note response DTO
 */
export class NursingNoteResponseDto {
  @ApiProperty({ description: 'Nursing note ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Admission ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  admissionId: string;

  @ApiProperty({ description: 'Type of nursing note', enum: NoteType, example: 'PROGRESS' })
  noteType: NoteType;

  @ApiPropertyOptional({ description: 'Subjective - Patient complaints', nullable: true })
  subjective: string | null;

  @ApiPropertyOptional({ description: 'Objective - Observable findings', nullable: true })
  objective: string | null;

  @ApiPropertyOptional({ description: 'Assessment - Nursing assessment', nullable: true })
  assessment: string | null;

  @ApiPropertyOptional({ description: 'Plan - Care plan', nullable: true })
  plan: string | null;

  @ApiProperty({ description: 'Time when note was recorded' })
  recordedAt: Date;

  @ApiProperty({
    description: 'User ID who recorded the note',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  recordedBy: string;

  @ApiProperty({ description: 'Whether the note is significant for handoff', example: false })
  isSignificant: boolean;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;
}

/**
 * Paginated nursing notes response
 */
export class PaginatedNursingNotesResponseDto {
  @ApiProperty({ description: 'Array of nursing notes', type: [NursingNoteResponseDto] })
  data: NursingNoteResponseDto[];

  @ApiProperty({ description: 'Total number of records', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;
}
