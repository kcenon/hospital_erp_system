/**
 * Mock Repository Factory
 * Creates mock repositories for testing purposes
 */
export interface MockRepository<T = unknown> {
  create: jest.Mock<Promise<T>, [Partial<T>]>;
  findById: jest.Mock<Promise<T | null>, [string]>;
  findOne: jest.Mock<Promise<T | null>, [Partial<T>]>;
  findAll: jest.Mock<Promise<T[]>, [Partial<T>?]>;
  update: jest.Mock<Promise<T>, [string, Partial<T>]>;
  delete: jest.Mock<Promise<void>, [string]>;
  softDelete: jest.Mock<Promise<void>, [string]>;
  count: jest.Mock<Promise<number>, [Partial<T>?]>;
}

export function createMockRepository<T = unknown>(): MockRepository<T> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };
}

/**
 * Mock Prisma Service Factory
 * Creates a mock PrismaService for testing
 */
export interface MockPrismaModel<T = unknown> {
  create: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  upsert: jest.Mock;
}

export function createMockPrismaModel<T = unknown>(): MockPrismaModel<T> {
  return {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  };
}

export interface MockPrismaService {
  user: MockPrismaModel;
  role: MockPrismaModel;
  permission: MockPrismaModel;
  userRole: MockPrismaModel;
  rolePermission: MockPrismaModel;
  patient: MockPrismaModel;
  patientDetail: MockPrismaModel;
  patientSequence: MockPrismaModel;
  admission: MockPrismaModel;
  transfer: MockPrismaModel;
  discharge: MockPrismaModel;
  building: MockPrismaModel;
  floor: MockPrismaModel;
  room: MockPrismaModel;
  bed: MockPrismaModel;
  vitalSign: MockPrismaModel;
  intakeOutput: MockPrismaModel;
  medication: MockPrismaModel;
  nursingNote: MockPrismaModel;
  dailyReport: MockPrismaModel;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
}

export function createMockPrismaService(): MockPrismaService {
  return {
    user: createMockPrismaModel(),
    role: createMockPrismaModel(),
    permission: createMockPrismaModel(),
    userRole: createMockPrismaModel(),
    rolePermission: createMockPrismaModel(),
    patient: createMockPrismaModel(),
    patientDetail: createMockPrismaModel(),
    patientSequence: createMockPrismaModel(),
    admission: createMockPrismaModel(),
    transfer: createMockPrismaModel(),
    discharge: createMockPrismaModel(),
    building: createMockPrismaModel(),
    floor: createMockPrismaModel(),
    room: createMockPrismaModel(),
    bed: createMockPrismaModel(),
    vitalSign: createMockPrismaModel(),
    intakeOutput: createMockPrismaModel(),
    medication: createMockPrismaModel(),
    nursingNote: createMockPrismaModel(),
    dailyReport: createMockPrismaModel(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((callback) => callback(createMockPrismaService())),
  };
}
