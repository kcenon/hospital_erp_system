import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma';
import {
  createTestApp,
  closeTestApp,
  TestApp,
  seedTestDatabase,
  cleanupTestDatabase,
  seedPatientTestData,
  cleanupPatientTestData,
  getTestDataIds,
  loginAs,
  authRequest,
  publicRequest,
} from './index';
import { createTestAdmission } from './test-database';

describe('Nursing Notes API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let nurseToken: string;
  let doctorToken: string;
  let admissionId: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await seedTestDatabase(prisma);
    await seedPatientTestData(prisma);

    const ids = getTestDataIds();
    admissionId = await createTestAdmission(
      prisma,
      ids.patients.johnId,
      ids.rooms.bed301AId,
      ids.users.doctorId,
      ids.users.nurseId,
    );

    const nurseTokens = await loginAs(app, 'nurse');
    nurseToken = nurseTokens.accessToken;

    const doctorTokens = await loginAs(app, 'doctor');
    doctorToken = doctorTokens.accessToken;
  });

  afterAll(async () => {
    await cleanupPatientTestData(prisma);
    await cleanupTestDatabase(prisma);
    await closeTestApp(testApp);
  });

  describe('POST /admissions/:admissionId/notes', () => {
    it('should create a progress note', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/notes`,
        nurseToken,
      ).send({
        noteType: 'PROGRESS',
        subjective: 'Patient reports feeling better today',
        objective: 'Vital signs stable, patient ambulating without assistance',
        assessment: 'Condition improving, pain well controlled',
        plan: 'Continue current treatment plan',
        isSignificant: false,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.noteType).toBe('PROGRESS');
    });

    it('should create a significant incident note', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/notes`,
        nurseToken,
      ).send({
        noteType: 'INCIDENT',
        subjective: 'Patient reports sudden onset of chest pain',
        objective: 'Patient diaphoretic, BP elevated at 180/100',
        assessment: 'Possible cardiac event, requires immediate attention',
        plan: 'Notify physician stat, prepare for EKG',
        isSignificant: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.isSignificant).toBe(true);
    });

    it('should create a handoff note', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/notes`,
        nurseToken,
      ).send({
        noteType: 'HANDOFF',
        subjective: 'Patient had uneventful shift',
        objective: 'All vital signs within normal limits',
        assessment: 'Stable condition',
        plan: 'Continue current plan, follow up on pending labs',
        isSignificant: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.noteType).toBe('HANDOFF');
    });

    it('should reject missing required fields', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/notes`,
        nurseToken,
      ).send({
        subjective: 'Missing noteType and isSignificant',
      });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'post', `/admissions/${admissionId}/notes`).send({
        noteType: 'PROGRESS',
        isSignificant: false,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /admissions/:admissionId/notes', () => {
    it('should return nursing notes list', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/notes`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/notes?page=1&limit=2`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'get', `/admissions/${admissionId}/notes`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /admissions/:admissionId/notes/significant', () => {
    it('should return only significant notes', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/notes/significant`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((note: { isSignificant: boolean }) => {
        expect(note.isSignificant).toBe(true);
      });
    });
  });

  describe('GET /admissions/:admissionId/notes/latest', () => {
    it('should return the latest nursing note', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/notes/latest`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });
  });
});
