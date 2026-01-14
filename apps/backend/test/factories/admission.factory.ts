import { faker } from '@faker-js/faker';
import {
  Admission,
  Transfer,
  Discharge,
  AdmissionType,
  AdmissionStatus,
  DischargeType,
} from '@prisma/client';

export function createTestAdmission(overrides?: Partial<Admission>): Admission {
  const now = new Date();
  const year = now.getFullYear();
  return {
    id: faker.string.uuid(),
    patientId: faker.string.uuid(),
    bedId: faker.string.uuid(),
    admissionNumber: `A${year}${faker.string.numeric(6)}`,
    admissionDate: now,
    admissionTime: `${faker.number.int({ min: 0, max: 23 }).toString().padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
    admissionType: faker.helpers.arrayElement([
      'SCHEDULED',
      'EMERGENCY',
      'TRANSFER_IN',
    ] as AdmissionType[]),
    diagnosis: faker.lorem.sentence(),
    chiefComplaint: faker.lorem.sentence(),
    attendingDoctorId: faker.string.uuid(),
    primaryNurseId: faker.string.uuid(),
    status: 'ACTIVE' as AdmissionStatus,
    expectedDischargeDate: faker.date.future({ years: 1 }),
    notes: faker.lorem.sentence(),
    createdAt: now,
    updatedAt: now,
    createdBy: faker.string.uuid(),
    ...overrides,
  };
}

export function createTestTransfer(overrides?: Partial<Transfer>): Transfer {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    admissionId: faker.string.uuid(),
    fromBedId: faker.string.uuid(),
    toBedId: faker.string.uuid(),
    transferDate: now,
    transferTime: `${faker.number.int({ min: 0, max: 23 }).toString().padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
    reason: faker.lorem.sentence(),
    notes: faker.lorem.sentence(),
    transferredBy: faker.string.uuid(),
    createdAt: now,
    ...overrides,
  };
}

export function createTestDischarge(overrides?: Partial<Discharge>): Discharge {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    admissionId: faker.string.uuid(),
    dischargeDate: now,
    dischargeTime: `${faker.number.int({ min: 0, max: 23 }).toString().padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
    dischargeType: faker.helpers.arrayElement([
      'NORMAL',
      'AMA',
      'TRANSFER_OUT',
      'DEATH',
      'OTHER',
    ] as DischargeType[]),
    dischargeDiagnosis: faker.lorem.sentence(),
    dischargeSummary: faker.lorem.paragraph(),
    followUpInstructions: faker.lorem.paragraph(),
    followUpDate: faker.date.future({ years: 1 }),
    dischargedBy: faker.string.uuid(),
    createdAt: now,
    ...overrides,
  };
}

export function createActiveAdmission(overrides?: Partial<Admission>): Admission {
  return createTestAdmission({
    status: 'ACTIVE' as AdmissionStatus,
    ...overrides,
  });
}

export function createDischargedAdmission(overrides?: Partial<Admission>): Admission {
  return createTestAdmission({
    status: 'DISCHARGED' as AdmissionStatus,
    ...overrides,
  });
}

export function createTransferredAdmission(overrides?: Partial<Admission>): Admission {
  return createTestAdmission({
    status: 'TRANSFERRED' as AdmissionStatus,
    ...overrides,
  });
}
