import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma';
import {
  createTestApp,
  closeTestApp,
  TestApp,
  seedTestDatabase,
  cleanupTestDatabase,
  TEST_USERS,
  resetUserLoginState,
  loginAs,
  authRequest,
  publicRequest,
} from './index';

describe('Auth API (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    await seedTestDatabase(prisma);
  });

  afterAll(async () => {
    await cleanupTestDatabase(prisma);
    await closeTestApp(testApp);
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await resetUserLoginState(prisma, TEST_USERS.admin.username);
    });

    it('should return tokens on valid credentials', async () => {
      const response = await publicRequest(app, 'post', '/auth/login').send({
        username: TEST_USERS.admin.username,
        password: TEST_USERS.admin.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.tokens).toHaveProperty('expiresIn');
      expect(response.body.tokens.tokenType).toBe('Bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(TEST_USERS.admin.username);
    });

    it('should return 401 on invalid username', async () => {
      const response = await publicRequest(app, 'post', '/auth/login').send({
        username: 'nonexistent_user',
        password: 'anypassword',
      });

      expect(response.status).toBe(401);
    });

    it('should return 401 on invalid password', async () => {
      const response = await publicRequest(app, 'post', '/auth/login').send({
        username: TEST_USERS.admin.username,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 when account is locked', async () => {
      const response = await publicRequest(app, 'post', '/auth/login').send({
        username: TEST_USERS.locked.username,
        password: TEST_USERS.locked.password,
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('locked');
    });

    it('should return 403 when account is inactive', async () => {
      const response = await publicRequest(app, 'post', '/auth/login').send({
        username: TEST_USERS.inactive.username,
        password: TEST_USERS.inactive.password,
      });

      expect(response.status).toBe(403);
    });

    it('should increment failed login count on wrong password', async () => {
      // First attempt - wrong password
      await publicRequest(app, 'post', '/auth/login').send({
        username: TEST_USERS.doctor.username,
        password: 'wrongpassword',
      });

      const user = await prisma.user.findUnique({
        where: { username: TEST_USERS.doctor.username },
      });

      expect(user?.failedLoginCount).toBeGreaterThan(0);

      // Reset for other tests
      await resetUserLoginState(prisma, TEST_USERS.doctor.username);
    });

    it('should reset failed login count on successful login', async () => {
      // First set some failed attempts
      await prisma.user.update({
        where: { username: TEST_USERS.doctor.username },
        data: { failedLoginCount: 3 },
      });

      // Successful login
      await publicRequest(app, 'post', '/auth/login').send({
        username: TEST_USERS.doctor.username,
        password: TEST_USERS.doctor.password,
      });

      const user = await prisma.user.findUnique({
        where: { username: TEST_USERS.doctor.username },
      });

      expect(user?.failedLoginCount).toBe(0);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const tokens = await loginAs(app, 'admin');
      refreshToken = tokens.refreshToken;
    });

    it('should return new access token with valid refresh token', async () => {
      const response = await publicRequest(app, 'post', '/auth/refresh').send({
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.tokenType).toBe('Bearer');
    });

    it('should return 401 on invalid refresh token', async () => {
      const response = await publicRequest(app, 'post', '/auth/refresh').send({
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
    });

    it('should return 401 on malformed refresh token', async () => {
      const response = await publicRequest(app, 'post', '/auth/refresh').send({
        refreshToken: 'not.a.valid.jwt.token',
      });

      expect(response.status).toBe(401);
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await publicRequest(app, 'post', '/auth/refresh').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const tokens = await loginAs(app, 'doctor');
      accessToken = tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await authRequest(app, 'post', '/auth/logout', accessToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('success');
    });

    it('should return 401 without token', async () => {
      const response = await publicRequest(app, 'post', '/auth/logout');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await authRequest(app, 'post', '/auth/logout', 'invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout-all', () => {
    let accessToken: string;

    beforeEach(async () => {
      const tokens = await loginAs(app, 'nurse');
      accessToken = tokens.accessToken;
    });

    it('should logout from all sessions', async () => {
      const response = await authRequest(app, 'post', '/auth/logout-all', accessToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('all sessions');
    });

    it('should return 401 without token', async () => {
      const response = await publicRequest(app, 'post', '/auth/logout-all');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const tokens = await loginAs(app, 'admin');
      accessToken = tokens.accessToken;
    });

    it('should return current user info', async () => {
      const response = await authRequest(app, 'get', '/auth/me', accessToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
      expect(response.body.username).toBe(TEST_USERS.admin.username);
      expect(response.body).toHaveProperty('roles');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      const response = await publicRequest(app, 'get', '/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with expired/invalid token', async () => {
      const response = await authRequest(app, 'get', '/auth/me', 'invalid.token.here');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/sessions', () => {
    let accessToken: string;

    beforeAll(async () => {
      const tokens = await loginAs(app, 'admin');
      accessToken = tokens.accessToken;
    });

    it('should return list of user sessions', async () => {
      const response = await authRequest(app, 'get', '/auth/sessions', accessToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should mark current session', async () => {
      const response = await authRequest(app, 'get', '/auth/sessions', accessToken);

      const currentSession = response.body.sessions.find(
        (s: { isCurrent: boolean }) => s.isCurrent,
      );
      expect(currentSession).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await publicRequest(app, 'get', '/auth/sessions');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/change-password', () => {
    const testUserForPasswordChange = {
      username: 'test_pwchange',
      password: 'OldPassword123!',
      newPassword: 'NewPassword456!',
      employeeId: 'EMP_PWC_TEST',
      name: 'Test Password Change',
      email: 'pwchange@test.local',
    };

    let accessToken: string;
    let userId: string;

    beforeAll(async () => {
      const bcrypt = await import('bcrypt');
      const user = await prisma.user.create({
        data: {
          employeeId: testUserForPasswordChange.employeeId,
          username: testUserForPasswordChange.username,
          passwordHash: await bcrypt.hash(testUserForPasswordChange.password, 12),
          name: testUserForPasswordChange.name,
          email: testUserForPasswordChange.email,
          isActive: true,
        },
      });
      userId = user.id;

      // Login to get token
      const response = await publicRequest(app, 'post', '/auth/login').send({
        username: testUserForPasswordChange.username,
        password: testUserForPasswordChange.password,
      });
      accessToken = response.body.tokens.accessToken;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: userId } });
    });

    it('should change password successfully', async () => {
      const response = await authRequest(app, 'post', '/auth/change-password', accessToken).send({
        currentPassword: testUserForPasswordChange.password,
        newPassword: testUserForPasswordChange.newPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('success');

      // Verify can login with new password
      const loginResponse = await publicRequest(app, 'post', '/auth/login').send({
        username: testUserForPasswordChange.username,
        password: testUserForPasswordChange.newPassword,
      });
      expect(loginResponse.status).toBe(200);

      // Update for subsequent tests
      testUserForPasswordChange.password = testUserForPasswordChange.newPassword;
      accessToken = loginResponse.body.tokens.accessToken;
    });

    it('should return 401 on wrong current password', async () => {
      const response = await authRequest(app, 'post', '/auth/change-password', accessToken).send({
        currentPassword: 'wrongcurrentpassword',
        newPassword: 'AnotherNewPassword123!',
      });

      expect(response.status).toBe(401);
    });

    it('should return 403 when new password is same as current', async () => {
      const response = await authRequest(app, 'post', '/auth/change-password', accessToken).send({
        currentPassword: testUserForPasswordChange.password,
        newPassword: testUserForPasswordChange.password,
      });

      expect(response.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const response = await publicRequest(app, 'post', '/auth/change-password').send({
        currentPassword: 'anypassword',
        newPassword: 'newpassword123',
      });

      expect(response.status).toBe(401);
    });
  });
});
