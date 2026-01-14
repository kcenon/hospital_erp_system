import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, retry } from 'rxjs';
import { AxiosError } from 'axios';
import {
  LegacyPatientAdapter,
  LegacyPatient,
  MedicalHistory,
  Diagnosis,
  CurrentMedication,
  Surgery,
} from '../interfaces';
import { LegacyCacheService } from '../services/legacy-cache.service';
import { LegacySystemConnectionException, LegacyPatientNotFoundException } from '../exceptions';

interface LegacyApiPatientResponse {
  patient_id: string;
  name: string;
  birth_date: string;
  gender: string;
  ssn?: string;
  phone?: string;
  address?: string;
  blood_type?: string;
  insurance_type?: string;
  insurance_number?: string;
}

interface LegacyApiMedicalHistoryResponse {
  patient_id: string;
  diagnoses: Array<{
    code: string;
    name: string;
    diagnosed_at: string;
    status: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date?: string;
  }>;
  allergies: string[];
  surgeries: Array<{
    name: string;
    performed_at: string;
    hospital?: string;
    notes?: string;
  }>;
  last_visit_date?: string;
}

@Injectable()
export class RestLegacyAdapter implements LegacyPatientAdapter {
  private readonly logger = new Logger(RestLegacyAdapter.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: LegacyCacheService,
  ) {
    this.baseUrl = this.configService.get<string>('LEGACY_API_URL', 'http://localhost:3001');
    this.apiKey = this.configService.get<string>('LEGACY_API_KEY', '');
    this.timeoutMs = this.configService.get<number>('LEGACY_API_TIMEOUT', 10000);
    this.maxRetries = this.configService.get<number>('LEGACY_API_RETRIES', 3);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }

