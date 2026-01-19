import { PrismaService } from '../../src/prisma';
import * as bcrypt from 'bcrypt';
import { Gender, RoomType, BedStatus, AdmissionType, AdmissionStatus } from '@prisma/client';

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

/**
 * Test patient data
 */
export const TEST_PATIENTS = {
  john: {
    patientNumber: 'P2025000001',
    name: 'John Doe',
    birthDate: new Date('1990-01-15'),
    gender: Gender.MALE,
    bloodType: 'A+',
    phone: '010-1234-5678',
    address: '123 Main St, Seoul',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '010-9876-5432',
    emergencyContactRelation: 'Spouse',
  },
  jane: {
    patientNumber: 'P2025000002',
    name: 'Jane Smith',
    birthDate: new Date('1985-06-20'),
    gender: Gender.FEMALE,
    bloodType: 'B+',
    phone: '010-2222-3333',
    address: '456 Oak Ave, Seoul',
  },
  mike: {
    patientNumber: 'P2025000003',
    name: 'Mike Johnson',
    birthDate: new Date('1975-03-10'),
    gender: Gender.MALE,
    bloodType: 'O-',
    phone: '010-4444-5555',
    address: '789 Pine Rd, Busan',
    legacyPatientId: 'OLD-001',
  },
};

/**
 * Test room data
 */
export const TEST_ROOMS = {
  building: {
    code: 'MAIN',
    name: 'Main Building',
    address: '123 Hospital St',
  },
  floor: {
    floorNumber: 3,
    name: '3F - Internal Medicine',
    department: 'Internal Medicine',
  },
  room301: {
    roomNumber: '301',
    name: 'Room 301',
    roomType: RoomType.WARD,
    bedCount: 2,
  },
  room302: {
    roomNumber: '302',
    name: 'Room 302',
    roomType: RoomType.WARD,
    bedCount: 2,
  },
  room310: {
    roomNumber: '310',
    name: 'Room 310 - ICU',
    roomType: RoomType.ICU,
    bedCount: 1,
  },
};

/**
 * Stored IDs for test data (populated by seed functions)
 */
export interface TestDataIds {
  users: {
    adminId: string;
    doctorId: string;
    nurseId: string;
  };
  patients: {
    johnId: string;
    janeId: string;
    mikeId: string;
  };
  rooms: {
    buildingId: string;
    floorId: string;
    room301Id: string;
    room302Id: string;
    room310Id: string;
    bed301AId: string;
    bed301BId: string;
    bed302AId: string;
    bed302BId: string;
    bed310AId: string;
  };
  admissions: {
    johnAdmissionId: string;
  };
}

let testDataIds: TestDataIds | null = null;

export function getTestDataIds(): TestDataIds {
  if (!testDataIds) {
    throw new Error('Test data not seeded. Call seedPatientTestData first.');
  }
  return testDataIds;
}

/**
 * Seed test patients for integration tests
 */
