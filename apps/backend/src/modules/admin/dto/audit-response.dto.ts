import {
  LoginHistory,
  AccessLog,
  ChangeLog,
  AuditAction,
  DeviceType,
} from '@prisma/client';

export class LoginHistoryResponseDto {
  id: string;
  userId: string | null;
  username: string;
  ipAddress: string;
  userAgent: string | null;
  deviceType: DeviceType | null;
  browser: string | null;
  os: string | null;
  loginAt: Date;
  logoutAt: Date | null;
  sessionId: string | null;
  success: boolean;
  failureReason: string | null;

  constructor(data: LoginHistory) {
    this.id = data.id;
    this.userId = data.userId;
    this.username = data.username;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.deviceType = data.deviceType;
    this.browser = data.browser;
    this.os = data.os;
    this.loginAt = data.loginAt;
    this.logoutAt = data.logoutAt;
    this.sessionId = data.sessionId;
    this.success = data.success;
    this.failureReason = data.failureReason;
  }
}

export class AccessLogResponseDto {
  id: string;
  userId: string;
  username: string;
  userRole: string | null;
  ipAddress: string;
  resourceType: string;
  resourceId: string;
  action: AuditAction;
  requestPath: string | null;
  requestMethod: string | null;
  patientId: string | null;
  accessedFields: string[];
  success: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;

  constructor(data: AccessLog) {
    this.id = data.id;
    this.userId = data.userId;
    this.username = data.username;
    this.userRole = data.userRole;
    this.ipAddress = data.ipAddress;
    this.resourceType = data.resourceType;
    this.resourceId = data.resourceId;
    this.action = data.action;
    this.requestPath = data.requestPath;
    this.requestMethod = data.requestMethod;
    this.patientId = data.patientId;
    this.accessedFields = data.accessedFields;
    this.success = data.success;
    this.errorCode = data.errorCode;
    this.errorMessage = data.errorMessage;
    this.createdAt = data.createdAt;
  }
}

export class ChangeLogResponseDto {
  id: string;
  userId: string;
  username: string;
  ipAddress: string | null;
  tableSchema: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues: unknown;
  newValues: unknown;
  changedFields: string[];
  changeReason: string | null;
  createdAt: Date;

  constructor(data: ChangeLog) {
    this.id = data.id;
    this.userId = data.userId;
    this.username = data.username;
    this.ipAddress = data.ipAddress;
    this.tableSchema = data.tableSchema;
    this.tableName = data.tableName;
    this.recordId = data.recordId;
    this.action = data.action;
    this.oldValues = data.oldValues;
    this.newValues = data.newValues;
    this.changedFields = data.changedFields;
    this.changeReason = data.changeReason;
    this.createdAt = data.createdAt;
  }
}

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(result: {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }) {
    this.data = result.data;
    this.total = result.total;
    this.page = result.page;
    this.limit = result.limit;
    this.totalPages = result.totalPages;
  }
}

export class PatientAccessReportResponseDto {
  patientId: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
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

export class SuspiciousActivityResponseDto {
  ipAddress: string;
  failedAttempts: number;
  usernames: string[];
}
