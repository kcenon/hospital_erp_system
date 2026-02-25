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

describe('Audit API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let doctorToken: string;
  let adminUserId: string;
  let patientId: string;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 1);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await seedTestDatabase(prisma);
    await seedPatientTestData(prisma);

    const ids = getTestDataIds();
    adminUserId = ids.users.adminId;
    patientId = ids.patients.johnId;

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

  describe('GET /admin/audit/login-history', () => {
    it('should return login history for admin', async () => {
      const response = await authRequest(app, 'get', '/admin/audit/login-history', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by success status', async () => {
      const response = await authRequest(
        app,
        'get',
        '/admin/audit/login-history?success=true',
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should support pagination', async () => {
      const response = await authRequest(
        app,
        'get',
        '/admin/audit/login-history?page=1&limit=5',
        adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await publicRequest(app, 'get', '/admin/audit/login-history');
      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await authRequest(app, 'get', '/admin/audit/login-history', doctorToken);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/audit/access-logs', () => {
    it('should return access logs for admin', async () => {
      const response = await authRequest(app, 'get', '/admin/audit/access-logs', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await authRequest(app, 'get', '/admin/audit/access-logs', doctorToken);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/audit/change-logs', () => {
    it('should return change logs for admin', async () => {
      const response = await authRequest(app, 'get', '/admin/audit/change-logs', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await authRequest(app, 'get', '/admin/audit/change-logs', doctorToken);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/audit/patients/:patientId/access-report', () => {
    it('should return patient access report', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/patients/${patientId}/access-report?startDate=${startDateStr}&endDate=${endDateStr}`,
        adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/patients/${patientId}/access-report?startDate=${startDateStr}&endDate=${endDateStr}`,
        doctorToken,
      );

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/audit/users/:userId/activity-report', () => {
    it('should return user activity report', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/users/${adminUserId}/activity-report?startDate=${startDateStr}&endDate=${endDateStr}`,
        adminToken,
      );

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/users/${adminUserId}/activity-report?startDate=${startDateStr}&endDate=${endDateStr}`,
        doctorToken,
      );

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/audit/security/suspicious-activity', () => {
    it('should return suspicious activity report', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/security/suspicious-activity?startDate=${startDateStr}&endDate=${endDateStr}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/security/suspicious-activity?startDate=${startDateStr}&endDate=${endDateStr}`,
        doctorToken,
      );

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/audit/security/failed-logins', () => {
    it('should return failed login attempts', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/security/failed-logins?startDate=${startDateStr}&endDate=${endDateStr}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await authRequest(
        app,
        'get',
        `/admin/audit/security/failed-logins?startDate=${startDateStr}&endDate=${endDateStr}`,
        doctorToken,
      );

      expect(response.status).toBe(403);
    });
  });
});
