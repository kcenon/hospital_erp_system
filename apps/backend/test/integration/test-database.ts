import { PrismaService } from '../../src/prisma';
import * as bcrypt from 'bcrypt';

/**
 * Test user credentials
 */
export const TEST_USERS = {
  admin: {
    username: 'test_admin',
    password: 'TestAdmin123!',
    employeeId: 'EMP_ADMIN_TEST',
    name: 'Test Admin',
    email: 'admin@test.local',
  },
  doctor: {
    username: 'test_doctor',
    password: 'TestDoctor123!',
    employeeId: 'EMP_DOC_TEST',
    name: 'Test Doctor',
    email: 'doctor@test.local',
  },
  nurse: {
    username: 'test_nurse',
    password: 'TestNurse123!',
    employeeId: 'EMP_NURSE_TEST',
    name: 'Test Nurse',
    email: 'nurse@test.local',
  },
  locked: {
    username: 'test_locked',
    password: 'TestLocked123!',
    employeeId: 'EMP_LOCKED_TEST',
    name: 'Test Locked User',
    email: 'locked@test.local',
  },
  inactive: {
    username: 'test_inactive',
    password: 'TestInactive123!',
    employeeId: 'EMP_INACTIVE_TEST',
    name: 'Test Inactive User',
    email: 'inactive@test.local',
  },
};

/**
 * Seed test users and roles for integration tests
 */
export async function seedTestDatabase(prisma: PrismaService): Promise<void> {
  const passwordHash = await bcrypt.hash('TestAdmin123!', 12);
  const lockUntil = new Date();
  lockUntil.setHours(lockUntil.getHours() + 1);

  // Create test roles
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: 'Administrator',
      description: 'System administrator with full access',
      level: 10,
      isActive: true,
    },
  });

  const doctorRole = await prisma.role.upsert({
    where: { code: 'DOCTOR' },
    update: {},
    create: {
      code: 'DOCTOR',
      name: 'Doctor',
      description: 'Medical doctor',
      level: 7,
      isActive: true,
    },
  });

  const nurseRole = await prisma.role.upsert({
    where: { code: 'NURSE' },
    update: {},
    create: {
      code: 'NURSE',
      name: 'Nurse',
      description: 'Nursing staff',
      level: 5,
      isActive: true,
    },
  });

  // Create test permissions
  const patientReadPerm = await prisma.permission.upsert({
    where: { code: 'patient:read' },
    update: {},
    create: {
      code: 'patient:read',
      resource: 'patient',
      action: 'read',
      description: 'Read patient data',
    },
  });

  const patientWritePerm = await prisma.permission.upsert({
    where: { code: 'patient:write' },
    update: {},
    create: {
      code: 'patient:write',
      resource: 'patient',
      action: 'write',
      description: 'Write patient data',
    },
  });

  // Assign permissions to roles
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: { roleId: doctorRole.id, permissionId: patientReadPerm.id },
    },
    update: {},
    create: { roleId: doctorRole.id, permissionId: patientReadPerm.id },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: { roleId: doctorRole.id, permissionId: patientWritePerm.id },
    },
    update: {},
    create: { roleId: doctorRole.id, permissionId: patientWritePerm.id },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: { roleId: nurseRole.id, permissionId: patientReadPerm.id },
    },
    update: {},
    create: { roleId: nurseRole.id, permissionId: patientReadPerm.id },
  });

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { username: TEST_USERS.admin.username },
    update: {},
    create: {
      employeeId: TEST_USERS.admin.employeeId,
      username: TEST_USERS.admin.username,
      passwordHash: await bcrypt.hash(TEST_USERS.admin.password, 12),
      name: TEST_USERS.admin.name,
      email: TEST_USERS.admin.email,
      isActive: true,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { username: TEST_USERS.doctor.username },
    update: {},
    create: {
      employeeId: TEST_USERS.doctor.employeeId,
      username: TEST_USERS.doctor.username,
      passwordHash: await bcrypt.hash(TEST_USERS.doctor.password, 12),
      name: TEST_USERS.doctor.name,
      email: TEST_USERS.doctor.email,
      isActive: true,
    },
  });

  const nurseUser = await prisma.user.upsert({
    where: { username: TEST_USERS.nurse.username },
    update: {},
    create: {
      employeeId: TEST_USERS.nurse.employeeId,
      username: TEST_USERS.nurse.username,
      passwordHash: await bcrypt.hash(TEST_USERS.nurse.password, 12),
      name: TEST_USERS.nurse.name,
      email: TEST_USERS.nurse.email,
      isActive: true,
    },
  });

  const lockedUser = await prisma.user.upsert({
    where: { username: TEST_USERS.locked.username },
    update: {},
    create: {
      employeeId: TEST_USERS.locked.employeeId,
      username: TEST_USERS.locked.username,
      passwordHash: await bcrypt.hash(TEST_USERS.locked.password, 12),
      name: TEST_USERS.locked.name,
      email: TEST_USERS.locked.email,
      isActive: true,
      failedLoginCount: 5,
      lockedUntil: lockUntil,
    },
  });

  const inactiveUser = await prisma.user.upsert({
    where: { username: TEST_USERS.inactive.username },
    update: {},
    create: {
      employeeId: TEST_USERS.inactive.employeeId,
      username: TEST_USERS.inactive.username,
      passwordHash: await bcrypt.hash(TEST_USERS.inactive.password, 12),
      name: TEST_USERS.inactive.name,
      email: TEST_USERS.inactive.email,
      isActive: false,
    },
  });

  // Assign roles to users
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: doctorUser.id, roleId: doctorRole.id } },
    update: {},
    create: { userId: doctorUser.id, roleId: doctorRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: nurseUser.id, roleId: nurseRole.id } },
    update: {},
    create: { userId: nurseUser.id, roleId: nurseRole.id },
  });
}

/**
 * Clean up test data after integration tests
 */
export async function cleanupTestDatabase(prisma: PrismaService): Promise<void> {
  const testUsernames = Object.values(TEST_USERS).map((u) => u.username);

  // Delete test user roles first (foreign key constraint)
  await prisma.userRole.deleteMany({
    where: {
      user: {
        username: { in: testUsernames },
      },
    },
  });

  // Delete test users
  await prisma.user.deleteMany({
    where: {
      username: { in: testUsernames },
    },
  });
}

/**
 * Reset user login state for testing
 */
export async function resetUserLoginState(prisma: PrismaService, username: string): Promise<void> {
  await prisma.user.update({
    where: { username },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
}
