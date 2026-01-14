import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from '../services/rbac.service';
import { PrismaService } from '../../../prisma';
import { Permissions } from '../constants';
import { createTestRole, createTestPermission } from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';

const REDIS_TOKEN = 'default_IORedisModuleConnectionToken';

describe('RbacService', () => {
  let service: RbacService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let mockRedis: {
    get: jest.Mock;
    setex: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: PrismaService, useValue: prismaService },
        { provide: REDIS_TOKEN, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);

    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    const userId = 'test-user-id';

    it('should return true when user has permission', async () => {
      const permission = createTestPermission({ code: 'patient:read' });
      mockRedis.get.mockResolvedValue(null);
      prismaService.rolePermission.findMany.mockResolvedValue([
        { permission, roleId: 'role-id', permissionId: permission.id },
      ]);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.hasPermission(userId, 'patient:read');

      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      mockRedis.get.mockResolvedValue(null);
      prismaService.rolePermission.findMany.mockResolvedValue([]);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.hasPermission(userId, 'patient:delete');

      expect(result).toBe(false);
    });

    it('should return true for admin with wildcard permission', async () => {
      const permission = createTestPermission({ code: Permissions.ALL });
      mockRedis.get.mockResolvedValue(null);
      prismaService.rolePermission.findMany.mockResolvedValue([
        { permission, roleId: 'role-id', permissionId: permission.id },
      ]);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.hasPermission(userId, 'any:permission');

      expect(result).toBe(true);
    });

    it('should use cached permissions when available', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:read', 'patient:update']));

      const result = await service.hasPermission(userId, 'patient:read');

      expect(result).toBe(true);
      expect(prismaService.rolePermission.findMany).not.toHaveBeenCalled();
    });

    it('should handle broader permission covering scoped permission', async () => {
      const permission = createTestPermission({ code: 'patient:update' });
      mockRedis.get.mockResolvedValue(null);
      prismaService.rolePermission.findMany.mockResolvedValue([
        { permission, roleId: 'role-id', permissionId: permission.id },
      ]);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.hasPermission(userId, 'patient:update:own');

      expect(result).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    const userId = 'test-user-id';

    it('should return true when user has at least one permission', async () => {
      const permission = createTestPermission({ code: 'patient:read' });
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:read']));

      const result = await service.hasAnyPermission(userId, ['patient:read', 'patient:delete']);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['room:read']));

      const result = await service.hasAnyPermission(userId, ['patient:read', 'patient:delete']);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    const userId = 'test-user-id';

    it('should return true when user has all permissions', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:read', 'patient:update']));

      const result = await service.hasAllPermissions(userId, ['patient:read', 'patient:update']);

      expect(result).toBe(true);
    });

    it('should return false when user lacks some permissions', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:read']));

      const result = await service.hasAllPermissions(userId, ['patient:read', 'patient:update']);

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    const userId = 'test-user-id';

    it('should return true when user has role', async () => {
      const role = createTestRole({ code: 'DOCTOR', isActive: true });
      prismaService.userRole.findMany.mockResolvedValue([
        { userId, roleId: role.id, role, assignedAt: new Date(), assignedBy: null },
      ]);

      const result = await service.hasRole(userId, 'DOCTOR');

      expect(result).toBe(true);
    });

    it('should return false when user does not have role', async () => {
      const role = createTestRole({ code: 'NURSE', isActive: true });
      prismaService.userRole.findMany.mockResolvedValue([
        { userId, roleId: role.id, role, assignedAt: new Date(), assignedBy: null },
      ]);

      const result = await service.hasRole(userId, 'DOCTOR');

      expect(result).toBe(false);
    });

    it('should ignore inactive roles', async () => {
      const role = createTestRole({ code: 'DOCTOR', isActive: false });
      prismaService.userRole.findMany.mockResolvedValue([
        { userId, roleId: role.id, role, assignedAt: new Date(), assignedBy: null },
      ]);

      const result = await service.hasRole(userId, 'DOCTOR');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    const userId = 'test-user-id';

    it('should return true when user has at least one role', async () => {
      const role = createTestRole({ code: 'NURSE', isActive: true });
      prismaService.userRole.findMany.mockResolvedValue([
        { userId, roleId: role.id, role, assignedAt: new Date(), assignedBy: null },
      ]);

      const result = await service.hasAnyRole(userId, ['DOCTOR', 'NURSE']);

      expect(result).toBe(true);
    });

    it('should return false when user has none of the roles', async () => {
      const role = createTestRole({ code: 'CLERK', isActive: true });
      prismaService.userRole.findMany.mockResolvedValue([
        { userId, roleId: role.id, role, assignedAt: new Date(), assignedBy: null },
      ]);

      const result = await service.hasAnyRole(userId, ['DOCTOR', 'NURSE']);

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource', () => {
    const userId = 'test-user-id';
    const patientId = 'patient-id';
    const admissionId = 'admission-id';

    it('should return true for admin with full access', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify([Permissions.ALL]));

      const result = await service.canAccessResource(userId, 'patient', patientId, 'read');

      expect(result).toBe(true);
    });

    it('should return true when user has full permission', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:read']));

      const result = await service.canAccessResource(userId, 'patient', patientId, 'read');

      expect(result).toBe(true);
    });

    it('should check ownership for :own permission', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:update:own']));
      prismaService.admission.findFirst.mockResolvedValue({
        id: admissionId,
        patientId,
        attendingDoctorId: userId,
        status: 'ACTIVE',
      });

      const result = await service.canAccessResource(userId, 'patient', patientId, 'update');

      expect(result).toBe(true);
      expect(prismaService.admission.findFirst).toHaveBeenCalledWith({
        where: {
          patientId,
          status: 'ACTIVE',
          attendingDoctorId: userId,
        },
      });
    });

    it('should check assignment for :assigned permission', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:read:assigned']));
      prismaService.admission.findFirst.mockResolvedValue({
        id: admissionId,
        patientId,
        primaryNurseId: userId,
        status: 'ACTIVE',
      });

      const result = await service.canAccessResource(userId, 'patient', patientId, 'read');

      expect(result).toBe(true);
    });

    it('should return false when not owner', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['patient:update:own']));
      prismaService.admission.findFirst.mockResolvedValue(null);

      const result = await service.canAccessResource(userId, 'patient', patientId, 'update');

      expect(result).toBe(false);
    });

    it('should return false when no matching permission', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['room:read']));

      const result = await service.canAccessResource(userId, 'patient', patientId, 'update');

      expect(result).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should delete user permission cache', async () => {
      const userId = 'test-user-id';
      mockRedis.del.mockResolvedValue(1);

      await service.invalidateCache(userId);

      expect(mockRedis.del).toHaveBeenCalledWith(`rbac:permissions:${userId}`);
    });
  });

  describe('invalidateAllCaches', () => {
    it('should delete all permission caches', async () => {
      const keys = ['rbac:permissions:user1', 'rbac:permissions:user2'];
      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(2);

      await service.invalidateAllCaches();

      expect(mockRedis.keys).toHaveBeenCalledWith('rbac:permissions:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });

    it('should not call del when no caches exist', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await service.invalidateAllCaches();

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});
