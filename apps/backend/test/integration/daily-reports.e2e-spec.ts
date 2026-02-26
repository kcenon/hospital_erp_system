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

describe('Daily Reports API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let doctorToken: string;
  let nurseToken: string;
  let admissionId: string;
  const today = new Date().toISOString().split('T')[0];

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

    const doctorTokens = await loginAs(app, 'doctor');
    doctorToken = doctorTokens.accessToken;

    const nurseTokens = await loginAs(app, 'nurse');
    nurseToken = nurseTokens.accessToken;
  });

  afterAll(async () => {
    await cleanupPatientTestData(prisma);
    await cleanupTestDatabase(prisma);
    await closeTestApp(testApp);
  });

  describe('GET /admissions/:admissionId/daily-reports/:date/summary', () => {
    it('should return live daily summary', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/daily-reports/${today}/summary`,
        doctorToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(
        app,
        'get',
        `/admissions/${admissionId}/daily-reports/${today}/summary`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /admissions/:admissionId/daily-reports/:date/generate', () => {
    it('should generate a daily report', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/daily-reports/${today}/generate`,
        doctorToken,
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(
        app,
        'post',
        `/admissions/${admissionId}/daily-reports/${today}/generate`,
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent admission', async () => {
      const fakeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const response = await authRequest(
        app,
        'post',
        `/admissions/${fakeId}/daily-reports/${today}/generate`,
        doctorToken,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /admissions/:admissionId/daily-reports/:date', () => {
    it('should return daily report for the generated date', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/daily-reports/${today}`,
        doctorToken,
      );

      expect(response.status).toBe(200);
    });
  });

  describe('GET /admissions/:admissionId/daily-reports', () => {
    it('should list all daily reports', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/daily-reports`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/daily-reports?page=1&limit=5`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'get', `/admissions/${admissionId}/daily-reports`);

      expect(response.status).toBe(401);
    });
  });
});
