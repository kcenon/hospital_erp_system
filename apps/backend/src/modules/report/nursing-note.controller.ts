import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { NursingNoteService } from './nursing-note.service';
import { ParseUUIDPipe, JwtAuthGuard } from '../../common';
import { PermissionGuard, RequirePermission } from '../auth';
import {
  CreateNursingNoteDto,
  GetNursingNotesDto,
  NursingNoteResponseDto,
  PaginatedNursingNotesResponseDto,
} from './dto/nursing-note.dto';

/**
 * NursingNote Controller
 *
 * Handles HTTP endpoints for nursing notes management.
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-036~038
 */
@Controller('admissions/:admissionId/notes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NursingNoteController {
  constructor(private readonly noteService: NursingNoteService) {}

  /**
   * Create nursing note
   * POST /admissions/:admissionId/notes
   */
  @Post()
  @RequirePermission('report:write')
  async create(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Body() dto: CreateNursingNoteDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<NursingNoteResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.noteService.create(admissionId, dto, effectiveUserId);
  }

  /**
   * Get nursing notes
   * GET /admissions/:admissionId/notes
   */
  @Get()
  @RequirePermission('report:read')
  async list(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetNursingNotesDto,
  ): Promise<PaginatedNursingNotesResponseDto> {
    return this.noteService.getByAdmission(admissionId, query);
  }

  /**
   * Get significant nursing notes
   * GET /admissions/:admissionId/notes/significant
   */
  @Get('significant')
  @RequirePermission('report:read')
  async getSignificant(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
  ): Promise<NursingNoteResponseDto[]> {
    return this.noteService.getSignificant(admissionId);
  }

  /**
   * Get latest nursing note
   * GET /admissions/:admissionId/notes/latest
   */
  @Get('latest')
  @RequirePermission('report:read')
  async getLatest(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
  ): Promise<NursingNoteResponseDto | null> {
    return this.noteService.getLatest(admissionId);
  }
}
