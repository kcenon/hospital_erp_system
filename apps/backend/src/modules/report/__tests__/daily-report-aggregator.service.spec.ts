import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionStatus, PatientStatus, MedicationStatus } from '@prisma/client';
import { DailyReportAggregatorService } from '../daily-report-aggregator.service';
import { VitalSignRepository } from '../vital-sign.repository';
import { IntakeOutputRepository } from '../intake-output.repository';
import { MedicationRepository } from '../medication.repository';
import { NursingNoteRepository } from '../nursing-note.repository';
import { DailyReportRepository } from '../daily-report.repository';
import { PrismaService } from '../../../prisma';
import { createMockPrismaService } from '../../../../test/utils';
import { AdmissionNotFoundException } from '../exceptions';

describe('DailyReportAggregatorService', () => {
  let service: DailyReportAggregatorService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const mockVitalRepo = {
    findByDateRange: jest.fn(),
  };

  const mockIoRepo = {
    getDailySummary: jest.fn(),
  };

  const mockMedicationRepo = {
    findByAdmission: jest.fn(),
  };

  const mockNoteRepo = {
    findSignificant: jest.fn(),
  };

  const mockDailyReportRepo = {
    upsert: jest.fn(),
    findByAdmissionAndDate: jest.fn(),
    findByAdmission: jest.fn(),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyReportAggregatorService,
        { provide: VitalSignRepository, useValue: mockVitalRepo },
        { provide: IntakeOutputRepository, useValue: mockIoRepo },
        { provide: MedicationRepository, useValue: mockMedicationRepo },
        { provide: NursingNoteRepository, useValue: mockNoteRepo },
        { provide: DailyReportRepository, useValue: mockDailyReportRepo },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<DailyReportAggregatorService>(DailyReportAggregatorService);

    jest.clearAllMocks();
  });

  describe('generateDailySummary', () => {
    const admissionId = 'admission-id';
    const date = new Date('2024-01-15');

    it('should generate summary with all data', async () => {
      const admission = {
        id: admissionId,
        status: AdmissionStatus.ACTIVE,
      };

      const vitals = [
        {
          id: 'vital-1',
          admissionId,
          temperature: { toNumber: () => 36.5 },
          systolicBp: 120,
          diastolicBp: 80,
          pulseRate: 72,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          bloodGlucose: null,
          painScore: null,
          consciousness: null,
          measuredAt: new Date('2024-01-15T08:00:00Z'),
          hasAlert: false,
        },
      ];

      const ioSummary = {
        oralIntake: 1000,
        ivIntake: 500,
        tubeFeeding: 0,
        otherIntake: 0,
        urineOutput: 800,
        stoolOutput: 100,
        vomitOutput: 0,
        drainageOutput: 0,
        otherOutput: 0,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findByDateRange.mockResolvedValue(vitals);
      mockIoRepo.getDailySummary.mockResolvedValue(ioSummary);
      prismaService.medication.findMany.mockResolvedValue([
        { status: MedicationStatus.ADMINISTERED },
        { status: MedicationStatus.SCHEDULED },
      ]);
      mockNoteRepo.findSignificant.mockResolvedValue([]);

      const result = await service.generateDailySummary(admissionId, date);

      expect(result.admissionId).toBe(admissionId);
      expect(result.vitalsSummary).not.toBeNull();
      expect(result.vitalsSummary?.measurementCount).toBe(1);
      expect(result.ioBalance).not.toBeNull();
      expect(result.ioBalance?.intake.total).toBe(1500);
      expect(result.ioBalance?.output.total).toBe(900);
      expect(result.ioBalance?.balance).toBe(600);
      expect(result.medicationCompliance.administered).toBe(1);
      expect(result.medicationCompliance.scheduled).toBe(2);
    });

    it('should return null vitals summary when no vitals', async () => {
      const admission = {
        id: admissionId,
        status: AdmissionStatus.ACTIVE,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findByDateRange.mockResolvedValue([]);
      mockIoRepo.getDailySummary.mockResolvedValue(null);
      prismaService.medication.findMany.mockResolvedValue([]);
      mockNoteRepo.findSignificant.mockResolvedValue([]);

      const result = await service.generateDailySummary(admissionId, date);

      expect(result.vitalsSummary).toBeNull();
      expect(result.ioBalance).toBeNull();
    });

    it('should detect critical patient status with critical alerts', async () => {
      const admission = {
        id: admissionId,
        status: AdmissionStatus.ACTIVE,
      };

      const vitals = [
        {
          id: 'vital-1',
          admissionId,
          temperature: { toNumber: () => 40.5 },
          systolicBp: 180,
          diastolicBp: 120,
          pulseRate: 150,
          respiratoryRate: 30,
          oxygenSaturation: 85,
          bloodGlucose: null,
          painScore: null,
          consciousness: null,
          measuredAt: new Date('2024-01-15T08:00:00Z'),
          hasAlert: true,
        },
      ];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findByDateRange.mockResolvedValue(vitals);
      mockIoRepo.getDailySummary.mockResolvedValue(null);
      prismaService.medication.findMany.mockResolvedValue([]);
      mockNoteRepo.findSignificant.mockResolvedValue([]);

      const result = await service.generateDailySummary(admissionId, date);

      expect(result.patientStatus).toBe(PatientStatus.CRITICAL);
      expect(result.alerts.length).toBeGreaterThan(0);
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.generateDailySummary(admissionId, date)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });

  describe('saveReport', () => {
    const admissionId = 'admission-id';
    const date = new Date('2024-01-15');
    const userId = 'user-id';

    it('should save report successfully', async () => {
      const admission = {
        id: admissionId,
        status: AdmissionStatus.ACTIVE,
      };

      const savedReport = {
        id: 'report-id',
        admissionId,
        reportDate: date,
        vitalsSummary: null,
        totalIntake: null,
        totalOutput: null,
        ioBalance: null,
        medicationsGiven: 0,
        medicationsHeld: 0,
        patientStatus: null,
        summary: null,
        alerts: null,
        generatedAt: new Date(),
        generatedBy: userId,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findByDateRange.mockResolvedValue([]);
      mockIoRepo.getDailySummary.mockResolvedValue(null);
      prismaService.medication.findMany.mockResolvedValue([]);
      mockNoteRepo.findSignificant.mockResolvedValue([]);
      mockDailyReportRepo.upsert.mockResolvedValue(savedReport);

      const result = await service.saveReport(admissionId, date, userId);

      expect(result.id).toBe('report-id');
      expect(result.admissionId).toBe(admissionId);
      expect(mockDailyReportRepo.upsert).toHaveBeenCalled();
    });
  });

  describe('getReport', () => {
    const admissionId = 'admission-id';
    const date = new Date('2024-01-15');

    it('should return existing report', async () => {
      const admission = {
        id: admissionId,
        status: AdmissionStatus.ACTIVE,
      };

      const report = {
        id: 'report-id',
        admissionId,
        reportDate: date,
        vitalsSummary: { measurementCount: 5 },
        totalIntake: 1500,
        totalOutput: 1200,
        ioBalance: 300,
        medicationsGiven: 4,
        medicationsHeld: 1,
        patientStatus: PatientStatus.STABLE,
        summary: null,
        alerts: [],
        generatedAt: new Date(),
        generatedBy: 'user-id',
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockDailyReportRepo.findByAdmissionAndDate.mockResolvedValue(report);

      const result = await service.getReport(admissionId, date);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('report-id');
      expect(result?.ioBalance).toBe(300);
    });

    it('should return null when report not found', async () => {
      const admission = {
        id: admissionId,
        status: AdmissionStatus.ACTIVE,
      };

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockDailyReportRepo.findByAdmissionAndDate.mockResolvedValue(null);

      const result = await service.getReport(admissionId, date);

      expect(result).toBeNull();
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getReport(admissionId, date)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });

  describe('listReports', () => {
    const admissionId = 'admission-id';

    it('should return paginated reports', async () => {
      const admission = {
        id: admissionId,
        status: AdmissionStatus.ACTIVE,
      };

      const reports = [
        {
          id: 'report-1',
          admissionId,
          reportDate: new Date('2024-01-15'),
          vitalsSummary: null,
          totalIntake: 1500,
          totalOutput: 1200,
          ioBalance: 300,
          medicationsGiven: 4,
          medicationsHeld: 1,
          patientStatus: PatientStatus.STABLE,
          summary: null,
          alerts: null,
          generatedAt: new Date(),
          generatedBy: 'user-id',
        },
      ];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockDailyReportRepo.findByAdmission.mockResolvedValue({
        data: reports,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.listReports(admissionId, { page: 1, limit: 20 });

      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.listReports(admissionId, {})).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });

  describe('generateAllDailyReports', () => {
    const date = new Date('2024-01-15');

    it('should generate reports for all active admissions', async () => {
      const admissions = [{ id: 'admission-1' }, { id: 'admission-2' }];

      prismaService.admission.findMany.mockResolvedValue(admissions);
      prismaService.admission.findUnique.mockResolvedValue({
        id: 'admission-1',
        status: AdmissionStatus.ACTIVE,
      });
      mockVitalRepo.findByDateRange.mockResolvedValue([]);
      mockIoRepo.getDailySummary.mockResolvedValue(null);
      prismaService.medication.findMany.mockResolvedValue([]);
      mockNoteRepo.findSignificant.mockResolvedValue([]);
      mockDailyReportRepo.upsert.mockResolvedValue({
        id: 'report-id',
        admissionId: 'admission-1',
        reportDate: date,
        vitalsSummary: null,
        totalIntake: null,
        totalOutput: null,
        ioBalance: null,
        medicationsGiven: 0,
        medicationsHeld: 0,
        patientStatus: null,
        summary: null,
        alerts: null,
        generatedAt: new Date(),
        generatedBy: null,
      });

      const count = await service.generateAllDailyReports(date);

      expect(count).toBe(2);
      expect(mockDailyReportRepo.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
