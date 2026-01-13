import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

export class PatientNotFoundException extends NotFoundException {
  constructor(patientId: string) {
    super(`Patient with ID ${patientId} not found`);
  }
}

export class AdmissionNotFoundException extends NotFoundException {
  constructor(admissionId: string) {
    super(`Admission with ID ${admissionId} not found`);
  }
}

export class BedNotFoundException extends NotFoundException {
  constructor(bedId: string) {
    super(`Bed with ID ${bedId} not found`);
  }
}

export class PatientAlreadyAdmittedException extends ConflictException {
  constructor(patientId: string) {
    super(`Patient with ID ${patientId} already has an active admission`);
  }
}

export class BedNotAvailableException extends ConflictException {
  constructor(bedId: string) {
    super(`Bed with ID ${bedId} is not available`);
  }
}

export class AdmissionNotActiveException extends BadRequestException {
  constructor(admissionId: string) {
    super(`Admission with ID ${admissionId} is not active`);
  }
}

export class AdmissionAlreadyDischargedException extends ConflictException {
  constructor(admissionId: string) {
    super(`Admission with ID ${admissionId} has already been discharged`);
  }
}
