import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionStatus } from '@prisma/client';
import { IntakeOutputService } from '../intake-output.service';
import { IntakeOutputRepository, DailyIOAggregate } from '../intake-output.repository';
import { PrismaService } from '../../../prisma';
import {
  createTestIntakeOutput,
  createNormalIntakeOutput,
  createTestAdmission,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';
import { AdmissionNotFoundException, AdmissionNotActiveException } from '../exceptions';

describe('IntakeOutputService', () => {
  let service: IntakeOutputService;
  let ioRepo: jest.Mocked<IntakeOutputRepository>;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const mockIORepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByAdmission: jest.fn(),
    findByDate: jest.fn(),
    getDailyAggregates: jest.fn(),
    getDailySummary: jest.fn(),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntakeOutputService,
        { provide: IntakeOutputRepository, useValue: mockIORepo },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<IntakeOutputService>(IntakeOutputService);
    ioRepo = module.get(IntakeOutputRepository);

    jest.clearAllMocks();
  });

  describe('record', () => {
    const userId = 'user-id';
    const admissionId = 'admission-id';
    const dto = {
      recordDate: '2024-01-15',
      recordTime: '2024-01-15T10:30:00Z',
      oralIntake: 500,
      ivIntake: 1000,
      tubeFeeding: 0,
      otherIntake: 0,
      urineOutput: 800,
      stoolOutput: 200,
      vomitOutput: 0,
      drainageOutput: 0,
      otherOutput: 0,
      notes: 'Normal intake',
    };

    it('should record intake/output successfully', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const ioRecord = createNormalIntakeOutput(admissionId);

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.create.mockResolvedValue(ioRecord);

      const result = await service.record(admissionId, dto, userId);

      expect(result.admissionId).toBe(admissionId);
      expect(result.totalIntake).toBe(
        ioRecord.oralIntake + ioRecord.ivIntake + ioRecord.tubeFeeding + ioRecord.otherIntake,
      );
      expect(result.totalOutput).toBe(
        ioRecord.urineOutput +
          ioRecord.stoolOutput +
          ioRecord.vomitOutput +
          ioRecord.drainageOutput +
          ioRecord.otherOutput,
      );
      expect(result.balance).toBe(result.totalIntake - result.totalOutput);
      expect(mockIORepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          admissionId,
          recordedBy: userId,
          oralIntake: dto.oralIntake,
          ivIntake: dto.ivIntake,
        }),
      );
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.record(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });

    it('should throw when admission not active', async () => {
      const dischargedAdmission = createTestAdmission({
        id: admissionId,
        status: 'DISCHARGED' as AdmissionStatus,
      });
      prismaService.admission.findUnique.mockResolvedValue(dischargedAdmission);

      await expect(service.record(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotActiveException,
      );
    });

    it('should default optional intake/output values to 0', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const minimalDto = {
        recordDate: '2024-01-15',
        recordTime: '2024-01-15T10:30:00Z',
      };
      const ioRecord = createTestIntakeOutput({
        admissionId,
        oralIntake: 0,
        ivIntake: 0,
        tubeFeeding: 0,
        otherIntake: 0,
        urineOutput: 0,
        stoolOutput: 0,
        vomitOutput: 0,
        drainageOutput: 0,
        otherOutput: 0,
      });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.create.mockResolvedValue(ioRecord);

      await service.record(admissionId, minimalDto, userId);

      expect(mockIORepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oralIntake: 0,
          ivIntake: 0,
          tubeFeeding: 0,
          otherIntake: 0,
          urineOutput: 0,
          stoolOutput: 0,
          vomitOutput: 0,
          drainageOutput: 0,
          otherOutput: 0,
        }),
      );
    });
  });

  describe('getHistory', () => {
    const admissionId = 'admission-id';
    const dto = {
      page: 1,
      limit: 20,
    };

    it('should return history with pagination', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const ioRecords = [
        createNormalIntakeOutput(admissionId),
        createNormalIntakeOutput(admissionId),
      ];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.findByAdmission.mockResolvedValue({
        data: ioRecords,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getHistory(admissionId, dto);

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter by date range', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.findByAdmission.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.getHistory(admissionId, {
        ...dto,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(mockIORepo.findByAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      );
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getHistory(admissionId, dto)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });

  describe('getDailySummary', () => {
    const admissionId = 'admission-id';
    const date = new Date('2024-01-15');

    it('should return daily summary with correct calculations', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const aggregate: DailyIOAggregate = {
        recordDate: date,
        oralIntake: 500,
        ivIntake: 1000,
        tubeFeeding: 200,
        otherIntake: 100,
        urineOutput: 800,
        stoolOutput: 200,
        vomitOutput: 50,
        drainageOutput: 50,
        otherOutput: 0,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailySummary.mockResolvedValue(aggregate);

      const result = await service.getDailySummary(admissionId, date);

      expect(result).not.toBeNull();
      expect(result!.intake.oral).toBe(500);
      expect(result!.intake.iv).toBe(1000);
      expect(result!.intake.tubeFeeding).toBe(200);
      expect(result!.intake.other).toBe(100);
      expect(result!.intake.total).toBe(1800);
      expect(result!.output.urine).toBe(800);
      expect(result!.output.stool).toBe(200);
      expect(result!.output.vomit).toBe(50);
      expect(result!.output.drainage).toBe(50);
      expect(result!.output.other).toBe(0);
      expect(result!.output.total).toBe(1100);
      expect(result!.balance).toBe(700);
      expect(result!.status).toBe('POSITIVE');
    });

    it('should return null when no records for date', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailySummary.mockResolvedValue(null);

      const result = await service.getDailySummary(admissionId, date);

      expect(result).toBeNull();
    });

    it('should return NORMAL status for balanced intake/output', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const aggregate: DailyIOAggregate = {
        recordDate: date,
        oralIntake: 500,
        ivIntake: 500,
        tubeFeeding: 0,
        otherIntake: 0,
        urineOutput: 700,
        stoolOutput: 200,
        vomitOutput: 0,
        drainageOutput: 0,
        otherOutput: 0,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailySummary.mockResolvedValue(aggregate);

      const result = await service.getDailySummary(admissionId, date);

      expect(result!.balance).toBe(100);
      expect(result!.status).toBe('NORMAL');
    });

    it('should return NEGATIVE status for high output', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const aggregate: DailyIOAggregate = {
        recordDate: date,
        oralIntake: 300,
        ivIntake: 200,
        tubeFeeding: 0,
        otherIntake: 0,
        urineOutput: 1000,
        stoolOutput: 200,
        vomitOutput: 100,
        drainageOutput: 0,
        otherOutput: 0,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailySummary.mockResolvedValue(aggregate);

      const result = await service.getDailySummary(admissionId, date);

      expect(result!.balance).toBe(-800);
      expect(result!.status).toBe('NEGATIVE');
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getDailySummary(admissionId, date)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });

  describe('getBalanceHistory', () => {
    const admissionId = 'admission-id';
    const dto = {
      startDate: '2024-01-01',
      endDate: '2024-01-07',
    };

    it('should return balance history for date range', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const aggregates: DailyIOAggregate[] = [
        {
          recordDate: new Date('2024-01-01'),
          oralIntake: 500,
          ivIntake: 1000,
          tubeFeeding: 0,
          otherIntake: 0,
          urineOutput: 800,
          stoolOutput: 200,
          vomitOutput: 0,
          drainageOutput: 0,
          otherOutput: 0,
        },
        {
          recordDate: new Date('2024-01-02'),
          oralIntake: 600,
          ivIntake: 800,
          tubeFeeding: 0,
          otherIntake: 0,
          urineOutput: 1500,
          stoolOutput: 300,
          vomitOutput: 100,
          drainageOutput: 0,
          otherOutput: 0,
        },
      ];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailyAggregates.mockResolvedValue(aggregates);

      const result = await service.getBalanceHistory(admissionId, dto);

      expect(result.length).toBe(2);
      expect(result[0].totalIntake).toBe(1500);
      expect(result[0].totalOutput).toBe(1000);
      expect(result[0].balance).toBe(500);
      expect(result[0].status).toBe('NORMAL');
      expect(result[1].totalIntake).toBe(1400);
      expect(result[1].totalOutput).toBe(1900);
      expect(result[1].balance).toBe(-500);
      expect(result[1].status).toBe('NORMAL');
    });

    it('should return empty array when no records in range', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailyAggregates.mockResolvedValue([]);

      const result = await service.getBalanceHistory(admissionId, dto);

      expect(result).toEqual([]);
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getBalanceHistory(admissionId, dto)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });

  describe('balance status calculation', () => {
    const admissionId = 'admission-id';
    const date = new Date('2024-01-15');

    it('should return POSITIVE when balance > 500', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const aggregate: DailyIOAggregate = {
        recordDate: date,
        oralIntake: 1000,
        ivIntake: 1000,
        tubeFeeding: 0,
        otherIntake: 0,
        urineOutput: 500,
        stoolOutput: 0,
        vomitOutput: 0,
        drainageOutput: 0,
        otherOutput: 0,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailySummary.mockResolvedValue(aggregate);

      const result = await service.getDailySummary(admissionId, date);

      expect(result!.balance).toBe(1500);
      expect(result!.status).toBe('POSITIVE');
    });

    it('should return NEGATIVE when balance < -500', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const aggregate: DailyIOAggregate = {
        recordDate: date,
        oralIntake: 300,
        ivIntake: 200,
        tubeFeeding: 0,
        otherIntake: 0,
        urineOutput: 1200,
        stoolOutput: 300,
        vomitOutput: 100,
        drainageOutput: 0,
        otherOutput: 0,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailySummary.mockResolvedValue(aggregate);

      const result = await service.getDailySummary(admissionId, date);

      expect(result!.balance).toBe(-1100);
      expect(result!.status).toBe('NEGATIVE');
    });

    it('should return NORMAL when -500 <= balance <= 500', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const aggregate: DailyIOAggregate = {
        recordDate: date,
        oralIntake: 1000,
        ivIntake: 500,
        tubeFeeding: 0,
        otherIntake: 0,
        urineOutput: 1200,
        stoolOutput: 200,
        vomitOutput: 0,
        drainageOutput: 0,
        otherOutput: 0,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockIORepo.getDailySummary.mockResolvedValue(aggregate);

      const result = await service.getDailySummary(admissionId, date);

      expect(result!.balance).toBe(100);
      expect(result!.status).toBe('NORMAL');
    });
  });
});
