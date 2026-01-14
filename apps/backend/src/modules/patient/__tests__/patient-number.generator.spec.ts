import { Test, TestingModule } from '@nestjs/testing';
import { PatientNumberGenerator } from '../patient-number.generator';
import { PrismaService } from '../../../prisma';
import { createMockPrismaService } from '../../../../test/utils';

describe('PatientNumberGenerator', () => {
  let generator: PatientNumberGenerator;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientNumberGenerator, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    generator = module.get<PatientNumberGenerator>(PatientNumberGenerator);

    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate unique patient number', async () => {
      const currentYear = new Date().getFullYear();
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          patientSequence: {
            findUnique: jest.fn().mockResolvedValue({
              id: 1,
              year: currentYear,
              lastValue: 5,
            }),
            update: jest.fn().mockResolvedValue({
              id: 1,
              year: currentYear,
              lastValue: 6,
            }),
          },
        };
        return callback(tx);
      });
      prismaService.$transaction = mockTransaction;

      const result = await generator.generate();

      expect(result).toBe(`P${currentYear}000006`);
    });

    it('should create new sequence for new year', async () => {
      const currentYear = new Date().getFullYear();
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          patientSequence: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 1,
              year: currentYear,
              lastValue: 1,
            }),
          },
        };
        return callback(tx);
      });
      prismaService.$transaction = mockTransaction;

      const result = await generator.generate();

      expect(result).toBe(`P${currentYear}000001`);
    });

    it('should pad sequence number to 6 digits', async () => {
      const currentYear = new Date().getFullYear();
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          patientSequence: {
            findUnique: jest.fn().mockResolvedValue({
              id: 1,
              year: currentYear,
              lastValue: 99,
            }),
            update: jest.fn().mockResolvedValue({
              id: 1,
              year: currentYear,
              lastValue: 100,
            }),
          },
        };
        return callback(tx);
      });
      prismaService.$transaction = mockTransaction;

      const result = await generator.generate();

      expect(result).toBe(`P${currentYear}000100`);
    });
  });

  describe('parsePatientNumber', () => {
    it('should parse valid patient number', () => {
      const result = generator.parsePatientNumber('P2024000123');

      expect(result).toEqual({
        year: 2024,
        sequence: 123,
      });
    });

    it('should return null for invalid format', () => {
      const result = generator.parsePatientNumber('INVALID');

      expect(result).toBeNull();
    });

    it('should return null for wrong length', () => {
      const result = generator.parsePatientNumber('P20241');

      expect(result).toBeNull();
    });

    it('should parse patient number with leading zeros', () => {
      const result = generator.parsePatientNumber('P2024000001');

      expect(result).toEqual({
        year: 2024,
        sequence: 1,
      });
    });
  });
});
