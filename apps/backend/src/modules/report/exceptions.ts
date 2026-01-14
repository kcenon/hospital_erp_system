import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Exception thrown when a vital sign value is outside valid range
 */
export class InvalidVitalValueException extends BadRequestException {
  constructor(fieldName: string, value: unknown, validRange: string) {
    super(`Invalid ${fieldName} value: ${value}. Valid range: ${validRange}`);
  }
}

/**
 * Exception thrown when an admission is not found
 */
export class AdmissionNotFoundException extends NotFoundException {
  constructor(admissionId: string) {
    super(`Admission with ID ${admissionId} not found`);
  }
}

/**
 * Exception thrown when admission is not active
 */
export class AdmissionNotActiveException extends BadRequestException {
  constructor(admissionId: string) {
    super(`Admission with ID ${admissionId} is not active`);
  }
}

/**
 * Exception thrown when a vital sign record is not found
 */
export class VitalSignNotFoundException extends NotFoundException {
  constructor(vitalSignId: string) {
    super(`Vital sign record with ID ${vitalSignId} not found`);
  }
}
