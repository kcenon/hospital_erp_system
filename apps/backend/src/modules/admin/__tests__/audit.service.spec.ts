import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { AuditService } from '../audit.service';
import { AuditRepository } from '../audit.repository';
import { faker } from '@faker-js/faker';
import { AuditAction } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let auditRepository: jest.Mocked<AuditRepository>;

  const mockAuditRepository = {
    createLoginHistory: jest.fn(),
    updateLoginHistory: jest.fn(),
    findLoginHistory: jest.fn(),
    createAccessLog: jest.fn(),
    findAccessLogs: jest.fn(),
    findAccessLogsByPatient: jest.fn(),
    createChangeLog: jest.fn(),
    findChangeLogs: jest.fn(),
  };

  const mockUser = {
    id: faker.string.uuid(),
    username: 'testuser',
    roles: ['DOCTOR'],
  };

  const mockRequest = {
    user: mockUser,
    ip: '192.168.1.1',
    path: '/api/patients/123',
    method: 'GET',
    headers: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditRepository, useValue: mockAuditRepository },
        { provide: REQUEST, useValue: mockRequest },
      ],
    }).compile();

    service = await module.resolve<AuditService>(AuditService);
    auditRepository = module.get(AuditRepository);

    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create change log for audit event', async () => {
      const event = {
        action: 'UPDATE' as AuditAction,
        resourceType: 'patient.patients',
        resourceId: faker.string.uuid(),
        changes: {
          old: { name: 'Old Name' },
          new: { name: 'New Name' },
        },
        reason: 'Name correction',
      };

      await service.log(event);

      expect(auditRepository.createChangeLog).toHaveBeenCalledWith({
        userId: mockUser.id,
        username: mockUser.username,
        ipAddress: '192.168.1.1',
        tableSchema: 'patient',
        tableName: 'patients',
        recordId: event.resourceId,
        action: 'UPDATE',
        oldValues: { name: 'Old Name' },
        newValues: { name: 'New Name' },
        changedFields: ['name'],
        changeReason: 'Name correction',
      });
    });

    it('should parse resource type without schema', async () => {
      const event = {
        action: 'CREATE' as AuditAction,
        resourceType: 'users',
        resourceId: faker.string.uuid(),
      };

      await service.log(event);

      expect(auditRepository.createChangeLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tableSchema: 'public',
          tableName: 'users',
        }),
      );
    });

    it('should not log when user is not authenticated', async () => {
      const moduleWithoutUser: TestingModule = await Test.createTestingModule({
        providers: [
          AuditService,
          { provide: AuditRepository, useValue: mockAuditRepository },
          { provide: REQUEST, useValue: { ...mockRequest, user: undefined } },
        ],
      }).compile();

      const serviceWithoutUser = await moduleWithoutUser.resolve<AuditService>(AuditService);

      await serviceWithoutUser.log({
        action: 'CREATE' as AuditAction,
        resourceType: 'patient',
        resourceId: faker.string.uuid(),
      });

      expect(auditRepository.createChangeLog).not.toHaveBeenCalled();
    });

    it('should detect changed fields correctly', async () => {
      const event = {
        action: 'UPDATE' as AuditAction,
        resourceType: 'patient.patients',
        resourceId: faker.string.uuid(),
        changes: {
          old: { name: 'John', age: 30, address: 'Old Address' },
          new: { name: 'John', age: 31, address: 'New Address' },
        },
      };

      await service.log(event);

      expect(auditRepository.createChangeLog).toHaveBeenCalledWith(
        expect.objectContaining({
          changedFields: expect.arrayContaining(['age', 'address']),
        }),
      );
    });
  });

  describe('logPatientAccess', () => {
    it('should create access log for patient access', async () => {
      const patientId = faker.string.uuid();

      await service.logPatientAccess({
        patientId,
        accessType: 'READ',
        accessedFields: ['name', 'birthDate', 'phone'],
      });

      expect(auditRepository.createAccessLog).toHaveBeenCalledWith({
        userId: mockUser.id,
        username: mockUser.username,
        userRole: 'DOCTOR',
        ipAddress: '192.168.1.1',
        resourceType: 'patient',
        resourceId: patientId,
        action: 'READ',
        patientId,
        accessedFields: ['name', 'birthDate', 'phone'],
        requestPath: '/api/patients/123',
        requestMethod: 'GET',
      });
    });

    it('should not log when user is not authenticated', async () => {
      const moduleWithoutUser: TestingModule = await Test.createTestingModule({
        providers: [
          AuditService,
          { provide: AuditRepository, useValue: mockAuditRepository },
          { provide: REQUEST, useValue: { ...mockRequest, user: undefined } },
        ],
      }).compile();

      const serviceWithoutUser = await moduleWithoutUser.resolve<AuditService>(AuditService);

      await serviceWithoutUser.logPatientAccess({
        patientId: faker.string.uuid(),
        accessType: 'READ',
        accessedFields: ['name'],
      });

      expect(auditRepository.createAccessLog).not.toHaveBeenCalled();
    });
  });

  describe('logResourceAccess', () => {
    it('should create access log for generic resource', async () => {
      const resourceId = faker.string.uuid();
      const patientId = faker.string.uuid();

      await service.logResourceAccess(
        'admission',
        resourceId,
        'READ',
        ['patientId', 'status'],
        patientId,
      );

      expect(auditRepository.createAccessLog).toHaveBeenCalledWith({
        userId: mockUser.id,
        username: mockUser.username,
        userRole: 'DOCTOR',
        ipAddress: '192.168.1.1',
        resourceType: 'admission',
        resourceId,
        action: 'READ',
        patientId,
        accessedFields: ['patientId', 'status'],
        requestPath: '/api/patients/123',
        requestMethod: 'GET',
      });
    });
  });

  describe('logLogin', () => {
    it('should create login history for successful login', async () => {
      const event = {
        userId: faker.string.uuid(),
        username: 'testuser',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        sessionId: faker.string.uuid(),
        success: true,
      };

      await service.logLogin(event);

      expect(auditRepository.createLoginHistory).toHaveBeenCalledWith({
        userId: event.userId,
        username: event.username,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        deviceType: 'PC',
        browser: 'Chrome',
        os: 'Windows',
        sessionId: event.sessionId,
        success: true,
        failureReason: undefined,
      });
    });

    it('should create login history for failed login', async () => {
      const event = {
        username: 'testuser',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        success: false,
        failureReason: 'Invalid password',
      };

      await service.logLogin(event);

      expect(auditRepository.createLoginHistory).toHaveBeenCalledWith({
        userId: undefined,
        username: event.username,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        deviceType: 'MOBILE',
        browser: undefined,
        os: 'iOS',
        sessionId: undefined,
        success: false,
        failureReason: 'Invalid password',
      });
    });

    it('should detect tablet device type', async () => {
      const event = {
        username: 'testuser',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0)',
        success: true,
      };

      await service.logLogin(event);

      expect(auditRepository.createLoginHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceType: 'TABLET',
        }),
      );
    });

    it('should detect different browsers', async () => {
      const firefoxEvent = {
        username: 'testuser',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Firefox/120.0',
        success: true,
      };

      await service.logLogin(firefoxEvent);

      expect(auditRepository.createLoginHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          browser: 'Firefox',
        }),
      );
    });
  });

  describe('logLogout', () => {
    it('should update login history with logout time', async () => {
      const sessionId = faker.string.uuid();

      await service.logLogout(sessionId);

      expect(auditRepository.updateLoginHistory).toHaveBeenCalledWith(
        sessionId,
        { logoutAt: expect.any(Date) },
      );
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const moduleWithForwardedIp: TestingModule = await Test.createTestingModule({
        providers: [
          AuditService,
          { provide: AuditRepository, useValue: mockAuditRepository },
          {
            provide: REQUEST,
            useValue: {
              ...mockRequest,
              headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
            },
          },
        ],
      }).compile();

      const serviceWithForwardedIp = await moduleWithForwardedIp.resolve<AuditService>(AuditService);

      await serviceWithForwardedIp.log({
        action: 'CREATE' as AuditAction,
        resourceType: 'patient',
        resourceId: faker.string.uuid(),
      });

      expect(auditRepository.createChangeLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '10.0.0.1',
        }),
      );
    });
  });
});
