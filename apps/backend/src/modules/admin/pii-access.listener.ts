import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';
import { AuditRepository } from './audit.repository';
import type { PiiAccessEvent } from '../patient/patient.service';

@Injectable()
export class PiiAccessListener {
  private readonly logger = new Logger(PiiAccessListener.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  @OnEvent('pii.accessed')
  async handlePiiAccess(event: PiiAccessEvent): Promise<void> {
    try {
      await this.auditRepository.createAccessLog({
        userId: 'system',
        username: 'system',
        userRole: event.role,
        ipAddress: '0.0.0.0',
        resourceType: 'patient_pii',
        resourceId: event.patientId,
        action: AuditAction.READ,
        patientId: event.patientId,
        accessedFields: event.accessedFields,
      });

      this.logger.log(
        `PII access logged: role=${event.role} patient=${event.patientId} fields=${event.accessedFields.join(',')}`,
      );
    } catch (error) {
      this.logger.error('Failed to log PII access', error);
    }
  }
}
