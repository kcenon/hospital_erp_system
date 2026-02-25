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

describe('Vital Signs API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let doctorToken: string;
  let nurseToken: string;
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

  describe('POST /admissions/:admissionId/vitals', () => {
    it('should record vital signs', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/vitals`,
        doctorToken,
      ).send({
        temperature: 36.5,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        consciousness: 'ALERT',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.temperature).toBeDefined();
      expect(response.body.systolicBp).toBe(120);
    });

    it('should record vital signs as nurse', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/vitals`,
        nurseToken,
      ).send({
        temperature: 37.0,
        systolicBp: 118,
        diastolicBp: 78,
        pulseRate: 74,
        respiratoryRate: 18,
        oxygenSaturation: 97,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject invalid vital sign values', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/vitals`,
        doctorToken,
      ).send({
        temperature: 50,
        systolicBp: 300,
      });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'post', `/admissions/${admissionId}/vitals`).send({
        temperature: 36.5,
      });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent admission', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(
        app,
        'post',
        `/admissions/${fakeId}/vitals`,
        doctorToken,
      ).send({
        temperature: 36.5,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /admissions/:admissionId/vitals', () => {
    it('should return vital signs history', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/vitals`,
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
        `/admissions/${admissionId}/vitals?page=1&limit=1`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'get', `/admissions/${admissionId}/vitals`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /admissions/:admissionId/vitals/latest', () => {
    it('should return the latest vital signs', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/vitals/latest`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('GET /admissions/:admissionId/vitals/trend', () => {
    it('should return vital signs trend data', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/vitals/trend`,
        doctorToken,
      );

      expect(response.status).toBe(200);
    });
  });
});
