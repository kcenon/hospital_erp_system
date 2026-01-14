import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LegacyPatientAdapter,
  LegacyPatient,
  MedicalHistory,
  Diagnosis,
  CurrentMedication,
  Surgery,
} from '../interfaces';
import { LegacyCacheService } from '../services/legacy-cache.service';
import { LegacySystemConnectionException } from '../exceptions';

interface JdbcConnection {
  query(sql: string, params: unknown[]): Promise<unknown[]>;
  close(): Promise<void>;
  isActive(): boolean;
}

interface JdbcConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  driverType: 'mssql' | 'oracle';
}

@Injectable()
export class JdbcLegacyAdapter implements LegacyPatientAdapter, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JdbcLegacyAdapter.name);
  private connection: JdbcConnection | null = null;
  private readonly config: JdbcConnectionConfig;
  private connectionRetries = 0;
  private readonly maxRetries = 3;

  constructor(
    @Inject('LEGACY_DB_CONNECTION')
    private readonly connectionFactory: () => Promise<JdbcConnection>,
    private readonly cacheService: LegacyCacheService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      host: this.configService.get<string>('LEGACY_DB_HOST', 'localhost'),
      port: this.configService.get<number>('LEGACY_DB_PORT', 1433),
      database: this.configService.get<string>('LEGACY_DB_NAME', 'legacy_hospital'),
      username: this.configService.get<string>('LEGACY_DB_USER', ''),
      password: this.configService.get<string>('LEGACY_DB_PASSWORD', ''),
      driverType: this.configService.get<'mssql' | 'oracle'>('LEGACY_DB_DRIVER', 'mssql'),
    };
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.warn('Failed to connect to legacy database on startup', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await this.connectionFactory();
      this.connectionRetries = 0;
      this.logger.log('Connected to legacy database');
    } catch (error) {
      this.connectionRetries++;
      this.logger.error(
        `Failed to connect to legacy database (attempt ${this.connectionRetries})`,
        error,
      );
      throw new LegacySystemConnectionException('Failed to connect to legacy database');
    }
  }

  private async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.logger.log('Disconnected from legacy database');
    }
  }

  private async ensureConnection(): Promise<JdbcConnection> {
    if (!this.connection || !this.connection.isActive()) {
      if (this.connectionRetries >= this.maxRetries) {
        throw new LegacySystemConnectionException('Max connection retries exceeded');
      }
      await this.connect();
    }
    return this.connection!;
  }

  async searchPatients(query: string): Promise<LegacyPatient[]> {
    const cached = await this.cacheService.getSearchResults(query);
    if (cached) {
      this.logger.debug(`Cache hit for search query: ${query}`);
      return cached;
    }

    const conn = await this.ensureConnection();
    const sql = `
      SELECT patient_id, name, birth_date, gender, ssn, phone, address,
             blood_type, insurance_type, insurance_number
      FROM PATIENTS
      WHERE name LIKE ? OR patient_id LIKE ?
      ORDER BY name
      LIMIT 50
    `;

    try {
      const results = await conn.query(sql, [`%${query}%`, `%${query}%`]);
      const patients = (results as Record<string, unknown>[]).map((row) =>
        this.mapToLegacyPatient(row),
      );
      await this.cacheService.setSearchResults(query, patients);
      return patients;
    } catch (error) {
      this.logger.error('Failed to search patients in legacy system', error);
      throw new LegacySystemConnectionException('Failed to search patients in legacy system');
    }
  }

  async findPatientById(legacyId: string): Promise<LegacyPatient | null> {
    const cached = await this.cacheService.getPatient(legacyId);
    if (cached) {
      this.logger.debug(`Cache hit for patient: ${legacyId}`);
      return cached;
    }

    const conn = await this.ensureConnection();
    const sql = `
      SELECT patient_id, name, birth_date, gender, ssn, phone, address,
             blood_type, insurance_type, insurance_number
      FROM PATIENTS
      WHERE patient_id = ?
    `;

    try {
      const results = await conn.query(sql, [legacyId]);
      if (results.length === 0) {
        return null;
      }

      const patient = this.mapToLegacyPatient(results[0] as Record<string, unknown>);
      await this.cacheService.setPatient(legacyId, patient);
      return patient;
    } catch (error) {
      this.logger.error(`Failed to find patient ${legacyId} in legacy system`, error);
      throw new LegacySystemConnectionException('Failed to find patient in legacy system');
    }
  }

  async getMedicalHistory(legacyId: string): Promise<MedicalHistory> {
    const cached = await this.cacheService.getMedicalHistory(legacyId);
    if (cached) {
      this.logger.debug(`Cache hit for medical history: ${legacyId}`);
      return cached;
    }

    const conn = await this.ensureConnection();

    try {
      const [diagnoses, medications, allergiesResult, surgeries, lastVisit] = await Promise.all([
        this.fetchDiagnoses(conn, legacyId),
        this.fetchMedications(conn, legacyId),
        this.fetchAllergies(conn, legacyId),
        this.fetchSurgeries(conn, legacyId),
        this.fetchLastVisitDate(conn, legacyId),
      ]);

      const history: MedicalHistory = {
        legacyId,
        diagnoses,
        medications,
        allergies: allergiesResult,
        surgeries,
        lastVisitDate: lastVisit,
      };

      await this.cacheService.setMedicalHistory(legacyId, history);
      return history;
    } catch (error) {
      this.logger.error(`Failed to fetch medical history for ${legacyId}`, error);
      throw new LegacySystemConnectionException('Failed to fetch medical history');
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!this.connection) {
        return false;
      }
      return this.connection.isActive();
    } catch {
      return false;
    }
  }

  private async fetchDiagnoses(conn: JdbcConnection, legacyId: string): Promise<Diagnosis[]> {
    const sql = `
      SELECT diagnosis_code, diagnosis_name, diagnosed_at, status
      FROM PATIENT_DIAGNOSES
      WHERE patient_id = ?
      ORDER BY diagnosed_at DESC
    `;
    const results = await conn.query(sql, [legacyId]);
    return (results as Record<string, unknown>[]).map((row) => ({
      code: String(row.diagnosis_code || ''),
      name: String(row.diagnosis_name || ''),
      diagnosedAt: new Date(row.diagnosed_at as string),
      status: this.mapDiagnosisStatus(String(row.status || '')),
    }));
  }

  private async fetchMedications(
    conn: JdbcConnection,
    legacyId: string,
  ): Promise<CurrentMedication[]> {
    const sql = `
      SELECT medication_name, dosage, frequency, start_date, end_date
      FROM PATIENT_MEDICATIONS
      WHERE patient_id = ? AND (end_date IS NULL OR end_date > GETDATE())
      ORDER BY start_date DESC
    `;
    const results = await conn.query(sql, [legacyId]);
    return (results as Record<string, unknown>[]).map((row) => ({
      name: String(row.medication_name || ''),
      dosage: String(row.dosage || ''),
      frequency: String(row.frequency || ''),
      startDate: new Date(row.start_date as string),
      endDate: row.end_date ? new Date(row.end_date as string) : undefined,
    }));
  }

  private async fetchAllergies(conn: JdbcConnection, legacyId: string): Promise<string[]> {
    const sql = `
      SELECT allergy_name
      FROM PATIENT_ALLERGIES
      WHERE patient_id = ?
    `;
    const results = await conn.query(sql, [legacyId]);
    return (results as Record<string, unknown>[]).map((row) => String(row.allergy_name || ''));
  }

  private async fetchSurgeries(conn: JdbcConnection, legacyId: string): Promise<Surgery[]> {
    const sql = `
      SELECT surgery_name, performed_at, hospital, notes
      FROM PATIENT_SURGERIES
      WHERE patient_id = ?
      ORDER BY performed_at DESC
    `;
    const results = await conn.query(sql, [legacyId]);
    return (results as Record<string, unknown>[]).map((row) => ({
      name: String(row.surgery_name || ''),
      performedAt: new Date(row.performed_at as string),
      hospital: row.hospital ? String(row.hospital) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
    }));
  }

  private async fetchLastVisitDate(
    conn: JdbcConnection,
    legacyId: string,
  ): Promise<Date | undefined> {
    const sql = `
      SELECT MAX(visit_date) as last_visit
      FROM PATIENT_VISITS
      WHERE patient_id = ?
    `;
    const results = await conn.query(sql, [legacyId]);
    if (results.length > 0) {
      const row = results[0] as Record<string, unknown>;
      return row.last_visit ? new Date(row.last_visit as string) : undefined;
    }
    return undefined;
  }

  private mapToLegacyPatient(row: Record<string, unknown>): LegacyPatient {
    return {
      legacyId: String(row.patient_id || ''),
      name: String(row.name || ''),
      birthDate: new Date(row.birth_date as string),
      gender: String(row.gender || ''),
      ssn: row.ssn ? String(row.ssn) : undefined,
      phone: row.phone ? String(row.phone) : undefined,
      address: row.address ? String(row.address) : undefined,
      bloodType: row.blood_type ? String(row.blood_type) : undefined,
      insuranceType: row.insurance_type ? String(row.insurance_type) : undefined,
      insuranceNumber: row.insurance_number ? String(row.insurance_number) : undefined,
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
