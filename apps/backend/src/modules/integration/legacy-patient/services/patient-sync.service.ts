import { Injectable, Inject, Logger } from '@nestjs/common';
import { Gender } from '@prisma/client';
import { PatientRepository } from '../../../patient/patient.repository';
import { PatientNumberGenerator } from '../../../patient/patient-number.generator';
import { PatientResponseDto } from '../../../patient/dto';
import { DataMaskingService } from '../../../patient/data-masking.service';
import {
  LEGACY_PATIENT_ADAPTER,
  LegacyPatientAdapter,
  LegacyPatient,
  MedicalHistory,
} from '../interfaces';
import { LegacyPatientNotFoundException, PatientAlreadyImportedException } from '../exceptions';
import { LegacyPatientResponseDto, MedicalHistoryResponseDto } from '../dto';

@Injectable()
export class PatientSyncService {
  private readonly logger = new Logger(PatientSyncService.name);

  constructor(
    @Inject(LEGACY_PATIENT_ADAPTER)
    private readonly legacyAdapter: LegacyPatientAdapter,
    private readonly patientRepository: PatientRepository,
    private readonly patientNumberGenerator: PatientNumberGenerator,
    private readonly dataMaskingService: DataMaskingService,
  ) {}

  async searchLegacy(query: string): Promise<LegacyPatientResponseDto[]> {
    const patients = await this.legacyAdapter.searchPatients(query);
    return patients.map((p) => this.toLegacyPatientResponseDto(p));
  }

  async findLegacyById(legacyId: string): Promise<LegacyPatientResponseDto> {
    const patient = await this.legacyAdapter.findPatientById(legacyId);
    if (!patient) {
      throw new LegacyPatientNotFoundException(legacyId);
    }
    return this.toLegacyPatientResponseDto(patient);
  }

  async getMedicalHistory(legacyId: string): Promise<MedicalHistoryResponseDto> {
    const history = await this.legacyAdapter.getMedicalHistory(legacyId);
    return this.toMedicalHistoryResponseDto(history);
  }

  async importFromLegacy(legacyId: string): Promise<PatientResponseDto> {
    const existingPatient = await this.patientRepository.findByLegacyId(legacyId);
    if (existingPatient) {
      throw new PatientAlreadyImportedException(legacyId, existingPatient.id);
    }

    const legacyPatient = await this.legacyAdapter.findPatientById(legacyId);
    if (!legacyPatient) {
      throw new LegacyPatientNotFoundException(legacyId);
    }

    const patientNumber = await this.patientNumberGenerator.generate();
    const gender = this.mapGender(legacyPatient.gender);

    const patient = await this.patientRepository.create({
      patientNumber,
      name: legacyPatient.name,
      birthDate: legacyPatient.birthDate,
      gender,
      bloodType: legacyPatient.bloodType,
      phone: legacyPatient.phone,
      address: legacyPatient.address,
      legacyPatientId: legacyId,
    });

    if (legacyPatient.ssn || legacyPatient.insuranceType || legacyPatient.insuranceNumber) {
      try {
        await this.patientRepository.createDetail(patient.id, {
          ssnEncrypted: legacyPatient.ssn ? this.encryptData(legacyPatient.ssn) : undefined,
          insuranceType: legacyPatient.insuranceType,
          insuranceNumberEncrypted: legacyPatient.insuranceNumber
            ? this.encryptData(legacyPatient.insuranceNumber)
            : undefined,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to create patient detail for imported patient ${patient.id}`,
          error,
        );
      }
    }

    this.logger.log(`Successfully imported patient ${legacyId} as ${patient.id}`);

    return this.toPatientResponseDto(patient);
  }

  async checkConnection(): Promise<boolean> {
    return this.legacyAdapter.isConnected();
  }

  private toLegacyPatientResponseDto(patient: LegacyPatient): LegacyPatientResponseDto {
    return {
      legacyId: patient.legacyId,
      name: patient.name,
      birthDate: patient.birthDate,
      gender: patient.gender,
      ssn: this.nullToUndefined(patient.ssn ? this.dataMaskingService.maskSsn(patient.ssn) : null),
      phone: this.nullToUndefined(
        patient.phone ? this.dataMaskingService.maskPhone(patient.phone) : null,
      ),
      address: this.nullToUndefined(
        patient.address ? this.dataMaskingService.maskAddress(patient.address) : null,
      ),
      bloodType: patient.bloodType,
      insuranceType: patient.insuranceType,
      insuranceNumber: this.nullToUndefined(
        patient.insuranceNumber
          ? this.dataMaskingService.maskInsuranceNumber(patient.insuranceNumber)
          : null,
      ),
    };
  }

  private toMedicalHistoryResponseDto(history: MedicalHistory): MedicalHistoryResponseDto {
    return {
      legacyId: history.legacyId,
      diagnoses: history.diagnoses.map((d) => ({
        code: d.code,
        name: d.name,
        diagnosedAt: d.diagnosedAt,
        status: d.status,
      })),
      medications: history.medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        startDate: m.startDate,
        endDate: m.endDate,
      })),
      allergies: history.allergies,
      surgeries: history.surgeries.map((s) => ({
        name: s.name,
        performedAt: s.performedAt,
        hospital: s.hospital,
        notes: s.notes,
      })),
      lastVisitDate: history.lastVisitDate,
    };
  }

  private toPatientResponseDto(patient: {
    id: string;
    patientNumber: string;
    name: string;
    birthDate: Date;
    gender: Gender;
    bloodType: string | null;
    phone: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelation: string | null;
    legacyPatientId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PatientResponseDto {
    return {
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
  }

  private mapGender(gender: string): 'MALE' | 'FEMALE' | 'OTHER' {
    const genderMap: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
      M: 'MALE',
      F: 'FEMALE',
      MALE: 'MALE',
      FEMALE: 'FEMALE',
      남: 'MALE',
      여: 'FEMALE',
    };
    return genderMap[gender.toUpperCase()] || 'OTHER';
  }

  private encryptData(data: string): Buffer {
    return Buffer.from(data, 'utf-8');
  }

  private nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
  }
}
