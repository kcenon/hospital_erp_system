import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditLogConfig {
  action: AuditAction;
  resourceType: string;
  resourceIdParam?: string;
  captureResponse?: boolean;
  captureRequest?: boolean;
  patientIdParam?: string;
}

/**
 * Decorator for automatic audit logging on controller methods.
 *
 * @example
 * ```typescript
 * @AuditLog({
 *   action: 'CREATE',
 *   resourceType: 'patient.patients',
 *   captureResponse: true,
 * })
 * @Post()
 * async create(@Body() dto: CreatePatientDto) { ... }
 *
 * @AuditLog({
 *   action: 'READ',
 *   resourceType: 'patient.patients',
 *   resourceIdParam: 'id',
 *   patientIdParam: 'id',
 * })
 * @Get(':id')
 * async findById(@Param('id') id: string) { ... }
 * ```
 */
export const AuditLog = (config: AuditLogConfig) =>
  SetMetadata(AUDIT_LOG_KEY, config);
