# System Integration Patterns Guide

## Document Information

| Item | Content |
|------|------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Manager | kcenon@naver.com |

---

## 1. Integration Overview

### 1.1 Target Systems

```
┌─────────────────────────────────────────────────────────────────┐
│                    System Integration Structure                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐                ┌──────────────────┐      │
│   │   Existing       │                │   New ERP        │      │
│   │   Clinical       │ ◀────────────▶ │   System         │      │
│   │   Program        │                │                  │      │
│   │   (Legacy)       │                │                  │      │
│   └────────┬─────────┘                └─────────┬────────┘      │
│            │                                    │                │
│            │                                    │                │
│   ┌────────┴─────────┐                ┌────────┴─────────┐      │
│   │   Legacy DB      │                │   PostgreSQL     │      │
│   │   (MSSQL/Oracle) │                │                  │      │
│   └──────────────────┘                └──────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Integration Strategies

| Strategy | Description | Use Case |
|------|------|----------|
| **Direct DB Connection** | Query legacy DB directly | When no API is available |
| **API Integration** | Call REST/SOAP API | When API is available (recommended) |
| **ETL Batch** | Periodic data synchronization | Read-only data |
| **Event-Based** | Real-time sync on changes | Bidirectional synchronization |
| **pacs_bridge Gateway** | HL7/FHIR protocol translation | LIS/EMR integration (recommended) |

### 1.3 pacs_bridge Integration Layer (Recommended)

For healthcare protocol integration (HL7, FHIR, DICOM), leverage the existing `pacs_bridge` project:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    pacs_bridge Integration Architecture                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   External Systems                                                        │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                    │
│   │   EMR/OCS   │   │     LIS     │   │    PACS     │                    │
│   │  (HL7 v2.x) │   │  (HL7/FHIR) │   │   (DICOM)   │                    │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                    │
│          │                 │                 │                            │
│          └─────────────────┼─────────────────┘                            │
│                            │                                              │
│                            ▼                                              │
│   ┌────────────────────────────────────────────────────────────────────┐ │
│   │                       pacs_bridge (C++23)                          │ │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │ │
│   │  │ HL7 v2.x   │  │ FHIR R4    │  │ Message    │  │ Patient    │   │ │
│   │  │ Gateway    │  │ Gateway    │  │ Queue      │  │ Cache      │   │ │
│   │  │ (MLLP/TLS) │  │ (REST)     │  │ (SQLite)   │  │ (TTL/LRU)  │   │ │
│   │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │ │
│   └────────────────────────────────────────────────────────────────────┘ │
│                            │                                              │
│                       REST API                                            │
│                            │                                              │
│                            ▼                                              │
│   ┌────────────────────────────────────────────────────────────────────┐ │
│   │                 hospital_erp_system (NestJS)                       │ │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐                   │ │
│   │  │ Integration│  │ Patient    │  │ Lab Result │                   │ │
│   │  │ Module     │  │ Service    │  │ Service    │                   │ │
│   │  └────────────┘  └────────────┘  └────────────┘                   │ │
│   └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 1.3.1 Integration Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Protocol Reuse** | HL7 v2.x parser/builder already implemented | 4-6 weeks development saved |
| **Security Ready** | TLS, OAuth2, audit logging implemented | Security compliance acceleration |
| **Message Queue** | Reliable SQLite-based message delivery | Guaranteed delivery, failure recovery |
| **FHIR Support** | R4 gateway in development | Future-proof architecture |
| **Monitoring** | Prometheus metrics, distributed tracing | Production-ready observability |

#### 1.3.2 pacs_bridge REST API Endpoints

```typescript
// Integration client for pacs_bridge REST API
@Injectable()
export class PacsBridgeClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Get patient from demographics cache
  async getPatient(patientId: string): Promise<PatientDto> {
    const url = `${this.baseUrl}/api/patients/${patientId}`;
    return this.get<PatientDto>(url);
  }

  // Get lab results from LIS via HL7 gateway
  async getLabResults(patientId: string): Promise<LabResultDto[]> {
    const url = `${this.baseUrl}/api/lab-results/${patientId}`;
    return this.get<LabResultDto[]>(url);
  }

  // Subscribe to HL7 ADT events
  async subscribeToADTEvents(callbackUrl: string): Promise<void> {
    const url = `${this.baseUrl}/api/subscriptions/adt`;
    await this.post(url, { callbackUrl, events: ['A01', 'A04', 'A08'] });
  }
}
```

#### 1.3.3 When to Use pacs_bridge

| Scenario | Recommended Approach |
|----------|---------------------|
| LIS integration | ✅ pacs_bridge HL7/FHIR Gateway |
| EMR/OCS patient query | ✅ pacs_bridge ADT Handler + Patient Cache |
| PACS image viewer link | ✅ pacs_system DICOMweb API |
| Direct legacy DB query | Direct DB connection (when HL7 not available) |
| Simple data migration | ETL Batch |

> **Reference**: [lis-integration.md](../02-design/lis-integration.md) for detailed LIS integration specification

---

## 2. Legacy DB Integration

### 2.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Adapter Pattern Applied                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    Application Layer                     │  │
│   │  ┌─────────────────────────────────────────────────┐    │  │
│   │  │              PatientService                      │    │  │
│   │  │                                                  │    │  │
│   │  │   findByLegacyId(legacyId): Patient             │    │  │
│   │  │   syncFromLegacy(patientNumber): Patient        │    │  │
│   │  │                                                  │    │  │
│   │  └─────────────────────┬────────────────────────────┘    │  │
│   └────────────────────────┼─────────────────────────────────┘  │
│                            │                                     │
│   ┌────────────────────────┼─────────────────────────────────┐  │
│   │                        ▼                                  │  │
│   │   ┌─────────────────────────────────────────────────┐   │  │
│   │   │           LegacyPatientAdapter                   │   │  │
│   │   │   (implements PatientDataSource)                 │   │  │
│   │   │                                                  │   │  │
│   │   │   + getPatientByNumber(num): LegacyPatient      │   │  │
│   │   │   + mapToPatient(legacy): Patient               │   │  │
│   │   │                                                  │   │  │
│   │   └─────────────────────┬────────────────────────────┘   │  │
│   │                         │                                 │  │
│   │          Infrastructure Layer                             │  │
│   └─────────────────────────┼─────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                   Legacy Database                        │  │
│   │                   (MSSQL/Oracle)                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Database Connection (Prisma)

```typescript
// prisma/schema.prisma - Main database
generator client {
  provider = "prisma-client-js"
  output   = "./generated/main"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Patient {
  id              String   @id @default(uuid())
  patientNumber   String   @unique @map("patient_number")
  name            String
  legacyPatientId String?  @map("legacy_patient_id")
  legacySyncAt    DateTime? @map("legacy_sync_at")
  // ...
}
```

```typescript
// src/legacy/legacy.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'legacy',
      type: 'mssql',  // or 'oracle'
      host: process.env.LEGACY_DB_HOST,
      port: parseInt(process.env.LEGACY_DB_PORT, 10),
      username: process.env.LEGACY_DB_USER,
      password: process.env.LEGACY_DB_PASSWORD,
      database: process.env.LEGACY_DB_NAME,
      entities: [LegacyPatient, LegacyAdmission],
      synchronize: false,  // Do not synchronize legacy DB
      extra: {
        trustServerCertificate: true,
      },
    }),
    TypeOrmModule.forFeature([LegacyPatient, LegacyAdmission], 'legacy'),
  ],
  providers: [LegacyPatientAdapter, LegacyAdmissionAdapter],
  exports: [LegacyPatientAdapter, LegacyAdmissionAdapter],
})
export class LegacyModule {}
```

### 2.3 Legacy Entity Mapping

```typescript
// src/legacy/entities/legacy-patient.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'TB_PATIENT', database: 'legacy' })
export class LegacyPatient {
  @PrimaryColumn({ name: 'PATIENT_ID' })
  patientId: string;

