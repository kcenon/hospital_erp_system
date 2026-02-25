import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionController } from '../admission.controller';
import { AdmissionService } from '../admission.service';
import { AdmissionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards';
import { PermissionGuard } from '../../auth/guards';

describe('AdmissionController', () => {
  let controller: AdmissionController;
  let service: jest.Mocked<AdmissionService>;

  const mockAdmissionService = {
    admitPatient: jest.fn(),
    findAll: jest.fn(),
    findByAdmissionNumber: jest.fn(),
    findActiveByPatient: jest.fn(),
    findByFloor: jest.fn(),
    findById: jest.fn(),
    transferPatient: jest.fn(),
    dischargePatient: jest.fn(),
    getTransferHistory: jest.fn(),
  };

  const mockUser = { id: 'user-uuid-1' };

  const mockAdmission = {
    id: 'admission-uuid-1',
    admissionNumber: 'ADM2025000001',
    patientId: 'patient-uuid-1',
    bedId: 'bed-uuid-1',
    admissionDate: new Date('2025-01-15'),
    admissionType: 'ELECTIVE',
    status: 'ACTIVE' as AdmissionStatus,
    admittedBy: 'user-uuid-1',
    primaryDoctorId: 'doctor-uuid-1',
    primaryNurseId: 'nurse-uuid-1',
    diagnosis: 'Test diagnosis',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdmissionController],
      providers: [{ provide: AdmissionService, useValue: mockAdmissionService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdmissionController>(AdmissionController);
    service = module.get(AdmissionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new admission', async () => {
      const dto = {
        patientId: 'patient-uuid-1',
        bedId: 'bed-uuid-1',
        admissionDate: '2025-01-15',
        admissionType: 'ELECTIVE' as const,
        primaryDoctorId: 'doctor-uuid-1',
        primaryNurseId: 'nurse-uuid-1',
        diagnosis: 'Test diagnosis',
      };
      service.admitPatient.mockResolvedValue(mockAdmission as never);

      const result = await controller.create(dto as never, mockUser);

      expect(service.admitPatient).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(mockAdmission);
    });
  });

  describe('findAll', () => {
    it('should return paginated admissions', async () => {
      const dto = { page: 1, limit: 10 };
      const mockResponse = {
        data: [mockAdmission],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResponse as never);

      const result = await controller.findAll(dto as never);

      expect(service.findAll).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });

    it('should pass filter parameters', async () => {
      const dto = { patientId: 'patient-uuid-1', status: 'ACTIVE' };
      service.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      } as never);

      await controller.findAll(dto as never);

      expect(service.findAll).toHaveBeenCalledWith(dto);
    });
  });

  describe('findByAdmissionNumber', () => {
    it('should return admission by number', async () => {
      service.findByAdmissionNumber.mockResolvedValue(mockAdmission as never);

      const result = await controller.findByAdmissionNumber('ADM2025000001');

      expect(service.findByAdmissionNumber).toHaveBeenCalledWith('ADM2025000001');
      expect(result).toEqual(mockAdmission);
    });
  });

  describe('findActiveByPatient', () => {
    it('should return active admission for patient', async () => {
      service.findActiveByPatient.mockResolvedValue(mockAdmission as never);

      const result = await controller.findActiveByPatient('patient-uuid-1');

      expect(service.findActiveByPatient).toHaveBeenCalledWith('patient-uuid-1');
      expect(result).toEqual(mockAdmission);
    });

    it('should return null when no active admission', async () => {
      service.findActiveByPatient.mockResolvedValue(null as never);

      const result = await controller.findActiveByPatient('patient-uuid-2');

      expect(result).toBeNull();
    });
  });

  describe('findByFloor', () => {
    it('should return admissions for a floor', async () => {
      service.findByFloor.mockResolvedValue([mockAdmission] as never);

      const result = await controller.findByFloor('floor-uuid-1');

      expect(service.findByFloor).toHaveBeenCalledWith('floor-uuid-1', undefined);
      expect(result).toEqual([mockAdmission]);
    });

    it('should filter by status', async () => {
      service.findByFloor.mockResolvedValue([mockAdmission] as never);

      const result = await controller.findByFloor('floor-uuid-1', AdmissionStatus.ACTIVE);

      expect(service.findByFloor).toHaveBeenCalledWith('floor-uuid-1', AdmissionStatus.ACTIVE);
      expect(result).toEqual([mockAdmission]);
    });
  });

  describe('findById', () => {
    it('should return admission by ID', async () => {
      service.findById.mockResolvedValue(mockAdmission as never);

      const result = await controller.findById('admission-uuid-1');

      expect(service.findById).toHaveBeenCalledWith('admission-uuid-1');
      expect(result).toEqual(mockAdmission);
    });
  });

  describe('transfer', () => {
    it('should transfer patient to a new bed', async () => {
      const dto = {
        toBedId: 'bed-uuid-2',
        transferDate: '2025-01-20',
        reason: 'Room upgrade',
      };
      const mockTransfer = {
        id: 'transfer-uuid-1',
        admissionId: 'admission-uuid-1',
        fromBedId: 'bed-uuid-1',
        toBedId: 'bed-uuid-2',
        transferDate: new Date('2025-01-20'),
        reason: 'Room upgrade',
        transferredBy: 'user-uuid-1',
      };
      service.transferPatient.mockResolvedValue(mockTransfer as never);

      const result = await controller.transfer('admission-uuid-1', dto as never, mockUser);

      expect(service.transferPatient).toHaveBeenCalledWith('admission-uuid-1', dto, mockUser.id);
      expect(result).toEqual(mockTransfer);
    });
  });

  describe('discharge', () => {
    it('should discharge patient', async () => {
      const dto = {
        dischargeDate: '2025-01-25',
        dischargeType: 'NORMAL' as const,
        dischargeDiagnosis: 'Recovered',
      };
      const mockDischarge = {
        id: 'discharge-uuid-1',
        admissionId: 'admission-uuid-1',
        dischargeDate: new Date('2025-01-25'),
        dischargeType: 'NORMAL',
        dischargeDiagnosis: 'Recovered',
        dischargedBy: 'user-uuid-1',
      };
      service.dischargePatient.mockResolvedValue(mockDischarge as never);

      const result = await controller.discharge('admission-uuid-1', dto as never, mockUser);

      expect(service.dischargePatient).toHaveBeenCalledWith('admission-uuid-1', dto, mockUser.id);
      expect(result).toEqual(mockDischarge);
    });
  });

  describe('getTransferHistory', () => {
    it('should return transfer history', async () => {
      const mockTransfers = [
        {
          id: 'transfer-uuid-1',
          admissionId: 'admission-uuid-1',
          fromBedId: 'bed-uuid-1',
          toBedId: 'bed-uuid-2',
          transferDate: new Date('2025-01-20'),
        },
      ];
      service.getTransferHistory.mockResolvedValue(mockTransfers as never);

      const result = await controller.getTransferHistory('admission-uuid-1');

      expect(service.getTransferHistory).toHaveBeenCalledWith('admission-uuid-1');
      expect(result).toEqual(mockTransfers);
    });

    it('should return empty array when no transfers', async () => {
      service.getTransferHistory.mockResolvedValue([] as never);

      const result = await controller.getTransferHistory('admission-uuid-2');

      expect(result).toEqual([]);
    });
  });
});
