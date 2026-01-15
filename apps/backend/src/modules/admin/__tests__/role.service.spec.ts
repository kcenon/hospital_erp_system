import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { RoleService } from '../role.service';
import { RoleRepository, RoleWithPermissions } from '../role.repository';
import { RoleNotFoundException } from '../exceptions';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepo: jest.Mocked<RoleRepository>;

  const mockRoleRepo = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByIdWithPermissions: jest.fn(),
    findAll: jest.fn(),
    findAllWithPermissions: jest.fn(),
  };

  const createMockRole = (overrides = {}) => ({
    id: faker.string.uuid(),
    code: 'DOCTOR',
    name: 'Doctor',
    description: 'Medical Doctor',
    level: 3,
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  });

  const createMockRoleWithPermissions = (overrides = {}): RoleWithPermissions => ({
    ...createMockRole(),
    rolePermissions: [
      {
        roleId: faker.string.uuid(),
        permissionId: faker.string.uuid(),
        permission: {
          id: faker.string.uuid(),
          code: 'patient:read',
          resource: 'patient',
          action: 'read',
          description: 'Read patient records',
          createdAt: faker.date.past(),
        },
      },
      {
        roleId: faker.string.uuid(),
        permissionId: faker.string.uuid(),
        permission: {
          id: faker.string.uuid(),
          code: 'patient:update',
          resource: 'patient',
          action: 'update',
          description: 'Update patient records',
          createdAt: faker.date.past(),
        },
      },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService, { provide: RoleRepository, useValue: mockRoleRepo }],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepo = module.get(RoleRepository);

    jest.clearAllMocks();
  });

  describe('listRoles', () => {
    it('should return all active roles', async () => {
      const mockRoles = [
        createMockRole({ code: 'ADMIN', name: 'Administrator', level: 1 }),
        createMockRole({ code: 'DOCTOR', name: 'Doctor', level: 3 }),
        createMockRole({ code: 'NURSE', name: 'Nurse', level: 4 }),
      ];

      mockRoleRepo.findAll.mockResolvedValue(mockRoles);

      const result = await service.listRoles();

      expect(result).toHaveLength(3);
      expect(result[0].code).toBe('ADMIN');
      expect(result[1].code).toBe('DOCTOR');
      expect(result[2].code).toBe('NURSE');
    });

    it('should return empty array when no roles exist', async () => {
      mockRoleRepo.findAll.mockResolvedValue([]);

      const result = await service.listRoles();

      expect(result).toHaveLength(0);
    });
  });

  describe('getRoleById', () => {
    it('should return role when found', async () => {
      const mockRole = createMockRole();
      mockRoleRepo.findById.mockResolvedValue(mockRole);

      const result = await service.getRoleById(mockRole.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockRole.id);
      expect(result.code).toBe(mockRole.code);
    });

    it('should throw RoleNotFoundException when role not found', async () => {
      mockRoleRepo.findById.mockResolvedValue(null);

      await expect(service.getRoleById(faker.string.uuid())).rejects.toThrow(RoleNotFoundException);
    });
  });

  describe('getRoleWithPermissions', () => {
    it('should return role with permissions', async () => {
      const mockRole = createMockRoleWithPermissions();
      mockRoleRepo.findByIdWithPermissions.mockResolvedValue(mockRole);

      const result = await service.getRoleWithPermissions(mockRole.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockRole.id);
      expect(result.permissions).toBeDefined();
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions[0].code).toBe('patient:read');
      expect(result.permissions[1].code).toBe('patient:update');
    });

    it('should throw RoleNotFoundException when role not found', async () => {
      mockRoleRepo.findByIdWithPermissions.mockResolvedValue(null);

      await expect(service.getRoleWithPermissions(faker.string.uuid())).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  describe('listRolesWithPermissions', () => {
    it('should return all roles with their permissions', async () => {
      const mockRoles = [
        createMockRoleWithPermissions({ code: 'ADMIN', name: 'Administrator' }),
        createMockRoleWithPermissions({ code: 'DOCTOR', name: 'Doctor' }),
      ];

      mockRoleRepo.findAllWithPermissions.mockResolvedValue(mockRoles);

      const result = await service.listRolesWithPermissions();

      expect(result).toHaveLength(2);
      expect(result[0].permissions).toBeDefined();
      expect(result[1].permissions).toBeDefined();
    });
  });
});