  @Column({ name: 'PATIENT_NO' })
  patientNo: string;

  @Column({ name: 'PATIENT_NM' })
  patientName: string;

  @Column({ name: 'BIRTH_DT' })
  birthDate: Date;

  @Column({ name: 'SEX_CD' })
  sexCode: string;  // '1': Male, '2': Female

  @Column({ name: 'BLOOD_TYPE_CD' })
  bloodTypeCode: string;

  @Column({ name: 'TEL_NO' })
  telNo: string;

  @Column({ name: 'REG_DT' })
  regDate: Date;

  @Column({ name: 'UPD_DT' })
  updDate: Date;
}
```

### 2.4 Adapter Implementation

```typescript
// src/legacy/adapters/legacy-patient.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegacyPatient } from '../entities/legacy-patient.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { PatientDataSource } from '../../patient/interfaces/patient-data-source.interface';

@Injectable()
export class LegacyPatientAdapter implements PatientDataSource {
  constructor(
    @InjectRepository(LegacyPatient, 'legacy')
    private readonly legacyPatientRepo: Repository<LegacyPatient>,
  ) {}

  async findByPatientNumber(patientNumber: string): Promise<Patient | null> {
    const legacy = await this.legacyPatientRepo.findOne({
      where: { patientNo: patientNumber },
    });

    if (!legacy) {
      return null;
    }

    return this.mapToPatient(legacy);
  }

