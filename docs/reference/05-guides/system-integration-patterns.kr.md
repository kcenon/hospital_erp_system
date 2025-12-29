# 시스템 연동 패턴 가이드

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 0.1.0.0 |
| 작성일 | 2025-12-29 |
| 상태 | 초안 |
| 관리자 | kcenon@naver.com |

---

## 1. 연동 개요

### 1.1 연동 대상 시스템

```
┌─────────────────────────────────────────────────────────────────┐
│                        시스템 연동 구조                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐                ┌──────────────────┐      │
│   │   기존 진료       │                │   신규 ERP        │      │
│   │   프로그램        │ ◀────────────▶ │   시스템          │      │
│   │   (레거시)        │                │                   │      │
│   └────────┬─────────┘                └─────────┬─────────┘      │
│            │                                    │                │
│            │                                    │                │
│   ┌────────┴─────────┐                ┌────────┴─────────┐      │
│   │   Legacy DB      │                │   PostgreSQL     │      │
│   │   (MSSQL/Oracle) │                │                  │      │
│   └──────────────────┘                └──────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 연동 전략

| 전략 | 설명 | 적용 상황 |
|------|------|----------|
| **DB 직접 연결** | 레거시 DB를 직접 조회 | API 미제공 시 |
| **API 연동** | REST/SOAP API 호출 | API 제공 시 (권장) |
| **ETL 배치** | 주기적 데이터 동기화 | 읽기 전용 데이터 |
| **이벤트 기반** | 변경 시 실시간 동기화 | 양방향 동기화 |
| **pacs_bridge 게이트웨이** | HL7/FHIR 프로토콜 변환 | LIS/EMR 연동 (권장) |

### 1.3 pacs_bridge 연동 계층 (권장)

의료 프로토콜 연동(HL7, FHIR, DICOM)을 위해 기존 `pacs_bridge` 프로젝트를 활용합니다:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     pacs_bridge 연동 아키텍처                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   외부 시스템                                                              │
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
│   │  │ HL7 v2.x   │  │ FHIR R4    │  │  메시지    │  │   환자     │   │ │
│   │  │ 게이트웨이  │  │ 게이트웨이  │  │    큐      │  │   캐시     │   │ │
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
│   │  │  연동      │  │   환자     │  │  검사결과   │                   │ │
│   │  │  모듈      │  │  서비스    │  │  서비스    │                   │ │
│   │  └────────────┘  └────────────┘  └────────────┘                   │ │
│   └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 1.3.1 연동 이점

| 이점 | 설명 | 영향 |
|------|------|------|
| **프로토콜 재사용** | HL7 v2.x 파서/빌더 이미 구현 | 4-6주 개발 기간 단축 |
| **보안 준비 완료** | TLS, OAuth2, 감사 로깅 구현됨 | 보안 규정 준수 가속화 |
| **메시지 큐** | SQLite 기반 안정적 메시지 전달 | 전달 보장, 장애 복구 |
| **FHIR 지원** | R4 게이트웨이 개발 진행 중 | 미래 지향적 아키텍처 |
| **모니터링** | Prometheus 메트릭, 분산 트레이싱 | 운영 준비 완료된 관측성 |

#### 1.3.2 pacs_bridge REST API 엔드포인트

```typescript
// pacs_bridge REST API 연동 클라이언트
@Injectable()
export class PacsBridgeClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // 인구통계 캐시에서 환자 조회
  async getPatient(patientId: string): Promise<PatientDto> {
    const url = `${this.baseUrl}/api/patients/${patientId}`;
    return this.get<PatientDto>(url);
  }

  // HL7 게이트웨이를 통해 LIS에서 검사 결과 조회
  async getLabResults(patientId: string): Promise<LabResultDto[]> {
    const url = `${this.baseUrl}/api/lab-results/${patientId}`;
    return this.get<LabResultDto[]>(url);
  }

  // HL7 ADT 이벤트 구독
  async subscribeToADTEvents(callbackUrl: string): Promise<void> {
    const url = `${this.baseUrl}/api/subscriptions/adt`;
    await this.post(url, { callbackUrl, events: ['A01', 'A04', 'A08'] });
  }
}
```

#### 1.3.3 pacs_bridge 사용 시나리오

| 시나리오 | 권장 접근 방식 |
|----------|--------------|
| LIS 연동 | ✅ pacs_bridge HL7/FHIR 게이트웨이 |
| EMR/OCS 환자 조회 | ✅ pacs_bridge ADT 핸들러 + 환자 캐시 |
| PACS 영상 뷰어 링크 | ✅ pacs_system DICOMweb API |
| 레거시 DB 직접 조회 | DB 직접 연결 (HL7 미지원 시) |
| 단순 데이터 이관 | ETL 배치 |

> **참조**: [lis-integration.md](../02-design/lis-integration.md) 상세 LIS 연동 규격

---

## 2. 레거시 DB 연동

### 2.1 연동 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                      Adapter Pattern 적용                        │
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

### 2.2 다중 데이터베이스 연결 (Prisma)

```typescript
// prisma/schema.prisma - 주 데이터베이스
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
      type: 'mssql',  // 또는 'oracle'
      host: process.env.LEGACY_DB_HOST,
      port: parseInt(process.env.LEGACY_DB_PORT, 10),
      username: process.env.LEGACY_DB_USER,
      password: process.env.LEGACY_DB_PASSWORD,
      database: process.env.LEGACY_DB_NAME,
      entities: [LegacyPatient, LegacyAdmission],
      synchronize: false,  // 레거시 DB는 동기화 하지 않음
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

