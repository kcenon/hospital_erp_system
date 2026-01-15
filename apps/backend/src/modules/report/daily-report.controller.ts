import { Controller, Get, Post, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
@ApiTags('daily-reports')
@ApiBearerAuth()
@Controller('admissions/:admissionId/daily-reports')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DailyReportController {
  constructor(private readonly aggregatorService: DailyReportAggregatorService) {}

  /**
   * Get daily report for a specific date
   * GET /admissions/:admissionId/daily-reports/:date
   */
  @ApiOperation({ summary: 'Get daily report for a specific date' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Daily report retrieved', type: DailyReportResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission or report not found' })
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
  @ApiOperation({ summary: 'Generate or regenerate daily report for a specific date' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({
    status: 201,
    description: 'Daily report generated successfully',
    type: DailyReportResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
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
  @ApiOperation({ summary: 'Get live daily summary without saving' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({
    status: 200,
    description: 'Daily summary retrieved',
    type: DailySummaryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
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
  @ApiOperation({ summary: 'List all daily reports for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Daily reports list retrieved',
    type: PaginatedDailyReportsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get()
  @RequirePermission('report:read')
  async listReports(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: ListDailyReportsDto,
  ): Promise<PaginatedDailyReportsResponseDto> {
    return this.aggregatorService.listReports(admissionId, query);
  }
}
