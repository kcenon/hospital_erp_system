import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RoundStatus } from '@prisma/client';

export class RoundNotFoundException extends NotFoundException {
  constructor(roundId: string) {
    super(`Round with ID ${roundId} not found`);
  }
}

export class RoundNotInProgressException extends BadRequestException {
  constructor(roundId: string) {
    super(`Round with ID ${roundId} is not in progress`);
  }
}

export class InvalidStateTransitionException extends BadRequestException {
  constructor(from: RoundStatus, to: RoundStatus) {
    super(`Invalid state transition from ${from} to ${to}`);
  }
}

export class RoundRecordNotFoundException extends NotFoundException {
  constructor(recordId: string) {
    super(`Round record with ID ${recordId} not found`);
  }
}

export class RoundRecordAlreadyExistsException extends ConflictException {
  constructor(roundId: string, admissionId: string) {
    super(`Round record for admission ${admissionId} already exists in round ${roundId}`);
  }
}

export class FloorNotFoundException extends NotFoundException {
  constructor(floorId: string) {
    super(`Floor with ID ${floorId} not found`);
  }
}

export class AdmissionNotFoundException extends NotFoundException {
  constructor(admissionId: string) {
    super(`Admission with ID ${admissionId} not found`);
  }
}
