import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoginHistory, AccessLog, ChangeLog, AuditAction, DeviceType } from '@prisma/client';

export class LoginHistoryResponseDto {
  @ApiProperty({ description: 'Login history record ID', format: 'uuid' })
  id: string;

  @ApiPropertyOptional({
    description: 'User ID if login was successful',
    format: 'uuid',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({ description: 'Username used for login attempt' })
  username: string;

  @ApiProperty({ description: 'IP address of the login attempt' })
  ipAddress: string;

  @ApiPropertyOptional({ description: 'User agent string from the browser', nullable: true })
  userAgent: string | null;

  @ApiPropertyOptional({
    description: 'Device type',
    enum: ['PC', 'TABLET', 'MOBILE'],
    nullable: true,
  })
  deviceType: DeviceType | null;

  @ApiPropertyOptional({ description: 'Browser name', nullable: true })
  browser: string | null;

  @ApiPropertyOptional({ description: 'Operating system', nullable: true })
  os: string | null;

  @ApiProperty({ description: 'Login timestamp' })
  loginAt: Date;

  @ApiPropertyOptional({ description: 'Logout timestamp', nullable: true })
  logoutAt: Date | null;

  @ApiPropertyOptional({ description: 'Session ID if login was successful', nullable: true })
  sessionId: string | null;

  @ApiProperty({ description: 'Whether the login was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Reason for login failure', nullable: true })
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
  @ApiProperty({ description: 'Access log record ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User ID who accessed the resource', format: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Username who accessed the resource' })
  username: string;

  @ApiPropertyOptional({ description: 'User role at time of access', nullable: true })
  userRole: string | null;

  @ApiProperty({ description: 'IP address of the request' })
  ipAddress: string;

  @ApiProperty({ description: 'Type of resource accessed' })
  resourceType: string;

  @ApiProperty({ description: 'ID of the resource accessed', format: 'uuid' })
  resourceId: string;

  @ApiProperty({ description: 'Action performed', enum: ['CREATE', 'READ', 'UPDATE', 'DELETE'] })
  action: AuditAction;

  @ApiPropertyOptional({ description: 'Request path', nullable: true })
  requestPath: string | null;

  @ApiPropertyOptional({ description: 'HTTP request method', nullable: true })
  requestMethod: string | null;

  @ApiPropertyOptional({
    description: 'Patient ID if accessing patient data',
    format: 'uuid',
    nullable: true,
  })
  patientId: string | null;

  @ApiProperty({ description: 'List of fields that were accessed', type: [String] })
  accessedFields: string[];

  @ApiProperty({ description: 'Whether the access was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error code if access failed', nullable: true })
  errorCode: string | null;

  @ApiPropertyOptional({ description: 'Error message if access failed', nullable: true })
  errorMessage: string | null;

  @ApiProperty({ description: 'Timestamp of the access' })
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
  @ApiProperty({ description: 'Change log record ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User ID who made the change', format: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Username who made the change' })
  username: string;

  @ApiPropertyOptional({ description: 'IP address of the request', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'Database schema name' })
  tableSchema: string;

  @ApiProperty({ description: 'Table name' })
  tableName: string;

  @ApiProperty({ description: 'Record ID that was changed', format: 'uuid' })
  recordId: string;

  @ApiProperty({ description: 'Action performed', enum: ['CREATE', 'READ', 'UPDATE', 'DELETE'] })
  action: AuditAction;

  @ApiPropertyOptional({
    description: 'Previous values before the change',
    type: 'object',
    additionalProperties: true,
  })
  oldValues: unknown;

  @ApiPropertyOptional({
    description: 'New values after the change',
    type: 'object',
    additionalProperties: true,
  })
  newValues: unknown;

  @ApiProperty({ description: 'List of fields that were changed', type: [String] })
  changedFields: string[];

  @ApiPropertyOptional({ description: 'Reason for the change', nullable: true })
  changeReason: string | null;

  @ApiProperty({ description: 'Timestamp of the change' })
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
  @ApiProperty({ description: 'Array of data items', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
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

class AccessByUserDto {
  @ApiProperty({ description: 'User ID', format: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Number of accesses' })
  accessCount: number;
}

class AccessByTypeDto {
  @ApiProperty({ description: 'Action type' })
  action: string;

  @ApiProperty({ description: 'Number of accesses' })
  count: number;
}

class AccessTimelineDto {
  @ApiProperty({ description: 'User ID', format: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'Fields that were accessed', type: [String] })
  accessedFields: string[];

  @ApiProperty({ description: 'Timestamp of the access' })
  timestamp: Date;
}

class DateRangeResponseDto {
  @ApiProperty({ description: 'Start date of the range' })
  startDate: Date;

  @ApiProperty({ description: 'End date of the range' })
  endDate: Date;
}

export class PatientAccessReportResponseDto {
  @ApiProperty({ description: 'Patient ID', format: 'uuid' })
  patientId: string;

  @ApiProperty({ description: 'Date range of the report', type: DateRangeResponseDto })
  dateRange: {
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({ description: 'Total number of accesses' })
  totalAccess: number;

  @ApiProperty({ description: 'Access breakdown by user', type: [AccessByUserDto] })
  accessByUser: Array<{
    userId: string;
    username: string;
    accessCount: number;
  }>;

  @ApiProperty({ description: 'Access breakdown by action type', type: [AccessByTypeDto] })
  accessByType: Array<{
    action: string;
    count: number;
  }>;

  @ApiProperty({ description: 'Timeline of accesses', type: [AccessTimelineDto] })
  timeline: Array<{
    userId: string;
    username: string;
    action: string;
    accessedFields: string[];
    timestamp: Date;
  }>;
}

export class SuspiciousActivityResponseDto {
  @ApiProperty({ description: 'IP address with suspicious activity' })
  ipAddress: string;

  @ApiProperty({ description: 'Number of failed login attempts' })
  failedAttempts: number;

  @ApiProperty({ description: 'Usernames attempted from this IP', type: [String] })
  usernames: string[];
}
