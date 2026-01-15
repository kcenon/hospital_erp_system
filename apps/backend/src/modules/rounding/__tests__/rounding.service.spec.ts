import { Test, TestingModule } from '@nestjs/testing';
import { RoundingService } from '../rounding.service';
import { RoundingRepository, RoundWithRecords } from '../rounding.repository';
import { PrismaService } from '../../../prisma';
import { RoundStatus, RoundType } from '@prisma/client';
import {
  RoundNotFoundException,
  RoundNotInProgressException,
  FloorNotFoundException,
  RoundRecordAlreadyExistsException,
} from '../exceptions';
import { createMockPrismaService } from '../../../../test/utils';

describe('RoundingService', () => {
  let service: RoundingService;
  let repository: jest.Mocked<RoundingRepository>;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByRoundNumber: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    createRecord: jest.fn(),
    findRecordById: jest.fn(),
    findRecordByRoundAndAdmission: jest.fn(),
    findRecordsByRound: jest.fn(),
    updateRecord: jest.fn(),
    getNextVisitOrder: jest.fn(),
    getNextRoundNumber: jest.fn(),
  };

  const createTestRound = (overrides: Partial<RoundWithRecords> = {}): RoundWithRecords => ({
    id: 'round-id',
    roundNumber: 'R2024011501',
    floorId: 'floor-id',
    roundType: RoundType.MORNING,
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: null,
    startedAt: null,
    completedAt: null,
    pausedAt: null,
    status: RoundStatus.PLANNED,
    leadDoctorId: 'doctor-id',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-id',
    records: [],
    ...overrides,
  });

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundingService,
        { provide: RoundingRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<RoundingService>(RoundingService);
    repository = module.get(RoundingRepository);

    jest.clearAllMocks();
  });

  describe('createSession', () => {
    const userId = 'user-id';
    const dto = {
      floorId: 'floor-id',
      roundType: RoundType.MORNING,
      scheduledDate: '2024-01-15',
      leadDoctorId: 'doctor-id',
    };

    it('should create a new rounding session', async () => {
      const floor = { id: 'floor-id', name: '3F Internal Medicine' };
      const round = createTestRound();

      prismaService.floor.findUnique.mockResolvedValue(floor);
      mockRepository.getNextRoundNumber.mockResolvedValue('R2024011501');
      mockRepository.create.mockResolvedValue(round);
      mockRepository.findById.mockResolvedValue(round);

      const result = await service.createSession(dto, userId);

      expect(result.roundNumber).toBe('R2024011501');
      expect(result.status).toBe(RoundStatus.PLANNED);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw when floor not found', async () => {
      prismaService.floor.findUnique.mockResolvedValue(null);

      await expect(service.createSession(dto, userId)).rejects.toThrow(FloorNotFoundException);
    });
  });

  describe('startSession', () => {
    it('should start a planned session', async () => {
      const round = createTestRound({ status: RoundStatus.PLANNED });
      const startedRound = createTestRound({
        status: RoundStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      mockRepository.findById.mockResolvedValueOnce(round);
      mockRepository.update.mockResolvedValue(startedRound);
      mockRepository.findById.mockResolvedValueOnce(startedRound);

      const result = await service.startSession('round-id');

      expect(result.status).toBe(RoundStatus.IN_PROGRESS);
      expect(mockRepository.update).toHaveBeenCalledWith('round-id', {
        status: RoundStatus.IN_PROGRESS,
        startedAt: expect.any(Date),
        pausedAt: null,
      });
    });

    it('should throw when round not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.startSession('nonexistent')).rejects.toThrow(RoundNotFoundException);
    });

    it('should throw for invalid state transition', async () => {
      const completedRound = createTestRound({ status: RoundStatus.COMPLETED });
      mockRepository.findById.mockResolvedValue(completedRound);

      await expect(service.startSession('round-id')).rejects.toThrow();
    });
  });

  describe('pauseSession', () => {
    it('should pause an in-progress session', async () => {
      const round = createTestRound({ status: RoundStatus.IN_PROGRESS });
      const pausedRound = createTestRound({
        status: RoundStatus.PAUSED,
        pausedAt: new Date(),
      });

      mockRepository.findById.mockResolvedValueOnce(round);
      mockRepository.update.mockResolvedValue(pausedRound);
      mockRepository.findById.mockResolvedValueOnce(pausedRound);

      const result = await service.pauseSession('round-id');

      expect(result.status).toBe(RoundStatus.PAUSED);
    });
  });

  describe('resumeSession', () => {
    it('should resume a paused session', async () => {
      const round = createTestRound({
        status: RoundStatus.PAUSED,
        pausedAt: new Date(),
      });
      const resumedRound = createTestRound({
        status: RoundStatus.IN_PROGRESS,
        pausedAt: null,
      });

      mockRepository.findById.mockResolvedValueOnce(round);
      mockRepository.update.mockResolvedValue(resumedRound);
      mockRepository.findById.mockResolvedValueOnce(resumedRound);

      const result = await service.resumeSession('round-id');

      expect(result.status).toBe(RoundStatus.IN_PROGRESS);
    });
  });

  describe('completeSession', () => {
    it('should complete an in-progress session', async () => {
      const round = createTestRound({ status: RoundStatus.IN_PROGRESS });
      const completedRound = createTestRound({
        status: RoundStatus.COMPLETED,
        completedAt: new Date(),
      });

      mockRepository.findById.mockResolvedValueOnce(round);
      mockRepository.update.mockResolvedValue(completedRound);
      mockRepository.findById.mockResolvedValueOnce(completedRound);

      const result = await service.completeSession('round-id');

      expect(result.status).toBe(RoundStatus.COMPLETED);
    });
  });

  describe('cancelSession', () => {
    it('should cancel a planned session', async () => {
      const round = createTestRound({ status: RoundStatus.PLANNED });
      const cancelledRound = createTestRound({ status: RoundStatus.CANCELLED });

      mockRepository.findById.mockResolvedValueOnce(round);
      mockRepository.update.mockResolvedValue(cancelledRound);
      mockRepository.findById.mockResolvedValueOnce(cancelledRound);

      const result = await service.cancelSession('round-id');

      expect(result.status).toBe(RoundStatus.CANCELLED);
    });
  });

  describe('findById', () => {
    it('should return round by ID', async () => {
      const round = createTestRound();
      mockRepository.findById.mockResolvedValue(round);

      const result = await service.findById('round-id');

      expect(result.id).toBe('round-id');
    });

    it('should throw when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(RoundNotFoundException);
    });
  });

  describe('addRecord', () => {
    const userId = 'user-id';
    const dto = {
      admissionId: 'admission-id',
      patientStatus: 'STABLE' as const,
      observation: 'Patient is stable',
    };

    it('should add a record to an in-progress round', async () => {
      const round = createTestRound({ status: RoundStatus.IN_PROGRESS });
      const record = {
        id: 'record-id',
        roundId: 'round-id',
        admissionId: 'admission-id',
        visitOrder: 1,
        patientStatus: 'STABLE',
        chiefComplaint: null,
        observation: 'Patient is stable',
        assessment: null,
        plan: null,
        orders: null,
        visitedAt: new Date(),
        visitDuration: null,
        recordedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(round);
      mockRepository.findRecordByRoundAndAdmission.mockResolvedValue(null);
      mockRepository.getNextVisitOrder.mockResolvedValue(1);
      mockRepository.createRecord.mockResolvedValue(record);

      const result = await service.addRecord('round-id', dto, userId);

      expect(result.observation).toBe('Patient is stable');
      expect(mockRepository.createRecord).toHaveBeenCalled();
    });

    it('should throw when round not in progress', async () => {
      const round = createTestRound({ status: RoundStatus.PLANNED });
      mockRepository.findById.mockResolvedValue(round);

      await expect(service.addRecord('round-id', dto, userId)).rejects.toThrow(
        RoundNotInProgressException,
      );
    });

    it('should throw when record already exists', async () => {
      const round = createTestRound({ status: RoundStatus.IN_PROGRESS });
      const existingRecord = { id: 'existing-record', admissionId: 'admission-id' };

      mockRepository.findById.mockResolvedValue(round);
      mockRepository.findRecordByRoundAndAdmission.mockResolvedValue(existingRecord);

      await expect(service.addRecord('round-id', dto, userId)).rejects.toThrow(
        RoundRecordAlreadyExistsException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated rounds', async () => {
      const rounds = [createTestRound(), createTestRound({ id: 'round-id-2' })];
      mockRepository.findAll.mockResolvedValue({
        data: rounds,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.findAll({ status: RoundStatus.IN_PROGRESS, page: 1, limit: 20 });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RoundStatus.IN_PROGRESS,
        }),
      );
    });
  });
});
