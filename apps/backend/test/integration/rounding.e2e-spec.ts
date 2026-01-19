import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma';
import { RoundStatus, RoundType, RoundPatientStatus } from '@prisma/client';
import {
  createTestApp,
  closeTestApp,
  TestApp,
  seedTestDatabase,
  cleanupTestDatabase,
  seedPatientTestData,
  cleanupPatientTestData,
  getTestDataIds,
  createTestAdmission,
  loginAs,
  authRequest,
  publicRequest,
} from './index';

describe('Rounding API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let doctorToken: string;
  let nurseToken: string;
  let adminToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    await seedTestDatabase(prisma);
    await seedPatientTestData(prisma);

    const doctorTokens = await loginAs(app, 'doctor');
    doctorToken = doctorTokens.accessToken;

    const nurseTokens = await loginAs(app, 'nurse');
    nurseToken = nurseTokens.accessToken;

    const adminTokens = await loginAs(app, 'admin');
    adminToken = adminTokens.accessToken;
  });

  afterAll(async () => {
    // Clean up rounds before patient data
    await prisma.roundRecord.deleteMany({});
    await prisma.round.deleteMany({});
    await cleanupPatientTestData(prisma);
    await cleanupTestDatabase(prisma);
    await closeTestApp(testApp);
  });

  describe('POST /rounds', () => {
    let testIds: ReturnType<typeof getTestDataIds>;

    beforeAll(() => {
      testIds = getTestDataIds();
    });

    it('should create round with floor assignment', async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);

      const response = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          scheduledTime: '09:00',
          leadDoctorId: testIds.users.doctorId,
          notes: 'Morning round for internal medicine',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('roundNumber');
      expect(response.body.floorId).toBe(testIds.rooms.floorId);
      expect(response.body.roundType).toBe(RoundType.MORNING);
      expect(response.body.status).toBe(RoundStatus.PLANNED);
      expect(response.body.leadDoctorId).toBe(testIds.users.doctorId);
      expect(response.body).toHaveProperty('validTransitions');
      expect(response.body.validTransitions).toContain(RoundStatus.IN_PROGRESS);
    });

    it('should return 400 when floor does not exist', async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);

      const response = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: '00000000-0000-0000-0000-000000000000',
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 with invalid round type', async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);

      const response = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: 'INVALID_TYPE',
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 with missing required fields', async () => {
      const response = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          roundType: RoundType.MORNING,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /rounds', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let createdRoundId: string;

    beforeAll(async () => {
      testIds = getTestDataIds();

      // Create a round for testing
      const scheduledDate = new Date();
      const response = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.AFTERNOON,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      createdRoundId = response.body.id;
    });

    it('should return paginated list of rounds', async () => {
      const response = await authRequest(app, 'get', '/rounds', doctorToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter rounds by floor', async () => {
      const response = await authRequest(
        app,
        'get',
        `/rounds?floorId=${testIds.rooms.floorId}`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((round: { floorId: string }) => {
        expect(round.floorId).toBe(testIds.rooms.floorId);
      });
    });

    it('should filter rounds by status', async () => {
      const response = await authRequest(
        app,
        'get',
        `/rounds?status=${RoundStatus.PLANNED}`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      response.body.data.forEach((round: { status: string }) => {
        expect(round.status).toBe(RoundStatus.PLANNED);
      });
    });

    it('should filter rounds by round type', async () => {
      const response = await authRequest(
        app,
        'get',
        `/rounds?roundType=${RoundType.AFTERNOON}`,
        doctorToken,
      );

      expect(response.status).toBe(200);
      response.body.data.forEach((round: { roundType: string }) => {
        expect(round.roundType).toBe(RoundType.AFTERNOON);
      });
    });

    it('should support pagination', async () => {
      const response = await authRequest(app, 'get', '/rounds?page=1&limit=5', doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /rounds/:id', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;

    beforeAll(async () => {
      testIds = getTestDataIds();

      const scheduledDate = new Date();
      const response = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.EVENING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = response.body.id;
    });

    it('should return round by ID', async () => {
      const response = await authRequest(app, 'get', `/rounds/${roundId}`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(roundId);
      expect(response.body).toHaveProperty('roundNumber');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('validTransitions');
    });

    it('should return 404 for non-existent round', async () => {
      const response = await authRequest(
        app,
        'get',
        '/rounds/00000000-0000-0000-0000-000000000000',
        doctorToken,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /rounds/:id/start', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;

    beforeEach(async () => {
      testIds = getTestDataIds();

      const scheduledDate = new Date();
      const response = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = response.body.id;
    });

    it('should transition round to IN_PROGRESS', async () => {
      const response = await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(RoundStatus.IN_PROGRESS);
      expect(response.body.startedAt).toBeDefined();
      expect(response.body.validTransitions).toContain(RoundStatus.PAUSED);
      expect(response.body.validTransitions).toContain(RoundStatus.COMPLETED);
    });

    it('should reject invalid state transition from COMPLETED', async () => {
      // Start the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);
      // Complete the round
      await authRequest(app, 'post', `/rounds/${roundId}/complete`, doctorToken);

      // Try to start again - should fail
      const response = await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /rounds/:id/pause', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;

    beforeEach(async () => {
      testIds = getTestDataIds();

      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = createResponse.body.id;

      // Start the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);
    });

    it('should pause an in-progress round', async () => {
      const response = await authRequest(app, 'post', `/rounds/${roundId}/pause`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(RoundStatus.PAUSED);
      expect(response.body.pausedAt).toBeDefined();
    });

    it('should reject pause on non-started round', async () => {
      // Create a new round without starting it
      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.AFTERNOON,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      const newRoundId = createResponse.body.id;

      const response = await authRequest(app, 'post', `/rounds/${newRoundId}/pause`, doctorToken);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /rounds/:id/resume', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;

    beforeEach(async () => {
      testIds = getTestDataIds();

      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = createResponse.body.id;

      // Start and pause the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);
      await authRequest(app, 'post', `/rounds/${roundId}/pause`, doctorToken);
    });

    it('should resume a paused round', async () => {
      const response = await authRequest(app, 'post', `/rounds/${roundId}/resume`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(RoundStatus.IN_PROGRESS);
      expect(response.body.pausedAt).toBeNull();
    });
  });

  describe('POST /rounds/:id/complete', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;

    beforeEach(async () => {
      testIds = getTestDataIds();

      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = createResponse.body.id;

      // Start the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);
    });

    it('should mark round as completed', async () => {
      const response = await authRequest(app, 'post', `/rounds/${roundId}/complete`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(RoundStatus.COMPLETED);
      expect(response.body.completedAt).toBeDefined();
      expect(response.body.validTransitions).toEqual([]);
    });

    it('should record completion time', async () => {
      const beforeComplete = new Date();
      const response = await authRequest(app, 'post', `/rounds/${roundId}/complete`, doctorToken);
      const afterComplete = new Date();

      const completedAt = new Date(response.body.completedAt);
      expect(completedAt.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
      expect(completedAt.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
    });
  });

  describe('POST /rounds/:id/cancel', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;

    beforeEach(async () => {
      testIds = getTestDataIds();

      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = createResponse.body.id;
    });

    it('should cancel a planned round', async () => {
      const response = await authRequest(app, 'post', `/rounds/${roundId}/cancel`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(RoundStatus.CANCELLED);
      expect(response.body.validTransitions).toEqual([]);
    });

    it('should cancel a paused round', async () => {
      // Start and pause the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);
      await authRequest(app, 'post', `/rounds/${roundId}/pause`, doctorToken);

      const response = await authRequest(app, 'post', `/rounds/${roundId}/cancel`, doctorToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(RoundStatus.CANCELLED);
    });

    it('should reject cancel on in-progress round', async () => {
      // Start the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);

      const response = await authRequest(app, 'post', `/rounds/${roundId}/cancel`, doctorToken);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /rounds/:id/records', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;
    let admissionId: string;

    beforeEach(async () => {
      testIds = getTestDataIds();

      // Create admission for testing
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed301AId,
        testIds.users.doctorId,
        testIds.users.nurseId,
      );

      // Create and start a round
      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = createResponse.body.id;

      // Start the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);
    });

    afterEach(async () => {
      // Clean up records and admissions
      await prisma.roundRecord.deleteMany({ where: { roundId } });

      // Reset bed status
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301AId },
        data: { status: 'EMPTY', currentAdmissionId: null },
      });

      // Delete admission
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
    });

    it('should add round record for patient', async () => {
      const response = await authRequest(app, 'post', `/rounds/${roundId}/records`, doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId,
          patientStatus: RoundPatientStatus.STABLE,
          chiefComplaint: 'No complaints',
          observation: 'Patient alert and oriented',
          assessment: 'Condition stable',
          plan: 'Continue current treatment',
          orders: 'CBC in AM',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.roundId).toBe(roundId);
      expect(response.body.admissionId).toBe(admissionId);
      expect(response.body.patientStatus).toBe(RoundPatientStatus.STABLE);
      expect(response.body.visitOrder).toBe(1);
      expect(response.body.visitedAt).toBeDefined();
    });

    it('should require round in IN_PROGRESS status', async () => {
      // Complete the round
      await authRequest(app, 'post', `/rounds/${roundId}/complete`, doctorToken);

      const response = await authRequest(app, 'post', `/rounds/${roundId}/records`, doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId,
          patientStatus: RoundPatientStatus.STABLE,
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate record for same admission', async () => {
      // Add first record
      await authRequest(app, 'post', `/rounds/${roundId}/records`, doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId,
          patientStatus: RoundPatientStatus.STABLE,
        });

      // Try to add another record for the same admission
      const response = await authRequest(app, 'post', `/rounds/${roundId}/records`, doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId,
          patientStatus: RoundPatientStatus.IMPROVING,
        });

      expect(response.status).toBe(409);
    });

    it('should increment visit order for each record', async () => {
      // Create another admission
      const admission2Id = await createTestAdmission(
        prisma,
        testIds.patients.janeId,
        testIds.rooms.bed301BId,
        testIds.users.doctorId,
      );

      // Add first record
      const response1 = await authRequest(app, 'post', `/rounds/${roundId}/records`, doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId,
          patientStatus: RoundPatientStatus.STABLE,
        });

      // Add second record
      const response2 = await authRequest(app, 'post', `/rounds/${roundId}/records`, doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId: admission2Id,
          patientStatus: RoundPatientStatus.IMPROVING,
        });

      expect(response1.body.visitOrder).toBe(1);
      expect(response2.body.visitOrder).toBe(2);

      // Clean up
      await prisma.roundRecord.deleteMany({ where: { roundId } });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed301BId },
        data: { status: 'EMPTY', currentAdmissionId: null },
      });
      await prisma.admission.delete({ where: { id: admission2Id } });
    });
  });

  describe('GET /rounds/:id/records', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;
    let admissionId: string;

    beforeAll(async () => {
      testIds = getTestDataIds();

      // Create admission for testing
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.mikeId,
        testIds.rooms.bed302AId,
        testIds.users.doctorId,
      );

      // Create and start a round
      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.NIGHT,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = createResponse.body.id;

      // Start the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);

      // Add a record
      await authRequest(app, 'post', `/rounds/${roundId}/records`, doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId,
          patientStatus: RoundPatientStatus.CRITICAL,
          observation: 'Patient needs close monitoring',
        });
    });

    afterAll(async () => {
      await prisma.roundRecord.deleteMany({ where: { roundId } });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed302AId },
        data: { status: 'EMPTY', currentAdmissionId: null },
      });
      await prisma.admission.delete({ where: { id: admissionId } });
    });

    it('should return all records for a round', async () => {
      const response = await authRequest(app, 'get', `/rounds/${roundId}/records`, doctorToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('roundId');
      expect(response.body[0]).toHaveProperty('admissionId');
      expect(response.body[0]).toHaveProperty('visitOrder');
    });

    it('should return 404 for non-existent round', async () => {
      const response = await authRequest(
        app,
        'get',
        '/rounds/00000000-0000-0000-0000-000000000000/records',
        doctorToken,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /rounds/:id/records/:recordId', () => {
    let testIds: ReturnType<typeof getTestDataIds>;
    let roundId: string;
    let recordId: string;
    let admissionId: string;

    beforeEach(async () => {
      testIds = getTestDataIds();

      // Create admission for testing
      admissionId = await createTestAdmission(
        prisma,
        testIds.patients.johnId,
        testIds.rooms.bed310AId,
        testIds.users.doctorId,
      );

      // Create and start a round
      const scheduledDate = new Date();
      const createResponse = await authRequest(app, 'post', '/rounds', doctorToken)
        .set('x-user-id', testIds.users.doctorId)
        .send({
          floorId: testIds.rooms.floorId,
          roundType: RoundType.MORNING,
          scheduledDate: scheduledDate.toISOString().split('T')[0],
          leadDoctorId: testIds.users.doctorId,
        });
      roundId = createResponse.body.id;

      // Start the round
      await authRequest(app, 'post', `/rounds/${roundId}/start`, doctorToken);

      // Add a record
      const recordResponse = await authRequest(
        app,
        'post',
        `/rounds/${roundId}/records`,
        doctorToken,
      )
        .set('x-user-id', testIds.users.doctorId)
        .send({
          admissionId,
          patientStatus: RoundPatientStatus.STABLE,
          observation: 'Initial observation',
        });
      recordId = recordResponse.body.id;
    });

    afterEach(async () => {
      await prisma.roundRecord.deleteMany({ where: { roundId } });
      await prisma.bed.update({
        where: { id: testIds.rooms.bed310AId },
        data: { status: 'EMPTY', currentAdmissionId: null },
      });
      await prisma.admission.deleteMany({
        where: { patientId: testIds.patients.johnId },
      });
    });

    it('should update round record', async () => {
      const response = await authRequest(
        app,
        'patch',
        `/rounds/${roundId}/records/${recordId}`,
        doctorToken,
      )
        .set('x-user-id', testIds.users.doctorId)
        .send({
          patientStatus: RoundPatientStatus.IMPROVING,
          observation: 'Updated observation - patient improving',
          plan: 'Continue medication and monitor',
        });

      expect(response.status).toBe(200);
      expect(response.body.patientStatus).toBe(RoundPatientStatus.IMPROVING);
      expect(response.body.observation).toBe('Updated observation - patient improving');
      expect(response.body.plan).toBe('Continue medication and monitor');
    });

    it('should return 404 for non-existent record', async () => {
      const response = await authRequest(
        app,
        'patch',
        `/rounds/${roundId}/records/00000000-0000-0000-0000-000000000000`,
        doctorToken,
      )
        .set('x-user-id', testIds.users.doctorId)
        .send({
          patientStatus: RoundPatientStatus.STABLE,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Authentication and Authorization', () => {
    let testIds: ReturnType<typeof getTestDataIds>;

    beforeAll(() => {
      testIds = getTestDataIds();
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'get', '/rounds');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await authRequest(app, 'get', '/rounds', 'invalid-token');

      expect(response.status).toBe(401);
    });

    it('should allow nurse to view rounds', async () => {
      const response = await authRequest(app, 'get', '/rounds', nurseToken);

      expect(response.status).toBe(200);
    });
  });
});
