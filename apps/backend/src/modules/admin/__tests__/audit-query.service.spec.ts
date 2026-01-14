import { Test, TestingModule } from '@nestjs/testing';
import { AuditQueryService } from '../audit-query.service';
import { AuditRepository, DateRange } from '../audit.repository';
import { faker } from '@faker-js/faker';
import { AuditAction, DeviceType } from '@prisma/client';

describe('AuditQueryService', () => {
  let service: AuditQueryService;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditQueryService,
        { provide: AuditRepository, useValue: mockAuditRepository },
      ],
    }).compile();

    service = module.get<AuditQueryService>(AuditQueryService);
    auditRepository = module.get(AuditRepository);

    jest.clearAllMocks();
  });

  describe('queryLoginHistory', () => {
    it('should return paginated login history', async () => {
      const mockData = [
        createMockLoginHistory(),
        createMockLoginHistory(),
      ];
      mockAuditRepository.findLoginHistory.mockResolvedValue({
        data: mockData,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.queryLoginHistory({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(auditRepository.findLoginHistory).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });

    it('should filter by userId', async () => {
      const userId = faker.string.uuid();
      mockAuditRepository.findLoginHistory.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.queryLoginHistory({ userId });

      expect(auditRepository.findLoginHistory).toHaveBeenCalledWith({ userId });
    });
  });

  describe('queryAccessLogs', () => {
    it('should return paginated access logs', async () => {
      const mockData = [
        createMockAccessLog(),
        createMockAccessLog(),
      ];
      mockAuditRepository.findAccessLogs.mockResolvedValue({
        data: mockData,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.queryAccessLogs({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by patientId', async () => {
      const patientId = faker.string.uuid();
      mockAuditRepository.findAccessLogs.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.queryAccessLogs({ patientId });

      expect(auditRepository.findAccessLogs).toHaveBeenCalledWith({ patientId });
    });
  });

  describe('queryChangeLogs', () => {
    it('should return paginated change logs', async () => {
      const mockData = [
        createMockChangeLog(),
        createMockChangeLog(),
      ];
      mockAuditRepository.findChangeLogs.mockResolvedValue({
        data: mockData,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.queryChangeLogs({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by tableName', async () => {
      mockAuditRepository.findChangeLogs.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.queryChangeLogs({ tableName: 'patients' });

      expect(auditRepository.findChangeLogs).toHaveBeenCalledWith({
        tableName: 'patients',
      });
    });
  });

  describe('getPatientAccessReport', () => {
    it('should generate comprehensive patient access report', async () => {
      const patientId = faker.string.uuid();
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const userId1 = faker.string.uuid();
      const userId2 = faker.string.uuid();

      const mockLogs = [
        createMockAccessLog({ userId: userId1, username: 'user1', action: 'READ' }),
        createMockAccessLog({ userId: userId1, username: 'user1', action: 'READ' }),
        createMockAccessLog({ userId: userId2, username: 'user2', action: 'UPDATE' }),
      ];
      mockAuditRepository.findAccessLogsByPatient.mockResolvedValue(mockLogs);

      const result = await service.getPatientAccessReport(patientId, dateRange);

      expect(result.patientId).toBe(patientId);
      expect(result.totalAccess).toBe(3);
      expect(result.accessByUser).toHaveLength(2);
      expect(result.accessByUser[0].accessCount).toBe(2);
      expect(result.accessByType).toHaveLength(2);
      expect(result.timeline).toHaveLength(3);
    });

    it('should return empty report when no access logs found', async () => {
      const patientId = faker.string.uuid();
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      mockAuditRepository.findAccessLogsByPatient.mockResolvedValue([]);

      const result = await service.getPatientAccessReport(patientId, dateRange);

      expect(result.totalAccess).toBe(0);
      expect(result.accessByUser).toHaveLength(0);
      expect(result.accessByType).toHaveLength(0);
      expect(result.timeline).toHaveLength(0);
    });
  });

  describe('getUserActivityReport', () => {
    it('should generate user activity report', async () => {
      const userId = faker.string.uuid();
      const dateRange: DateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockAuditRepository.findLoginHistory.mockResolvedValue({
        data: [
          createMockLoginHistory({ success: true }),
          createMockLoginHistory({ success: true }),
          createMockLoginHistory({ success: false }),
        ],
        total: 3,
        page: 1,
        limit: 1000,
        totalPages: 1,
      });
      mockAuditRepository.findAccessLogs.mockResolvedValue({
        data: [createMockAccessLog()],
        total: 5,
        page: 1,
        limit: 1000,
        totalPages: 1,
      });
      mockAuditRepository.findChangeLogs.mockResolvedValue({
        data: [createMockChangeLog()],
        total: 3,
        page: 1,
        limit: 1000,
        totalPages: 1,
      });

      const result = await service.getUserActivityReport(userId, dateRange);

      expect(result.userId).toBe(userId);
      expect(result.loginCount).toBe(2);
      expect(result.failedLoginCount).toBe(1);
      expect(result.accessCount).toBe(5);
      expect(result.changeCount).toBe(3);
    });
  });

  describe('getSuspiciousActivity', () => {
    it('should identify IPs with multiple failed login attempts', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const suspiciousIp = '192.168.1.100';

      mockAuditRepository.findLoginHistory.mockResolvedValue({
        data: [
          createMockLoginHistory({ ipAddress: suspiciousIp, username: 'user1', success: false }),
          createMockLoginHistory({ ipAddress: suspiciousIp, username: 'user2', success: false }),
          createMockLoginHistory({ ipAddress: suspiciousIp, username: 'user1', success: false }),
          createMockLoginHistory({ ipAddress: suspiciousIp, username: 'user3', success: false }),
          createMockLoginHistory({ ipAddress: suspiciousIp, username: 'user1', success: false }),
          createMockLoginHistory({ ipAddress: '192.168.1.1', username: 'user4', success: false }),
        ],
        total: 6,
        page: 1,
        limit: 10000,
        totalPages: 1,
      });

      const result = await service.getSuspiciousActivity(startDate, endDate, 5);

      expect(result).toHaveLength(1);
      expect(result[0].ipAddress).toBe(suspiciousIp);
      expect(result[0].failedAttempts).toBe(5);
      expect(result[0].usernames).toContain('user1');
      expect(result[0].usernames).toContain('user2');
      expect(result[0].usernames).toContain('user3');
    });

    it('should return empty array when no suspicious activity', async () => {
      mockAuditRepository.findLoginHistory.mockResolvedValue({
        data: [
          createMockLoginHistory({ ipAddress: '192.168.1.1', success: false }),
          createMockLoginHistory({ ipAddress: '192.168.1.2', success: false }),
        ],
        total: 2,
        page: 1,
        limit: 10000,
        totalPages: 1,
      });

      const result = await service.getSuspiciousActivity(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        5,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('getFailedLoginAttempts', () => {
    it('should return failed login attempts', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockAuditRepository.findLoginHistory.mockResolvedValue({
        data: [createMockLoginHistory({ success: false })],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const result = await service.getFailedLoginAttempts(startDate, endDate);

      expect(auditRepository.findLoginHistory).toHaveBeenCalledWith({
        success: false,
        startDate,
        endDate,
        limit: 100,
      });
      expect(result.data).toHaveLength(1);
    });
  });
});

// Helper functions to create mock data
function createMockLoginHistory(overrides?: Partial<{
  userId: string;
  username: string;
  ipAddress: string;
  success: boolean;
}>) {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    userId: overrides?.userId ?? faker.string.uuid(),
    username: overrides?.username ?? faker.internet.username(),
    ipAddress: overrides?.ipAddress ?? faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
    deviceType: 'PC' as DeviceType,
    browser: 'Chrome',
    os: 'Windows',
    loginAt: now,
    logoutAt: null,
    sessionId: faker.string.uuid(),
    success: overrides?.success ?? true,
    failureReason: null,
    createdAt: now,
  };
}

function createMockAccessLog(overrides?: Partial<{
  userId: string;
  username: string;
  action: string;
}>) {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    userId: overrides?.userId ?? faker.string.uuid(),
    username: overrides?.username ?? faker.internet.username(),
    userRole: 'DOCTOR',
    ipAddress: faker.internet.ip(),
    resourceType: 'patient',
    resourceId: faker.string.uuid(),
    action: (overrides?.action ?? 'READ') as AuditAction,
    requestPath: '/api/patients/123',
    requestMethod: 'GET',
    patientId: faker.string.uuid(),
    accessedFields: ['name', 'birthDate'],
    success: true,
    errorCode: null,
    errorMessage: null,
    createdAt: now,
  };
}

function createMockChangeLog() {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    username: faker.internet.username(),
    ipAddress: faker.internet.ip(),
    tableSchema: 'patient',
    tableName: 'patients',
    recordId: faker.string.uuid(),
    action: 'UPDATE' as AuditAction,
    oldValues: { name: 'Old Name' },
    newValues: { name: 'New Name' },
    changedFields: ['name'],
    changeReason: 'Name correction',
    createdAt: now,
  };
}
