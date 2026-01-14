import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDIT_LOG_KEY, AuditLogConfig } from '../decorators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditConfig = this.reflector.get<AuditLogConfig>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const resourceId = this.extractResourceId(request, response, auditConfig);
          const patientId = this.extractPatientId(request, response, auditConfig);

          if (auditConfig.action === 'READ') {
            const accessedFields = this.extractAccessedFields(response);
            await this.auditService.logResourceAccess(
              auditConfig.resourceType,
              resourceId,
              auditConfig.action,
              accessedFields,
              patientId,
            );
          } else {
            await this.auditService.log({
              action: auditConfig.action,
              resourceType: auditConfig.resourceType,
              resourceId,
              changes: this.buildChanges(request, response, auditConfig),
              reason: request.body?.changeReason,
            });
          }

          this.logger.debug(
            `Audit: ${auditConfig.action} ${auditConfig.resourceType}/${resourceId} (${Date.now() - startTime}ms)`,
          );
        } catch (error) {
          this.logger.error('Failed to log audit event', error);
        }
      }),
      catchError((error) => {
        this.logger.debug(
          `Audit: Failed ${auditConfig.action} ${auditConfig.resourceType} - ${error.message}`,
        );
        throw error;
      }),
    );
  }

  private extractResourceId(
    request: { params?: Record<string, string>; body?: Record<string, unknown> },
    response: unknown,
    config: AuditLogConfig,
  ): string {
    if (config.resourceIdParam && request.params?.[config.resourceIdParam]) {
      return request.params[config.resourceIdParam];
    }

    if (response && typeof response === 'object') {
      const res = response as Record<string, unknown>;
      if (res.id && typeof res.id === 'string') {
        return res.id;
      }
      if (res.data && typeof res.data === 'object') {
        const data = res.data as Record<string, unknown>;
        if (data.id && typeof data.id === 'string') {
          return data.id;
        }
      }
    }

    return 'unknown';
  }

  private extractPatientId(
    request: { params?: Record<string, string>; body?: Record<string, unknown> },
    response: unknown,
    config: AuditLogConfig,
  ): string | undefined {
    if (config.patientIdParam && request.params?.[config.patientIdParam]) {
      return request.params[config.patientIdParam];
    }

    if (request.body && typeof request.body.patientId === 'string') {
      return request.body.patientId;
    }

    if (response && typeof response === 'object') {
      const res = response as Record<string, unknown>;
      if (res.patientId && typeof res.patientId === 'string') {
        return res.patientId;
      }
    }

    return undefined;
  }

  private extractAccessedFields(response: unknown): string[] {
    if (!response || typeof response !== 'object') {
      return [];
    }

    const res = response as Record<string, unknown>;
    const data = res.data || res;

    if (typeof data !== 'object') {
      return [];
    }

    return Object.keys(data as Record<string, unknown>);
  }

  private buildChanges(
    request: { body?: Record<string, unknown> },
    response: unknown,
    config: AuditLogConfig,
  ): { old?: Record<string, unknown>; new?: Record<string, unknown> } | undefined {
    const changes: {
      old?: Record<string, unknown>;
      new?: Record<string, unknown>;
    } = {};

    if (config.captureRequest && request.body) {
      const { changeReason, ...bodyWithoutReason } = request.body;
      changes.new = bodyWithoutReason;
    }

    if (config.captureResponse && response && typeof response === 'object') {
      const res = response as Record<string, unknown>;
      changes.new = (res.data || res) as Record<string, unknown>;
    }

    if (!changes.old && !changes.new) {
      return undefined;
    }

    return changes;
  }
}
