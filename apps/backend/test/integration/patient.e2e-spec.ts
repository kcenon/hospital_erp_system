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
  TEST_PATIENTS,
  getTestDataIds,
  loginAs,
  authRequest,
  publicRequest,
} from './index';

describe('Patient API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await seedTestDatabase(prisma);
    await seedPatientTestData(prisma);

    // Get tokens for different user roles
    const adminTokens = await loginAs(app, 'admin');
    adminToken = adminTokens.accessToken;

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

  describe('GET /patients', () => {
    it('should return paginated list of patients', async () => {
      const response = await authRequest(app, 'get', '/patients', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('should filter patients by search query', async () => {
      const response = await authRequest(app, 'get', '/patients?search=John', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((p: { name: string }) => p.name.includes('John'))).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await authRequest(app, 'get', '/patients?page=1&limit=2', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await publicRequest(app, 'get', '/patients');

      expect(response.status).toBe(401);
    });

    it('should allow doctors with patient:read permission', async () => {
      const response = await authRequest(app, 'get', '/patients', doctorToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should allow nurses with patient:read permission', async () => {
      const response = await authRequest(app, 'get', '/patients', nurseToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /patients', () => {
    const newPatient = {
      name: 'New Test Patient',
      birthDate: '1995-05-15',
      gender: 'MALE',
      bloodType: 'AB+',
      phone: '010-7777-8888',
      address: '999 New St, Seoul',
    };

    afterEach(async () => {
      // Clean up created patient
      await prisma.patient.deleteMany({
        where: { name: newPatient.name },
      });
    });

    it('should create patient with generated patient number', async () => {
      const response = await authRequest(app, 'post', '/patients', adminToken).send(newPatient);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('patientNumber');
      expect(response.body.patientNumber).toMatch(/^P\d{10}$/);
      expect(response.body.name).toBe(newPatient.name);
      expect(response.body.gender).toBe(newPatient.gender);
    });

    it('should require authentication', async () => {
      const response = await publicRequest(app, 'post', '/patients').send(newPatient);

      expect(response.status).toBe(401);
    });

    it('should require patient:create permission', async () => {
      // Nurse doesn't have patient:create permission by default
      const response = await authRequest(app, 'post', '/patients', nurseToken).send(newPatient);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const invalidPatient = {
        name: 'Test',
        // Missing birthDate and gender
      };

      const response = await authRequest(app, 'post', '/patients', adminToken).send(invalidPatient);

      expect(response.status).toBe(400);
    });

    it('should validate phone format', async () => {
      const invalidPatient = {
        ...newPatient,
        phone: 'invalid-phone-format!',
      };

      const response = await authRequest(app, 'post', '/patients', adminToken).send(invalidPatient);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /patients/:id', () => {
    it('should return patient details', async () => {
      const testIds = getTestDataIds();
      const response = await authRequest(
        app,
        'get',
        `/patients/${testIds.patients.johnId}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testIds.patients.johnId);
      expect(response.body.name).toBe(TEST_PATIENTS.john.name);
      expect(response.body.patientNumber).toBe(TEST_PATIENTS.john.patientNumber);
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(app, 'get', `/patients/${fakeId}`, adminToken);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await authRequest(app, 'get', '/patients/invalid-uuid', adminToken);

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const testIds = getTestDataIds();
      const response = await publicRequest(app, 'get', `/patients/${testIds.patients.johnId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /patients/:id', () => {
    it('should update patient', async () => {
      const testIds = getTestDataIds();
      const updateData = {
        phone: '010-9999-0000',
        address: 'Updated Address, Seoul',
      };

      const response = await authRequest(
        app,
        'patch',
        `/patients/${testIds.patients.janeId}`,
        adminToken,
      ).send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.phone).toBe(updateData.phone);
      expect(response.body.address).toBe(updateData.address);
    });

    it('should require authentication', async () => {
      const testIds = getTestDataIds();
      const response = await publicRequest(
        app,
        'patch',
        `/patients/${testIds.patients.janeId}`,
      ).send({ phone: '010-1111-2222' });

      expect(response.status).toBe(401);
    });

    it('should require patient:update permission', async () => {
      const testIds = getTestDataIds();
      const response = await authRequest(
        app,
        'patch',
        `/patients/${testIds.patients.janeId}`,
        nurseToken,
      ).send({ phone: '010-1111-2222' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(app, 'patch', `/patients/${fakeId}`, adminToken).send({
        phone: '010-1111-2222',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /patients/:id', () => {
    let patientToDeleteId: string;

    beforeEach(async () => {
      // Create a patient to delete
      const patient = await prisma.patient.create({
        data: {
          patientNumber: 'P2025999999',
          name: 'Patient To Delete',
          birthDate: new Date('1980-01-01'),
          gender: 'MALE',
        },
      });
      patientToDeleteId = patient.id;
    });

    afterEach(async () => {
      // Clean up if not deleted
      await prisma.patient.deleteMany({
        where: { patientNumber: 'P2025999999' },
      });
    });

    it('should soft delete patient (Admin only)', async () => {
      const response = await authRequest(
        app,
        'delete',
        `/patients/${patientToDeleteId}`,
        adminToken,
      );

      expect(response.status).toBe(204);

      // Verify patient is soft deleted
      const patient = await prisma.patient.findUnique({
        where: { id: patientToDeleteId },
      });
      expect(patient?.deletedAt).not.toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await authRequest(
        app,
        'delete',
        `/patients/${patientToDeleteId}`,
        doctorToken,
      );

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(app, 'delete', `/patients/${fakeId}`, adminToken);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /patients/search', () => {
    it('should search patients by name', async () => {
      const response = await authRequest(app, 'get', '/patients/search?q=John', adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((p: { name: string }) => p.name.includes('John'))).toBe(true);
    });

    it('should search patients by patient number', async () => {
      const response = await authRequest(
        app,
        'get',
        `/patients/search?q=${TEST_PATIENTS.mike.patientNumber}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.some(
          (p: { patientNumber: string }) => p.patientNumber === TEST_PATIENTS.mike.patientNumber,
        ),
      ).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const response = await authRequest(
        app,
        'get',
        '/patients/search?q=NonExistentPatient12345',
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /patients/by-number/:patientNumber', () => {
    it('should find patient by patient number', async () => {
      const response = await authRequest(
        app,
        'get',
        `/patients/by-number/${TEST_PATIENTS.john.patientNumber}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.patientNumber).toBe(TEST_PATIENTS.john.patientNumber);
      expect(response.body.name).toBe(TEST_PATIENTS.john.name);
    });

    it('should return 404 for non-existent patient number', async () => {
      const response = await authRequest(app, 'get', '/patients/by-number/P9999999999', adminToken);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /patients/by-legacy-id/:legacyId', () => {
    it('should find patient by legacy ID', async () => {
      const response = await authRequest(
        app,
        'get',
        `/patients/by-legacy-id/${TEST_PATIENTS.mike.legacyPatientId}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body.legacyPatientId).toBe(TEST_PATIENTS.mike.legacyPatientId);
      expect(response.body.name).toBe(TEST_PATIENTS.mike.name);
    });

    it('should return 404 for non-existent legacy ID', async () => {
      const response = await authRequest(
        app,
        'get',
        '/patients/by-legacy-id/NONEXISTENT-LEGACY',
        adminToken,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /patients/:id/detail', () => {
    it('should create patient detail', async () => {
      const testIds = getTestDataIds();
      const detailData = {
        allergies: 'Penicillin, Peanuts',
        insuranceType: 'National Health Insurance',
        insuranceCompany: 'NHIS',
        notes: 'Test patient notes',
      };

      const response = await authRequest(
        app,
        'post',
        `/patients/${testIds.patients.janeId}/detail`,
        adminToken,
      ).send(detailData);

      expect(response.status).toBe(201);
      expect(response.body.allergies).toBe(detailData.allergies);
      expect(response.body.insuranceType).toBe(detailData.insuranceType);

      // Cleanup
      await prisma.patientDetail.deleteMany({
        where: { patientId: testIds.patients.janeId },
      });
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authRequest(
        app,
        'post',
        `/patients/${fakeId}/detail`,
        adminToken,
      ).send({
        allergies: 'None',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /patients/:id/detail', () => {
    let patientWithDetailId: string;

    beforeAll(async () => {
      // Create a patient with detail for testing
      const patient = await prisma.patient.create({
        data: {
          patientNumber: 'P2025888888',
          name: 'Patient With Detail',
          birthDate: new Date('1980-01-01'),
          gender: 'FEMALE',
        },
      });
      patientWithDetailId = patient.id;

      await prisma.patientDetail.create({
        data: {
          patientId: patient.id,
          allergiesEncrypted: Buffer.from('Original allergies', 'utf-8'),
          insuranceType: 'Original insurance',
        },
      });
    });

    afterAll(async () => {
      await prisma.patientDetail.deleteMany({
        where: { patientId: patientWithDetailId },
      });
      await prisma.patient.delete({
        where: { id: patientWithDetailId },
      });
    });

    it('should update patient detail', async () => {
      const updateData = {
        allergies: 'Updated allergies',
        notes: 'Updated notes',
      };

      const response = await authRequest(
        app,
        'patch',
        `/patients/${patientWithDetailId}/detail`,
        adminToken,
      ).send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.allergies).toBe(updateData.allergies);
      expect(response.body.notes).toBe(updateData.notes);
    });

    it('should return 404 for patient without detail', async () => {
      const testIds = getTestDataIds();
      // John doesn't have detail
      const response = await authRequest(
        app,
        'patch',
        `/patients/${testIds.patients.johnId}/detail`,
        adminToken,
      ).send({
        allergies: 'New allergies',
      });

      expect(response.status).toBe(404);
    });
  });
});
