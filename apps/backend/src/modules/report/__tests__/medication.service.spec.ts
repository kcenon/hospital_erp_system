import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdmissionStatus, MedicationStatus, MedicationRoute } from '@prisma/client';
import { MedicationService } from '../medication.service';
import { MedicationRepository } from '../medication.repository';
import { PrismaService } from '../../../prisma';
import {
  createTestMedication,
  createScheduledMedication,
  createAdministeredMedication,
  createHeldMedication,
  createTestAdmission,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';
import { AdmissionNotFoundException, AdmissionNotActiveException } from '../exceptions';

describe('MedicationService', () => {
  let service: MedicationService;
  let medicationRepo: jest.Mocked<MedicationRepository>;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const mockMedicationRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findByAdmission: jest.fn(),
    findScheduledByDate: jest.fn(),
    findAdministeredToday: jest.fn(),
    countScheduled: jest.fn(),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationService,
        { provide: MedicationRepository, useValue: mockMedicationRepo },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<MedicationService>(MedicationService);
    medicationRepo = module.get(MedicationRepository);

    jest.clearAllMocks();
  });

  describe('schedule', () => {
    const admissionId = 'admission-id';
    const dto = {
      medicationName: 'Amoxicillin 500mg',
      dosage: '500mg',
      route: MedicationRoute.PO,
      frequency: 'TID',
      scheduledTime: '2024-01-15T08:00:00Z',
      notes: 'Take with food',
    };

    it('should schedule medication successfully', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const medication = createScheduledMedication(admissionId);

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockMedicationRepo.create.mockResolvedValue(medication);

      const result = await service.schedule(admissionId, dto);

      expect(result.admissionId).toBe(admissionId);
      expect(result.status).toBe(MedicationStatus.SCHEDULED);
      expect(mockMedicationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          admissionId,
          medicationName: dto.medicationName,
          dosage: dto.dosage,
          route: dto.route,
          frequency: dto.frequency,
        }),
      );
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.schedule(admissionId, dto)).rejects.toThrow(AdmissionNotFoundException);
    });

    it('should throw when admission not active', async () => {
      const dischargedAdmission = createTestAdmission({
        id: admissionId,
        status: 'DISCHARGED' as AdmissionStatus,
      });
      prismaService.admission.findUnique.mockResolvedValue(dischargedAdmission);

      await expect(service.schedule(admissionId, dto)).rejects.toThrow(AdmissionNotActiveException);
    });

    it('should schedule medication without optional fields', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const minimalDto = {
        medicationName: 'Lisinopril 10mg',
        dosage: '10mg',
        route: MedicationRoute.PO,
      };
      const medication = createTestMedication({
        admissionId,
        medicationName: minimalDto.medicationName,
        dosage: minimalDto.dosage,
        route: minimalDto.route,
        frequency: null,
        scheduledTime: null,
        notes: null,
      });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockMedicationRepo.create.mockResolvedValue(medication);

      const result = await service.schedule(admissionId, minimalDto);

      expect(result.medicationName).toBe(minimalDto.medicationName);
      expect(result.frequency).toBeNull();
      expect(result.scheduledTime).toBeNull();
    });

    it('should support all medication routes', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });

      const routes = [
        MedicationRoute.PO,
        MedicationRoute.IV,
        MedicationRoute.IM,
        MedicationRoute.SC,
        MedicationRoute.SL,
        MedicationRoute.TOP,
        MedicationRoute.INH,
        MedicationRoute.PR,
      ];

      for (const route of routes) {
        const routeDto = {
          medicationName: 'Test Medication',
          dosage: '100mg',
          route,
        };
        const medication = createTestMedication({
          admissionId,
          route,
        });

        prismaService.admission.findUnique.mockResolvedValue(admission);
        mockMedicationRepo.create.mockResolvedValue(medication);

        const result = await service.schedule(admissionId, routeDto);

        expect(result.route).toBe(route);
      }
    });
  });

  describe('administer', () => {
    const medicationId = 'medication-id';
    const userId = 'user-id';
    const dto = {
      administeredAt: '2024-01-15T08:15:00Z',
      notes: 'Patient tolerated well',
    };

    it('should administer medication successfully', async () => {
      const scheduled = createScheduledMedication('admission-id');
      const administered = createAdministeredMedication('admission-id');

      mockMedicationRepo.findById.mockResolvedValue(scheduled);
      mockMedicationRepo.update.mockResolvedValue({
        ...administered,
        id: medicationId,
        administeredBy: userId,
      });

      const result = await service.administer(medicationId, dto, userId);

      expect(result.status).toBe(MedicationStatus.ADMINISTERED);
      expect(result.administeredBy).toBe(userId);
      expect(mockMedicationRepo.update).toHaveBeenCalledWith(
        medicationId,
        expect.objectContaining({
          status: MedicationStatus.ADMINISTERED,
          administeredBy: userId,
        }),
      );
    });

    it('should throw when medication not found', async () => {
      mockMedicationRepo.findById.mockResolvedValue(null);

      await expect(service.administer(medicationId, dto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when medication not in SCHEDULED status', async () => {
      const administered = createAdministeredMedication('admission-id');
      mockMedicationRepo.findById.mockResolvedValue(administered);

      await expect(service.administer(medicationId, dto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use current time when administeredAt not provided', async () => {
      const scheduled = createScheduledMedication('admission-id');
      const administered = createAdministeredMedication('admission-id');

      mockMedicationRepo.findById.mockResolvedValue(scheduled);
      mockMedicationRepo.update.mockResolvedValue({
        ...administered,
        id: medicationId,
        administeredBy: userId,
      });

      await service.administer(medicationId, {}, userId);

      expect(mockMedicationRepo.update).toHaveBeenCalledWith(
        medicationId,
        expect.objectContaining({
          administeredAt: expect.any(Date),
        }),
      );
    });
  });

  describe('hold', () => {
    const medicationId = 'medication-id';
    const userId = 'user-id';
    const dto = {
      reason: 'Patient NPO for procedure',
    };

    it('should hold medication successfully', async () => {
      const scheduled = createScheduledMedication('admission-id');
      const held = createHeldMedication('admission-id');

      mockMedicationRepo.findById.mockResolvedValue(scheduled);
      mockMedicationRepo.update.mockResolvedValue({
        ...held,
        id: medicationId,
        holdReason: dto.reason,
      });

      const result = await service.hold(medicationId, dto, userId);

      expect(result.status).toBe(MedicationStatus.HELD);
      expect(result.holdReason).toBe(dto.reason);
      expect(mockMedicationRepo.update).toHaveBeenCalledWith(
        medicationId,
        expect.objectContaining({
          status: MedicationStatus.HELD,
          holdReason: dto.reason,
        }),
      );
    });

    it('should throw when medication not found', async () => {
      mockMedicationRepo.findById.mockResolvedValue(null);

      await expect(service.hold(medicationId, dto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw when medication not in SCHEDULED status', async () => {
      const administered = createAdministeredMedication('admission-id');
      mockMedicationRepo.findById.mockResolvedValue(administered);

      await expect(service.hold(medicationId, dto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refuse', () => {
    const medicationId = 'medication-id';
    const userId = 'user-id';
    const dto = {
      reason: 'Patient refuses due to nausea',
    };

    it('should record refusal successfully', async () => {
      const scheduled = createScheduledMedication('admission-id');
      const refused = createTestMedication({
        id: medicationId,
        status: MedicationStatus.REFUSED,
        holdReason: dto.reason,
      });

      mockMedicationRepo.findById.mockResolvedValue(scheduled);
      mockMedicationRepo.update.mockResolvedValue(refused);

      const result = await service.refuse(medicationId, dto, userId);

      expect(result.status).toBe(MedicationStatus.REFUSED);
      expect(result.holdReason).toBe(dto.reason);
      expect(mockMedicationRepo.update).toHaveBeenCalledWith(
        medicationId,
        expect.objectContaining({
          status: MedicationStatus.REFUSED,
          holdReason: dto.reason,
        }),
      );
    });

    it('should throw when medication not found', async () => {
      mockMedicationRepo.findById.mockResolvedValue(null);

      await expect(service.refuse(medicationId, dto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw when medication not in SCHEDULED status', async () => {
      const held = createHeldMedication('admission-id');
      mockMedicationRepo.findById.mockResolvedValue(held);

      await expect(service.refuse(medicationId, dto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getScheduled', () => {
    const admissionId = 'admission-id';
    const date = new Date('2024-01-15');

    it('should return scheduled medications for date', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const medications = [
        createScheduledMedication(admissionId),
        createScheduledMedication(admissionId),
      ];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockMedicationRepo.findScheduledByDate.mockResolvedValue(medications);

      const result = await service.getScheduled(admissionId, date);

      expect(result.length).toBe(2);
      expect(result[0].status).toBe(MedicationStatus.SCHEDULED);
      expect(mockMedicationRepo.findScheduledByDate).toHaveBeenCalledWith(admissionId, date);
    });

    it('should return empty array when no scheduled medications', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockMedicationRepo.findScheduledByDate.mockResolvedValue([]);

      const result = await service.getScheduled(admissionId, date);

      expect(result).toEqual([]);
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getScheduled(admissionId, date)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });

  describe('getHistory', () => {
    const admissionId = 'admission-id';
    const dto = {
      page: 1,
      limit: 20,
    };

    it('should return medication history with pagination', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const medications = [
        createScheduledMedication(admissionId),
        createAdministeredMedication(admissionId),
      ];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockMedicationRepo.findByAdmission.mockResolvedValue({
        data: medications,
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
      mockMedicationRepo.findByAdmission.mockResolvedValue({
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

      expect(mockMedicationRepo.findByAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      );
    });

    it('should filter by status', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const administeredMeds = [createAdministeredMedication(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockMedicationRepo.findByAdmission.mockResolvedValue({
        data: administeredMeds,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await service.getHistory(admissionId, {
        ...dto,
        status: MedicationStatus.ADMINISTERED,
      });

      expect(mockMedicationRepo.findByAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MedicationStatus.ADMINISTERED,
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

  describe('status transitions', () => {
    const medicationId = 'medication-id';
    const userId = 'user-id';

    it('should only allow transitions from SCHEDULED status', async () => {
      const scheduledMed = createScheduledMedication('admission-id');
      const administeredMed = createAdministeredMedication('admission-id');
      const heldMed = createHeldMedication('admission-id');

      mockMedicationRepo.findById.mockResolvedValue(administeredMed);
      await expect(service.administer(medicationId, {}, userId)).rejects.toThrow(
        BadRequestException,
      );

      mockMedicationRepo.findById.mockResolvedValue(heldMed);
      await expect(service.hold(medicationId, { reason: 'test' }, userId)).rejects.toThrow(
        BadRequestException,
      );

      mockMedicationRepo.findById.mockResolvedValue(administeredMed);
      await expect(service.refuse(medicationId, { reason: 'test' }, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow administer from SCHEDULED', async () => {
      const scheduled = createScheduledMedication('admission-id');
      const administered = {
        ...scheduled,
        status: MedicationStatus.ADMINISTERED,
        administeredAt: new Date(),
        administeredBy: userId,
      };

      mockMedicationRepo.findById.mockResolvedValue(scheduled);
      mockMedicationRepo.update.mockResolvedValue(administered);

      const result = await service.administer(medicationId, {}, userId);

      expect(result.status).toBe(MedicationStatus.ADMINISTERED);
    });

    it('should allow hold from SCHEDULED', async () => {
      const scheduled = createScheduledMedication('admission-id');
      const held = {
        ...scheduled,
        status: MedicationStatus.HELD,
        holdReason: 'test reason',
      };

      mockMedicationRepo.findById.mockResolvedValue(scheduled);
      mockMedicationRepo.update.mockResolvedValue(held);

      const result = await service.hold(medicationId, { reason: 'test reason' }, userId);

      expect(result.status).toBe(MedicationStatus.HELD);
    });

    it('should allow refuse from SCHEDULED', async () => {
      const scheduled = createScheduledMedication('admission-id');
      const refused = {
        ...scheduled,
        status: MedicationStatus.REFUSED,
        holdReason: 'patient refusal',
      };

      mockMedicationRepo.findById.mockResolvedValue(scheduled);
      mockMedicationRepo.update.mockResolvedValue(refused);

      const result = await service.refuse(medicationId, { reason: 'patient refusal' }, userId);

      expect(result.status).toBe(MedicationStatus.REFUSED);
    });
  });
});
