import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma';
import { BedStatus, AdmissionStatus } from '@prisma/client';
import {
  createTestApp,
  closeTestApp,
  TestApp,
  seedTestDatabase,
  cleanupTestDatabase,
  seedPatientTestData,
  cleanupPatientTestData,
  createTestAdmission,
  getTestDataIds,
  loginAs,
  authRequest,
  publicRequest,
} from './index';

describe('Admission API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let doctorToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await seedTestDatabase(prisma);
    await seedPatientTestData(prisma);

    // Get tokens
    const adminTokens = await loginAs(app, 'admin');
    adminToken = adminTokens.accessToken;

    const doctorTokens = await loginAs(app, 'doctor');
    doctorToken = doctorTokens.accessToken;
  });

  afterAll(async () => {
    await cleanupPatientTestData(prisma);
    await cleanupTestDatabase(prisma);
    await closeTestApp(testApp);
  });

  describe('POST /admissions', () => {
    afterEach(async () => {
      // Clean up any admissions created during tests
      const testIds = getTestDataIds();
      await prisma.admission.deleteMany({
        where: {
          patientId: testIds.patients.johnId,
        },
      });
      // Reset bed status
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should create admission and update bed status', async () => {
      const testIds = getTestDataIds();
      const admissionData = {
        patientId: testIds.patients.johnId,
        bedId: testIds.rooms.bed301AId,
        admissionDate: new Date().toISOString().split('T')[0],
        admissionTime: '14:30',
        admissionType: 'SCHEDULED',
        diagnosis: 'Test diagnosis',
        chiefComplaint: 'Test chief complaint',
        attendingDoctorId: testIds.users.doctorId,
      };

      const response = await authRequest(app, 'post', '/admissions', adminToken)
        .set('x-user-id', testIds.users.adminId)
        .send(admissionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('admissionNumber');
      expect(response.body.admissionNumber).toMatch(/^ADM\d{10}$/);
      expect(response.body.patientId).toBe(testIds.patients.johnId);
      expect(response.body.status).toBe('ACTIVE');

      // Verify bed status was updated
      const bed = await prisma.bed.findUnique({
        where: { id: testIds.rooms.bed301AId },
      });
      expect(bed?.status).toBe(BedStatus.OCCUPIED);
    });

    it('should return 400 when bed is not available', async () => {
      const testIds = getTestDataIds();

      // First, occupy the bed
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: BedStatus.OCCUPIED },
      });

      const admissionData = {
        patientId: testIds.patients.janeId,
        bedId: testIds.rooms.bed301AId,
        admissionDate: new Date().toISOString().split('T')[0],
        admissionTime: '15:00',
        admissionType: 'SCHEDULED',
        attendingDoctorId: testIds.users.doctorId,
      };

      const response = await authRequest(app, 'post', '/admissions', adminToken)
        .set('x-user-id', testIds.users.adminId)
        .send(admissionData);

      expect(response.status).toBe(409);
    });

    it('should return 400 when patient is already admitted', async () => {
      const testIds = getTestDataIds();

      // Create an active admission for John
      await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );

      // Try to admit the same patient again
      const admissionData = {
        patientId: testIds.patients.johnId,
        bedId: testIds.rooms.bed302AId,
        admissionDate: new Date().toISOString().split('T')[0],
        admissionTime: '16:00',
        admissionType: 'SCHEDULED',
        attendingDoctorId: testIds.users.doctorId,
      };

      const response = await authRequest(app, 'post', '/admissions', adminToken)
        .set('x-user-id', testIds.users.adminId)
        .send(admissionData);

      expect(response.status).toBe(409);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing patientId, bedId, etc.
        diagnosis: 'Test',
      };

      const response = await authRequest(app, 'post', '/admissions', adminToken).send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /admissions', () => {
    let admissionId: string;

    beforeAll(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );
    });

    afterAll(async () => {
      const testIds = getTestDataIds();
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should return paginated list of admissions', async () => {
      const response = await authRequest(app, 'get', '/admissions', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await authRequest(app, 'get', '/admissions?status=ACTIVE', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.data.every((a: { status: string }) => a.status === 'ACTIVE')).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await publicRequest(app, 'get', '/admissions');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /admissions/:id', () => {
    let admissionId: string;

    beforeAll(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.janeId,
        testIds.rooms.bed302AId,
        testIds.users.doctorId,
      );
    });

    afterAll(async () => {
      const testIds = getTestDataIds();
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.janeId },
      });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed302AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should return admission by ID', async () => {
      const response = await authRequest(app, 'get', `/admissions/${admissionId}`, adminToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(admissionId);
      expect(response.body).toHaveProperty('admissionNumber');
      expect(response.body).toHaveProperty('patientId');
      expect(response.body).toHaveProperty('bedId');
    });

    it('should return 404 for non-existent admission', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(app, 'get', `/admissions/${fakeId}`, adminToken);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /admissions/:id/transfer', () => {
    let admissionId: string;

    beforeEach(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );
    });

    afterEach(async () => {
      const testIds = getTestDataIds();
      await prisma.transfer.deleteMany({
        where: { admissionId },
      });
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
      await prisma.bed.updateMany({
        where: {
          id: {
            in: [testIds.rooms.bed301AId, testIds.rooms.bed302AId, testIds.rooms.bed310AId],
          },
        },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should transfer patient to new bed', async () => {
      const testIds = getTestDataIds();
      const transferData = {
        toBedId: testIds.rooms.bed302AId,
        transferDate: new Date().toISOString().split('T')[0],
        transferTime: '10:00',
        reason: 'Patient requires different room',
      };

      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/transfer`,
        adminToken,
      )
        .set('x-user-id', testIds.users.adminId)
        .send(transferData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.toBedId).toBe(testIds.rooms.bed302AId);
      expect(response.body.reason).toBe(transferData.reason);
    });

    it('should update both bed statuses', async () => {
      const testIds = getTestDataIds();
      const transferData = {
        toBedId: testIds.rooms.bed302AId,
        transferDate: new Date().toISOString().split('T')[0],
        transferTime: '10:00',
        reason: 'Patient requires different room',
      };

      await authRequest(app, 'post', `/admissions/${admissionId}/transfer`, adminToken)
        .set('x-user-id', testIds.users.adminId)
        .send(transferData);

      // Check old bed is now empty
      const oldBed = await prisma.bed.findUnique({
        where: { id: testIds.rooms.bed301AId },
      });
      expect(oldBed?.status).toBe(BedStatus.EMPTY);

      // Check new bed is occupied
      const newBed = await prisma.bed.findUnique({
        where: { id: testIds.rooms.bed302AId },
      });
      expect(newBed?.status).toBe(BedStatus.OCCUPIED);
    });

    it('should return 409 when target bed is occupied', async () => {
      const testIds = getTestDataIds();

      // Occupy the target bed
      await prisma.bed.update({
        where: { id: testIds.rooms.bed302AId },
        data: { status: BedStatus.OCCUPIED },
      });

      const transferData = {
        toBedId: testIds.rooms.bed302AId,
        transferDate: new Date().toISOString().split('T')[0],
        transferTime: '10:00',
        reason: 'Transfer test',
      };

      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/transfer`,
        adminToken,
      )
        .set('x-user-id', testIds.users.adminId)
        .send(transferData);

      expect(response.status).toBe(409);
    });

    it('should return 404 for non-existent admission', async () => {
      const testIds = getTestDataIds();
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const transferData = {
        toBedId: testIds.rooms.bed302AId,
        transferDate: new Date().toISOString().split('T')[0],
        transferTime: '10:00',
        reason: 'Transfer test',
      };

      const response = await authRequest(app, 'post', `/admissions/${fakeId}/transfer`, adminToken)
        .set('x-user-id', testIds.users.adminId)
        .send(transferData);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /admissions/:id/discharge', () => {
    let admissionId: string;

    beforeEach(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );
    });

    afterEach(async () => {
      const testIds = getTestDataIds();
      await prisma.discharge.deleteMany({
        where: { admissionId },
      });
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should discharge patient and free bed', async () => {
      const testIds = getTestDataIds();
      const dischargeData = {
        dischargeDate: new Date().toISOString().split('T')[0],
        dischargeTime: '11:00',
        dischargeType: 'NORMAL',
        dischargeDiagnosis: 'Recovered',
        dischargeSummary: 'Patient fully recovered',
        followUpInstructions: 'Rest for 2 weeks',
      };

      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/discharge`,
        adminToken,
      )
        .set('x-user-id', testIds.users.adminId)
        .send(dischargeData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.dischargeType).toBe('NORMAL');

      // Verify admission status changed
      const admission = await prisma.admission.findUnique({
        where: { id: admissionId },
      });
      expect(admission?.status).toBe(AdmissionStatus.DISCHARGED);

      // Verify bed is now empty
      const bed = await prisma.bed.findUnique({
        where: { id: testIds.rooms.bed301AId },
      });
      expect(bed?.status).toBe(BedStatus.EMPTY);
    });

    it('should return 409 for already discharged patient', async () => {
      const testIds = getTestDataIds();
      const dischargeData = {
        dischargeDate: new Date().toISOString().split('T')[0],
        dischargeTime: '11:00',
        dischargeType: 'NORMAL',
      };

      // First discharge
      await authRequest(app, 'post', `/admissions/${admissionId}/discharge`, adminToken)
        .set('x-user-id', testIds.users.adminId)
        .send(dischargeData);

      // Try to discharge again
      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/discharge`,
        adminToken,
      )
        .set('x-user-id', testIds.users.adminId)
        .send(dischargeData);

      expect(response.status).toBe(409);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing dischargeDate, dischargeTime, dischargeType
        dischargeSummary: 'Test',
      };

      const response = await authRequest(
        app,
        'post',
        `/admissions/${admissionId}/discharge`,
        adminToken,
      ).send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /admissions/:id/transfers', () => {
    let admissionId: string;

    beforeAll(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.mikeId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );

      // Create some transfers
      await prisma.transfer.create({
        data: {
          admissionId,
          fromBedId: testIds.rooms.bed301AId,
          toBedId: testIds.rooms.bed302AId,
          transferDate: new Date(),
          transferTime: '10:00',
          reason: 'First transfer',
          transferredBy: testIds.users.adminId,
        },
      });
    });

    afterAll(async () => {
      const testIds = getTestDataIds();
      await prisma.transfer.deleteMany({
        where: { admissionId },
      });
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.mikeId },
      });
      await prisma.bed.updateMany({
        where: {
          id: {
            in: [testIds.rooms.bed301AId, testIds.rooms.bed302AId],
          },
        },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should return transfer history for admission', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/${admissionId}/transfers`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('fromBedId');
      expect(response.body[0]).toHaveProperty('toBedId');
      expect(response.body[0]).toHaveProperty('reason');
    });

    it('should return empty array for admission with no transfers', async () => {
      const testIds = getTestDataIds();
      // Create admission without transfers
      const newAdmissionId = await createTestAdmission(
        prisma,
        testIds.patients.janeId,
        testIds.rooms.bed310AId,
        testIds.users.doctorId,
      );

      const response = await authRequest(
        app,
        'get',
        `/admissions/${newAdmissionId}/transfers`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Cleanup
      await prisma.admission.delete({ where: { id: newAdmissionId } });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed310AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });
  });

  describe('GET /admissions/by-number/:admissionNumber', () => {
    let admissionId: string;
    let admissionNumber: string;

    beforeAll(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );
      const admission = await prisma.admission.findUnique({
        where: { id: admissionId },
      });
      admissionNumber = admission!.admissionNumber;
    });

    afterAll(async () => {
      const testIds = getTestDataIds();
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should find admission by admission number', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admissions/by-number/${admissionNumber}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.admissionNumber).toBe(admissionNumber);
      expect(response.body.id).toBe(admissionId);
    });

    it('should return 404 for non-existent admission number', async () => {
      const response = await authRequest(
        app,
        'get',
        '/admissions/by-number/ADM9999999999',
        adminToken,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /admissions/patient/:patientId/active', () => {
    let admissionId: string;

    beforeAll(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );
    });

    afterAll(async () => {
      const testIds = getTestDataIds();
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should find active admission for patient', async () => {
      const testIds = getTestDataIds();
      const response = await authRequest(
        app,
        'get',
        `/admissions/patient/${testIds.patients.johnId}/active`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(admissionId);
      expect(response.body.status).toBe('ACTIVE');
    });

    it('should return null for patient without active admission', async () => {
      const testIds = getTestDataIds();
      const response = await authRequest(
        app,
        'get',
        `/admissions/patient/${testIds.patients.janeId}/active`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });
  });

  describe('GET /admissions/floor/:floorId', () => {
    let admissionId: string;

    beforeAll(async () => {
      const testIds = getTestDataIds();
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
      );
    });

    afterAll(async () => {
      const testIds = getTestDataIds();
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: BedStatus.EMPTY, currentAdmissionId: null },
      });
    });

    it('should find admissions by floor', async () => {
      const testIds = getTestDataIds();
      const response = await authRequest(
        app,
        'get',
        `/admissions/floor/${testIds.rooms.floorId}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const testIds = getTestDataIds();
      const response = await authRequest(
        app,
        'get',
        `/admissions/floor/${testIds.rooms.floorId}?status=ACTIVE`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.every((a: { status: string }) => a.status === 'ACTIVE')).toBe(true);
    });
  });
});