### 2.3 레거시 엔터티 매핑

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
  sexCode: string;  // '1': 남, '2': 여

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

### 2.4 Adapter 구현

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

### 2.5 동기화 서비스

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
   * 환자번호로 레거시 시스템에서 환자 정보를 가져와 동기화
   */
  async syncPatientByNumber(patientNumber: string): Promise<Patient> {
    this.logger.log(`Syncing patient: ${patientNumber}`);

    // 1. 레거시 시스템에서 조회
    const legacyData = await this.legacyAdapter.findByPatientNumber(patientNumber);

    if (!legacyData) {
      throw new NotFoundException(`레거시 시스템에 환자 정보가 없습니다: ${patientNumber}`);
    }

    // 2. 기존 환자 확인
    const existingPatient = await this.prisma.patient.findUnique({
      where: { patientNumber },
    });

    // 3. 생성 또는 업데이트
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
   * 캐시된 환자 정보 조회 (캐시 미스 시 동기화)
   */
  async getPatientWithSync(patientNumber: string, maxAge: number = 5 * 60 * 1000): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({
      where: { patientNumber },
    });

    // 캐시 유효성 검사 (5분)
    if (patient && patient.legacySyncAt) {
      const syncAge = Date.now() - patient.legacySyncAt.getTime();
      if (syncAge < maxAge) {
        return patient;
      }
    }

    // 동기화 필요
    return this.syncPatientByNumber(patientNumber);
  }

  /**
   * 배치 동기화 (매일 새벽 2시)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async syncAllPatients(): Promise<void> {
    this.logger.log('Starting daily patient sync...');

    const batchSize = 100;
    let offset = 0;
    let synced = 0;
    let failed = 0;

    while (true) {
      // 동기화가 오래된 환자 조회
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

## 3. API 연동

### 3.1 HTTP 클라이언트 설정

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
  private readonly timeout = 10000; // 10초

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
      // 서버 응답 에러
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;

      if (status === 404) {
        return new NotFoundException('레거시 시스템에서 데이터를 찾을 수 없습니다.');
      }
      if (status === 401 || status === 403) {
        return new UnauthorizedException('레거시 시스템 인증 실패');
      }

      return new HttpException(message, status);
    }

    if (error.code === 'ECONNABORTED') {
      return new RequestTimeoutException('레거시 시스템 응답 시간 초과');
    }

    return new ServiceUnavailableException('레거시 시스템 연결 실패');
  }
}
```

### 3.2 Circuit Breaker 패턴

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
  private readonly resetTimeout = 30000; // 30초

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    fallback?: () => T,
  ): Promise<T> {
    const state = this.getState(key);

    // 회로 열림 상태 확인
    if (state.isOpen) {
      if (this.shouldReset(state)) {
        state.isOpen = false;
        state.failures = 0;
      } else {
        if (fallback) {
          return fallback();
        }
        throw new ServiceUnavailableException('서비스 일시 중단');
      }
    }

    try {
      const result = await fn();
      // 성공 시 실패 카운트 리셋
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

### 3.3 사용 예시

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
    // 1. 캐시 확인
    const cacheKey = `legacy:patient:${patientNumber}`;
    const cached = await this.cacheManager.get<PatientDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Circuit Breaker로 API 호출
    const legacyData = await this.circuitBreaker.execute(
      'legacy-patient-api',
      () => this.legacyApiClient.getPatient(patientNumber),
      () => null, // 실패 시 null 반환
    );

    if (!legacyData) {
      throw new ServiceUnavailableException('레거시 시스템 일시 중단');
    }

    // 3. 매핑
    const patient = this.mapToPatientDto(legacyData);

    // 4. 캐시 저장 (5분)
    await this.cacheManager.set(cacheKey, patient, 300);

    return patient;
  }
}
```

---

## 4. 데이터 동기화 전략

### 4.1 동기화 방식 비교

| 방식 | 장점 | 단점 | 적용 |
|------|------|------|------|
| **On-Demand** | 항상 최신, 간단 | 지연 발생 | 실시간 조회 |
| **Scheduled** | 일관성, 부하 분산 | 지연 있음 | 일별 동기화 |
| **Event-Based** | 실시간, 효율적 | 구현 복잡 | 양방향 동기화 |

### 4.2 On-Demand 동기화

```typescript
// 조회 시점에 동기화
async getPatientDetails(patientNumber: string): Promise<PatientDetails> {
  // 1. 로컬 DB 조회
  let patient = await this.patientRepo.findByNumber(patientNumber);

  // 2. 없거나 오래된 경우 레거시에서 동기화
  if (!patient || this.isStale(patient.legacySyncAt)) {
    const legacyData = await this.legacyAdapter.findByPatientNumber(patientNumber);
    patient = await this.upsertPatient(legacyData);
  }

  // 3. 진료 정보는 항상 레거시에서 조회 (읽기 전용)
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

### 4.3 이벤트 기반 동기화

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
      // ERP에서 변경된 경우 -> 레거시로 전파
      await this.syncToLegacy(event.patientNumber, event.changes);
    }
  }

  private async syncToLegacy(patientNumber: string, changes: Partial<Patient>) {
    // 레거시 API로 업데이트 요청
    await this.legacyApiClient.updatePatient(patientNumber, {
      telNo: changes.phone?.replace(/-/g, ''),
      // ... 매핑
    });
  }
}
```

---

## 5. 의료 표준 연동

### 5.1 HL7 FHIR 연동

```typescript
// src/integration/fhir/fhir-patient.mapper.ts
import { Patient as FhirPatient } from 'fhir/r4';

export class FhirPatientMapper {
  /**
   * 내부 Patient를 FHIR Patient로 변환
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
   * FHIR Patient를 내부 Patient로 변환
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

### 5.2 HL7 v2 메시지 파싱

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
   * ADT^A01 (입원) 메시지 파싱
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
    // 한국어: 성^이름 형식
    return `${components[0]}${components[1] || ''}`;
  }

  private parseDate(field: string): Date {
    // YYYYMMDD 형식
    const year = parseInt(field.slice(0, 4));
    const month = parseInt(field.slice(4, 6)) - 1;
    const day = parseInt(field.slice(6, 8));
    return new Date(year, month, day);
  }

  private parseDateTime(field: string): Date {
    // YYYYMMDDHHMMSS 형식
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

## 6. 에러 처리 및 복원력

### 6.1 재시도 전략

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

// 사용 예시
@Injectable()
export class LegacyService {
  @Retry({ maxAttempts: 3, delay: 1000, backoff: 2 })
  async fetchPatient(id: string): Promise<Patient> {
    return this.legacyApi.getPatient(id);
  }
}
```

### 6.2 Fallback 전략

```typescript
// src/integration/services/patient-integration.service.ts
@Injectable()
export class PatientIntegrationService {
  async getPatientData(patientNumber: string): Promise<PatientData> {
    try {
      // 1차: 레거시 API 시도
      return await this.legacyApiClient.getPatient(patientNumber);
    } catch (error) {
      this.logger.warn(`Legacy API failed, trying DB direct: ${error.message}`);

      try {
        // 2차: DB 직접 연결 시도
        return await this.legacyDbAdapter.findByPatientNumber(patientNumber);
      } catch (dbError) {
        this.logger.warn(`Legacy DB failed, using cached: ${dbError.message}`);

        // 3차: 캐시된 데이터 사용
        const cached = await this.getCachedPatient(patientNumber);
        if (cached) {
          return {
            ...cached,
            _stale: true, // 오래된 데이터 표시
          };
        }

        throw new ServiceUnavailableException(
          '환자 정보를 조회할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
    }
  }
}
```

---

## 7. 모니터링 및 로깅

### 7.1 연동 메트릭

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

### 7.2 연동 로깅

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

## 8. 체크리스트

### 연동 구현 체크리스트

- [ ] 레거시 DB 스키마 분석 완료
- [ ] 엔터티 매핑 정의
- [ ] Adapter 클래스 구현
- [ ] 동기화 서비스 구현
- [ ] Circuit Breaker 적용
- [ ] 재시도 로직 구현
- [ ] Fallback 전략 수립
- [ ] 캐싱 전략 적용
- [ ] 에러 처리 및 로깅
- [ ] 모니터링 메트릭 설정
- [ ] 통합 테스트 작성
