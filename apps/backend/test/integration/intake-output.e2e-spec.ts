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

describe('Intake/Output API (e2e)', () => {
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

  describe('POST /admissions/:admissionId/io', () => {
    it('should record intake/output', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/io`,
        nurseToken,
      ).send({
        recordDate: today,
        recordTime: new Date().toISOString(),
        oralIntake: 500,
        ivIntake: 1000,
        urineOutput: 800,
        stoolOutput: 200,
        notes: 'Normal fluid balance',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.oralIntake).toBe(500);
      expect(response.body.ivIntake).toBe(1000);
    });

    it('should record another I/O entry', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/io`,
        nurseToken,
      ).send({
        recordDate: today,
        recordTime: new Date().toISOString(),
        oralIntake: 300,
        ivIntake: 500,
        urineOutput: 600,
        notes: 'Afternoon recording',
      });

      expect(response.status).toBe(201);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'post', `/admissions/${admissionId}/io`).send({
        recordDate: new Date().toISOString().split('T')[0],
        recordTime: new Date().toISOString(),
        oralIntake: 100,
      });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent admission', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(app, 'post', `/admissions/${fakeId}/io`, nurseToken).send({
        recordDate: new Date().toISOString().split('T')[0],
        recordTime: new Date().toISOString(),
        oralIntake: 100,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /admissions/:admissionId/io', () => {
    it('should return I/O history', async () => {
      const response = await authRequest(app, 'get', `/admissions/${admissionId}/io`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/io?page=1&limit=1`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'get', `/admissions/${admissionId}/io`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /admissions/:admissionId/io/daily/:date', () => {
    it('should return daily I/O summary', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/io/daily/${today}`,
        doctorToken,
      );

      expect(response.status).toBe(200);
    });
  });

  describe('GET /admissions/:admissionId/io/balance', () => {
    it('should return I/O balance history', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/io/balance`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
