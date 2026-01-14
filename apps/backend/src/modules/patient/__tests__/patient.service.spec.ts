import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PatientService } from '../patient.service';
import { PatientRepository } from '../patient.repository';
import { PatientNumberGenerator } from '../patient-number.generator';
import { DataMaskingService } from '../data-masking.service';
import {
  createTestPatient,
  createTestPatientWithDetail,
  createTestPatientDetail,
} from '../../../../test/factories';

describe('PatientService', () => {
  let service: PatientService;
  let repository: jest.Mocked<PatientRepository>;
  let patientNumberGenerator: jest.Mocked<PatientNumberGenerator>;
  let dataMaskingService: DataMaskingService;

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByPatientNumber: jest.fn(),
    findByLegacyId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    search: jest.fn(),
    createDetail: jest.fn(),
    updateDetail: jest.fn(),
    findDetailByPatientId: jest.fn(),
  };

  const mockPatientNumberGenerator = {
    generate: jest.fn(),
    parsePatientNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: PatientRepository, useValue: mockRepository },
        { provide: PatientNumberGenerator, useValue: mockPatientNumberGenerator },
        DataMaskingService,
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    repository = module.get(PatientRepository);
    patientNumberGenerator = module.get(PatientNumberGenerator);
    dataMaskingService = module.get<DataMaskingService>(DataMaskingService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create patient with generated number', async () => {
      const patient = createTestPatient();
      const patientNumber = 'P2024000001';
      mockPatientNumberGenerator.generate.mockResolvedValue(patientNumber);
      mockRepository.create.mockResolvedValue({ ...patient, patientNumber });

      const result = await service.create({
        name: patient.name,
        birthDate: patient.birthDate.toISOString(),
        gender: patient.gender,
        bloodType: patient.bloodType ?? undefined,
        phone: patient.phone ?? undefined,
      });

      expect(mockPatientNumberGenerator.generate).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientNumber,
          name: patient.name,
        }),
      );
      expect(result.patientNumber).toBe(patientNumber);
    });
  });

  describe('findById', () => {
    it('should return patient with masked data', async () => {
      const patient = createTestPatientWithDetail();
      mockRepository.findById.mockResolvedValue(patient);

      const result = await service.findById(patient.id);

      expect(result.id).toBe(patient.id);
      expect(mockRepository.findById).toHaveBeenCalledWith(patient.id);
    });

    it('should throw when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatientNumber', () => {
    it('should return patient by patient number', async () => {
      const patient = createTestPatient();
      mockRepository.findByPatientNumber.mockResolvedValue(patient);

      const result = await service.findByPatientNumber(patient.patientNumber);

      expect(result.patientNumber).toBe(patient.patientNumber);
      expect(mockRepository.findByPatientNumber).toHaveBeenCalledWith(patient.patientNumber);
    });

    it('should throw when patient not found', async () => {
      mockRepository.findByPatientNumber.mockResolvedValue(null);

      await expect(service.findByPatientNumber('P0000000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByLegacyId', () => {
    it('should return patient by legacy ID', async () => {
      const patient = createTestPatient({ legacyPatientId: 'LEGACY001' });
      mockRepository.findByLegacyId.mockResolvedValue(patient);

      const result = await service.findByLegacyId('LEGACY001');

      expect(result.legacyPatientId).toBe('LEGACY001');
    });

    it('should throw when not found', async () => {
      mockRepository.findByLegacyId.mockResolvedValue(null);

      await expect(service.findByLegacyId('NOTFOUND')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated patients', async () => {
      const patients = [createTestPatient(), createTestPatient()];
      mockRepository.findAll.mockResolvedValue({
        data: patients,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should apply search filters', async () => {
      const patients = [createTestPatient({ name: 'John Doe' })];
      mockRepository.findAll.mockResolvedValue({
        data: patients,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await service.findAll({ search: 'John', page: 1, limit: 20 });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'John',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update patient', async () => {
      const patient = createTestPatient();
      const updatedPatient = { ...patient, name: 'Updated Name' };
      mockRepository.findById.mockResolvedValue(patient);
      mockRepository.update.mockResolvedValue(updatedPatient);

      const result = await service.update(patient.id, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(mockRepository.update).toHaveBeenCalledWith(
        patient.id,
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete patient', async () => {
      const patient = createTestPatient();
      mockRepository.findById.mockResolvedValue(patient);
      mockRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete(patient.id);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(patient.id);
    });

    it('should throw when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should find by patient number', async () => {
      const patient = createTestPatient({ patientNumber: 'P2024000001' });
      mockRepository.search.mockResolvedValue([patient]);

      const result = await service.search('P2024000001');

      expect(result.length).toBe(1);
      expect(result[0].patientNumber).toBe('P2024000001');
    });

    it('should find by partial name match', async () => {
      const patient = createTestPatient({ name: 'John Doe' });
      mockRepository.search.mockResolvedValue([patient]);

      const result = await service.search('John');

      expect(result.length).toBe(1);
    });

    it('should return empty array when no match', async () => {
      mockRepository.search.mockResolvedValue([]);

      const result = await service.search('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('createDetail', () => {
    it('should create patient detail', async () => {
      const patient = createTestPatient();
      const detail = createTestPatientDetail(patient.id);
      mockRepository.findById.mockResolvedValue({ ...patient, detail: null });
      mockRepository.createDetail.mockResolvedValue(detail);

      const result = await service.createDetail(patient.id, {
        allergies: 'Penicillin',
        insuranceType: 'National Health Insurance',
      });

      expect(result.allergies).toBe(detail.allergies);
      expect(mockRepository.createDetail).toHaveBeenCalled();
    });

    it('should throw when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.createDetail('nonexistent', { allergies: 'None' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when detail already exists', async () => {
      const patientWithDetail = createTestPatientWithDetail();
      mockRepository.findById.mockResolvedValue(patientWithDetail);

      await expect(
        service.createDetail(patientWithDetail.id, { allergies: 'None' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateDetail', () => {
    it('should update patient detail', async () => {
      const detail = createTestPatientDetail('patient-id');
      const updatedDetail = { ...detail, allergies: 'Updated allergies' };
      mockRepository.findDetailByPatientId.mockResolvedValue(detail);
      mockRepository.updateDetail.mockResolvedValue(updatedDetail);

      const result = await service.updateDetail('patient-id', {
        allergies: 'Updated allergies',
      });

      expect(result.allergies).toBe('Updated allergies');
    });

    it('should throw when detail not found', async () => {
      mockRepository.findDetailByPatientId.mockResolvedValue(null);

      await expect(service.updateDetail('nonexistent', { allergies: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
