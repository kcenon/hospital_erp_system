import { PrismaClient, RoomType, BedStatus, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default password for seed users (should be changed on first login)
const DEFAULT_PASSWORD = 'Hospital@2024';
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.patientHistory.deleteMany();
  await prisma.patientDetail.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.patientSequence.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // =====================================================================
  // Seed Roles, Permissions, and Users
  // =====================================================================

  console.log('Creating roles...');

  // Create roles with hierarchy levels
  // Role hierarchy: ADMIN(1) > DOCTOR(2) > HEAD_NURSE(3) > NURSE(4) > CLERK(5)
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        code: 'ADMIN',
        name: 'System Administrator',
        description: 'Full system access with administrative capabilities',
        level: 1,
        isActive: true,
      },
    }),
    prisma.role.create({
      data: {
        code: 'DOCTOR',
        name: 'Doctor',
        description: 'Medical staff with patient care access',
        level: 2,
        isActive: true,
      },
    }),
    prisma.role.create({
      data: {
        code: 'HEAD_NURSE',
        name: 'Head Nurse',
        description: 'Senior nursing staff with ward management access',
        level: 3,
        isActive: true,
      },
    }),
    prisma.role.create({
      data: {
        code: 'NURSE',
        name: 'Nurse',
        description: 'Nursing staff with patient care access',
        level: 4,
        isActive: true,
      },
    }),
    prisma.role.create({
      data: {
        code: 'CLERK',
        name: 'Clerk',
        description: 'Administrative staff with limited access',
        level: 5,
        isActive: true,
      },
    }),
  ]);

  const [adminRole, doctorRole, headNurseRole, nurseRole, clerkRole] = roles;

  console.log('Creating permissions...');

  // Define permissions per resource
  const resources = ['patient', 'room', 'admission', 'report', 'rounding', 'admin'];
  const actions = ['read', 'create', 'update', 'delete'];

  const permissionsData: Array<{
    code: string;
    resource: string;
    action: string;
    description: string;
  }> = [];

  for (const resource of resources) {
    for (const action of actions) {
      permissionsData.push({
        code: `${resource}:${action}`,
        resource,
        action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} access to ${resource} module`,
      });
    }
  }

  const permissions = await Promise.all(
    permissionsData.map((p) =>
      prisma.permission.create({
        data: p,
      }),
    ),
  );

  // Create a map for easy permission lookup
  const permissionMap = new Map(permissions.map((p) => [p.code, p]));

  console.log('Assigning permissions to roles...');

  // Helper function to get permission ID
  const getPermissionId = (code: string): string => {
    const permission = permissionMap.get(code);
    if (!permission) {
      throw new Error(`Permission not found: ${code}`);
    }
    return permission.id;
  };

  // Admin gets all permissions
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });

  // Doctor permissions
  const doctorPermissions = [
    'patient:read',
    'patient:create',
    'patient:update',
    'room:read',
    'admission:read',
    'admission:create',
    'admission:update',
    'report:read',
    'report:create',
    'rounding:read',
    'rounding:create',
    'rounding:update',
  ];
  await prisma.rolePermission.createMany({
    data: doctorPermissions.map((code) => ({
      roleId: doctorRole.id,
      permissionId: getPermissionId(code),
    })),
  });

  // Head Nurse permissions
  const headNursePermissions = [
    'patient:read',
    'patient:update',
    'room:read',
    'room:update',
    'admission:read',
    'admission:update',
    'report:read',
    'report:create',
    'rounding:read',
    'rounding:create',
    'rounding:update',
  ];
  await prisma.rolePermission.createMany({
    data: headNursePermissions.map((code) => ({
      roleId: headNurseRole.id,
      permissionId: getPermissionId(code),
    })),
  });

  // Nurse permissions
  const nursePermissions = [
    'patient:read',
    'room:read',
    'admission:read',
    'report:read',
    'report:create',
    'rounding:read',
    'rounding:create',
  ];
  await prisma.rolePermission.createMany({
    data: nursePermissions.map((code) => ({
      roleId: nurseRole.id,
      permissionId: getPermissionId(code),
    })),
  });

  // Clerk permissions
  const clerkPermissions = [
    'patient:read',
    'patient:create',
    'room:read',
    'admission:read',
  ];
  await prisma.rolePermission.createMany({
    data: clerkPermissions.map((code) => ({
      roleId: clerkRole.id,
      permissionId: getPermissionId(code),
    })),
  });

  console.log('Creating initial admin user...');

  // Create initial admin user
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  const adminUser = await prisma.user.create({
    data: {
      employeeId: 'EMP001',
      username: 'admin',
      passwordHash: hashedPassword,
      name: 'System Administrator',
      email: 'admin@hospital.local',
      department: 'IT',
      position: 'System Administrator',
      isActive: true,
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create sample users for each role
  const sampleUsers = [
    {
      employeeId: 'DOC001',
      username: 'doctor1',
      name: 'Dr. John Smith',
      email: 'john.smith@hospital.local',
      department: 'Internal Medicine',
      position: 'Senior Doctor',
      roleId: doctorRole.id,
    },
    {
      employeeId: 'HN001',
      username: 'headnurse1',
      name: 'Jane Doe',
      email: 'jane.doe@hospital.local',
      department: 'Internal Medicine',
      position: 'Head Nurse',
      roleId: headNurseRole.id,
    },
    {
      employeeId: 'NRS001',
      username: 'nurse1',
      name: 'Alice Johnson',
      email: 'alice.johnson@hospital.local',
      department: 'Internal Medicine',
      position: 'Registered Nurse',
      roleId: nurseRole.id,
    },
    {
      employeeId: 'CLK001',
      username: 'clerk1',
      name: 'Bob Wilson',
      email: 'bob.wilson@hospital.local',
      department: 'Administration',
      position: 'Administrative Clerk',
      roleId: clerkRole.id,
    },
  ];

  for (const userData of sampleUsers) {
    const user = await prisma.user.create({
      data: {
        employeeId: userData.employeeId,
        username: userData.username,
        passwordHash: hashedPassword,
        name: userData.name,
        email: userData.email,
        department: userData.department,
        position: userData.position,
        isActive: true,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: userData.roleId,
        assignedBy: adminUser.id,
      },
    });
  }

  console.log('Creating buildings...');

  // Create main building
  const mainBuilding = await prisma.building.create({
    data: {
      code: 'MAIN',
      name: 'Main Building',
      address: '123 Hospital Street',
      isActive: true,
    },
  });

  // Create annex building
  const annexBuilding = await prisma.building.create({
    data: {
      code: 'ANNEX',
      name: 'Annex Building',
      address: '125 Hospital Street',
      isActive: true,
    },
  });

  console.log('Creating floors...');

  // Create floors for main building
  const mainFloors = await Promise.all([
    prisma.floor.create({
      data: {
        buildingId: mainBuilding.id,
        floorNumber: 3,
        name: '3F - Internal Medicine Ward',
        department: 'Internal Medicine',
        isActive: true,
      },
    }),
    prisma.floor.create({
      data: {
        buildingId: mainBuilding.id,
        floorNumber: 4,
        name: '4F - Surgery Ward',
        department: 'Surgery',
        isActive: true,
      },
    }),
    prisma.floor.create({
      data: {
        buildingId: mainBuilding.id,
        floorNumber: 5,
        name: '5F - ICU',
        department: 'Intensive Care',
        isActive: true,
      },
    }),
  ]);

  // Create floors for annex building
  const annexFloors = await Promise.all([
    prisma.floor.create({
      data: {
        buildingId: annexBuilding.id,
        floorNumber: 2,
        name: '2F - VIP Ward',
        department: 'VIP Services',
        isActive: true,
      },
    }),
    prisma.floor.create({
      data: {
        buildingId: annexBuilding.id,
        floorNumber: 3,
        name: '3F - Isolation Ward',
        department: 'Infectious Disease',
        isActive: true,
      },
    }),
  ]);

  console.log('Creating rooms and beds...');

  // Helper function to create beds for a room
  async function createBedsForRoom(
    roomId: string,
    bedCount: number,
  ): Promise<void> {
    const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const beds = [];

    for (let i = 0; i < bedCount; i++) {
      beds.push({
        roomId,
        bedNumber: bedLetters[i] || String(i + 1),
        status: BedStatus.EMPTY,
        isActive: true,
      });
    }

    await prisma.bed.createMany({ data: beds });
  }

  // Create rooms for Internal Medicine Ward (3F Main)
  const internalMedicineRooms = [
    { roomNumber: '301', name: 'Room 301', roomType: RoomType.WARD, bedCount: 4 },
    { roomNumber: '302', name: 'Room 302', roomType: RoomType.WARD, bedCount: 4 },
    { roomNumber: '303', name: 'Room 303', roomType: RoomType.WARD, bedCount: 4 },
    { roomNumber: '304', name: 'Room 304', roomType: RoomType.WARD, bedCount: 2 },
    { roomNumber: '305', name: 'Room 305', roomType: RoomType.WARD, bedCount: 2 },
  ];

  for (const roomData of internalMedicineRooms) {
    const room = await prisma.room.create({
      data: {
        floorId: mainFloors[0].id,
        roomNumber: roomData.roomNumber,
        name: roomData.name,
        roomType: roomData.roomType,
        bedCount: roomData.bedCount,
        isActive: true,
      },
    });
    await createBedsForRoom(room.id, roomData.bedCount);
  }

  // Create rooms for Surgery Ward (4F Main)
  const surgeryRooms = [
    { roomNumber: '401', name: 'Room 401', roomType: RoomType.WARD, bedCount: 4 },
    { roomNumber: '402', name: 'Room 402', roomType: RoomType.WARD, bedCount: 4 },
    { roomNumber: '403', name: 'Room 403', roomType: RoomType.WARD, bedCount: 2 },
    { roomNumber: '404', name: 'Room 404', roomType: RoomType.WARD, bedCount: 2 },
  ];

  for (const roomData of surgeryRooms) {
    const room = await prisma.room.create({
      data: {
        floorId: mainFloors[1].id,
        roomNumber: roomData.roomNumber,
        name: roomData.name,
        roomType: roomData.roomType,
        bedCount: roomData.bedCount,
        isActive: true,
      },
    });
    await createBedsForRoom(room.id, roomData.bedCount);
  }

  // Create rooms for ICU (5F Main)
  const icuRooms = [
    { roomNumber: '501', name: 'ICU Room 1', roomType: RoomType.ICU, bedCount: 1 },
    { roomNumber: '502', name: 'ICU Room 2', roomType: RoomType.ICU, bedCount: 1 },
    { roomNumber: '503', name: 'ICU Room 3', roomType: RoomType.ICU, bedCount: 1 },
    { roomNumber: '504', name: 'ICU Room 4', roomType: RoomType.ICU, bedCount: 1 },
    { roomNumber: '505', name: 'ICU Room 5', roomType: RoomType.ICU, bedCount: 1 },
    { roomNumber: '506', name: 'ICU Room 6', roomType: RoomType.ICU, bedCount: 1 },
  ];

  for (const roomData of icuRooms) {
    const room = await prisma.room.create({
      data: {
        floorId: mainFloors[2].id,
        roomNumber: roomData.roomNumber,
        name: roomData.name,
        roomType: roomData.roomType,
        bedCount: roomData.bedCount,
        isActive: true,
      },
    });
    await createBedsForRoom(room.id, roomData.bedCount);
  }

  // Create rooms for VIP Ward (2F Annex)
  const vipRooms = [
    { roomNumber: '201', name: 'VIP Suite 1', roomType: RoomType.VIP, bedCount: 1 },
    { roomNumber: '202', name: 'VIP Suite 2', roomType: RoomType.VIP, bedCount: 1 },
    { roomNumber: '203', name: 'VIP Suite 3', roomType: RoomType.VIP, bedCount: 1 },
  ];

  for (const roomData of vipRooms) {
    const room = await prisma.room.create({
      data: {
        floorId: annexFloors[0].id,
        roomNumber: roomData.roomNumber,
        name: roomData.name,
        roomType: roomData.roomType,
        bedCount: roomData.bedCount,
        isActive: true,
      },
    });
    await createBedsForRoom(room.id, roomData.bedCount);
  }

  // Create rooms for Isolation Ward (3F Annex)
  const isolationRooms = [
    {
      roomNumber: '301',
      name: 'Isolation Room 1',
      roomType: RoomType.ISOLATION,
      bedCount: 1,
    },
    {
      roomNumber: '302',
      name: 'Isolation Room 2',
      roomType: RoomType.ISOLATION,
      bedCount: 1,
    },
    {
      roomNumber: '303',
      name: 'Isolation Room 3',
      roomType: RoomType.ISOLATION,
      bedCount: 1,
    },
    {
      roomNumber: '304',
      name: 'Isolation Room 4',
      roomType: RoomType.ISOLATION,
      bedCount: 1,
    },
  ];

  for (const roomData of isolationRooms) {
    const room = await prisma.room.create({
      data: {
        floorId: annexFloors[1].id,
        roomNumber: roomData.roomNumber,
        name: roomData.name,
        roomType: roomData.roomType,
        bedCount: roomData.bedCount,
        isActive: true,
      },
    });
    await createBedsForRoom(room.id, roomData.bedCount);
  }

  // =====================================================================
  // Seed Patients
  // =====================================================================

  console.log('Creating patients...');

  // Initialize patient sequence for current year
  const currentYear = new Date().getFullYear();
  await prisma.patientSequence.create({
    data: {
      year: currentYear,
      lastValue: 0,
    },
  });

  // Helper function to generate patient number
  const generatePatientNumber = async (): Promise<string> => {
    const sequence = await prisma.patientSequence.update({
      where: { year: currentYear },
      data: { lastValue: { increment: 1 } },
    });
    return `P${currentYear}${String(sequence.lastValue).padStart(6, '0')}`;
  };

  // Sample patient data
  const patientsData = [
    {
      name: 'John Doe',
      birthDate: new Date('1975-03-15'),
      gender: Gender.MALE,
      bloodType: 'A+',
      phone: '010-1234-5678',
      address: '123 Main Street, Seoul',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '010-8765-4321',
      emergencyContactRelation: 'Spouse',
      detail: {
        allergies: 'Penicillin',
        insuranceType: 'National Health Insurance',
        insuranceCompany: 'NHI',
        notes: 'Regular check-up required',
      },
    },
    {
      name: 'Emily Kim',
      birthDate: new Date('1988-07-22'),
      gender: Gender.FEMALE,
      bloodType: 'O+',
      phone: '010-2345-6789',
      address: '456 Oak Avenue, Busan',
      emergencyContactName: 'Michael Kim',
      emergencyContactPhone: '010-9876-5432',
      emergencyContactRelation: 'Brother',
      detail: {
        allergies: 'Sulfa drugs, Aspirin',
        insuranceType: 'Private Insurance',
        insuranceCompany: 'Samsung Life',
        notes: 'History of hypertension',
      },
    },
    {
      name: 'Robert Park',
      birthDate: new Date('1960-11-08'),
      gender: Gender.MALE,
      bloodType: 'B-',
      phone: '010-3456-7890',
      address: '789 Pine Road, Incheon',
      emergencyContactName: 'Susan Park',
      emergencyContactPhone: '010-1357-2468',
      emergencyContactRelation: 'Daughter',
      detail: {
        allergies: null,
        insuranceType: 'National Health Insurance',
        insuranceCompany: 'NHI',
        notes: 'Diabetes Type 2',
      },
    },
    {
      name: 'Sarah Lee',
      birthDate: new Date('1995-05-30'),
      gender: Gender.FEMALE,
      bloodType: 'AB+',
      phone: '010-4567-8901',
      address: '321 Maple Lane, Daegu',
      emergencyContactName: 'David Lee',
      emergencyContactPhone: '010-2468-1357',
      emergencyContactRelation: 'Father',
      detail: {
        allergies: 'Latex',
        insuranceType: 'National Health Insurance',
        insuranceCompany: 'NHI',
        notes: null,
      },
    },
    {
      name: 'James Choi',
      birthDate: new Date('1982-09-12'),
      gender: Gender.MALE,
      bloodType: 'O-',
      phone: '010-5678-9012',
      address: '654 Birch Street, Gwangju',
      emergencyContactName: 'Linda Choi',
      emergencyContactPhone: '010-3579-2468',
      emergencyContactRelation: 'Wife',
      detail: {
        allergies: 'Iodine contrast',
        insuranceType: 'Private Insurance',
        insuranceCompany: 'Hyundai Insurance',
        notes: 'Previous cardiac surgery',
      },
    },
  ];

  for (const patientData of patientsData) {
    const patientNumber = await generatePatientNumber();
    await prisma.patient.create({
      data: {
        patientNumber,
        name: patientData.name,
        birthDate: patientData.birthDate,
        gender: patientData.gender,
        bloodType: patientData.bloodType,
        phone: patientData.phone,
        address: patientData.address,
        emergencyContactName: patientData.emergencyContactName,
        emergencyContactPhone: patientData.emergencyContactPhone,
        emergencyContactRelation: patientData.emergencyContactRelation,
        detail: {
          create: {
            allergies: patientData.detail.allergies,
            insuranceType: patientData.detail.insuranceType,
            insuranceCompany: patientData.detail.insuranceCompany,
            notes: patientData.detail.notes,
          },
        },
      },
    });
  }

  // Print summary
  const userCount = await prisma.user.count();
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();
  const buildingCount = await prisma.building.count();
  const floorCount = await prisma.floor.count();
  const roomCount = await prisma.room.count();
  const bedCount = await prisma.bed.count();
  const patientCount = await prisma.patient.count();

  console.log('\nSeed completed successfully!');
  console.log('Summary:');
  console.log('  Authentication:');
  console.log(`    Users: ${userCount}`);
  console.log(`    Roles: ${roleCount}`);
  console.log(`    Permissions: ${permissionCount}`);
  console.log('  Infrastructure:');
  console.log(`    Buildings: ${buildingCount}`);
  console.log(`    Floors: ${floorCount}`);
  console.log(`    Rooms: ${roomCount}`);
  console.log(`    Beds: ${bedCount}`);
  console.log('  Patients:');
  console.log(`    Patients: ${patientCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
