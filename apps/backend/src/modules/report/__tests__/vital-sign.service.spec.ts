import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdmissionStatus } from '@prisma/client';
import { VitalSignService } from '../vital-sign.service';
import { VitalSignRepository } from '../vital-sign.repository';
import { PrismaService } from '../../../prisma';
import { RoomGateway } from '../../room/room.gateway';
import { BedService } from '../../room/bed.service';
import {
  createTestVitalSign,
  createNormalVitalSign,
  createHighFeverVitalSign,
  createTestAdmission,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';
import { AdmissionNotFoundException, AdmissionNotActiveException } from '../exceptions';

describe('VitalSignService', () => {
  let service: VitalSignService;
  let vitalRepo: jest.Mocked<VitalSignRepository>;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockVitalRepo = {
    create: jest.fn(),
    findByAdmission: jest.fn(),
    findLatest: jest.fn(),
    findByDateRange: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockRoomGateway = {
    server: {
      emit: jest.fn(),
    },
  };

  const mockBedService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VitalSignService,
        { provide: VitalSignRepository, useValue: mockVitalRepo },
        { provide: PrismaService, useValue: prismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: RoomGateway, useValue: mockRoomGateway },
        { provide: BedService, useValue: mockBedService },
      ],
    }).compile();

    service = module.get<VitalSignService>(VitalSignService);
    vitalRepo = module.get(VitalSignRepository);
    eventEmitter = module.get(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('record', () => {
    const userId = 'user-id';
    const admissionId = 'admission-id';
    const dto = {
      temperature: 36.5,
      systolicBp: 120,
      diastolicBp: 80,
      pulseRate: 72,
      oxygenSaturation: 98,
    };

    it('should record vital signs successfully', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const vitalSign = createNormalVitalSign(admissionId);

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.create.mockResolvedValue(vitalSign);

      const result = await service.record(admissionId, dto, userId);

      expect(result.temperature).toBe(vitalSign.temperature?.toNumber());
      expect(mockVitalRepo.create).toHaveBeenCalled();
    });

    it('should emit alert when abnormal values detected', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const feverDto = {
        temperature: 39.5,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 72,
        oxygenSaturation: 98,
      };
      const vitalSign = createHighFeverVitalSign(admissionId);

      prismaService.admission.findUnique.mockResolvedValue(admission);
      prismaService.patient.findUnique.mockResolvedValue({ name: 'Test Patient' });
      mockBedService.findById.mockResolvedValue({
        bedNumber: 'A',
        room: { roomNumber: '101' },
      });
      mockVitalRepo.create.mockResolvedValue(vitalSign);

      const result = await service.record(admissionId, feverDto, userId);

      expect(result.hasAlert).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'vital.alert',
        expect.objectContaining({
          admissionId,
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
  });

  describe('getHistory', () => {
    const admissionId = 'admission-id';
    const dto = {
      page: 1,
      limit: 20,
    };

    it('should return history with pagination', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const vitalSigns = [createNormalVitalSign(admissionId), createNormalVitalSign(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findByAdmission.mockResolvedValue({
        data: vitalSigns,
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
      mockVitalRepo.findByAdmission.mockResolvedValue({
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

      expect(mockVitalRepo.findByAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      );
    });

    it('should filter by alert status', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findByAdmission.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.getHistory(admissionId, {
        ...dto,
        hasAlert: true,
      });

      expect(mockVitalRepo.findByAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAlert: true,
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

  describe('getLatest', () => {
    const admissionId = 'admission-id';

    it('should return latest vital sign', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const vitalSign = createNormalVitalSign(admissionId);

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findLatest.mockResolvedValue(vitalSign);

      const result = await service.getLatest(admissionId);

      expect(result).not.toBeNull();
      expect(result!.admissionId).toBe(admissionId);
    });

    it('should return null when no vital signs', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findLatest.mockResolvedValue(null);

      const result = await service.getLatest(admissionId);

      expect(result).toBeNull();
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getLatest(admissionId)).rejects.toThrow(AdmissionNotFoundException);
    });
  });

  describe('getTrendData', () => {
    const admissionId = 'admission-id';
    const dto = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    it('should return trend data', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const vitalSigns = [createNormalVitalSign(admissionId), createNormalVitalSign(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockVitalRepo.findByDateRange.mockResolvedValue(vitalSigns);

      const result = await service.getTrendData(admissionId, dto);

      expect(result.labels.length).toBe(2);
      expect(result.temperature.length).toBe(2);
      expect(result.systolicBp.length).toBe(2);
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getTrendData(admissionId, dto)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });
});
