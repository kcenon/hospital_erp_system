import { faker } from '@faker-js/faker';
import { Patient, PatientDetail, Gender } from '@prisma/client';

export interface PatientWithDetail extends Patient {
  detail: PatientDetail | null;
}

export function createTestPatient(overrides?: Partial<Patient>): Patient {
  const now = new Date();
  const year = now.getFullYear();
  return {
    id: faker.string.uuid(),
    patientNumber: `P${year}${faker.string.numeric(6)}`,
    name: faker.person.fullName(),
    birthDate: faker.date.past({ years: 50 }),
    gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER'] as Gender[]),
    bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null]),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(true),
    emergencyContactName: faker.person.fullName(),
    emergencyContactPhone: faker.phone.number(),
    emergencyContactRelation: faker.helpers.arrayElement(['Spouse', 'Parent', 'Child', 'Sibling']),
    legacyPatientId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createTestPatientDetail(
  patientId: string,
  overrides?: Partial<PatientDetail>,
): PatientDetail {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    patientId,
    ssnEncrypted: null,
    medicalHistoryEncrypted: null,
    allergies: faker.helpers.arrayElement([
      'Penicillin',
      'Aspirin',
      'None',
      'Peanuts, Shellfish',
      null,
    ]),
    insuranceType: faker.helpers.arrayElement(['National Health Insurance', 'Medical Aid', 'Private']),
    insuranceNumberEncrypted: null,
    insuranceCompany: faker.company.name(),
    notes: faker.lorem.sentence(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestPatientWithDetail(
  patientOverrides?: Partial<Patient>,
  detailOverrides?: Partial<PatientDetail>,
): PatientWithDetail {
  const patient = createTestPatient(patientOverrides);
  return {
    ...patient,
    detail: createTestPatientDetail(patient.id, detailOverrides),
  };
}

export function createDeletedPatient(overrides?: Partial<Patient>): Patient {
  return createTestPatient({
    deletedAt: new Date(),
    ...overrides,
  });
}