  async searchPatients(query: string): Promise<LegacyPatient[]> {
    const cached = await this.cacheService.getSearchResults(query);
    if (cached) {
      this.logger.debug(`Cache hit for search query: ${query}`);
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<LegacyApiPatientResponse[]>(`${this.baseUrl}/patients/search`, {
            params: { q: query },
            headers: this.getHeaders(),
          })
          .pipe(
            timeout(this.timeoutMs),
            retry({ count: this.maxRetries, delay: 1000 }),
            catchError((error: AxiosError) => {
              this.logger.error(`Failed to search patients: ${error.message}`);
              throw new LegacySystemConnectionException('Failed to connect to legacy API');
            }),
          ),
      );

      const patients = response.data.map((p) => this.mapToLegacyPatient(p));
      await this.cacheService.setSearchResults(query, patients);
      return patients;
    } catch (error) {
      if (error instanceof LegacySystemConnectionException) {
        throw error;
      }
      this.logger.error('Unexpected error during patient search', error);
      throw new LegacySystemConnectionException('Unexpected error during patient search');
    }
  }

  async findPatientById(legacyId: string): Promise<LegacyPatient | null> {
    const cached = await this.cacheService.getPatient(legacyId);
    if (cached) {
      this.logger.debug(`Cache hit for patient: ${legacyId}`);
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<LegacyApiPatientResponse>(`${this.baseUrl}/patients/${legacyId}`, {
            headers: this.getHeaders(),
          })
          .pipe(
            timeout(this.timeoutMs),
            retry({ count: this.maxRetries, delay: 1000 }),
            catchError((error: AxiosError) => {
              if (error.response?.status === 404) {
                throw new LegacyPatientNotFoundException(legacyId);
              }
              this.logger.error(`Failed to find patient ${legacyId}: ${error.message}`);
              throw new LegacySystemConnectionException('Failed to connect to legacy API');
            }),
          ),
      );

      const patient = this.mapToLegacyPatient(response.data);
      await this.cacheService.setPatient(legacyId, patient);
      return patient;
    } catch (error) {
      if (error instanceof LegacySystemConnectionException) {
        throw error;
      }
      if (error instanceof LegacyPatientNotFoundException) {
        return null;
      }
      this.logger.error(`Unexpected error finding patient ${legacyId}`, error);
      throw new LegacySystemConnectionException('Unexpected error finding patient');
    }
  }

  async getMedicalHistory(legacyId: string): Promise<MedicalHistory> {
    const cached = await this.cacheService.getMedicalHistory(legacyId);
    if (cached) {
      this.logger.debug(`Cache hit for medical history: ${legacyId}`);
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<LegacyApiMedicalHistoryResponse>(
            `${this.baseUrl}/patients/${legacyId}/medical-history`,
            {
              headers: this.getHeaders(),
            },
          )
          .pipe(
            timeout(this.timeoutMs),
            retry({ count: this.maxRetries, delay: 1000 }),
            catchError((error: AxiosError) => {
              if (error.response?.status === 404) {
                throw new LegacyPatientNotFoundException(legacyId);
              }
              this.logger.error(`Failed to get medical history for ${legacyId}: ${error.message}`);
              throw new LegacySystemConnectionException('Failed to connect to legacy API');
            }),
          ),
      );

      const history = this.mapToMedicalHistory(response.data);
      await this.cacheService.setMedicalHistory(legacyId, history);
      return history;
    } catch (error) {
      if (
        error instanceof LegacySystemConnectionException ||
        error instanceof LegacyPatientNotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error getting medical history for ${legacyId}`, error);
      throw new LegacySystemConnectionException('Unexpected error getting medical history');
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ status: string }>(`${this.baseUrl}/health`, {
          headers: this.getHeaders(),
        }),
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private mapToLegacyPatient(response: LegacyApiPatientResponse): LegacyPatient {
    return {
      legacyId: response.patient_id,
      name: response.name,
      birthDate: new Date(response.birth_date),
      gender: response.gender,
      ssn: response.ssn,
      phone: response.phone,
      address: response.address,
      bloodType: response.blood_type,
      insuranceType: response.insurance_type,
      insuranceNumber: response.insurance_number,
    };
  }

  private mapToMedicalHistory(response: LegacyApiMedicalHistoryResponse): MedicalHistory {
    return {
      legacyId: response.patient_id,
      diagnoses: response.diagnoses.map((d) => this.mapToDiagnosis(d)),
      medications: response.medications.map((m) => this.mapToMedication(m)),
      allergies: response.allergies,
      surgeries: response.surgeries.map((s) => this.mapToSurgery(s)),
      lastVisitDate: response.last_visit_date ? new Date(response.last_visit_date) : undefined,
    };
  }

  private mapToDiagnosis(d: {
    code: string;
    name: string;
    diagnosed_at: string;
    status: string;
  }): Diagnosis {
    return {
      code: d.code,
      name: d.name,
      diagnosedAt: new Date(d.diagnosed_at),
      status: this.mapDiagnosisStatus(d.status),
    };
  }

  private mapToMedication(m: {
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date?: string;
  }): CurrentMedication {
    return {
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      startDate: new Date(m.start_date),
      endDate: m.end_date ? new Date(m.end_date) : undefined,
    };
  }

  private mapToSurgery(s: {
    name: string;
    performed_at: string;
    hospital?: string;
    notes?: string;
  }): Surgery {
    return {
      name: s.name,
      performedAt: new Date(s.performed_at),
      hospital: s.hospital,
      notes: s.notes,
    };
  }

  private mapDiagnosisStatus(status: string): 'ACTIVE' | 'RESOLVED' | 'CHRONIC' {
    const statusMap: Record<string, 'ACTIVE' | 'RESOLVED' | 'CHRONIC'> = {
      A: 'ACTIVE',
      R: 'RESOLVED',
      C: 'CHRONIC',
      ACTIVE: 'ACTIVE',
      RESOLVED: 'RESOLVED',
      CHRONIC: 'CHRONIC',
    };
    return statusMap[status.toUpperCase()] || 'ACTIVE';
  }
}
