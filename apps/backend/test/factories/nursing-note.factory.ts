import { faker } from '@faker-js/faker';
import { NursingNote, NoteType } from '@prisma/client';

export function createTestNursingNote(overrides?: Partial<NursingNote>): NursingNote {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    admissionId: faker.string.uuid(),
    noteType: faker.helpers.arrayElement([
      'ASSESSMENT',
      'PROGRESS',
      'PROCEDURE',
      'INCIDENT',
      'HANDOFF',
    ] as NoteType[]),
    subjective: faker.lorem.sentence(),
    objective: faker.lorem.sentence(),
    assessment: faker.lorem.sentence(),
    plan: faker.lorem.sentence(),
    recordedAt: now,
    recordedBy: faker.string.uuid(),
    isSignificant: faker.datatype.boolean(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createProgressNote(
  admissionId: string,
  overrides?: Partial<NursingNote>,
): NursingNote {
  return createTestNursingNote({
    admissionId,
    noteType: 'PROGRESS' as NoteType,
    subjective: 'Patient reports feeling better today',
    objective: 'Vital signs stable, patient ambulating without assistance',
    assessment: 'Condition improving, pain well controlled',
    plan: 'Continue current treatment plan, monitor for changes',
    isSignificant: false,
    ...overrides,
  });
}

export function createAssessmentNote(
  admissionId: string,
  overrides?: Partial<NursingNote>,
): NursingNote {
  return createTestNursingNote({
    admissionId,
    noteType: 'ASSESSMENT' as NoteType,
    subjective: 'Patient reports mild discomfort',
    objective: 'Alert and oriented, skin warm and dry',
    assessment: 'Initial nursing assessment completed',
    plan: 'Implement care plan as ordered',
    isSignificant: false,
    ...overrides,
  });
}

export function createSignificantNote(
  admissionId: string,
  overrides?: Partial<NursingNote>,
): NursingNote {
  return createTestNursingNote({
    admissionId,
    noteType: 'INCIDENT' as NoteType,
    subjective: 'Patient reports sudden onset of chest pain',
    objective: 'Patient diaphoretic, BP elevated at 180/100',
    assessment: 'Possible cardiac event, requires immediate attention',
    plan: 'Notify physician stat, prepare for EKG, start O2 as needed',
    isSignificant: true,
    ...overrides,
  });
}

export function createHandoffNote(
  admissionId: string,
  overrides?: Partial<NursingNote>,
): NursingNote {
  return createTestNursingNote({
    admissionId,
    noteType: 'HANDOFF' as NoteType,
    subjective: 'Patient had uneventful shift, no complaints',
    objective: 'All vital signs within normal limits throughout shift',
    assessment: 'Stable condition, ready for continued monitoring',
    plan: 'Continue current plan, follow up on pending lab results',
    isSignificant: true,
    ...overrides,
  });
}

export function createProcedureNote(
  admissionId: string,
  overrides?: Partial<NursingNote>,
): NursingNote {
  return createTestNursingNote({
    admissionId,
    noteType: 'PROCEDURE' as NoteType,
    subjective: 'Patient expressed understanding of procedure',
    objective: 'Procedure completed without complications',
    assessment: 'Patient tolerated procedure well',
    plan: 'Monitor for post-procedure complications',
    isSignificant: false,
    ...overrides,
  });
}
