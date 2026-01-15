import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';

export class LegacyPatientNotFoundException extends NotFoundException {
  constructor(legacyId: string) {
    super(`Legacy patient with ID ${legacyId} not found`);
  }
}

export class LegacySystemConnectionException extends ServiceUnavailableException {
  constructor(message?: string) {
    super(message || 'Legacy system is unavailable');
  }
}

export class PatientAlreadyImportedException extends NotFoundException {
  constructor(legacyId: string, patientId: string) {
    super(`Patient with legacy ID ${legacyId} already exists with ID ${patientId}`);
  }
}
