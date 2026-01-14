import { faker } from '@faker-js/faker';
import { VitalSign, Consciousness } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export function createTestVitalSign(overrides?: Partial<VitalSign>): VitalSign {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    admissionId: faker.string.uuid(),
    temperature: new Decimal(faker.number.float({ min: 35.0, max: 39.0, fractionDigits: 1 })),
    systolicBp: faker.number.int({ min: 90, max: 180 }),
    diastolicBp: faker.number.int({ min: 60, max: 120 }),
    pulseRate: faker.number.int({ min: 50, max: 120 }),
    respiratoryRate: faker.number.int({ min: 12, max: 24 }),
    oxygenSaturation: faker.number.int({ min: 85, max: 100 }),
    bloodGlucose: faker.number.int({ min: 70, max: 200 }),
    painScore: faker.number.int({ min: 0, max: 10 }),
    consciousness: faker.helpers.arrayElement([
      'ALERT',
      'VERBAL',
      'PAIN',
      'UNRESPONSIVE',
    ] as Consciousness[]),
    measuredAt: now,
    measuredBy: faker.string.uuid(),
    notes: null,
    hasAlert: false,
    createdAt: now,
    ...overrides,
  };
}

export function createNormalVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    temperature: new Decimal(36.5),
    systolicBp: 120,
    diastolicBp: 80,
    pulseRate: 72,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    bloodGlucose: 100,
    painScore: 0,
    consciousness: 'ALERT' as Consciousness,
    hasAlert: false,
    ...overrides,
  });
}

export function createHighFeverVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    temperature: new Decimal(39.5),
    hasAlert: true,
    ...overrides,
  });
}

export function createCriticalHypoxiaVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    oxygenSaturation: 88,
    hasAlert: true,
    ...overrides,
  });
}

export function createHypertensiveVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    systolicBp: 185,
    diastolicBp: 110,
    hasAlert: true,
    ...overrides,
  });
}

export function createHypotensiveVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    systolicBp: 85,
    diastolicBp: 55,
    hasAlert: true,
    ...overrides,
  });
}

export function createTachycardiaVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    pulseRate: 130,
    hasAlert: true,
    ...overrides,
  });
}

export function createBradycardiaVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    pulseRate: 45,
    hasAlert: true,
    ...overrides,
  });
}

export function createMultipleAlertsVitalSign(
  admissionId: string,
  overrides?: Partial<VitalSign>,
): VitalSign {
  return createTestVitalSign({
    admissionId,
    temperature: new Decimal(39.8),
    oxygenSaturation: 87,
    systolicBp: 190,
    pulseRate: 135,
    hasAlert: true,
    ...overrides,
  });
}
