import { PrismaClient, RoomType, BedStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();

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

  // Print summary
  const buildingCount = await prisma.building.count();
  const floorCount = await prisma.floor.count();
  const roomCount = await prisma.room.count();
  const bedCount = await prisma.bed.count();

  console.log('\nSeed completed successfully!');
  console.log('Summary:');
  console.log(`  Buildings: ${buildingCount}`);
  console.log(`  Floors: ${floorCount}`);
  console.log(`  Rooms: ${roomCount}`);
  console.log(`  Beds: ${bedCount}`);
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
