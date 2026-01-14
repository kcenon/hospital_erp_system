import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  LoginHistory,
  AccessLog,
  ChangeLog,
  AuditAction,
  DeviceType,
  Prisma,
} from '@prisma/client';

export interface CreateLoginHistoryData {
  userId?: string;
  username: string;
  ipAddress: string;
  userAgent?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  sessionId?: string;
  success: boolean;
  failureReason?: string;
}

export interface CreateAccessLogData {
  userId: string;
  username: string;
  userRole?: string;
  ipAddress: string;
  resourceType: string;
  resourceId: string;
  action: AuditAction;
  requestPath?: string;
  requestMethod?: string;
  patientId?: string;
  accessedFields: string[];
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface CreateChangeLogData {
  userId: string;
  username: string;
  ipAddress?: string;
  tableSchema: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields: string[];
  changeReason?: string;
}

export interface QueryLoginHistoryParams {
  userId?: string;
  username?: string;
  ipAddress?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface QueryAccessLogsParams {
  userId?: string;
  patientId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface QueryChangeLogsParams {
  userId?: string;
  tableSchema?: string;
  tableName?: string;
  recordId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Login History Operations
  async createLoginHistory(data: CreateLoginHistoryData): Promise<LoginHistory> {
    return this.prisma.loginHistory.create({
      data: {
        userId: data.userId,
        username: data.username,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceType: data.deviceType,
        browser: data.browser,
        os: data.os,
        sessionId: data.sessionId,
        success: data.success,
        failureReason: data.failureReason,
      },
    });
  }

  async updateLoginHistory(
    sessionId: string,
    data: { logoutAt?: Date },
  ): Promise<LoginHistory | null> {
    const existing = await this.prisma.loginHistory.findFirst({
      where: { sessionId },
    });

    if (!existing) {
      return null;
    }

    return this.prisma.loginHistory.update({
      where: { id: existing.id },
      data,
    });
  }

  async findLoginHistory(params: QueryLoginHistoryParams): Promise<PaginatedResult<LoginHistory>> {
    const { page = 1, limit = 20, ...filters } = params;

    const where: Prisma.LoginHistoryWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.username) {
      where.username = { contains: filters.username, mode: 'insensitive' };
    }

    if (filters.ipAddress) {
      where.ipAddress = filters.ipAddress;
    }

    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.startDate || filters.endDate) {
      where.loginAt = {};
      if (filters.startDate) {
        where.loginAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.loginAt.lte = filters.endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { loginAt: 'desc' },
      }),
      this.prisma.loginHistory.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Access Log Operations
  async createAccessLog(data: CreateAccessLogData): Promise<AccessLog> {
    return this.prisma.accessLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        userRole: data.userRole,
        ipAddress: data.ipAddress,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        action: data.action,
        requestPath: data.requestPath,
        requestMethod: data.requestMethod,
        patientId: data.patientId,
        accessedFields: data.accessedFields,
        success: data.success ?? true,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      },
    });
  }

  async findAccessLogs(params: QueryAccessLogsParams): Promise<PaginatedResult<AccessLog>> {
    const { page = 1, limit = 20, ...filters } = params;

    const where: Prisma.AccessLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAccessLogsByPatient(patientId: string, dateRange: DateRange): Promise<AccessLog[]> {
    return this.prisma.accessLog.findMany({
      where: {
        patientId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Change Log Operations
  async createChangeLog(data: CreateChangeLogData): Promise<ChangeLog> {
    return this.prisma.changeLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        ipAddress: data.ipAddress,
        tableSchema: data.tableSchema,
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        oldValues: data.oldValues as Prisma.InputJsonValue,
        newValues: data.newValues as Prisma.InputJsonValue,
        changedFields: data.changedFields,
        changeReason: data.changeReason,
      },
    });
  }

  async findChangeLogs(params: QueryChangeLogsParams): Promise<PaginatedResult<ChangeLog>> {
    const { page = 1, limit = 20, ...filters } = params;

    const where: Prisma.ChangeLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.tableSchema) {
      where.tableSchema = filters.tableSchema;
    }

    if (filters.tableName) {
      where.tableName = filters.tableName;
    }

    if (filters.recordId) {
      where.recordId = filters.recordId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.changeLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.changeLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