export async function seedPatientTestData(prisma: PrismaService): Promise<TestDataIds> {
  // Get test user IDs
  const adminUser = await prisma.user.findUnique({
    where: { username: TEST_USERS.admin.username },
  });
  const doctorUser = await prisma.user.findUnique({
    where: { username: TEST_USERS.doctor.username },
  });
  const nurseUser = await prisma.user.findUnique({
    where: { username: TEST_USERS.nurse.username },
  });

  if (!adminUser || !doctorUser || !nurseUser) {
    throw new Error('Test users must be seeded first. Call seedTestDatabase first.');
  }

  // Create test permissions for patient/admission operations
  const patientCreatePerm = await prisma.permission.upsert({
    where: { code: 'patient:create' },
    update: {},
    create: {
      code: 'patient:create',
      resource: 'patient',
      action: 'create',
      description: 'Create patient',
    },
  });

  const patientUpdatePerm = await prisma.permission.upsert({
    where: { code: 'patient:update' },
    update: {},
    create: {
      code: 'patient:update',
      resource: 'patient',
      action: 'update',
      description: 'Update patient',
    },
  });

  const patientDeletePerm = await prisma.permission.upsert({
    where: { code: 'patient:delete' },
    update: {},
    create: {
      code: 'patient:delete',
      resource: 'patient',
      action: 'delete',
      description: 'Delete patient',
    },
  });

  // Get admin role and assign all permissions
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (adminRole) {
    for (const perm of [patientCreatePerm, patientUpdatePerm, patientDeletePerm]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      });
    }
  }

  // Create building
  const building = await prisma.building.upsert({
    where: { code: TEST_ROOMS.building.code },
    update: {},
    create: {
      ...TEST_ROOMS.building,
      isActive: true,
    },
  });

  // Create floor
  const floor = await prisma.floor.upsert({
    where: {
      buildingId_floorNumber: {
        buildingId: building.id,
        floorNumber: TEST_ROOMS.floor.floorNumber,
      },
    },
    update: {},
    create: {
      buildingId: building.id,
      ...TEST_ROOMS.floor,
      isActive: true,
    },
  });

  // Create rooms
  const room301 = await prisma.room.upsert({
    where: {
      floorId_roomNumber: { floorId: floor.id, roomNumber: TEST_ROOMS.room301.roomNumber },
    },
    update: {},
    create: {
      floorId: floor.id,
      ...TEST_ROOMS.room301,
      isActive: true,
    },
  });

  const room302 = await prisma.room.upsert({
    where: {
      floorId_roomNumber: { floorId: floor.id, roomNumber: TEST_ROOMS.room302.roomNumber },
    },
    update: {},
    create: {
      floorId: floor.id,
      ...TEST_ROOMS.room302,
      isActive: true,
    },
  });

  const room310 = await prisma.room.upsert({
    where: {
      floorId_roomNumber: { floorId: floor.id, roomNumber: TEST_ROOMS.room310.roomNumber },
    },
    update: {},
    create: {
      floorId: floor.id,
      ...TEST_ROOMS.room310,
      isActive: true,
    },
  });

  // Create beds
  const bed301A = await prisma.bed.upsert({
    where: { roomId_bedNumber: { roomId: room301.id, bedNumber: 'A' } },
    update: {},
    create: {
      roomId: room301.id,
      bedNumber: 'A',
      status: BedStatus.EMPTY,
      isActive: true,
    },
  });

  const bed301B = await prisma.bed.upsert({
    where: { roomId_bedNumber: { roomId: room301.id, bedNumber: 'B' } },
    update: {},
    create: {
      roomId: room301.id,
      bedNumber: 'B',
      status: BedStatus.EMPTY,
      isActive: true,
    },
  });

  const bed302A = await prisma.bed.upsert({
    where: { roomId_bedNumber: { roomId: room302.id, bedNumber: 'A' } },
    update: {},
    create: {
      roomId: room302.id,
      bedNumber: 'A',
      status: BedStatus.EMPTY,
      isActive: true,
    },
  });

  const bed302B = await prisma.bed.upsert({
    where: { roomId_bedNumber: { roomId: room302.id, bedNumber: 'B' } },
    update: {},
    create: {
      roomId: room302.id,
      bedNumber: 'B',
      status: BedStatus.EMPTY,
      isActive: true,
    },
  });

  const bed310A = await prisma.bed.upsert({
    where: { roomId_bedNumber: { roomId: room310.id, bedNumber: 'A' } },
    update: {},
    create: {
      roomId: room310.id,
      bedNumber: 'A',
      status: BedStatus.EMPTY,
      isActive: true,
    },
  });

  // Create test patients
  const johnPatient = await prisma.patient.upsert({
    where: { patientNumber: TEST_PATIENTS.john.patientNumber },
    update: {},
    create: TEST_PATIENTS.john,
  });

  const janePatient = await prisma.patient.upsert({
    where: { patientNumber: TEST_PATIENTS.jane.patientNumber },
    update: {},
    create: TEST_PATIENTS.jane,
  });

  const mikePatient = await prisma.patient.upsert({
    where: { patientNumber: TEST_PATIENTS.mike.patientNumber },
    update: {},
    create: TEST_PATIENTS.mike,
  });

  testDataIds = {
    users: {
      adminId: adminUser.id,
      doctorId: doctorUser.id,
      nurseId: nurseUser.id,
    },
    patients: {
      johnId: johnPatient.id,
      janeId: janePatient.id,
      mikeId: mikePatient.id,
    },
    rooms: {
      buildingId: building.id,
      floorId: floor.id,
      room301Id: room301.id,
      room302Id: room302.id,
      room310Id: room310.id,
      bed301AId: bed301A.id,
      bed301BId: bed301B.id,
      bed302AId: bed302A.id,
      bed302BId: bed302B.id,
      bed310AId: bed310A.id,
    },
    admissions: {
      johnAdmissionId: '', // Will be set after admission creation
    },
  };

  return testDataIds;
}

