import { faker } from '@faker-js/faker';
import { Building, Floor, Room, Bed, RoomType, BedStatus } from '@prisma/client';

export interface RoomWithBeds extends Room {
  beds: Bed[];
}

export interface FloorWithRooms extends Floor {
  rooms: RoomWithBeds[];
}

export function createTestBuilding(overrides?: Partial<Building>): Building {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    code: `BLD-${faker.string.alphanumeric(3).toUpperCase()}`,
    name: `${faker.location.buildingNumber()} Building`,
    address: faker.location.streetAddress(true),
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestFloor(buildingId: string, overrides?: Partial<Floor>): Floor {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    buildingId,
    floorNumber: faker.number.int({ min: 1, max: 10 }),
    name: `${faker.number.int({ min: 1, max: 10 })}F`,
    department: faker.helpers.arrayElement([
      'Internal Medicine',
      'Surgery',
      'Orthopedics',
      'Cardiology',
      'Neurology',
    ]),
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestRoom(floorId: string, overrides?: Partial<Room>): Room {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    floorId,
    roomNumber: `${faker.number.int({ min: 100, max: 999 })}`,
    name: null,
    roomType: faker.helpers.arrayElement([
      'WARD',
      'ICU',
      'ISOLATION',
      'VIP',
      'EMERGENCY',
    ] as RoomType[]),
    bedCount: faker.number.int({ min: 1, max: 6 }),
    isActive: true,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestBed(roomId: string, overrides?: Partial<Bed>): Bed {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    roomId,
    bedNumber: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E', 'F']),
    status: 'EMPTY' as BedStatus,
    currentAdmissionId: null,
    notes: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createEmptyBed(roomId: string, overrides?: Partial<Bed>): Bed {
  return createTestBed(roomId, {
    status: 'EMPTY' as BedStatus,
    currentAdmissionId: null,
    ...overrides,
  });
}

export function createOccupiedBed(
  roomId: string,
  admissionId: string,
  overrides?: Partial<Bed>,
): Bed {
  return createTestBed(roomId, {
    status: 'OCCUPIED' as BedStatus,
    currentAdmissionId: admissionId,
    ...overrides,
  });
}

export function createReservedBed(roomId: string, overrides?: Partial<Bed>): Bed {
  return createTestBed(roomId, {
    status: 'RESERVED' as BedStatus,
    ...overrides,
  });
}

export function createMaintenanceBed(roomId: string, overrides?: Partial<Bed>): Bed {
  return createTestBed(roomId, {
    status: 'MAINTENANCE' as BedStatus,
    notes: 'Under maintenance',
    ...overrides,
  });
}

export function createRoomWithBeds(
  floorId: string,
  bedCount: number = 4,
  roomOverrides?: Partial<Room>,
): RoomWithBeds {
  const room = createTestRoom(floorId, { bedCount, ...roomOverrides });
  const beds: Bed[] = [];
  const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (let i = 0; i < bedCount; i++) {
    beds.push(createTestBed(room.id, { bedNumber: bedLabels[i] }));
  }

  return { ...room, beds };
}
