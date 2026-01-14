import { faker } from '@faker-js/faker';
import { User, Role, Permission, UserRole, RolePermission } from '@prisma/client';

export interface UserWithRoles extends User {
  userRoles: (UserRole & { role: Role })[];
}

export function createTestUser(overrides?: Partial<User>): User {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    employeeId: `EMP${faker.string.numeric(6)}`,
    username: faker.internet.username().toLowerCase(),
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJJR6q9i', // "password123"
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    department: faker.commerce.department(),
    position: faker.person.jobTitle(),
    isActive: true,
    lastLoginAt: null,
    passwordChangedAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createTestRole(overrides?: Partial<Role>): Role {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    code: faker.helpers.arrayElement(['DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST']),
    name: faker.person.jobTitle(),
    description: faker.lorem.sentence(),
    level: faker.number.int({ min: 1, max: 10 }),
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestPermission(overrides?: Partial<Permission>): Permission {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    code: `${faker.helpers.arrayElement(['patient', 'admission', 'room'])}:${faker.helpers.arrayElement(['read', 'write', 'delete'])}`,
    resource: faker.helpers.arrayElement(['patient', 'admission', 'room', 'report']),
    action: faker.helpers.arrayElement(['read', 'write', 'delete', 'admin']),
    description: faker.lorem.sentence(),
    createdAt: now,
    ...overrides,
  };
}

export function createTestUserRole(
  userId: string,
  roleId: string,
  overrides?: Partial<UserRole>,
): UserRole {
  const now = new Date();
  return {
    userId,
    roleId,
    assignedAt: now,
    assignedBy: null,
    ...overrides,
  };
}

export function createTestUserWithRoles(
  userOverrides?: Partial<User>,
  roles: Role[] = [createTestRole()],
): UserWithRoles {
  const user = createTestUser(userOverrides);
  return {
    ...user,
    userRoles: roles.map((role) => ({
      ...createTestUserRole(user.id, role.id),
      role,
    })),
  };
}

export function createTestRolePermission(
  roleId: string,
  permissionId: string,
): RolePermission {
  return {
    roleId,
    permissionId,
  };
}

export function createLockedUser(overrides?: Partial<User>): User {
  const lockUntil = new Date();
  lockUntil.setMinutes(lockUntil.getMinutes() + 30);

  return createTestUser({
    failedLoginCount: 5,
    lockedUntil: lockUntil,
    ...overrides,
  });
}

export function createInactiveUser(overrides?: Partial<User>): User {
  return createTestUser({
    isActive: false,
    ...overrides,
  });
}
