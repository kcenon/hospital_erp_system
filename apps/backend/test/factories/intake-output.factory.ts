import { faker } from '@faker-js/faker';
import { IntakeOutput } from '@prisma/client';

export function createTestIntakeOutput(overrides?: Partial<IntakeOutput>): IntakeOutput {
  const now = new Date();
  const recordDate = new Date(now);
  recordDate.setHours(0, 0, 0, 0);

  return {
    id: faker.string.uuid(),
    admissionId: faker.string.uuid(),
    recordDate,
    recordTime: now,
    oralIntake: faker.number.int({ min: 0, max: 500 }),
    ivIntake: faker.number.int({ min: 0, max: 1000 }),
    tubeFeeding: faker.number.int({ min: 0, max: 300 }),
    otherIntake: faker.number.int({ min: 0, max: 100 }),
    urineOutput: faker.number.int({ min: 0, max: 800 }),
    stoolOutput: faker.number.int({ min: 0, max: 300 }),
    vomitOutput: faker.number.int({ min: 0, max: 200 }),
    drainageOutput: faker.number.int({ min: 0, max: 100 }),
    otherOutput: faker.number.int({ min: 0, max: 100 }),
    recordedBy: faker.string.uuid(),
    notes: faker.lorem.sentence(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createNormalIntakeOutput(admissionId: string): IntakeOutput {
  return createTestIntakeOutput({
    admissionId,
    oralIntake: 500,
    ivIntake: 1000,
    tubeFeeding: 0,
    otherIntake: 0,
    urineOutput: 800,
    stoolOutput: 200,
    vomitOutput: 0,
    drainageOutput: 0,
    otherOutput: 0,
    notes: 'Normal fluid balance',
  });
}

export function createHighOutputIntakeOutput(admissionId: string): IntakeOutput {
  return createTestIntakeOutput({
    admissionId,
    oralIntake: 500,
    ivIntake: 500,
    tubeFeeding: 0,
    otherIntake: 0,
    urineOutput: 1500,
    stoolOutput: 500,
    vomitOutput: 200,
    drainageOutput: 100,
    otherOutput: 0,
    notes: 'High output - negative balance',
  });
}

export function createHighIntakeIntakeOutput(admissionId: string): IntakeOutput {
  return createTestIntakeOutput({
    admissionId,
    oralIntake: 1000,
    ivIntake: 2000,
    tubeFeeding: 500,
    otherIntake: 100,
    urineOutput: 500,
    stoolOutput: 100,
    vomitOutput: 0,
    drainageOutput: 0,
    otherOutput: 0,
    notes: 'High intake - positive balance',
  });
}
