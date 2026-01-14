import { Injectable, Logger } from '@nestjs/common';
import { AccessLog } from '@prisma/client';
import {
  AuditRepository,
  QueryLoginHistoryParams,
  QueryAccessLogsParams,
  QueryChangeLogsParams,
  DateRange,
  PaginatedResult,
} from './audit.repository';

export interface PatientAccessReport {
  patientId: string;
  dateRange: DateRange;
  totalAccess: number;
  accessByUser: Array<{
    userId: string;
    username: string;
    accessCount: number;
  }>;
  accessByType: Array<{
    action: string;
    count: number;
  }>;
  timeline: Array<{
    userId: string;
    username: string;
    action: string;
    accessedFields: string[];
    timestamp: Date;
  }>;
}

export interface UserActivityReport {
  userId: string;
  username: string;
  dateRange: DateRange;
  loginCount: number;
  failedLoginCount: number;
  accessCount: number;
  changeCount: number;
  recentActivity: Array<{
    type: 'login' | 'access' | 'change';
    action: string;
    resourceType?: string;
    resourceId?: string;
    timestamp: Date;
  }>;
}

@Injectable()
export class AuditQueryService {
  private readonly logger = new Logger(AuditQueryService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Query login history with filtering and pagination
   */
  async queryLoginHistory(params: QueryLoginHistoryParams) {
    return this.auditRepository.findLoginHistory(params);
  }

  /**
   * Query access logs with filtering and pagination (REQ-FR-062)
   */
  async queryAccessLogs(params: QueryAccessLogsParams) {
    return this.auditRepository.findAccessLogs(params);
  }

  /**
   * Query change logs with filtering and pagination
   */
  async queryChangeLogs(params: QueryChangeLogsParams) {
    return this.auditRepository.findChangeLogs(params);
  }

  /**
   * Get comprehensive patient access report
   */
  async getPatientAccessReport(
    patientId: string,
    dateRange: DateRange,
  ): Promise<PatientAccessReport> {
    const logs = await this.auditRepository.findAccessLogsByPatient(
      patientId,
      dateRange,
    );

    return {
      patientId,
      dateRange,
      totalAccess: logs.length,
      accessByUser: this.groupAccessByUser(logs),
      accessByType: this.groupAccessByType(logs),
      timeline: logs.map((log) => ({
        userId: log.userId,
        username: log.username,
        action: log.action,
        accessedFields: log.accessedFields,
        timestamp: log.createdAt,
      })),
    };
  }

  /**
   * Get user activity report
   */
  async getUserActivityReport(
    userId: string,
    dateRange: DateRange,
  ): Promise<UserActivityReport> {
    const [loginHistory, accessLogs, changeLogs] = await Promise.all([
      this.auditRepository.findLoginHistory({
        userId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000,
      }),
      this.auditRepository.findAccessLogs({
        userId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000,
      }),
      this.auditRepository.findChangeLogs({
        userId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000,
      }),
    ]);

    const username = loginHistory.data[0]?.username ||
      accessLogs.data[0]?.username ||
      changeLogs.data[0]?.username ||
      'Unknown';

    const recentActivity = this.buildActivityTimeline(
      loginHistory.data,
      accessLogs.data,
      changeLogs.data,
    );

    return {
      userId,
      username,
      dateRange,
      loginCount: loginHistory.data.filter((l) => l.success).length,
      failedLoginCount: loginHistory.data.filter((l) => !l.success).length,
      accessCount: accessLogs.total,
      changeCount: changeLogs.total,
      recentActivity: recentActivity.slice(0, 50),
    };
  }

  /**
   * Get failed login attempts for security monitoring
   */
  async getFailedLoginAttempts(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ) {
    return this.auditRepository.findLoginHistory({
      success: false,
      startDate,
      endDate,
      limit,
    });
  }

  /**
   * Get suspicious activity (multiple failed logins from same IP)
   */
  async getSuspiciousActivity(
    startDate: Date,
    endDate: Date,
    threshold: number = 5,
  ): Promise<
    Array<{
      ipAddress: string;
      failedAttempts: number;
      usernames: string[];
    }>
  > {
    const failedLogins = await this.auditRepository.findLoginHistory({
      success: false,
      startDate,
      endDate,
      limit: 10000,
    });

    const ipMap = new Map<
      string,
      { count: number; usernames: Set<string> }
    >();

    for (const login of failedLogins.data) {
      const existing = ipMap.get(login.ipAddress);
      if (existing) {
        existing.count++;
        existing.usernames.add(login.username);
      } else {
        ipMap.set(login.ipAddress, {
          count: 1,
          usernames: new Set([login.username]),
        });
      }
    }

    return Array.from(ipMap.entries())
      .filter(([, data]) => data.count >= threshold)
      .map(([ipAddress, data]) => ({
        ipAddress,
        failedAttempts: data.count,
        usernames: Array.from(data.usernames),
      }))
      .sort((a, b) => b.failedAttempts - a.failedAttempts);
  }

  private groupAccessByUser(
    logs: AccessLog[],
  ): Array<{ userId: string; username: string; accessCount: number }> {
    const userMap = new Map<string, { username: string; count: number }>();

    for (const log of logs) {
      const existing = userMap.get(log.userId);
      if (existing) {
        existing.count++;
      } else {
        userMap.set(log.userId, { username: log.username, count: 1 });
      }
    }

    return Array.from(userMap.entries())
      .map(([userId, data]) => ({
        userId,
        username: data.username,
        accessCount: data.count,
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
  }

  private groupAccessByType(
    logs: AccessLog[],
  ): Array<{ action: string; count: number }> {
    const actionMap = new Map<string, number>();

    for (const log of logs) {
      const count = actionMap.get(log.action) || 0;
      actionMap.set(log.action, count + 1);
    }

    return Array.from(actionMap.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);
  }

  private buildActivityTimeline(
    loginHistory: Array<{ success: boolean; loginAt: Date; username: string }>,
    accessLogs: Array<{
      action: string;
      resourceType: string;
      resourceId: string;
      createdAt: Date;
    }>,
    changeLogs: Array<{
      action: string;
      tableName: string;
      recordId: string;
      createdAt: Date;
    }>,
  ): Array<{
    type: 'login' | 'access' | 'change';
    action: string;
    resourceType?: string;
    resourceId?: string;
    timestamp: Date;
  }> {
    const activities: Array<{
      type: 'login' | 'access' | 'change';
      action: string;
      resourceType?: string;
      resourceId?: string;
      timestamp: Date;
    }> = [];

    for (const login of loginHistory) {
      activities.push({
        type: 'login',
        action: login.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        timestamp: login.loginAt,
      });
    }

    for (const access of accessLogs) {
      activities.push({
        type: 'access',
        action: access.action,
        resourceType: access.resourceType,
        resourceId: access.resourceId,
        timestamp: access.createdAt,
      });
    }

    for (const change of changeLogs) {
      activities.push({
        type: 'change',
        action: change.action,
        resourceType: change.tableName,
        resourceId: change.recordId,
        timestamp: change.createdAt,
      });
    }

    return activities.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}