  async findById(legacyId: string): Promise<Patient | null> {
    const legacy = await this.legacyPatientRepo.findOne({
      where: { patientId: legacyId },
    });

    if (!legacy) {
      return null;
    }

    return this.mapToPatient(legacy);
  }

  private mapToPatient(legacy: LegacyPatient): Partial<Patient> {
    return {
      patientNumber: legacy.patientNo,
      name: legacy.patientName,
      birthDate: legacy.birthDate,
      gender: this.mapGender(legacy.sexCode),
      bloodType: this.mapBloodType(legacy.bloodTypeCode),
      phone: this.formatPhone(legacy.telNo),
      legacyPatientId: legacy.patientId,
      legacySyncAt: new Date(),
    };
  }

  private mapGender(sexCode: string): 'M' | 'F' {
    return sexCode === '1' ? 'M' : 'F';
  }

  private mapBloodType(code: string): string | null {
    const bloodTypeMap: Record<string, string> = {
      '01': 'A+', '02': 'A-',
      '03': 'B+', '04': 'B-',
      '05': 'O+', '06': 'O-',
      '07': 'AB+', '08': 'AB-',
    };
    return bloodTypeMap[code] ?? null;
  }

  private formatPhone(telNo: string): string | null {
    if (!telNo) return null;
    // 01012345678 -> 010-1234-5678
    const cleaned = telNo.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return telNo;
  }
}
```

### 2.5 Synchronization Service

```typescript
// src/integration/services/patient-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { LegacyPatientAdapter } from '../../legacy/adapters/legacy-patient.adapter';

@Injectable()
export class PatientSyncService {
  private readonly logger = new Logger(PatientSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyAdapter: LegacyPatientAdapter,
  ) {}

  /**
   * Fetch patient information from legacy system by patient number and sync
   */
  async syncPatientByNumber(patientNumber: string): Promise<Patient> {
    this.logger.log(`Syncing patient: ${patientNumber}`);

    // 1. Query from legacy system
    const legacyData = await this.legacyAdapter.findByPatientNumber(patientNumber);

    if (!legacyData) {
      throw new NotFoundException(`Patient information not found in legacy system: ${patientNumber}`);
    }

    // 2. Check existing patient
    const existingPatient = await this.prisma.patient.findUnique({
      where: { patientNumber },
    });

    // 3. Create or update
    if (existingPatient) {
      return this.prisma.patient.update({
        where: { id: existingPatient.id },
        data: {
          ...legacyData,
          legacySyncAt: new Date(),
        },
      });
    } else {
      return this.prisma.patient.create({
        data: {
          ...legacyData,
          legacySyncAt: new Date(),
        },
      });
    }
  }

