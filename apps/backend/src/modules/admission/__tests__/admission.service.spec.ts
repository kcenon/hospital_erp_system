import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionService } from '../admission.service';
import { AdmissionRepository } from '../admission.repository';
import { AdmissionNumberGenerator } from '../admission-number.generator';
import { BedService } from '../../room/bed.service';
import { PrismaService } from '../../../prisma';
import { BedStatus, AdmissionStatus } from '@prisma/client';
import {
  createTestAdmission,
  createTestTransfer,
  createTestDischarge,
  createTestPatient,
  createEmptyBed,
  createOccupiedBed,
} from '../../../../test/factories';
import {
  PatientNotFoundException,
  PatientAlreadyAdmittedException,
  BedNotAvailableException,
  AdmissionNotFoundException,
  AdmissionNotActiveException,
  AdmissionAlreadyDischargedException,
} from '../exceptions';
import { createMockPrismaService } from '../../../../test/utils';

describe('AdmissionService', () => {
  let service: AdmissionService;
  let repository: jest.Mocked<AdmissionRepository>;
  let admissionNumberGenerator: jest.Mocked<AdmissionNumberGenerator>;
  let bedService: jest.Mocked<BedService>;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const mockRepository = {
    findById: jest.fn(),
    findByAdmissionNumber: jest.fn(),
    findActiveByPatient: jest.fn(),
    findByFloor: jest.fn(),
    findAll: jest.fn(),
  };

  const mockAdmissionNumberGenerator = {
    generate: jest.fn(),
  };

  const mockBedService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionService,
        { provide: AdmissionRepository, useValue: mockRepository },
        { provide: AdmissionNumberGenerator, useValue: mockAdmissionNumberGenerator },
        { provide: BedService, useValue: mockBedService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AdmissionService>(AdmissionService);
    repository = module.get(AdmissionRepository);
    admissionNumberGenerator = module.get(AdmissionNumberGenerator);
    bedService = module.get(BedService);

    jest.clearAllMocks();
  });

  describe('admitPatient', () => {
    const userId = 'user-id';
    const dto = {
      patientId: 'patient-id',
      bedId: 'bed-id',
      admissionDate: '2024-01-15',
      admissionTime: '10:00',
      admissionType: 'SCHEDULED' as const,
      attendingDoctorId: 'doctor-id',
    };

    it('should create admission and occupy bed', async () => {
      const patient = createTestPatient({ id: dto.patientId });
      const bed = createEmptyBed('room-id', { id: dto.bedId });
      const admissionNumber = 'A2024000001';
      const admission = createTestAdmission({
        id: 'admission-id',
        patientId: dto.patientId,
        bedId: dto.bedId,
        admissionNumber,
      });

      prismaService.patient.findFirst.mockResolvedValue(patient);
      mockRepository.findActiveByPatient.mockResolvedValue(null);
      mockBedService.findById.mockResolvedValue(bed);
      mockAdmissionNumberGenerator.generate.mockResolvedValue(admissionNumber);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          admission: { create: jest.fn().mockResolvedValue(admission) },
          bed: { update: jest.fn().mockResolvedValue(bed) },
        });
      });
      mockRepository.findById.mockResolvedValue({
        ...admission,
        transfers: [],
        discharge: null,
      });

      const result = await service.admitPatient(dto, userId);

      expect(result.admissionNumber).toBe(admissionNumber);
      expect(mockAdmissionNumberGenerator.generate).toHaveBeenCalled();
    });

    it('should throw when patient not found', async () => {
      prismaService.patient.findFirst.mockResolvedValue(null);

      await expect(service.admitPatient(dto, userId)).rejects.toThrow(PatientNotFoundException);
    });

    it('should throw when patient already admitted', async () => {
      const patient = createTestPatient({ id: dto.patientId });
      const existingAdmission = createTestAdmission({
        patientId: dto.patientId,
        status: 'ACTIVE' as AdmissionStatus,
      });

      prismaService.patient.findFirst.mockResolvedValue(patient);
      mockRepository.findActiveByPatient.mockResolvedValue(existingAdmission);

      await expect(service.admitPatient(dto, userId)).rejects.toThrow(
        PatientAlreadyAdmittedException,
      );
    });

    it('should throw when bed not available', async () => {
      const patient = createTestPatient({ id: dto.patientId });
      const occupiedBed = createOccupiedBed('room-id', 'other-admission', {
        id: dto.bedId,
      });

      prismaService.patient.findFirst.mockResolvedValue(patient);
      mockRepository.findActiveByPatient.mockResolvedValue(null);
      mockBedService.findById.mockResolvedValue(occupiedBed);

      await expect(service.admitPatient(dto, userId)).rejects.toThrow(BedNotAvailableException);
    });
  });

  describe('transferPatient', () => {
    const userId = 'user-id';
    const admissionId = 'admission-id';
    const dto = {
      toBedId: 'new-bed-id',
      transferDate: '2024-01-16',
      transferTime: '14:00',
      reason: 'Patient requested window view',
    };

    it('should create transfer record and update bed statuses', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        bedId: 'old-bed-id',
        status: 'ACTIVE' as AdmissionStatus,
      });
      const admissionWithRelations = {
        ...admission,
        transfers: [],
        discharge: null,
      };
      const newBed = createEmptyBed('room-id', { id: dto.toBedId });
      const transfer = createTestTransfer({
        admissionId,
        fromBedId: admission.bedId,
        toBedId: dto.toBedId,
      });

      mockRepository.findById.mockResolvedValue(admissionWithRelations);
      mockBedService.findById.mockResolvedValue(newBed);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          transfer: { create: jest.fn().mockResolvedValue(transfer) },
          bed: { update: jest.fn() },
          admission: { update: jest.fn() },
        });
      });

      const result = await service.transferPatient(admissionId, dto, userId);

      expect(result.fromBedId).toBe(admission.bedId);
      expect(result.toBedId).toBe(dto.toBedId);
    });

    it('should throw when admission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.transferPatient(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });

    it('should throw when admission not active', async () => {
      const dischargedAdmission = {
        ...createTestAdmission({
          id: admissionId,
          status: 'DISCHARGED' as AdmissionStatus,
        }),
        transfers: [],
        discharge: createTestDischarge({ admissionId }),
      };
      mockRepository.findById.mockResolvedValue(dischargedAdmission);

      await expect(service.transferPatient(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotActiveException,
      );
    });

    it('should throw when new bed not available', async () => {
      const admission = {
        ...createTestAdmission({
          id: admissionId,
          status: 'ACTIVE' as AdmissionStatus,
        }),
        transfers: [],
        discharge: null,
      };
      const occupiedBed = createOccupiedBed('room-id', 'other-admission', {
        id: dto.toBedId,
      });

      mockRepository.findById.mockResolvedValue(admission);
      mockBedService.findById.mockResolvedValue(occupiedBed);

      await expect(service.transferPatient(admissionId, dto, userId)).rejects.toThrow(
        BedNotAvailableException,
      );
    });
  });

  describe('dischargePatient', () => {
    const userId = 'user-id';
    const admissionId = 'admission-id';
    const dto = {
      dischargeDate: '2024-01-20',
      dischargeTime: '10:00',
      dischargeType: 'NORMAL' as const,
      dischargeDiagnosis: 'Recovered',
      dischargeSummary: 'Patient made full recovery',
    };

    it('should create discharge record and release bed', async () => {
      const admission = {
        ...createTestAdmission({
          id: admissionId,
          status: 'ACTIVE' as AdmissionStatus,
        }),
        transfers: [],
        discharge: null,
      };
      const discharge = createTestDischarge({
        admissionId,
        dischargeType: dto.dischargeType,
      });

      mockRepository.findById.mockResolvedValue(admission);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          discharge: { create: jest.fn().mockResolvedValue(discharge) },
          bed: { update: jest.fn() },
          admission: { update: jest.fn() },
        });
      });

      const result = await service.dischargePatient(admissionId, dto, userId);

      expect(result.dischargeType).toBe(dto.dischargeType);
    });

    it('should throw when admission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.dischargePatient(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });

    it('should throw when admission not active', async () => {
      const dischargedAdmission = {
        ...createTestAdmission({
          id: admissionId,
          status: 'DISCHARGED' as AdmissionStatus,
        }),
        transfers: [],
        discharge: createTestDischarge({ admissionId }),
      };
      mockRepository.findById.mockResolvedValue(dischargedAdmission);

      await expect(service.dischargePatient(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotActiveException,
      );
    });

    it('should throw when already discharged', async () => {
      const admission = {
        ...createTestAdmission({
          id: admissionId,
          status: 'ACTIVE' as AdmissionStatus,
        }),
        transfers: [],
        discharge: createTestDischarge({ admissionId }),
      };
      mockRepository.findById.mockResolvedValue(admission);

      await expect(service.dischargePatient(admissionId, dto, userId)).rejects.toThrow(
        AdmissionAlreadyDischargedException,
      );
    });
  });

  describe('findById', () => {
    it('should return admission by ID', async () => {
      const admission = {
        ...createTestAdmission({ id: 'admission-id' }),
        transfers: [],
        discharge: null,
      };
      mockRepository.findById.mockResolvedValue(admission);

      const result = await service.findById('admission-id');

      expect(result.id).toBe('admission-id');
    });

    it('should throw when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(AdmissionNotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated admissions', async () => {
      const admissions = [
        {
          ...createTestAdmission(),
          transfers: [],
          discharge: null,
        },
        {
          ...createTestAdmission(),
          transfers: [],
          discharge: null,
        },
      ];
      mockRepository.findAll.mockResolvedValue({
        data: admissions,
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

      await service.findAll({ status: 'ACTIVE' as AdmissionStatus, page: 1, limit: 20 });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACTIVE',
        }),
      );
    });
  });

  describe('findActiveByPatient', () => {
    it('should return active admission for patient', async () => {
      const admission = createTestAdmission({
        patientId: 'patient-id',
        status: 'ACTIVE' as AdmissionStatus,
      });
      const admissionWithRelations = {
        ...admission,
        transfers: [],
        discharge: null,
      };
      mockRepository.findActiveByPatient.mockResolvedValue(admission);
      mockRepository.findById.mockResolvedValue(admissionWithRelations);

      const result = await service.findActiveByPatient('patient-id');

      expect(result).not.toBeNull();
      expect(result!.patientId).toBe('patient-id');
    });

    it('should return null when no active admission', async () => {
      mockRepository.findActiveByPatient.mockResolvedValue(null);

      const result = await service.findActiveByPatient('patient-id');

      expect(result).toBeNull();
    });
  });

  describe('getTransferHistory', () => {
    it('should return transfer history', async () => {
      const admission = {
        ...createTestAdmission({ id: 'admission-id' }),
        transfers: [
          createTestTransfer({ admissionId: 'admission-id' }),
          createTestTransfer({ admissionId: 'admission-id' }),
        ],
        discharge: null,
      };
      mockRepository.findById.mockResolvedValue(admission);

      const result = await service.getTransferHistory('admission-id');

      expect(result.length).toBe(2);
    });

    it('should throw when admission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getTransferHistory('nonexistent')).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });
  });
});
