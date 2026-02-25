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

describe('Medications API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let doctorToken: string;
  let nurseToken: string;
  let admissionId: string;
  let scheduledMedicationId: string;

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

  describe('POST /admissions/:admissionId/medications', () => {
    it('should schedule a medication', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications`,
        doctorToken,
      ).send({
        medicationName: 'Amoxicillin 500mg',
        dosage: '500mg',
        route: 'PO',
        frequency: 'TID',
        notes: 'Take with food',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.medicationName).toBe('Amoxicillin 500mg');
      expect(response.body.status).toBe('SCHEDULED');

      scheduledMedicationId = response.body.id;
    });

    it('should schedule IV medication', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications`,
        doctorToken,
      ).send({
        medicationName: 'Ceftriaxone 1g',
        dosage: '1g',
        route: 'IV',
        frequency: 'Q24H',
        notes: 'Infuse over 30 minutes',
      });

      expect(response.status).toBe(201);
      expect(response.body.route).toBe('IV');
    });

    it('should reject missing required fields', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications`,
        doctorToken,
      ).send({
        notes: 'Missing medication name and dosage',
      });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications`,
      ).send({
        medicationName: 'Test Med',
        dosage: '100mg',
        route: 'PO',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /admissions/:admissionId/medications/:id/administer', () => {
    it('should administer a scheduled medication', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications/${scheduledMedicationId}/administer`,
        nurseToken,
      ).send({
        notes: 'Patient tolerated well',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ADMINISTERED');
      expect(response.body.administeredAt).toBeDefined();
    });
  });

  describe('POST /admissions/:admissionId/medications/:id/hold', () => {
    let holdMedId: string;

    beforeAll(async () => {
      const res = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications`,
        doctorToken,
      ).send({
        medicationName: 'Metformin 500mg',
        dosage: '500mg',
        route: 'PO',
        frequency: 'BID',
      });
      holdMedId = res.body.id;
    });

    it('should hold a medication with reason', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications/${holdMedId}/hold`,
        nurseToken,
      ).send({
        reason: 'Patient NPO for procedure',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('HELD');
    });
  });

  describe('POST /admissions/:admissionId/medications/:id/refuse', () => {
    let refuseMedId: string;

    beforeAll(async () => {
      const res = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications`,
        doctorToken,
      ).send({
        medicationName: 'Omeprazole 20mg',
        dosage: '20mg',
        route: 'PO',
        frequency: 'QD',
      });
      refuseMedId = res.body.id;
    });

    it('should record medication refusal', async () => {
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/medications/${refuseMedId}/refuse`,
        nurseToken,
      ).send({
        reason: 'Patient refuses due to nausea',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('REFUSED');
    });
  });

  describe('GET /admissions/:admissionId/medications/scheduled/:date', () => {
    it('should return scheduled medications for today', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/medications/scheduled/${today}`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /admissions/:admissionId/medications', () => {
    it('should return medication history', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/medications`,
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
        `/admissions/${admissionId}/medications?page=1&limit=2`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'get', `/admissions/${admissionId}/medications`);
      expect(response.status).toBe(401);
    });
  });
});
