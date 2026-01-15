import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
@ApiTags('nursing-notes')
@ApiBearerAuth()
@Controller('admissions/:admissionId/notes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NursingNoteController {
  constructor(private readonly noteService: NursingNoteService) {}

  /**
   * Create nursing note
   * POST /admissions/:admissionId/notes
   */
  @ApiOperation({ summary: 'Create a nursing note for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 201,
    description: 'Nursing note created successfully',
    type: NursingNoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
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
  @ApiOperation({ summary: 'Get nursing notes for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Nursing notes retrieved',
    type: PaginatedNursingNotesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
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
  @ApiOperation({ summary: 'Get significant nursing notes for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Significant nursing notes retrieved',
    type: [NursingNoteResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
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
  @ApiOperation({ summary: 'Get the latest nursing note for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Latest nursing note retrieved',
    type: NursingNoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get('latest')
  @RequirePermission('report:read')
  async getLatest(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
  ): Promise<NursingNoteResponseDto | null> {
    return this.noteService.getLatest(admissionId);
  }
}
