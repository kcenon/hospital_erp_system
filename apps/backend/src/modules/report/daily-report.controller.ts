import { Controller, Get, Post, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { DailyReportAggregatorService } from './daily-report-aggregator.service';
import { ParseUUIDPipe, JwtAuthGuard } from '../../common';
import { PermissionGuard, RequirePermission } from '../auth';
import {
  DailySummaryResponseDto,
  DailyReportResponseDto,
  PaginatedDailyReportsResponseDto,
  ListDailyReportsDto,
} from './dto/daily-report.dto';

/**
 * DailyReport Controller
 *
 * Handles HTTP endpoints for daily report management.
 * Reference: SDS Section 4.5.3 (Daily Report Aggregation Service)
 * Requirements: REQ-FR-040
 */
@Controller('admissions/:admissionId/daily-reports')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DailyReportController {
  constructor(private readonly aggregatorService: DailyReportAggregatorService) {}

  /**
   * Get daily report for a specific date
   * GET /admissions/:admissionId/daily-reports/:date
   */
  @Get(':date')
  @RequirePermission('report:read')
  async getReport(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Param('date') date: string,
  ): Promise<DailyReportResponseDto | null> {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    return this.aggregatorService.getReport(admissionId, reportDate);
  }

  /**
   * Generate or regenerate daily report for a specific date
   * POST /admissions/:admissionId/daily-reports/:date/generate
   */
  @Post(':date/generate')
  @RequirePermission('report:write')
  async generateReport(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Param('date') date: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<DailyReportResponseDto> {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    return this.aggregatorService.saveReport(admissionId, reportDate, userId);
  }

  /**
   * Get live daily summary (without saving)
   * GET /admissions/:admissionId/daily-reports/:date/summary
   */
  @Get(':date/summary')
  @RequirePermission('report:read')
  async getSummary(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Param('date') date: string,
  ): Promise<DailySummaryResponseDto> {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    return this.aggregatorService.generateDailySummary(admissionId, reportDate);
  }

  /**
   * List all daily reports for an admission
   * GET /admissions/:admissionId/daily-reports
   */
  @Get()
  @RequirePermission('report:read')
  async listReports(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: ListDailyReportsDto,
  ): Promise<PaginatedDailyReportsResponseDto> {
    return this.aggregatorService.listReports(admissionId, query);
  }
}
