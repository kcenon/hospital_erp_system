import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { IntakeOutputService } from './intake-output.service';
import { ParseUUIDPipe, JwtAuthGuard } from '../../common';
import { PermissionGuard, RequirePermission } from '../auth';
import { RecordIODto } from './dto/record-io.dto';
import {
  IntakeOutputResponseDto,
  IODailySummaryDto,
  IOBalanceDto,
  PaginatedIOResponseDto,
} from './dto/io-response.dto';
import { GetIOHistoryDto, GetIOBalanceDto } from './dto/get-io-history.dto';

/**
 * IntakeOutput Controller
 *
 * Handles HTTP endpoints for intake/output management.
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-036~038
 */
@Controller('admissions/:admissionId/io')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class IntakeOutputController {
  constructor(private readonly ioService: IntakeOutputService) {}

  /**
   * Record intake/output (REQ-FR-036)
   * POST /admissions/:admissionId/io
   */
  @Post()
  @RequirePermission('report:write')
  async record(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Body() dto: RecordIODto,
    @Headers('x-user-id') userId?: string,
  ): Promise<IntakeOutputResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.ioService.record(admissionId, dto, effectiveUserId);
  }

  /**
   * Get intake/output history
   * GET /admissions/:admissionId/io
   */
  @Get()
  @RequirePermission('report:read')
  async getHistory(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetIOHistoryDto,
  ): Promise<PaginatedIOResponseDto> {
    return this.ioService.getHistory(admissionId, query);
  }

  /**
   * Get daily I/O summary (REQ-FR-037)
   * GET /admissions/:admissionId/io/daily/:date
   */
  @Get('daily/:date')
  @RequirePermission('report:read')
  async getDailySummary(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Param('date') dateStr: string,
  ): Promise<IODailySummaryDto | null> {
    const date = new Date(dateStr);
    return this.ioService.getDailySummary(admissionId, date);
  }

  /**
   * Get I/O balance history (REQ-FR-038)
   * GET /admissions/:admissionId/io/balance
   */
  @Get('balance')
  @RequirePermission('report:read')
  async getBalanceHistory(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetIOBalanceDto,
  ): Promise<IOBalanceDto[]> {
    return this.ioService.getBalanceHistory(admissionId, query);
  }
}