  /**
   * Query cached patient information (sync on cache miss)
   */
  async getPatientWithSync(patientNumber: string, maxAge: number = 5 * 60 * 1000): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({
      where: { patientNumber },
    });

    // Cache validity check (5 minutes)
    if (patient && patient.legacySyncAt) {
      const syncAge = Date.now() - patient.legacySyncAt.getTime();
      if (syncAge < maxAge) {
        return patient;
      }
    }

    // Sync needed
    return this.syncPatientByNumber(patientNumber);
  }

  /**
   * Batch synchronization (daily at 2 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async syncAllPatients(): Promise<void> {
    this.logger.log('Starting daily patient sync...');

    const batchSize = 100;
    let offset = 0;
    let synced = 0;
    let failed = 0;

    while (true) {
      // Query patients with stale sync
      const patients = await this.prisma.patient.findMany({
        where: {
          legacyPatientId: { not: null },
          OR: [
            { legacySyncAt: null },
            { legacySyncAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          ],
        },
        take: batchSize,
        skip: offset,
      });

      if (patients.length === 0) break;

      for (const patient of patients) {
        try {
          await this.syncPatientByNumber(patient.patientNumber);
          synced++;
        } catch (error) {
          this.logger.error(`Failed to sync patient ${patient.patientNumber}:`, error);
          failed++;
        }
      }

      offset += batchSize;
    }

    this.logger.log(`Sync completed. Synced: ${synced}, Failed: ${failed}`);
  }
}
```

---

## 3. API Integration

### 3.1 HTTP Client Configuration

```typescript
// src/integration/http/legacy-api.client.ts
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class LegacyApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('LEGACY_API_URL');
    this.apiKey = this.configService.get('LEGACY_API_KEY');
  }

  async getPatient(patientNumber: string): Promise<LegacyPatientDto> {
    const url = `${this.baseUrl}/patients/${patientNumber}`;

    const response = await firstValueFrom(
      this.httpService.get<LegacyPatientDto>(url, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      }).pipe(
        timeout(this.timeout),
        retry({ count: 3, delay: 1000 }),
        catchError((error: AxiosError) => {
          throw this.handleError(error);
        }),
      ),
    );

    return response.data;
  }

  async searchPatients(query: string): Promise<LegacyPatientDto[]> {
    const url = `${this.baseUrl}/patients/search`;

    const response = await firstValueFrom(
      this.httpService.get<LegacyPatientDto[]>(url, {
        params: { q: query },
        headers: {
          'X-API-Key': this.apiKey,
        },
      }).pipe(
        timeout(this.timeout),
        retry({ count: 2, delay: 500 }),
        catchError((error: AxiosError) => {
          throw this.handleError(error);
        }),
      ),
    );

    return response.data;
  }

  private handleError(error: AxiosError): HttpException {
    if (error.response) {
      // Server response error
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;

      if (status === 404) {
        return new NotFoundException('Data not found in legacy system.');
      }
      if (status === 401 || status === 403) {
        return new UnauthorizedException('Legacy system authentication failed');
      }

      return new HttpException(message, status);
    }

    if (error.code === 'ECONNABORTED') {
      return new RequestTimeoutException('Legacy system response timeout');
    }

    return new ServiceUnavailableException('Legacy system connection failed');
  }
}
```

### 3.2 Circuit Breaker Pattern

```typescript
// src/integration/circuit-breaker/circuit-breaker.decorator.ts
import { Injectable } from '@nestjs/common';

interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  isOpen: boolean;
}

@Injectable()
export class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private readonly threshold = 5;
  private readonly resetTimeout = 30000; // 30 seconds

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    fallback?: () => T,
  ): Promise<T> {
    const state = this.getState(key);

    // Check circuit open state
    if (state.isOpen) {
      if (this.shouldReset(state)) {
        state.isOpen = false;
        state.failures = 0;
      } else {
        if (fallback) {
          return fallback();
        }
        throw new ServiceUnavailableException('Service temporarily unavailable');
      }
    }

    try {
      const result = await fn();
      // Reset failure count on success
      state.failures = 0;
      return result;
    } catch (error) {
      state.failures++;
      state.lastFailure = new Date();

      if (state.failures >= this.threshold) {
        state.isOpen = true;
      }

      throw error;
    }
  }

  private getState(key: string): CircuitBreakerState {
    if (!this.states.has(key)) {
      this.states.set(key, {
        failures: 0,
        lastFailure: null,
        isOpen: false,
      });
    }
    return this.states.get(key)!;
  }

  private shouldReset(state: CircuitBreakerState): boolean {
    if (!state.lastFailure) return true;
    return Date.now() - state.lastFailure.getTime() > this.resetTimeout;
  }
}
```

### 3.3 Usage Example

```typescript
// src/integration/services/legacy-patient.service.ts
@Injectable()
export class LegacyPatientService {
  constructor(
    private readonly legacyApiClient: LegacyApiClient,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly cacheManager: Cache,
  ) {}

  async getPatient(patientNumber: string): Promise<PatientDto> {
    // 1. Check cache
    const cacheKey = `legacy:patient:${patientNumber}`;
    const cached = await this.cacheManager.get<PatientDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. API call with Circuit Breaker
    const legacyData = await this.circuitBreaker.execute(
      'legacy-patient-api',
      () => this.legacyApiClient.getPatient(patientNumber),
      () => null, // Return null on failure
    );

    if (!legacyData) {
      throw new ServiceUnavailableException('Legacy system temporarily unavailable');
    }

    // 3. Mapping
    const patient = this.mapToPatientDto(legacyData);

    // 4. Save to cache (5 minutes)
    await this.cacheManager.set(cacheKey, patient, 300);

    return patient;
  }
}
```

---

## 4. Data Synchronization Strategies

### 4.1 Synchronization Method Comparison

| Method | Advantages | Disadvantages | Application |
|------|------|------|------|
| **On-Demand** | Always current, simple | Latency | Real-time queries |
| **Scheduled** | Consistency, load distribution | Delay | Daily sync |
| **Event-Based** | Real-time, efficient | Complex implementation | Bidirectional sync |

### 4.2 On-Demand Synchronization

```typescript
// Sync at query time
async getPatientDetails(patientNumber: string): Promise<PatientDetails> {
  // 1. Query local DB
  let patient = await this.patientRepo.findByNumber(patientNumber);

  // 2. Sync from legacy if not found or stale
  if (!patient || this.isStale(patient.legacySyncAt)) {
    const legacyData = await this.legacyAdapter.findByPatientNumber(patientNumber);
    patient = await this.upsertPatient(legacyData);
  }

  // 3. Always query medical records from legacy (read-only)
  const medicalRecords = await this.legacyAdapter.getMedicalRecords(patientNumber);

  return {
    ...patient,
    medicalRecords,
  };
}

private isStale(syncAt: Date | null, maxAge = 5 * 60 * 1000): boolean {
  if (!syncAt) return true;
  return Date.now() - syncAt.getTime() > maxAge;
}
```

### 4.3 Event-Based Synchronization

```typescript
// src/integration/events/patient-sync.event.ts
export class PatientUpdatedEvent {
  constructor(
    public readonly patientNumber: string,
    public readonly source: 'legacy' | 'erp',
    public readonly changes: Partial<Patient>,
  ) {}
}

// src/integration/listeners/legacy-sync.listener.ts
@Injectable()
export class LegacySyncListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyApiClient: LegacyApiClient,
  ) {}

  @OnEvent('patient.updated')
  async handlePatientUpdated(event: PatientUpdatedEvent) {
    if (event.source === 'erp') {
      // Changed in ERP -> propagate to legacy
      await this.syncToLegacy(event.patientNumber, event.changes);
    }
  }

  private async syncToLegacy(patientNumber: string, changes: Partial<Patient>) {
    // Send update request to legacy API
    await this.legacyApiClient.updatePatient(patientNumber, {
      telNo: changes.phone?.replace(/-/g, ''),
      // ... mapping
    });
  }
}
```

---

## 5. Medical Standards Integration

### 5.1 HL7 FHIR Integration

```typescript
// src/integration/fhir/fhir-patient.mapper.ts
import { Patient as FhirPatient } from 'fhir/r4';

export class FhirPatientMapper {
  /**
   * Convert internal Patient to FHIR Patient
   */
  toFhir(patient: Patient): FhirPatient {
    return {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        {
          system: 'urn:hospital:patient-number',
          value: patient.patientNumber,
        },
      ],
      name: [
        {
          use: 'official',
          text: patient.name,
          family: patient.name.slice(0, 1),
          given: [patient.name.slice(1)],
        },
      ],
      gender: patient.gender === 'M' ? 'male' : 'female',
      birthDate: patient.birthDate.toISOString().split('T')[0],
      telecom: patient.phone
        ? [
            {
              system: 'phone',
              value: patient.phone,
              use: 'mobile',
            },
          ]
        : undefined,
      address: patient.address
        ? [
            {
              use: 'home',
              text: patient.address,
            },
          ]
        : undefined,
    };
  }

  /**
   * Convert FHIR Patient to internal Patient
   */
  fromFhir(fhir: FhirPatient): Partial<Patient> {
    const identifier = fhir.identifier?.find(
      (id) => id.system === 'urn:hospital:patient-number',
    );

    return {
      patientNumber: identifier?.value,
      name: fhir.name?.[0]?.text || '',
      gender: fhir.gender === 'male' ? 'M' : 'F',
      birthDate: fhir.birthDate ? new Date(fhir.birthDate) : undefined,
      phone: fhir.telecom?.find((t) => t.system === 'phone')?.value,
      address: fhir.address?.[0]?.text,
    };
  }
}
```

### 5.2 HL7 v2 Message Parsing

```typescript
// src/integration/hl7/hl7-parser.ts
import { Injectable } from '@nestjs/common';

