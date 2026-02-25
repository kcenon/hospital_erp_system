import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { VitalSignService } from './vital-sign.service';
import { ParseUUIDPipe, JwtAuthGuard, CurrentUser } from '../../common';
import { PermissionGuard, RequirePermission } from '../auth';
import {
  RecordVitalSignsDto,
  AmendVitalSignsDto,
  GetVitalHistoryDto,
  GetTrendDto,
  VitalSignResponseDto,
  PaginatedVitalSignsResponseDto,
  VitalTrendResponseDto,
} from './dto';

/**
 * VitalSign Controller
 *
 * Handles HTTP endpoints for vital signs management.
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-030~035
 */
@ApiTags('vitals')
@ApiBearerAuth()
@Controller('admissions/:admissionId/vitals')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VitalSignController {
  constructor(private readonly vitalSignService: VitalSignService) {}

  /**
   * Record vital signs (REQ-FR-030)
   * POST /admissions/:admissionId/vitals
   */
  @ApiOperation({ summary: 'Record vital signs for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 201,
    description: 'Vital signs recorded successfully',
    type: VitalSignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Post()
  @RequirePermission('vital:write')
  async record(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Body() dto: RecordVitalSignsDto,
    @CurrentUser() user: { id: string },
  ): Promise<VitalSignResponseDto> {
    return this.vitalSignService.record(admissionId, dto, user.id);
  }

  /**
   * Amend vital signs record
   * POST /admissions/:admissionId/vitals/:id/amend
   */
  @ApiOperation({ summary: 'Amend a vital signs record' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'id', description: 'Vital sign record UUID to amend' })
  @ApiResponse({
    status: 201,
    description: 'Vital signs amended successfully',
    type: VitalSignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Vital sign record not found' })
  @Post(':id/amend')
  @RequirePermission('vital:write')
  async amend(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AmendVitalSignsDto,
    @CurrentUser() user: { id: string },
  ): Promise<VitalSignResponseDto> {
    return this.vitalSignService.amend(admissionId, id, dto, user.id);
  }

  /**
   * Get vital signs history (REQ-FR-031)
   * GET /admissions/:admissionId/vitals
   */
  @ApiOperation({ summary: 'Get vital signs history for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Vital signs history retrieved',
    type: PaginatedVitalSignsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get()
  @RequirePermission('vital:read')
  async getHistory(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetVitalHistoryDto,
  ): Promise<PaginatedVitalSignsResponseDto> {
    return this.vitalSignService.getHistory(admissionId, query);
  }

  /**
   * Get latest vital signs
   * GET /admissions/:admissionId/vitals/latest
   */
  @ApiOperation({ summary: 'Get latest vital signs for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Latest vital signs retrieved',
    type: VitalSignResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get('latest')
  @RequirePermission('vital:read')
  async getLatest(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
  ): Promise<VitalSignResponseDto | null> {
    return this.vitalSignService.getLatest(admissionId);
  }

  /**
   * Get vital signs trend data (REQ-FR-032)
   * GET /admissions/:admissionId/vitals/trend
   */
  @ApiOperation({ summary: 'Get vital signs trend data for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Vital signs trend data retrieved',
    type: VitalTrendResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get('trend')
  @RequirePermission('vital:read')
  async getTrend(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetTrendDto,
  ): Promise<VitalTrendResponseDto> {
    return this.vitalSignService.getTrendData(admissionId, query);
  }
}
