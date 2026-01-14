import { Controller, Get, Param, Query, UseGuards, Logger, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards';
import { PermissionGuard } from '../auth/guards';
import { RequirePermission } from '../auth/decorators';
import { AuditQueryService } from './audit-query.service';
import {
  QueryLoginHistoryDto,
  QueryAccessLogsDto,
  QueryChangeLogsDto,
  DateRangeDto,
  LoginHistoryResponseDto,
  AccessLogResponseDto,
  ChangeLogResponseDto,
  PaginatedResponseDto,
  PatientAccessReportResponseDto,
  SuspiciousActivityResponseDto,
} from './dto';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('admin:audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditQueryService: AuditQueryService) {}

  /**
   * Query login history with filtering and pagination
   * GET /admin/audit/login-history
   */
  @Get('login-history')
  async queryLoginHistory(
    @Query() query: QueryLoginHistoryDto,
  ): Promise<PaginatedResponseDto<LoginHistoryResponseDto>> {
    this.logger.log('Querying login history');

    const result = await this.auditQueryService.queryLoginHistory({
      userId: query.userId,
      username: query.username,
      ipAddress: query.ipAddress,
      success: query.success,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return new PaginatedResponseDto({
      ...result,
      data: result.data.map((item) => new LoginHistoryResponseDto(item)),
    });
  }

  /**
   * Query access logs with filtering and pagination
   * GET /admin/audit/access-logs
   */
  @Get('access-logs')
  async queryAccessLogs(
    @Query() query: QueryAccessLogsDto,
  ): Promise<PaginatedResponseDto<AccessLogResponseDto>> {
    this.logger.log('Querying access logs');

    const result = await this.auditQueryService.queryAccessLogs({
      userId: query.userId,
      patientId: query.patientId,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return new PaginatedResponseDto({
      ...result,
      data: result.data.map((item) => new AccessLogResponseDto(item)),
    });
  }

  /**
   * Query change logs with filtering and pagination
   * GET /admin/audit/change-logs
   */
  @Get('change-logs')
  async queryChangeLogs(
    @Query() query: QueryChangeLogsDto,
  ): Promise<PaginatedResponseDto<ChangeLogResponseDto>> {
    this.logger.log('Querying change logs');

    const result = await this.auditQueryService.queryChangeLogs({
      userId: query.userId,
      tableSchema: query.tableSchema,
      tableName: query.tableName,
      recordId: query.recordId,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return new PaginatedResponseDto({
      ...result,
      data: result.data.map((item) => new ChangeLogResponseDto(item)),
    });
  }

  /**
   * Get patient access report
   * GET /admin/audit/patients/:patientId/access-report
   */
  @Get('patients/:patientId/access-report')
  async getPatientAccessReport(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: DateRangeDto,
  ): Promise<PatientAccessReportResponseDto> {
    this.logger.log(`Getting access report for patient ${patientId}`);

    return this.auditQueryService.getPatientAccessReport(patientId, {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });
  }

  /**
   * Get user activity report
   * GET /admin/audit/users/:userId/activity-report
   */
  @Get('users/:userId/activity-report')
  async getUserActivityReport(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: DateRangeDto,
  ) {
    this.logger.log(`Getting activity report for user ${userId}`);

    return this.auditQueryService.getUserActivityReport(userId, {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });
  }

  /**
   * Get suspicious activity (multiple failed logins)
   * GET /admin/audit/security/suspicious-activity
   */
  @Get('security/suspicious-activity')
  async getSuspiciousActivity(
    @Query() query: DateRangeDto,
  ): Promise<SuspiciousActivityResponseDto[]> {
    this.logger.log('Getting suspicious activity report');

    return this.auditQueryService.getSuspiciousActivity(
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }

  /**
   * Get failed login attempts
   * GET /admin/audit/security/failed-logins
   */
  @Get('security/failed-logins')
  async getFailedLoginAttempts(
    @Query() query: DateRangeDto,
  ): Promise<PaginatedResponseDto<LoginHistoryResponseDto>> {
    this.logger.log('Getting failed login attempts');

    const result = await this.auditQueryService.getFailedLoginAttempts(
      new Date(query.startDate),
      new Date(query.endDate),
    );

    return new PaginatedResponseDto({
      ...result,
      data: result.data.map((item) => new LoginHistoryResponseDto(item)),
    });
  }
}