interface Hl7Message {
  segments: Hl7Segment[];
}

interface Hl7Segment {
  name: string;
  fields: string[];
}

@Injectable()
export class Hl7Parser {
  private readonly segmentSeparator = '\r';
  private readonly fieldSeparator = '|';
  private readonly componentSeparator = '^';

  parse(rawMessage: string): Hl7Message {
    const lines = rawMessage.split(this.segmentSeparator);
    const segments = lines
      .filter((line) => line.trim())
      .map((line) => this.parseSegment(line));

    return { segments };
  }

  private parseSegment(line: string): Hl7Segment {
    const fields = line.split(this.fieldSeparator);
    return {
      name: fields[0],
      fields: fields.slice(1),
    };
  }

  /**
   * Parse ADT^A01 (Admission) message
   */
  parseAdmission(message: Hl7Message): AdmissionData {
    const pid = message.segments.find((s) => s.name === 'PID');
    const pv1 = message.segments.find((s) => s.name === 'PV1');

    if (!pid || !pv1) {
      throw new Error('Invalid ADT message: missing PID or PV1 segment');
    }

    return {
      patientNumber: pid.fields[2], // PID-3
      patientName: this.parseName(pid.fields[4]), // PID-5
      birthDate: this.parseDate(pid.fields[6]), // PID-7
      gender: this.parseGender(pid.fields[7]), // PID-8
      roomNumber: pv1.fields[2], // PV1-3
      admissionDate: this.parseDateTime(pv1.fields[43]), // PV1-44
      attendingDoctor: pv1.fields[6], // PV1-7
    };
  }

