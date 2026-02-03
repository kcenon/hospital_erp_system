import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Patient, PatientDetail } from '@prisma/client';
import { PatientRepository, PatientWithDetail } from './patient.repository';
import { PatientNumberGenerator } from './patient-number.generator';
import { DataMaskingService, UserRole } from './data-masking.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  CreatePatientDetailDto,
  UpdatePatientDetailDto,
  PatientResponseDto,
  PatientDetailResponseDto,
  FindPatientsDto,
  PaginatedPatientsResponseDto,
} from './dto';

@Injectable()
export class PatientService {
  constructor(
    private readonly repository: PatientRepository,
    private readonly patientNumberGenerator: PatientNumberGenerator,
    private readonly dataMaskingService: DataMaskingService,
  ) {}

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    const patientNumber = await this.patientNumberGenerator.generate();

    const patient = await this.repository.create({
      patientNumber,
      name: dto.name,
      birthDate: new Date(dto.birthDate),
      gender: dto.gender,
      bloodType: dto.bloodType,
      phone: dto.phone,
      address: dto.address,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      emergencyContactRelation: dto.emergencyContactRelation,
      legacyPatientId: dto.legacyPatientId,
    });

    return this.toResponseDto(patient);
  }

  async findById(id: string, role?: UserRole): Promise<PatientResponseDto> {
    const patient = await this.repository.findById(id);
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return this.toResponseDto(patient, role);
  }

  async findByPatientNumber(patientNumber: string, role?: UserRole): Promise<PatientResponseDto> {
    const patient = await this.repository.findByPatientNumber(patientNumber);
    if (!patient) {
      throw new NotFoundException(`Patient with number ${patientNumber} not found`);
    }
    return this.toResponseDto(patient, role);
  }

  async findByLegacyId(legacyId: string, role?: UserRole): Promise<PatientResponseDto> {
    const patient = await this.repository.findByLegacyId(legacyId);
    if (!patient) {
      throw new NotFoundException(`Patient with legacy ID ${legacyId} not found`);
    }
    return this.toResponseDto(patient, role);
  }

  async findAll(dto: FindPatientsDto, role?: UserRole): Promise<PaginatedPatientsResponseDto> {
    const result = await this.repository.findAll({
      search: dto.search,
      name: dto.name,
      patientNumber: dto.patientNumber,
      gender: dto.gender,
      page: dto.page,
      limit: dto.limit,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    });

    return {
      data: result.data.map((patient) => this.toResponseDto(patient, role)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const patient = await this.repository.update(id, {
      name: dto.name,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      gender: dto.gender,
      bloodType: dto.bloodType,
      phone: dto.phone,
      address: dto.address,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      emergencyContactRelation: dto.emergencyContactRelation,
      legacyPatientId: dto.legacyPatientId,
    });

    return this.toResponseDto(patient);
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    await this.repository.softDelete(id);
  }

  async search(query: string, role?: UserRole): Promise<PatientResponseDto[]> {
    const patients = await this.repository.search(query);
    return patients.map((patient) => this.toResponseDto(patient, role));
  }

  async createDetail(
    patientId: string,
    dto: CreatePatientDetailDto,
  ): Promise<PatientDetailResponseDto> {
    const patient = await this.repository.findById(patientId);
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (patient.detail) {
      throw new ConflictException(`Patient detail already exists for patient ${patientId}`);
    }

    const detail = await this.repository.createDetail(patientId, {
      ssnEncrypted: dto.ssn ? this.encryptData(dto.ssn) : undefined,
      medicalHistoryEncrypted: dto.medicalHistory
        ? this.encryptData(dto.medicalHistory)
        : undefined,
      allergiesEncrypted: dto.allergies ? this.encryptData(dto.allergies) : undefined,
      insuranceType: dto.insuranceType,
      insuranceNumberEncrypted: dto.insuranceNumber
        ? this.encryptData(dto.insuranceNumber)
        : undefined,
      insuranceCompany: dto.insuranceCompany,
      notes: dto.notes,
    });

    return this.toDetailResponseDto(detail);
  }

  async updateDetail(
    patientId: string,
    dto: UpdatePatientDetailDto,
  ): Promise<PatientDetailResponseDto> {
    const existingDetail = await this.repository.findDetailByPatientId(patientId);
    if (!existingDetail) {
      throw new NotFoundException(`Patient detail not found for patient ${patientId}`);
    }

    const detail = await this.repository.updateDetail(patientId, {
      ssnEncrypted: dto.ssn !== undefined ? this.encryptData(dto.ssn) : undefined,
      medicalHistoryEncrypted:
        dto.medicalHistory !== undefined ? this.encryptData(dto.medicalHistory) : undefined,
      allergiesEncrypted: dto.allergies !== undefined ? this.encryptData(dto.allergies) : undefined,
      insuranceType: dto.insuranceType,
      insuranceNumberEncrypted:
        dto.insuranceNumber !== undefined ? this.encryptData(dto.insuranceNumber) : undefined,
      insuranceCompany: dto.insuranceCompany,
      notes: dto.notes,
    });

    return this.toDetailResponseDto(detail);
  }

  private toResponseDto(patient: Patient | PatientWithDetail, role?: UserRole): PatientResponseDto {
    const dto: PatientResponseDto = {
      id: patient.id,
      patientNumber: patient.patientNumber,
      name: patient.name,
      birthDate: patient.birthDate,
      gender: patient.gender,
      bloodType: patient.bloodType,
      phone: this.dataMaskingService.maskPhone(patient.phone),
      address: this.dataMaskingService.maskAddress(patient.address),
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: this.dataMaskingService.maskPhone(patient.emergencyContactPhone),
      emergencyContactRelation: patient.emergencyContactRelation,
      legacyPatientId: patient.legacyPatientId,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };

    if ('detail' in patient && patient.detail) {
      dto.detail = this.toDetailResponseDto(patient.detail, role);
    }

    return dto;
  }

  private toDetailResponseDto(detail: PatientDetail, role?: UserRole): PatientDetailResponseDto {
    return {
      id: detail.id,
      ssn: detail.ssnEncrypted
        ? this.dataMaskingService.maskSsn(this.decryptData(detail.ssnEncrypted), role)
        : null,
      medicalHistory: detail.medicalHistoryEncrypted
        ? this.decryptData(detail.medicalHistoryEncrypted)
        : null,
      allergies: detail.allergiesEncrypted ? this.decryptData(detail.allergiesEncrypted) : null,
      insuranceType: detail.insuranceType,
      insuranceNumber: detail.insuranceNumberEncrypted
        ? this.dataMaskingService.maskInsuranceNumber(
            this.decryptData(detail.insuranceNumberEncrypted),
            role,
          )
        : null,
      insuranceCompany: detail.insuranceCompany,
      notes: detail.notes,
    };
  }

  private encryptData(data: string): Buffer {
    return Buffer.from(data, 'utf-8');
  }

  private decryptData(data: Buffer): string {
    return data.toString('utf-8');
  }
}
