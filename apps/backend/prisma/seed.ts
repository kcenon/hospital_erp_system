import {
  PrismaClient,
  RoomType,
  BedStatus,
  Gender,
  AdmissionType,
  AdmissionStatus,
  MedicationRoute,
  MedicationStatus,
  NoteType,
  RoundType,
  RoundStatus,
  Consciousness,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default password for seed users (should be changed on first login)
const DEFAULT_PASSWORD = 'Hospital@2024';
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.roundRecord.deleteMany();
  await prisma.round.deleteMany();
  await prisma.roundSequence.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.nursingNote.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.intakeOutput.deleteMany();
  await prisma.vitalSign.deleteMany();
  await prisma.discharge.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.admissionSequence.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.accessLog.deleteMany();
  await prisma.changeLog.deleteMany();
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
  const clerkPermissions = ['patient:read', 'patient:create', 'room:read', 'admission:read'];
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
  async function createBedsForRoom(roomId: string, bedCount: number): Promise<void> {
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
            allergiesEncrypted: patientData.detail.allergies
              ? Buffer.from(patientData.detail.allergies, 'utf-8')
              : null,
            insuranceType: patientData.detail.insuranceType,
            insuranceCompany: patientData.detail.insuranceCompany,
            notes: patientData.detail.notes,
          },
        },
      },
    });
  }

  // =====================================================================
  // Seed Additional Patients (25 more for a total of 30)
  // =====================================================================

  console.log('Creating additional patients...');

  const additionalPatients = [
    { name: 'Min-Jun Park', birthDate: '1970-04-10', gender: Gender.MALE, bloodType: 'A+' },
    { name: 'Soo-Yeon Kim', birthDate: '1985-08-15', gender: Gender.FEMALE, bloodType: 'B+' },
    { name: 'Hyun-Woo Lee', birthDate: '1952-12-03', gender: Gender.MALE, bloodType: 'O-' },
    { name: 'Ji-Eun Choi', birthDate: '1990-02-28', gender: Gender.FEMALE, bloodType: 'AB+' },
    { name: 'Sang-Ho Jung', birthDate: '1968-06-20', gender: Gender.MALE, bloodType: 'A-' },
    { name: 'Hye-Jin Yoon', birthDate: '1978-10-05', gender: Gender.FEMALE, bloodType: 'O+' },
    { name: 'Dong-Hoon Kang', birthDate: '1945-01-17', gender: Gender.MALE, bloodType: 'B-' },
    { name: 'Eun-Bi Han', birthDate: '1993-11-22', gender: Gender.FEMALE, bloodType: 'A+' },
    { name: 'Tae-Hyung Shin', birthDate: '1980-07-09', gender: Gender.MALE, bloodType: 'O+' },
    { name: 'Yeon-Seo Lim', birthDate: '1965-03-30', gender: Gender.FEMALE, bloodType: 'B+' },
    { name: 'Joon-Ho Seo', birthDate: '1973-09-14', gender: Gender.MALE, bloodType: 'AB-' },
    { name: 'Su-Min Oh', birthDate: '1988-05-27', gender: Gender.FEMALE, bloodType: 'A+' },
    { name: 'Woo-Jin Hwang', birthDate: '1955-08-11', gender: Gender.MALE, bloodType: 'O+' },
    { name: 'Da-Hye Bae', birthDate: '1998-01-06', gender: Gender.FEMALE, bloodType: 'B+' },
    { name: 'Seung-Hwan Jo', birthDate: '1962-04-25', gender: Gender.MALE, bloodType: 'A-' },
    { name: 'Mi-Ra Song', birthDate: '1983-12-18', gender: Gender.FEMALE, bloodType: 'O-' },
    { name: 'In-Ho Yoo', birthDate: '1950-06-08', gender: Gender.MALE, bloodType: 'AB+' },
    { name: 'Bo-Young Jeon', birthDate: '1992-09-03', gender: Gender.FEMALE, bloodType: 'B-' },
    { name: 'Gi-Tae Moon', birthDate: '1977-02-14', gender: Gender.MALE, bloodType: 'A+' },
    { name: 'Na-Yeon Kwon', birthDate: '1986-10-31', gender: Gender.FEMALE, bloodType: 'O+' },
    { name: 'Chang-Min Ahn', birthDate: '1943-07-20', gender: Gender.MALE, bloodType: 'B+' },
    { name: 'Hye-Su Ryu', birthDate: '1995-04-12', gender: Gender.FEMALE, bloodType: 'AB+' },
    { name: 'Young-Ho Baek', birthDate: '1971-11-28', gender: Gender.MALE, bloodType: 'O-' },
    { name: 'Seo-Yun Im', birthDate: '1989-08-07', gender: Gender.FEMALE, bloodType: 'A+' },
    { name: 'Kyung-Ho Nam', birthDate: '1958-03-16', gender: Gender.MALE, bloodType: 'B-' },
  ];

  const allPatientIds: string[] = [];

  // Collect existing patient IDs
  const existingPatients = await prisma.patient.findMany({ select: { id: true } });
  allPatientIds.push(...existingPatients.map((p) => p.id));

  for (const p of additionalPatients) {
    const patientNumber = await generatePatientNumber();
    const patient = await prisma.patient.create({
      data: {
        patientNumber,
        name: p.name,
        birthDate: new Date(p.birthDate),
        gender: p.gender,
        bloodType: p.bloodType,
        phone: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        address: 'Seoul, Korea',
        emergencyContactName: 'Family Contact',
        emergencyContactPhone: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        emergencyContactRelation: 'Family',
        detail: {
          create: {
            insuranceType: 'National Health Insurance',
            insuranceCompany: 'NHI',
          },
        },
      },
    });
    allPatientIds.push(patient.id);
  }

  // =====================================================================
  // Seed Admissions, Vitals, Medications, and Notes
  // =====================================================================

  console.log('Creating admissions and clinical data...');

  // Get doctor and nurse IDs
  const doctor = await prisma.user.findFirst({ where: { username: 'doctor1' } });
  const nurse = await prisma.user.findFirst({ where: { username: 'nurse1' } });
  const headNurse = await prisma.user.findFirst({ where: { username: 'headnurse1' } });

  if (!doctor || !nurse || !headNurse) {
    throw new Error('Required users not found');
  }

  // Get available beds
  const availableBeds = await prisma.bed.findMany({
    where: { status: BedStatus.EMPTY, isActive: true },
    take: 15,
    include: { room: { include: { floor: true } } },
  });

  // Initialize admission sequence
  await prisma.admissionSequence.create({
    data: { year: currentYear, lastValue: 0 },
  });

  const generateAdmissionNumber = async (): Promise<string> => {
    const seq = await prisma.admissionSequence.update({
      where: { year: currentYear },
      data: { lastValue: { increment: 1 } },
    });
    return `A${currentYear}${String(seq.lastValue).padStart(6, '0')}`;
  };

  const diagnoses = [
    'Pneumonia',
    'Acute appendicitis',
    'Congestive heart failure',
    'Type 2 diabetes complications',
    'Hip fracture',
    'COPD exacerbation',
    'Acute kidney injury',
    'Cellulitis',
    'Deep vein thrombosis',
    'Urinary tract infection',
    'Stroke',
    'Myocardial infarction',
  ];

  // Create 12 active admissions
  const admissionIds: string[] = [];
  const admissionCount = Math.min(12, availableBeds.length, allPatientIds.length);

  for (let i = 0; i < admissionCount; i++) {
    const bed = availableBeds[i];
    const patientId = allPatientIds[i];
    const admissionNumber = await generateAdmissionNumber();
    const daysAgo = Math.floor(Math.random() * 7) + 1;
    const admissionDate = new Date();
    admissionDate.setDate(admissionDate.getDate() - daysAgo);

    const admission = await prisma.admission.create({
      data: {
        patientId,
        bedId: bed.id,
        admissionNumber,
        admissionDate,
        admissionTime: new Date(`1970-01-01T${String(8 + (i % 12)).padStart(2, '0')}:00:00.000Z`),
        admissionType: i % 3 === 0 ? AdmissionType.EMERGENCY : AdmissionType.SCHEDULED,
        diagnosis: diagnoses[i % diagnoses.length],
        chiefComplaint: `Patient presents with ${diagnoses[i % diagnoses.length].toLowerCase()} symptoms`,
        attendingDoctorId: doctor.id,
        primaryNurseId: nurse.id,
        status: AdmissionStatus.ACTIVE,
        createdBy: doctor.id,
      },
    });

    // Update bed to OCCUPIED
    await prisma.bed.update({
      where: { id: bed.id },
      data: { status: BedStatus.OCCUPIED, currentAdmissionId: admission.id },
    });

    admissionIds.push(admission.id);

    // Create vital signs for the past 3 days (every 4 hours)
    const vitalSignsData = [];
    for (let day = 0; day < Math.min(3, daysAgo); day++) {
      for (let hour = 0; hour < 24; hour += 4) {
        const measuredAt = new Date();
        measuredAt.setDate(measuredAt.getDate() - day);
        measuredAt.setHours(hour, 0, 0, 0);

        vitalSignsData.push({
          admissionId: admission.id,
          temperature: 36.0 + Math.random() * 2.0,
          systolicBp: 110 + Math.floor(Math.random() * 40),
          diastolicBp: 65 + Math.floor(Math.random() * 25),
          pulseRate: 60 + Math.floor(Math.random() * 40),
          respiratoryRate: 14 + Math.floor(Math.random() * 8),
          oxygenSaturation: 94 + Math.floor(Math.random() * 6),
          painScore: Math.floor(Math.random() * 5),
          consciousness: 'ALERT' as Consciousness,
          measuredAt,
          measuredBy: nurse.id,
          hasAlert: false,
        });
      }
    }

    if (vitalSignsData.length > 0) {
      await prisma.vitalSign.createMany({ data: vitalSignsData });
    }

    // Create medications (3-5 per admission)
    const medCount = 3 + Math.floor(Math.random() * 3);
    const meds = [
      { name: 'Amoxicillin 500mg', dosage: '500mg', route: MedicationRoute.PO, freq: 'TID' },
      { name: 'Metformin 500mg', dosage: '500mg', route: MedicationRoute.PO, freq: 'BID' },
      { name: 'Ceftriaxone 1g', dosage: '1g', route: MedicationRoute.IV, freq: 'Q24H' },
      { name: 'Omeprazole 20mg', dosage: '20mg', route: MedicationRoute.PO, freq: 'QD' },
      { name: 'Lisinopril 10mg', dosage: '10mg', route: MedicationRoute.PO, freq: 'QD' },
    ];

    for (let m = 0; m < medCount; m++) {
      const med = meds[m % meds.length];
      const status =
        m === 0
          ? MedicationStatus.ADMINISTERED
          : m === 1
            ? MedicationStatus.SCHEDULED
            : MedicationStatus.SCHEDULED;

      await prisma.medication.create({
        data: {
          admissionId: admission.id,
          medicationName: med.name,
          dosage: med.dosage,
          route: med.route,
          frequency: med.freq,
          scheduledTime: new Date(`1970-01-01T${String(8 + m * 4).padStart(2, '0')}:00:00.000Z`),
          status,
          administeredAt: status === MedicationStatus.ADMINISTERED ? new Date() : null,
          administeredBy: status === MedicationStatus.ADMINISTERED ? nurse.id : null,
          prescribedBy: doctor.id,
          startDate: admissionDate,
          pharmacyVerified: true,
        },
      });
    }

    // Create nursing notes (2 per admission)
    const noteTypes = [NoteType.ASSESSMENT, NoteType.PROGRESS];
    for (const noteType of noteTypes) {
      const recordedAt = new Date();
      recordedAt.setHours(recordedAt.getHours() - Math.floor(Math.random() * 24));

      await prisma.nursingNote.create({
        data: {
          admissionId: admission.id,
          noteType,
          subjective: 'Patient reports feeling improved.',
          objective: 'Vital signs stable. No acute distress.',
          assessment: `${diagnoses[i % diagnoses.length]} - ${noteType === NoteType.ASSESSMENT ? 'Initial assessment' : 'Progressing well'}`,
          plan: 'Continue current treatment plan. Monitor vitals Q4H.',
          recordedAt,
          recordedBy: nurse.id,
          isSignificant: noteType === NoteType.ASSESSMENT,
        },
      });
    }

    // Create intake/output records for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.intakeOutput.create({
      data: {
        admissionId: admission.id,
        recordDate: today,
        recordTime: new Date('1970-01-01T08:00:00.000Z'),
        oralIntake: 200 + Math.floor(Math.random() * 300),
        ivIntake: 100 + Math.floor(Math.random() * 200),
        urineOutput: 150 + Math.floor(Math.random() * 250),
        recordedBy: nurse.id,
      },
    });
  }

  // Set some additional beds to varied states
  const remainingBeds = await prisma.bed.findMany({
    where: { status: BedStatus.EMPTY, isActive: true },
    take: 4,
  });

  if (remainingBeds.length >= 2) {
    await prisma.bed.update({
      where: { id: remainingBeds[0].id },
      data: { status: BedStatus.RESERVED },
    });
    await prisma.bed.update({
      where: { id: remainingBeds[1].id },
      data: { status: BedStatus.MAINTENANCE, notes: 'Under maintenance - equipment check' },
    });
  }

  // =====================================================================
  // Seed Rounds
  // =====================================================================

  console.log('Creating rounds...');

  await prisma.roundSequence.create({
    data: { date: new Date(), lastValue: 0 },
  });

  // Create a completed morning round for the first floor
  if (admissionIds.length >= 4) {
    const morningRound = await prisma.round.create({
      data: {
        roundNumber: `R${currentYear}000001`,
        floorId: mainFloors[0].id,
        roundType: RoundType.MORNING,
        scheduledDate: new Date(),
        scheduledTime: new Date('1970-01-01T09:00:00.000Z'),
        startedAt: new Date(new Date().setHours(9, 0, 0, 0)),
        completedAt: new Date(new Date().setHours(10, 30, 0, 0)),
        status: RoundStatus.COMPLETED,
        leadDoctorId: doctor.id,
        notes: 'Morning round completed. All patients stable.',
        createdBy: doctor.id,
      },
    });

    // Create round records for first 4 admissions
    for (let r = 0; r < Math.min(4, admissionIds.length); r++) {
      await prisma.roundRecord.create({
        data: {
          roundId: morningRound.id,
          admissionId: admissionIds[r],
          visitOrder: r + 1,
          patientStatus: 'STABLE',
          observation: 'Patient resting comfortably. Vitals within normal limits.',
          assessment: 'Condition stable. Responding to treatment.',
          plan: 'Continue current management.',
          visitedAt: new Date(new Date().setHours(9, 15 + r * 15, 0, 0)),
          visitDuration: 10 + Math.floor(Math.random() * 10),
          recordedBy: doctor.id,
        },
      });
    }

    // Create a planned afternoon round
    await prisma.round.create({
      data: {
        roundNumber: `R${currentYear}000002`,
        floorId: mainFloors[0].id,
        roundType: RoundType.AFTERNOON,
        scheduledDate: new Date(),
        scheduledTime: new Date('1970-01-01T14:00:00.000Z'),
        status: RoundStatus.PLANNED,
        leadDoctorId: doctor.id,
        createdBy: doctor.id,
      },
    });
  }

  // =====================================================================
  // Seed Login History
  // =====================================================================

  console.log('Creating audit data...');

  const auditUsers = [adminUser, doctor, nurse, headNurse];
  for (const user of auditUsers) {
    // Successful login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        username: user.username,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        deviceType: 'PC',
        browser: 'Chrome',
        os: 'Windows 10',
        success: true,
      },
    });
  }

  // Failed login attempt
  await prisma.loginHistory.create({
    data: {
      userId: null,
      username: 'unknown_user',
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0',
      success: false,
      failureReason: 'Invalid credentials',
    },
  });

  // Print summary
  const userCount = await prisma.user.count();
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();
  const buildingCount = await prisma.building.count();
  const floorCount = await prisma.floor.count();
  const roomCount = await prisma.room.count();
  const bedCount = await prisma.bed.count();
  const patientCount = await prisma.patient.count();
  const admissionSeedCount = await prisma.admission.count();
  const vitalSignCount = await prisma.vitalSign.count();
  const medicationCount = await prisma.medication.count();
  const nursingNoteCount = await prisma.nursingNote.count();
  const roundCount = await prisma.round.count();

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
  console.log('  Clinical:');
  console.log(`    Patients: ${patientCount}`);
  console.log(`    Admissions: ${admissionSeedCount}`);
  console.log(`    Vital Signs: ${vitalSignCount}`);
  console.log(`    Medications: ${medicationCount}`);
  console.log(`    Nursing Notes: ${nursingNoteCount}`);
  console.log(`    Rounds: ${roundCount}`);
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