  private parseName(field: string): string {
    const components = field.split(this.componentSeparator);
    // Format: Family^Given
    return `${components[0]}${components[1] || ''}`;
  }

  private parseDate(field: string): Date {
    // YYYYMMDD format
    const year = parseInt(field.slice(0, 4));
    const month = parseInt(field.slice(4, 6)) - 1;
    const day = parseInt(field.slice(6, 8));
    return new Date(year, month, day);
  }

  private parseDateTime(field: string): Date {
    // YYYYMMDDHHMMSS format
    const date = this.parseDate(field);
    date.setHours(parseInt(field.slice(8, 10)));
    date.setMinutes(parseInt(field.slice(10, 12)));
    date.setSeconds(parseInt(field.slice(12, 14)));
    return date;
  }

  private parseGender(field: string): 'M' | 'F' {
    return field === 'M' ? 'M' : 'F';
  }
}
```

---

## 6. Error Handling and Resilience

### 6.1 Retry Strategy

```typescript
// src/integration/retry/retry.decorator.ts
export function Retry(options: RetryOptions = {}) {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;
      let currentDelay = delay;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt < maxAttempts) {
            await sleep(currentDelay);
            currentDelay *= backoff;
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

// Usage example
@Injectable()
export class LegacyService {
  @Retry({ maxAttempts: 3, delay: 1000, backoff: 2 })
  async fetchPatient(id: string): Promise<Patient> {
    return this.legacyApi.getPatient(id);
  }
}
```

### 6.2 Fallback Strategy

```typescript
// src/integration/services/patient-integration.service.ts
@Injectable()
export class PatientIntegrationService {
  async getPatientData(patientNumber: string): Promise<PatientData> {
    try {
      // Primary: Try legacy API
      return await this.legacyApiClient.getPatient(patientNumber);
    } catch (error) {
      this.logger.warn(`Legacy API failed, trying DB direct: ${error.message}`);

      try {
        // Secondary: Try direct DB connection
        return await this.legacyDbAdapter.findByPatientNumber(patientNumber);
      } catch (dbError) {
        this.logger.warn(`Legacy DB failed, using cached: ${dbError.message}`);

        // Tertiary: Use cached data
        const cached = await this.getCachedPatient(patientNumber);
        if (cached) {
          return {
            ...cached,
            _stale: true, // Mark as stale data
          };
        }

        throw new ServiceUnavailableException(
          'Unable to retrieve patient information. Please try again later.',
        );
      }
    }
  }
}
```

---

## 7. Monitoring and Logging

### 7.1 Integration Metrics

```typescript
// src/integration/metrics/integration.metrics.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class IntegrationMetrics {
  private readonly syncCounter = new Counter({
    name: 'legacy_sync_total',
    help: 'Total number of legacy sync operations',
    labelNames: ['operation', 'status'],
  });

  private readonly syncDuration = new Histogram({
    name: 'legacy_sync_duration_seconds',
    help: 'Duration of legacy sync operations',
    labelNames: ['operation'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  });

  recordSync(operation: string, status: 'success' | 'failure', duration: number) {
    this.syncCounter.inc({ operation, status });
    this.syncDuration.observe({ operation }, duration / 1000);
  }
}
```

### 7.2 Integration Logging

```typescript
// src/integration/interceptors/integration-logging.interceptor.ts
@Injectable()
export class IntegrationLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Integration');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log({
            message: 'Integration call succeeded',
            class: className,
            method: methodName,
            duration,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            message: 'Integration call failed',
            class: className,
            method: methodName,
            duration,
            error: error.message,
          });
        },
      }),
    );
  }
}
```

---

## 8. Checklist

### Integration Implementation Checklist

- [ ] Legacy DB schema analysis complete
- [ ] Entity mapping defined
- [ ] Adapter classes implemented
- [ ] Synchronization service implemented
- [ ] Circuit Breaker applied
- [ ] Retry logic implemented
- [ ] Fallback strategy established
- [ ] Caching strategy applied
- [ ] Error handling and logging
- [ ] Monitoring metrics configured
- [ ] Integration tests written
