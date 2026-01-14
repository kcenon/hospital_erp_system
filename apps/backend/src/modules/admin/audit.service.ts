import { Injectable, Logger, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { AuditAction, DeviceType } from '@prisma/client';
import { AuditRepository } from './audit.repository';

export interface AuditEvent {
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  changes?: {
    old?: Record<string, unknown>;
    new?: Record<string, unknown>;
  };
  reason?: string;
}

export interface LoginEvent {
  userId?: string;
  username: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  failureReason?: string;
}

export interface PatientAccessContext {
  patientId: string;
  accessType: AuditAction;
  accessedFields: string[];
}

interface AuthenticatedUser {
  id: string;
  username: string;
  roles?: string[];
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditRepository: AuditRepository,
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
  ) {}

  /**
   * Log a generic audit event (REQ-NFR-032)
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      const user = this.request.user;
      if (!user) {
        this.logger.warn('Audit log attempted without authenticated user');
        return;
      }

      const changedFields = event.changes ? this.getChangedFields(event.changes) : [];

      const [schema, table] = this.parseResourceType(event.resourceType);

      await this.auditRepository.createChangeLog({
        userId: user.id,
        username: user.username,
        ipAddress: this.getClientIp(),
        tableSchema: schema,
        tableName: table,
        recordId: event.resourceId,
        action: event.action,
        oldValues: event.changes?.old,
        newValues: event.changes?.new,
        changedFields,
        changeReason: event.reason,
      });

      this.logger.debug(
        `Audit log created: ${event.action} on ${event.resourceType}/${event.resourceId}`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Log patient information access (REQ-NFR-031)
   */
  async logPatientAccess(context: PatientAccessContext): Promise<void> {
    try {
      const user = this.request.user;
      if (!user) {
        this.logger.warn('Patient access log attempted without authenticated user');
        return;
      }

      await this.auditRepository.createAccessLog({
        userId: user.id,
        username: user.username,
        userRole: user.roles?.[0],
        ipAddress: this.getClientIp(),
        resourceType: 'patient',
        resourceId: context.patientId,
        action: context.accessType,
        patientId: context.patientId,
        accessedFields: context.accessedFields,
        requestPath: this.request.path,
        requestMethod: this.request.method,
      });

      this.logger.debug(
        `Patient access logged: ${context.accessType} on patient/${context.patientId}`,
      );
    } catch (error) {
      this.logger.error('Failed to log patient access', error);
    }
  }

  /**
   * Log resource access (generic)
   */
  async logResourceAccess(
    resourceType: string,
    resourceId: string,
    action: AuditAction,
    accessedFields: string[] = [],
    patientId?: string,
  ): Promise<void> {
    try {
      const user = this.request.user;
      if (!user) {
        this.logger.warn('Resource access log attempted without authenticated user');
        return;
      }

      await this.auditRepository.createAccessLog({
        userId: user.id,
        username: user.username,
        userRole: user.roles?.[0],
        ipAddress: this.getClientIp(),
        resourceType,
        resourceId,
        action,
        patientId,
        accessedFields,
        requestPath: this.request.path,
        requestMethod: this.request.method,
      });
    } catch (error) {
      this.logger.error('Failed to log resource access', error);
    }
  }

  /**
   * Log login attempt (REQ-NFR-030)
   */
  async logLogin(event: LoginEvent): Promise<void> {
    try {
      const deviceInfo = this.parseUserAgent(event.userAgent);

      await this.auditRepository.createLoginHistory({
        userId: event.userId,
        username: event.username,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        sessionId: event.sessionId,
        success: event.success,
        failureReason: event.failureReason,
      });

      this.logger.debug(
        `Login ${event.success ? 'success' : 'failure'} logged for ${event.username}`,
      );
    } catch (error) {
      this.logger.error('Failed to log login attempt', error);
    }
  }

  /**
   * Log logout
   */
  async logLogout(sessionId: string): Promise<void> {
    try {
      await this.auditRepository.updateLoginHistory(sessionId, {
        logoutAt: new Date(),
      });

      this.logger.debug(`Logout logged for session ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to log logout', error);
    }
  }

  /**
   * Extract client IP from request headers
   */
  private getClientIp(): string {
    const forwardedFor = this.request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
      return ips.trim();
    }
    return this.request.ip || '0.0.0.0';
  }

  /**
   * Get list of changed fields between old and new values
   */
  private getChangedFields(changes: {
    old?: Record<string, unknown>;
    new?: Record<string, unknown>;
  }): string[] {
    if (!changes.old && !changes.new) return [];

    const fields: string[] = [];
    const allKeys = new Set([...Object.keys(changes.old || {}), ...Object.keys(changes.new || {})]);

    for (const key of allKeys) {
      const oldValue = changes.old?.[key];
      const newValue = changes.new?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        fields.push(key);
      }
    }

    return fields;
  }

  /**
   * Parse resource type into schema and table name
   */
  private parseResourceType(resourceType: string): [string, string] {
    const parts = resourceType.split('.');
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    }
    return ['public', resourceType];
  }

  /**
   * Parse user agent string to extract device info
   */
  private parseUserAgent(userAgent?: string): {
    deviceType?: DeviceType;
    browser?: string;
    os?: string;
  } {
    if (!userAgent) {
      return {};
    }

    const result: {
      deviceType?: DeviceType;
      browser?: string;
      os?: string;
    } = {};

    // Device type detection (order matters: check specific patterns first)
    if (/ipad/i.test(userAgent)) {
      result.deviceType = 'TABLET';
    } else if (/iphone|android.*mobile/i.test(userAgent)) {
      result.deviceType = 'MOBILE';
    } else if (/tablet|android/i.test(userAgent)) {
      result.deviceType = 'TABLET';
    } else {
      result.deviceType = 'PC';
    }

    // Browser detection
    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
      result.browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      result.browser = 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      result.browser = 'Safari';
    } else if (/edg/i.test(userAgent)) {
      result.browser = 'Edge';
    } else if (/msie|trident/i.test(userAgent)) {
      result.browser = 'Internet Explorer';
    }

    // OS detection
    if (/windows/i.test(userAgent)) {
      result.os = 'Windows';
    } else if (/macintosh|mac os/i.test(userAgent)) {
      result.os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      result.os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      result.os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      result.os = 'iOS';
    }

    return result;
  }
}