/**
 * Create a test admission
 */
export async function createTestAdmission(
  prisma: PrismaService,
  patientId: string,
  bedId: string,
  doctorId: string,
  nurseId?: string,
): Promise<string> {
  // Get or create admission sequence
  const currentYear = new Date().getFullYear();
  const sequence = await prisma.admissionSequence.upsert({
    where: { year: currentYear },
    update: { lastValue: { increment: 1 } },
    create: { year: currentYear, lastValue: 1 },
  });

  const admissionNumber = `ADM${currentYear}${String(sequence.lastValue).padStart(6, '0')}`;

  // Update bed status
  await prisma.bed.update({
    where: { id: bedId },
    data: { status: BedStatus.OCCUPIED },
  });

  // Create admission
  const admission = await prisma.admission.create({
    data: {
      patientId,
      bedId,
      admissionNumber,
      admissionDate: new Date(),
      admissionTime: '14:30',
      admissionType: AdmissionType.SCHEDULED,
      diagnosis: 'Test diagnosis',
      chiefComplaint: 'Test chief complaint',
      attendingDoctorId: doctorId,
      primaryNurseId: nurseId,
      status: AdmissionStatus.ACTIVE,
      createdBy: doctorId,
    },
  });

  // Update bed with admission ID
  await prisma.bed.update({
    where: { id: bedId },
    data: { currentAdmissionId: admission.id },
  });

  if (testDataIds) {
    testDataIds.admissions.johnAdmissionId = admission.id;
  }

  return admission.id;
}

/**
 * Clean up patient test data
 */
export async function cleanupPatientTestData(prisma: PrismaService): Promise<void> {
  const patientNumbers = Object.values(TEST_PATIENTS).map((p) => p.patientNumber);

  // Delete admissions first (due to foreign key constraints)
  await prisma.admission.deleteMany({
    where: {
      patientId: {
        in: await prisma.patient
          .findMany({
            where: { patientNumber: { in: patientNumbers } },
            select: { id: true },
          })
          .then((patients) => patients.map((p) => p.id)),
      },
    },
  });

  // Reset bed statuses
  await prisma.bed.updateMany({
    where: {
      room: {
        floor: {
          building: {
            code: TEST_ROOMS.building.code,
          },
        },
      },
    },
    data: {
      status: BedStatus.EMPTY,
      currentAdmissionId: null,
    },
  });

  // Delete patients
  await prisma.patient.deleteMany({
    where: { patientNumber: { in: patientNumbers } },
  });

  // Delete beds, rooms, floors, buildings
  await prisma.bed.deleteMany({
    where: {
      room: {
        floor: {
          building: {
            code: TEST_ROOMS.building.code,
          },
        },
      },
    },
  });

  await prisma.room.deleteMany({
    where: {
      floor: {
        building: {
          code: TEST_ROOMS.building.code,
        },
      },
    },
  });

  await prisma.floor.deleteMany({
    where: {
      building: {
        code: TEST_ROOMS.building.code,
      },
    },
  });

  await prisma.building.deleteMany({
    where: { code: TEST_ROOMS.building.code },
  });

  testDataIds = null;
}
