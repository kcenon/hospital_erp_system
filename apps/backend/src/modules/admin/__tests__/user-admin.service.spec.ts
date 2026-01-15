import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { UserAdminService } from '../user-admin.service';
import { UserAdminRepository, UserWithRoles } from '../user-admin.repository';
import { RoleRepository } from '../role.repository';
import { SessionService, RbacService } from '../../auth/services';
import { AuditService } from '../audit.service';
import {
  UserNotFoundException,
  DuplicateUsernameException,
  DuplicateEmployeeIdException,
  RoleNotFoundException,
  RoleAlreadyAssignedException,
  RoleNotAssignedException,
  CannotDeactivateLastAdminException,
  CannotRemoveLastAdminRoleException,
} from '../exceptions';

describe('UserAdminService', () => {
  let service: UserAdminService;
  let userRepo: jest.Mocked<UserAdminRepository>;
  let roleRepo: jest.Mocked<RoleRepository>;
  let sessionService: jest.Mocked<SessionService>;
  let rbacService: jest.Mocked<RbacService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUserRepo = {
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findByEmployeeId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    assignRole: jest.fn(),
    removeRole: jest.fn(),
    hasRole: jest.fn(),
    countActiveAdmins: jest.fn(),
    countUsersWithAdminRole: jest.fn(),
  };

  const mockRoleRepo = {
    findById: jest.fn(),
    getNonExistentRoleIds: jest.fn(),
  };

  const mockSessionService = {
    destroyAllForUser: jest.fn(),
  };

  const mockRbacService = {
    invalidateCache: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const createMockUser = (overrides: Partial<UserWithRoles> = {}): UserWithRoles => ({
    id: faker.string.uuid(),
    employeeId: faker.string.alphanumeric(8),
    username: faker.internet.username(),
    passwordHash: faker.string.alphanumeric(60),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    department: 'Internal Medicine',
    position: 'Doctor',
    isActive: true,
    lastLoginAt: faker.date.recent(),
    passwordChangedAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    deletedAt: null,
    userRoles: [
      {
        roleId: faker.string.uuid(),
        assignedAt: faker.date.past(),
        assignedBy: faker.string.uuid(),
        role: {
          id: faker.string.uuid(),
          code: 'DOCTOR',
          name: 'Doctor',
          description: 'Medical Doctor',
          level: 3,
          isActive: true,
        },
      },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAdminService,
        { provide: UserAdminRepository, useValue: mockUserRepo },
        { provide: RoleRepository, useValue: mockRoleRepo },
        { provide: SessionService, useValue: mockSessionService },
        { provide: RbacService, useValue: mockRbacService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<UserAdminService>(UserAdminService);
    userRepo = module.get(UserAdminRepository);
    roleRepo = module.get(RoleRepository);
    sessionService = module.get(SessionService);
    rbacService = module.get(RbacService);
    auditService = module.get(AuditService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto = {
      employeeId: 'EMP001',
      username: 'newuser',
      name: 'New User',
      email: 'newuser@hospital.com',
      roleIds: [faker.string.uuid()],
    };
    const adminId = faker.string.uuid();

    it('should create a new user successfully', async () => {
      const mockCreatedUser = createMockUser({
        employeeId: createUserDto.employeeId,
        username: createUserDto.username,
        name: createUserDto.name,
      });

      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.findByEmployeeId.mockResolvedValue(null);
      mockRoleRepo.getNonExistentRoleIds.mockResolvedValue([]);
      mockUserRepo.create.mockResolvedValue(mockCreatedUser);

      const result = await service.createUser(createUserDto, adminId);

      expect(result).toBeDefined();
      expect(result.username).toBe(createUserDto.username);
      expect(result.temporaryPassword).toBeDefined();
      expect(userRepo.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw DuplicateUsernameException when username exists', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(createMockUser());

      await expect(service.createUser(createUserDto, adminId)).rejects.toThrow(
        DuplicateUsernameException,
      );
    });

    it('should throw DuplicateEmployeeIdException when employee ID exists', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.findByEmployeeId.mockResolvedValue(createMockUser());

      await expect(service.createUser(createUserDto, adminId)).rejects.toThrow(
        DuplicateEmployeeIdException,
      );
    });

    it('should throw RoleNotFoundException when role does not exist', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.findByEmployeeId.mockResolvedValue(null);
      mockRoleRepo.getNonExistentRoleIds.mockResolvedValue([createUserDto.roleIds[0]]);

      await expect(service.createUser(createUserDto, adminId)).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = createMockUser();
      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw UserNotFoundException when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.getUserById(faker.string.uuid())).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('updateUser', () => {
    const updateDto = { name: 'Updated Name' };
    const adminId = faker.string.uuid();

    it('should update user successfully', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({ ...mockUser, name: updateDto.name });

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, updateDto, adminId);

      expect(result.name).toBe(updateDto.name);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw UserNotFoundException when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.updateUser(faker.string.uuid(), updateDto, adminId)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('deactivateUser', () => {
    const adminId = faker.string.uuid();

    it('should deactivate user and destroy sessions', async () => {
      const mockUser = createMockUser();
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockUserRepo.countActiveAdmins.mockResolvedValue(2);

      await service.deactivateUser(mockUser.id, adminId);

      expect(userRepo.update).toHaveBeenCalledWith(mockUser.id, { isActive: false });
      expect(sessionService.destroyAllForUser).toHaveBeenCalledWith(mockUser.id);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw CannotDeactivateLastAdminException when deactivating last admin', async () => {
      const adminUser = createMockUser({
        userRoles: [
          {
            roleId: faker.string.uuid(),
            assignedAt: new Date(),
            assignedBy: null,
            role: {
              id: faker.string.uuid(),
              code: 'ADMIN',
              name: 'Administrator',
              description: null,
              level: 1,
              isActive: true,
            },
          },
        ],
      });

      mockUserRepo.findById.mockResolvedValue(adminUser);
      mockUserRepo.countActiveAdmins.mockResolvedValue(1);

      await expect(service.deactivateUser(adminUser.id, adminId)).rejects.toThrow(
        CannotDeactivateLastAdminException,
      );
    });
  });

  describe('resetPassword', () => {
    const adminId = faker.string.uuid();

    it('should reset password and return temporary password', async () => {
      const mockUser = createMockUser();
      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await service.resetPassword(mockUser.id, adminId);

      expect(result.temporaryPassword).toBeDefined();
      expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
      expect(userRepo.update).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('assignRole', () => {
    const adminId = faker.string.uuid();
    const roleId = faker.string.uuid();

    it('should assign role to user', async () => {
      const mockUser = createMockUser();
      const mockRole = { id: roleId, code: 'NURSE', name: 'Nurse' };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRepo.hasRole.mockResolvedValue(false);

      await service.assignRole(mockUser.id, roleId, adminId);

      expect(userRepo.assignRole).toHaveBeenCalledWith(mockUser.id, roleId, adminId);
      expect(rbacService.invalidateCache).toHaveBeenCalledWith(mockUser.id);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw RoleAlreadyAssignedException when user already has role', async () => {
      const mockUser = createMockUser();
      const mockRole = { id: roleId, code: 'NURSE', name: 'Nurse' };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRepo.hasRole.mockResolvedValue(true);

      await expect(service.assignRole(mockUser.id, roleId, adminId)).rejects.toThrow(
        RoleAlreadyAssignedException,
      );
    });
  });

  describe('removeRole', () => {
    const adminId = faker.string.uuid();
    const roleId = faker.string.uuid();

    it('should remove role from user', async () => {
      const mockUser = createMockUser();
      const mockRole = { id: roleId, code: 'NURSE', name: 'Nurse' };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRepo.hasRole.mockResolvedValue(true);

      await service.removeRole(mockUser.id, roleId, adminId);

      expect(userRepo.removeRole).toHaveBeenCalledWith(mockUser.id, roleId);
      expect(rbacService.invalidateCache).toHaveBeenCalledWith(mockUser.id);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw RoleNotAssignedException when user does not have role', async () => {
      const mockUser = createMockUser();
      const mockRole = { id: roleId, code: 'NURSE', name: 'Nurse' };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRepo.hasRole.mockResolvedValue(false);

      await expect(service.removeRole(mockUser.id, roleId, adminId)).rejects.toThrow(
        RoleNotAssignedException,
      );
    });

    it('should throw CannotRemoveLastAdminRoleException when removing last admin role', async () => {
      const mockUser = createMockUser();
      const mockRole = { id: roleId, code: 'ADMIN', name: 'Administrator' };

      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRepo.hasRole.mockResolvedValue(true);
      mockUserRepo.countUsersWithAdminRole.mockResolvedValue(1);

      await expect(service.removeRole(mockUser.id, roleId, adminId)).rejects.toThrow(
        CannotRemoveLastAdminRoleException,
      );
    });
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [createMockUser(), createMockUser()];
      mockUserRepo.findMany.mockResolvedValue({ users: mockUsers, total: 2 });

      const result = await service.listUsers({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });
  });
});
