import { faker } from '@faker-js/faker';
import { Medication, MedicationRoute, MedicationStatus } from '@prisma/client';

export function createTestMedication(overrides?: Partial<Medication>): Medication {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(8, 0, 0, 0);

  return {
    id: faker.string.uuid(),
    admissionId: faker.string.uuid(),
    medicationName: faker.helpers.arrayElement([
      'Amoxicillin 500mg',
      'Lisinopril 10mg',
      'Metformin 500mg',
      'Omeprazole 20mg',
      'Amlodipine 5mg',
    ]),
    dosage: faker.helpers.arrayElement(['500mg', '250mg', '100mg', '50mg', '10mg']),
    route: faker.helpers.arrayElement([
      MedicationRoute.PO,
      MedicationRoute.IV,
      MedicationRoute.IM,
      MedicationRoute.SC,
    ]),
    frequency: faker.helpers.arrayElement(['QD', 'BID', 'TID', 'QID', 'PRN']),
    scheduledTime,
    administeredAt: null,
    administeredBy: null,
    status: MedicationStatus.SCHEDULED,
    holdReason: null,
    notes: faker.lorem.sentence(),
    createdAt: now,
    ...overrides,
  };
}

export function createScheduledMedication(admissionId: string): Medication {
  return createTestMedication({
    admissionId,
    medicationName: 'Amoxicillin 500mg',
    dosage: '500mg',
    route: MedicationRoute.PO,
    frequency: 'TID',
    status: MedicationStatus.SCHEDULED,
    notes: 'Take with food',
  });
}

export function createAdministeredMedication(admissionId: string): Medication {
  const now = new Date();
  return createTestMedication({
    admissionId,
    medicationName: 'Lisinopril 10mg',
    dosage: '10mg',
    route: MedicationRoute.PO,
    frequency: 'QD',
    status: MedicationStatus.ADMINISTERED,
    administeredAt: now,
    administeredBy: faker.string.uuid(),
    notes: 'Patient tolerated well',
  });
}

export function createHeldMedication(admissionId: string): Medication {
  return createTestMedication({
    admissionId,
    medicationName: 'Metformin 500mg',
    dosage: '500mg',
    route: MedicationRoute.PO,
    frequency: 'BID',
    status: MedicationStatus.HELD,
    holdReason: 'Patient NPO for procedure',
  });
}

export function createRefusedMedication(admissionId: string): Medication {
  return createTestMedication({
    admissionId,
    medicationName: 'Omeprazole 20mg',
    dosage: '20mg',
    route: MedicationRoute.PO,
    frequency: 'QD',
    status: MedicationStatus.REFUSED,
    holdReason: 'Patient refuses due to nausea',
  });
}

export function createIVMedication(admissionId: string): Medication {
  return createTestMedication({
    admissionId,
    medicationName: 'Ceftriaxone 1g',
    dosage: '1g',
    route: MedicationRoute.IV,
    frequency: 'Q24H',
    status: MedicationStatus.SCHEDULED,
    notes: 'Infuse over 30 minutes',
  });
}
