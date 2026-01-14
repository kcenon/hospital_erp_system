import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { VitalSignService } from './vital-sign.service';
import { ParseUUIDPipe, JwtAuthGuard } from '../../common';
import { PermissionGuard, RequirePermission } from '../auth';
import {
  RecordVitalSignsDto,
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
@Controller('admissions/:admissionId/vitals')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VitalSignController {
  constructor(private readonly vitalSignService: VitalSignService) {}

  /**
   * Record vital signs (REQ-FR-030)
   * POST /admissions/:admissionId/vitals
   */
  @Post()
  @RequirePermission('vital:write')
  async record(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Body() dto: RecordVitalSignsDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<VitalSignResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.vitalSignService.record(admissionId, dto, effectiveUserId);
  }

  /**
   * Get vital signs history (REQ-FR-031)
   * GET /admissions/:admissionId/vitals
   */
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
  @Get('trend')
  @RequirePermission('vital:read')
  async getTrend(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetTrendDto,
  ): Promise<VitalTrendResponseDto> {
    return this.vitalSignService.getTrendData(admissionId, query);
  }
}
