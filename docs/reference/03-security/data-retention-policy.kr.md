# 데이터 보존 및 삭제 정책

---

## 문서 정보

| 항목      | 내용                                 |
| --------- | ------------------------------------ |
| 문서 버전 | 1.0.0                                |
| 작성일    | 2026-01-12                           |
| 상태      | 초안                                 |
| 관리자    | kcenon@naver.com                     |
| 표준 기준 | 의료법, 개인정보보호법, HIPAA (참조) |

---

## 문서 이력

| 버전  | 일자       | 작성자 | 변경 내용                     |
| ----- | ---------- | ------ | ----------------------------- |
| 1.0.0 | 2026-01-12 | -      | 초안 작성 (갭 분석 기반 신규) |

---

## 목차

1. [개요](#1-개요)
2. [법적 근거](#2-법적-근거)
3. [데이터 분류 및 보존 기간](#3-데이터-분류-및-보존-기간)
4. [데이터 보존 프로세스](#4-데이터-보존-프로세스)
5. [데이터 삭제 프로세스](#5-데이터-삭제-프로세스)
6. [아카이빙 전략](#6-아카이빙-전략)
7. [접근 제어](#7-접근-제어)
8. [감사 및 모니터링](#8-감사-및-모니터링)
9. [예외 처리](#9-예외-처리)
10. [기술 구현](#10-기술-구현)

---

## 1. 개요

### 1.1 목적

본 문서는 입원환자 관리 ERP 시스템의 **데이터 보존 및 삭제 정책**을 정의합니다. 의료 데이터의 특성상 법적 보존 의무와 환자 프라이버시 권리 사이의 균형을 유지해야 합니다.

### 1.2 적용 범위

```
적용 대상 데이터
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 환자 개인정보 (식별정보, 연락처)
2. 진료 기록 (입퇴원, 바이탈, 검사결과)
3. 간호 기록 (라운딩, 간호일지)
4. 시스템 로그 (접근로그, 감사로그)
5. 사용자 계정 정보
6. 백업 데이터
```

### 1.3 추적성 참조

| 관련 요구사항   | 문서                                      |
| --------------- | ----------------------------------------- |
| REQ-NFR-SEC-001 | SRS.kr.md - 보안 요구사항                 |
| SEC-005         | security-requirements.kr.md - 데이터 보안 |
| DB-004          | database-design.kr.md - 감사 스키마       |

---

## 2. 법적 근거

### 2.1 국내 법규

#### 2.1.1 의료법

| 조항                   | 요구사항             | 보존 기간                       |
| ---------------------- | -------------------- | ------------------------------- |
| 의료법 제22조          | 진료기록부 보존      | **10년**                        |
| 의료법 시행규칙 제15조 | 진료기록부 등의 보존 | **5년~10년** (문서 유형별 상이) |

**세부 보존 기간**:
| 문서 유형 | 보존 기간 |
|----------|----------|
| 진료기록부 | 10년 |
| 환자명부 | 5년 |
| 검사소견기록 | 5년 |
| 방사선사진 및 그 소견서 | 5년 |
| 간호기록부 | 5년 |
| 진단서등 부본 | 3년 |

#### 2.1.2 개인정보보호법

| 조항   | 요구사항                                        |
| ------ | ----------------------------------------------- |
| 제21조 | 개인정보 파기: 보유 목적 달성 시 지체 없이 파기 |
| 제35조 | 열람권: 정보주체의 열람 요구 가능               |
| 제36조 | 정정·삭제권: 정보주체의 정정·삭제 요구 가능     |
| 제37조 | 처리정지권: 처리 정지 요구 가능                 |

#### 2.1.3 전자서명법

| 조항   | 요구사항                        |
| ------ | ------------------------------- |
| 제4조  | 전자서명의 효력                 |
| 제18조 | 전자문서의 보관: 원본 상태 유지 |

### 2.2 보존 기간 산정 원칙

```
보존 기간 산정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 법적 의무 기간: 해당 법률에서 정한 최소 기간
2. 운영 필요 기간: 업무상 필요한 기간
3. 적용 기간: MAX(법적 의무, 운영 필요)
4. 기산점: 해당 목적 달성 시점 (퇴원일, 거래종료일 등)
```

---

## 3. 데이터 분류 및 보존 기간

### 3.1 데이터 분류 체계

```
┌─────────────────────────────────────────────────────────────┐
│                  Data Classification Matrix                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Level 1   │  │   Level 2   │  │   Level 3   │          │
│  │  Critical   │  │  Sensitive  │  │   General   │          │
│  │  (핵심)     │  │  (민감)     │  │  (일반)     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│        │               │                │                    │
│        ▼               ▼                ▼                    │
│  - 진료기록       - 환자 연락처     - 시스템 설정           │
│  - 검사결과       - 보호자 정보     - 사용자 선호           │
│  - 간호기록       - 접근 로그       - 세션 데이터           │
│  - 바이탈 기록    - 직원 정보       - 임시 파일             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 상세 보존 기간표

#### 3.2.1 환자 데이터

| 데이터 항목   | 분류    | 보존 기간                | 근거                 | 파기 방법        |
| ------------- | ------- | ------------------------ | -------------------- | ---------------- |
| 환자 기본정보 | Level 1 | 마지막 진료일 + **10년** | 의료법 22조          | 완전 파기        |
| 입퇴원 기록   | Level 1 | 퇴원일 + **10년**        | 의료법 22조          | 완전 파기        |
| 바이탈 사인   | Level 1 | 퇴원일 + **5년**         | 의료법 시행규칙 15조 | 완전 파기        |
| 간호 기록     | Level 1 | 퇴원일 + **5년**         | 의료법 시행규칙 15조 | 완전 파기        |
| 검사 결과     | Level 1 | 결과일 + **5년**         | 의료법 시행규칙 15조 | 완전 파기        |
| 라운딩 메모   | Level 1 | 퇴원일 + **5년**         | 의료법 시행규칙 15조 | 완전 파기        |
| 환자 연락처   | Level 2 | 마지막 진료일 + **10년** | 진료기록 연계        | 비식별화 후 파기 |
| 보호자 정보   | Level 2 | 마지막 진료일 + **3년**  | 운영 필요            | 비식별화 후 파기 |

#### 3.2.2 시스템 데이터

| 데이터 항목   | 분류    | 보존 기간           | 근거           | 파기 방법        |
| ------------- | ------- | ------------------- | -------------- | ---------------- |
| 사용자 계정   | Level 2 | 퇴직일 + **3년**    | 내부 규정      | 비활성화 후 파기 |
| 접근 로그     | Level 2 | 생성일 + **2년**    | 개인정보보호법 | 자동 파기        |
| 감사 로그     | Level 2 | 생성일 + **5년**    | 의료법         | 아카이브 후 파기 |
| API 호출 로그 | Level 3 | 생성일 + **90일**   | 운영 필요      | 자동 파기        |
| 세션 데이터   | Level 3 | 만료 + **7일**      | 운영 필요      | 자동 파기        |
| 임시 파일     | Level 3 | 생성일 + **24시간** | 운영 필요      | 자동 파기        |

#### 3.2.3 백업 데이터

| 백업 유형      | 보존 기간 | 저장 위치               | 암호화  |
| -------------- | --------- | ----------------------- | ------- |
| 일일 전체 백업 | **90일**  | S3 Standard             | AES-256 |
| 주간 증분 백업 | **1년**   | S3 Standard-IA          | AES-256 |
| 월간 스냅샷    | **5년**   | S3 Glacier              | AES-256 |
| 연간 아카이브  | **10년**  | S3 Glacier Deep Archive | AES-256 |

---

## 4. 데이터 보존 프로세스

### 4.1 데이터 생명주기

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Lifecycle Management                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│    │ 생성    │ ─▶ │ 활성    │ ─▶ │ 보관    │ ─▶ │ 아카이브│        │
│    │ Create  │    │ Active  │    │ Retain  │    │ Archive │        │
│    └─────────┘    └─────────┘    └─────────┘    └─────────┘        │
│         │              │              │              │               │
│         ▼              ▼              ▼              ▼               │
│    데이터 입력    실시간 조회    읽기 전용     Cold Storage          │
│    암호화 저장    빈번한 접근    제한된 접근   최소 접근             │
│                                                       │               │
│                                                       ▼               │
│                                                  ┌─────────┐         │
│                                                  │ 파기    │         │
│                                                  │ Destroy │         │
│                                                  └─────────┘         │
│                                                       │               │
│                                                       ▼               │
│                                               완전 삭제 + 인증서     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 상태 전이 규칙

```typescript
// data-lifecycle.ts
interface DataLifecycleRule {
  dataType: DataType;
  activeToRetain: {
    trigger: 'discharge' | 'account_inactive' | 'date_based';
    afterDays: number;
  };
  retainToArchive: {
    afterDays: number;
  };
  archiveToDestroy: {
    afterYears: number;
  };
}

const lifecycleRules: DataLifecycleRule[] = [
  {
    dataType: 'patient_record',
    activeToRetain: { trigger: 'discharge', afterDays: 365 }, // 퇴원 후 1년
    retainToArchive: { afterDays: 365 * 2 }, // 보관 후 2년
    archiveToDestroy: { afterYears: 10 }, // 아카이브 후 10년 (총 10년)
  },
  {
    dataType: 'vital_signs',
    activeToRetain: { trigger: 'discharge', afterDays: 90 },
    retainToArchive: { afterDays: 365 },
    archiveToDestroy: { afterYears: 5 },
  },
  {
    dataType: 'nursing_notes',
    activeToRetain: { trigger: 'discharge', afterDays: 90 },
    retainToArchive: { afterDays: 365 },
    archiveToDestroy: { afterYears: 5 },
  },
  {
    dataType: 'access_logs',
    activeToRetain: { trigger: 'date_based', afterDays: 90 },
    retainToArchive: { afterDays: 365 },
    archiveToDestroy: { afterYears: 2 },
  },
  {
    dataType: 'audit_logs',
    activeToRetain: { trigger: 'date_based', afterDays: 365 },
    retainToArchive: { afterDays: 365 * 2 },
    archiveToDestroy: { afterYears: 5 },
  },
];
```

### 4.3 보존 무결성 검증

```typescript
// integrity-verification.ts
interface IntegrityCheckResult {
  dataId: string;
  checksum: string;
  verified: boolean;
  verifiedAt: Date;
  previousChecksum?: string;
  tamperDetected: boolean;
}

async function verifyDataIntegrity(dataId: string): Promise<IntegrityCheckResult> {
  const data = await getArchivedData(dataId);
  const storedChecksum = await getStoredChecksum(dataId);

  // 현재 체크섬 계산
  const currentChecksum = await calculateChecksum(data);

  const verified = currentChecksum === storedChecksum;
  const tamperDetected = !verified;

  if (tamperDetected) {
    await logSecurityIncident({
      type: 'DATA_INTEGRITY_VIOLATION',
      dataId,
      expectedChecksum: storedChecksum,
      actualChecksum: currentChecksum,
      severity: 'CRITICAL'
    });

    // 즉시 관리자 알림
    await alertSecurityTeam({
      incident: 'Data tampering detected',
      dataId,
      action: 'Immediate investigation required'
    });
  }

  // 검증 기록 저장
  await saveIntegrityCheck({
    dataId,
    checksum: currentChecksum,
    verified,
    verifiedAt: new Date(),
    previousChecksum: storedChecksum,
    tamperDetected
  });

  return { dataId, checksum: currentChecksum, verified, verifiedAt: new Date(), tamperDetected };
}

// 주간 무결성 검증 스케줄러
@Cron('0 2 * * 0') // 매주 일요일 02:00
async function weeklyIntegrityCheck(): Promise<void> {
  const archivedRecords = await getArchivedRecordIds();

  for (const recordId of archivedRecords) {
    await verifyDataIntegrity(recordId);
  }
}
```

---

## 5. 데이터 삭제 프로세스

### 5.1 삭제 워크플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Deletion Workflow                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐                                                  │
│  │ 삭제 대상 식별 │ ◀── 보존 기간 만료 / 정보주체 요청              │
│  └───────┬───────┘                                                  │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐                                                  │
│  │ 삭제 가능 검증 │ ◀── 법적 보존 의무 확인                         │
│  └───────┬───────┘                                                  │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐     ┌─────────────────────────────┐             │
│  │ 관리자 승인   │ ──▶ │ Level 1 데이터: 필수        │             │
│  └───────┬───────┘     │ Level 2 데이터: 조건부     │             │
│          │             │ Level 3 데이터: 자동       │             │
│          ▼             └─────────────────────────────┘             │
│  ┌───────────────┐                                                  │
│  │ 삭제 실행     │ ◀── 파기 방법별 처리                            │
│  └───────┬───────┘                                                  │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐                                                  │
│  │ 삭제 검증     │ ◀── 복구 불가능 확인                            │
│  └───────┬───────┘                                                  │
│          │                                                          │
│          ▼                                                          │
│  ┌───────────────┐                                                  │
│  │ 삭제 증명서   │ ◀── 감사 기록 생성                              │
│  └───────────────┘                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 삭제 방법

#### 5.2.1 완전 파기 (Secure Deletion)

```typescript
// secure-deletion.ts
interface SecureDeletionOptions {
  method: 'DOD_5220' | 'NIST_800_88' | 'GUTMANN';
  verifyAfter: boolean;
  generateCertificate: boolean;
}

async function secureDelete(
  dataId: string,
  dataType: DataType,
  options: SecureDeletionOptions = {
    method: 'NIST_800_88',
    verifyAfter: true,
    generateCertificate: true,
  },
): Promise<DeletionResult> {
  // 1. 삭제 전 메타데이터 기록
  const metadata = await capturePreDeletionMetadata(dataId);

  // 2. 관련 데이터 식별 (외래키 관계)
  const relatedData = await identifyRelatedData(dataId, dataType);

  // 3. 트랜잭션 시작
  const transaction = await prisma.$transaction(async (tx) => {
    // 3.1 관련 데이터 먼저 삭제 (참조 무결성)
    for (const related of relatedData) {
      await tx[related.table].delete({ where: { id: related.id } });
    }

    // 3.2 주 데이터 삭제
    await tx[dataType].delete({ where: { id: dataId } });

    // 3.3 삭제 로그 기록
    await tx.deletionLog.create({
      data: {
        dataId,
        dataType,
        deletedAt: new Date(),
        method: options.method,
        deletedBy: getCurrentUserId(),
        metadata: JSON.stringify(metadata),
      },
    });

    return { success: true };
  });

  // 4. 백업에서도 삭제 (또는 마스킹)
  await removeFromBackups(dataId, dataType);

  // 5. 검색 인덱스에서 제거
  await removeFromSearchIndex(dataId, dataType);

  // 6. 삭제 검증
  if (options.verifyAfter) {
    const stillExists = await verifyDeletion(dataId, dataType);
    if (stillExists) {
      throw new DeletionVerificationError(dataId);
    }
  }

  // 7. 삭제 증명서 생성
  let certificate: DeletionCertificate | null = null;
  if (options.generateCertificate) {
    certificate = await generateDeletionCertificate({
      dataId,
      dataType,
      deletedAt: new Date(),
      method: options.method,
      verifiedBy: 'system',
      metadata,
    });
  }

  return {
    success: true,
    dataId,
    deletedAt: new Date(),
    certificate,
  };
}
```

#### 5.2.2 비식별화 (De-identification)

```typescript
// de-identification.ts
interface DeIdentificationRules {
  [fieldName: string]: DeIdentificationMethod;
}

type DeIdentificationMethod =
  | 'REMOVE' // 완전 제거
  | 'MASK' // 부분 마스킹 (홍*동)
  | 'GENERALIZE' // 일반화 (35세 → 30대)
  | 'PSEUDONYMIZE' // 가명화 (ID → 임의코드)
  | 'ENCRYPT' // 암호화
  | 'HASH' // 해시 (복원 불가)
  | 'TRUNCATE' // 절삭 (010-1234-**** )
  | 'RANDOMIZE'; // 무작위화

const patientDeIdentificationRules: DeIdentificationRules = {
  name: 'MASK', // 홍*동
  residentNumber: 'REMOVE', // 완전 제거
  phoneNumber: 'TRUNCATE', // 010-****-1234
  address: 'GENERALIZE', // 서울시 강남구 → 서울시
  email: 'HASH', // 복원 불가 해시
  birthDate: 'GENERALIZE', // 1985-03-15 → 1985년
  emergencyContact: 'REMOVE', // 완전 제거
  medicalRecordNumber: 'PSEUDONYMIZE', // 가명 ID로 대체
};

async function deIdentifyPatient(patientId: string): Promise<void> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) return;

  const deIdentified = {
    name: maskName(patient.name),
    residentNumber: null,
    phoneNumber: truncatePhone(patient.phoneNumber),
    address: generalizeAddress(patient.address),
    email: hashEmail(patient.email),
    birthDate: generalizeDate(patient.birthDate),
    emergencyContact: null,
    medicalRecordNumber: generatePseudonym(patient.medicalRecordNumber),
    isDeIdentified: true,
    deIdentifiedAt: new Date(),
  };

  await prisma.patient.update({
    where: { id: patientId },
    data: deIdentified,
  });

  // 비식별화 로그 기록
  await logDeIdentification(patientId, 'patient');
}

// 헬퍼 함수들
function maskName(name: string): string {
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

function truncatePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.substring(0, 3) + '-****-' + digits.substring(digits.length - 4);
}

function generalizeAddress(address: string): string {
  // 시/도, 구/군까지만 남김
  const match = address.match(
    /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[시도]?\s*\S+[구군시]/,
  );
  return match ? match[0] : '주소 비공개';
}

function generalizeDate(date: Date): string {
  return date.getFullYear() + '년';
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email).digest('hex').substring(0, 16);
}

function generatePseudonym(original: string): string {
  // 일관된 가명 생성 (동일 입력 → 동일 출력)
  const hash = crypto
    .createHash('sha256')
    .update(original + process.env.PSEUDONYM_SALT)
    .digest('hex');
  return 'PSEUDO-' + hash.substring(0, 12).toUpperCase();
}
```

### 5.3 삭제 증명서

```typescript
// deletion-certificate.ts
interface DeletionCertificate {
  certificateId: string;
  issuedAt: Date;
  dataId: string;
  dataType: string;
  dataDescription: string;
  deletionMethod: string;
  deletedAt: Date;
  deletedBy: string;
  verifiedBy: string;
  legalBasis: string;
  signature: string;
}

async function generateDeletionCertificate(params: DeletionParams): Promise<DeletionCertificate> {
  const certificate: DeletionCertificate = {
    certificateId: `DEL-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`,
    issuedAt: new Date(),
    dataId: params.dataId,
    dataType: params.dataType,
    dataDescription: params.metadata.description,
    deletionMethod: params.method,
    deletedAt: params.deletedAt,
    deletedBy: params.deletedBy || 'SYSTEM',
    verifiedBy: params.verifiedBy || 'SYSTEM_VERIFICATION',
    legalBasis: params.legalBasis || '개인정보보호법 제21조',
    signature: '',
  };

  // 전자 서명 생성
  certificate.signature = await signCertificate(certificate);

  // 증명서 저장
  await prisma.deletionCertificate.create({
    data: certificate,
  });

  return certificate;
}

// 증명서 PDF 생성
async function exportCertificatePDF(certificateId: string): Promise<Buffer> {
  const certificate = await prisma.deletionCertificate.findUnique({
    where: { certificateId },
  });

  const pdfContent = `
    데이터 삭제 증명서
    ═══════════════════════════════════════

    증명서 번호: ${certificate.certificateId}
    발급일시: ${formatDateTime(certificate.issuedAt)}

    삭제 정보
    ───────────────────────────────────────
    데이터 ID: ${certificate.dataId}
    데이터 유형: ${certificate.dataType}
    데이터 설명: ${certificate.dataDescription}

    삭제 세부사항
    ───────────────────────────────────────
    삭제 방법: ${certificate.deletionMethod}
    삭제 일시: ${formatDateTime(certificate.deletedAt)}
    삭제 수행자: ${certificate.deletedBy}
    검증자: ${certificate.verifiedBy}
    법적 근거: ${certificate.legalBasis}

    본 증명서는 위 데이터가 복구 불가능하게
    영구 삭제되었음을 증명합니다.

    전자서명: ${certificate.signature}
  `;

  return generatePDF(pdfContent);
}
```

---

## 6. 아카이빙 전략

### 6.1 아카이브 계층 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Archive Storage Hierarchy                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Hot Storage (PostgreSQL)                                          │
│   ├── 현재 입원 환자 데이터                                          │
│   ├── 최근 90일 퇴원 환자                                            │
│   └── 활성 사용자 세션                                               │
│                                                                      │
│   Warm Storage (S3 Standard-IA)                                     │
│   ├── 90일 ~ 2년 퇴원 환자                                          │
│   ├── 1년 이상 된 보고서                                             │
│   └── 주간/월간 백업                                                 │
│                                                                      │
│   Cold Storage (S3 Glacier)                                         │
│   ├── 2년 ~ 5년 환자 기록                                           │
│   ├── 감사 로그 아카이브                                             │
│   └── 연간 스냅샷                                                    │
│                                                                      │
│   Deep Archive (S3 Glacier Deep Archive)                            │
│   ├── 5년 ~ 10년 환자 기록 (법적 보존)                              │
│   └── 장기 아카이브 백업                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 아카이브 자동화

```typescript
// archive-scheduler.ts
@Injectable()
export class ArchiveScheduler {
  constructor(
    private readonly archiveService: ArchiveService,
    private readonly notificationService: NotificationService,
  ) {}

  // 매일 새벽 3시에 실행
  @Cron('0 3 * * *')
  async runDailyArchive(): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. 아카이브 대상 식별
      const candidates = await this.identifyArchiveCandidates();

      // 2. 단계별 아카이브 실행
      const results = {
        hotToWarm: await this.archiveService.moveToWarm(candidates.hotToWarm),
        warmToCold: await this.archiveService.moveToCold(candidates.warmToCold),
        coldToDeep: await this.archiveService.moveToDeepArchive(candidates.coldToDeep),
      };

      // 3. 결과 로깅
      await this.logArchiveResults(results);

      // 4. 관리자 보고
      if (this.shouldNotifyAdmin(results)) {
        await this.notificationService.sendAdminReport({
          type: 'DAILY_ARCHIVE_COMPLETE',
          duration: Date.now() - startTime,
          results,
        });
      }
    } catch (error) {
      await this.handleArchiveError(error);
    }
  }

  private async identifyArchiveCandidates(): Promise<ArchiveCandidates> {
    const now = new Date();

    // Hot → Warm: 90일 지난 퇴원 환자
    const hotToWarm = await this.prisma.patient.findMany({
      where: {
        status: 'DISCHARGED',
        dischargeDate: {
          lt: subDays(now, 90),
        },
        storageClass: 'HOT',
      },
      take: 1000, // 배치 크기 제한
    });

    // Warm → Cold: 2년 지난 데이터
    const warmToCold = await this.prisma.archivedPatient.findMany({
      where: {
        archivedAt: {
          lt: subYears(now, 2),
        },
        storageClass: 'WARM',
      },
      take: 500,
    });

    // Cold → Deep: 5년 지난 데이터
    const coldToDeep = await this.prisma.archivedPatient.findMany({
      where: {
        archivedAt: {
          lt: subYears(now, 5),
        },
        storageClass: 'COLD',
      },
      take: 200,
    });

    return { hotToWarm, warmToCold, coldToDeep };
  }
}
```

### 6.3 아카이브 데이터 조회

```typescript
// archive-retrieval.ts
interface ArchiveRetrievalRequest {
  dataId: string;
  dataType: string;
  requestedBy: string;
  reason: string;
  priority: 'STANDARD' | 'EXPEDITED' | 'BULK';
}

async function requestArchiveRetrieval(request: ArchiveRetrievalRequest): Promise<RetrievalJob> {
  // 1. 권한 확인
  const hasAccess = await checkArchiveAccess(request.requestedBy, request.dataType);
  if (!hasAccess) {
    throw new UnauthorizedAccessError('Archive access denied');
  }

  // 2. 데이터 위치 확인
  const location = await findArchiveLocation(request.dataId, request.dataType);

  // 3. 복원 시간 추정
  const estimatedTime = getRetrievalEstimate(location.storageClass, request.priority);

  // 4. 복원 요청 생성
  const job = await prisma.archiveRetrievalJob.create({
    data: {
      dataId: request.dataId,
      dataType: request.dataType,
      storageClass: location.storageClass,
      priority: request.priority,
      requestedBy: request.requestedBy,
      reason: request.reason,
      status: 'PENDING',
      estimatedCompletionAt: addMinutes(new Date(), estimatedTime),
      createdAt: new Date(),
    },
  });

  // 5. S3 Glacier 복원 요청
  if (location.storageClass === 'COLD' || location.storageClass === 'DEEP') {
    await s3
      .restoreObject({
        Bucket: location.bucket,
        Key: location.key,
        RestoreRequest: {
          Days: 7,
          GlacierJobParameters: {
            Tier: request.priority === 'EXPEDITED' ? 'Expedited' : 'Standard',
          },
        },
      })
      .promise();
  }

  // 6. 감사 로그
  await logArchiveAccess({
    action: 'RETRIEVAL_REQUESTED',
    dataId: request.dataId,
    requestedBy: request.requestedBy,
    reason: request.reason,
    jobId: job.id,
  });

  return job;
}

// 복원 시간 추정
function getRetrievalEstimate(storageClass: string, priority: string): number {
  const estimates = {
    HOT: { STANDARD: 0, EXPEDITED: 0, BULK: 0 },
    WARM: { STANDARD: 5, EXPEDITED: 1, BULK: 30 }, // 분 단위
    COLD: { STANDARD: 180, EXPEDITED: 5, BULK: 720 }, // 분 단위 (3시간, 5분, 12시간)
    DEEP: { STANDARD: 720, EXPEDITED: 60, BULK: 2880 }, // 분 단위 (12시간, 1시간, 48시간)
  };

  return estimates[storageClass]?.[priority] || 180;
}
```

---

## 7. 접근 제어

### 7.1 보존 데이터 접근 권한

| 역할          | 활성 데이터 | 보관 데이터 | 아카이브         | 삭제      |
| ------------- | ----------- | ----------- | ---------------- | --------- |
| 시스템 관리자 | 읽기/쓰기   | 읽기        | 읽기 (승인 필요) | 승인 필요 |
| 원무과장      | 읽기/쓰기   | 읽기        | 요청 가능        | 불가      |
| 의사          | 읽기/쓰기   | 읽기        | 불가             | 불가      |
| 간호사        | 읽기/쓰기   | 읽기        | 불가             | 불가      |
| 감사자        | 읽기 전용   | 읽기 전용   | 읽기 전용        | 불가      |

### 7.2 삭제 권한 매트릭스

| 데이터 유형    | 자동 삭제 | 사용자 요청 | 관리자 승인 | 이중 승인 |
| -------------- | --------- | ----------- | ----------- | --------- |
| Level 1 (핵심) | 불가      | 불가        | 필수        | **필수**  |
| Level 2 (민감) | 불가      | 가능        | 필수        | 조건부    |
| Level 3 (일반) | **가능**  | 가능        | 선택        | 불필요    |

### 7.3 삭제 승인 워크플로우

```typescript
// deletion-approval.ts
interface DeletionRequest {
  id: string;
  dataId: string;
  dataType: DataType;
  dataLevel: 1 | 2 | 3;
  requestedBy: string;
  reason: string;
  legalBasis?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  approvals: Approval[];
  createdAt: Date;
}

interface Approval {
  approverId: string;
  approverRole: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt: Date;
}

async function requestDeletion(
  dataId: string,
  dataType: DataType,
  reason: string,
): Promise<DeletionRequest> {
  const dataLevel = await getDataLevel(dataType);
  const requiredApprovals = getRequiredApprovals(dataLevel);

  const request = await prisma.deletionRequest.create({
    data: {
      dataId,
      dataType,
      dataLevel,
      requestedBy: getCurrentUserId(),
      reason,
      status: 'PENDING',
      requiredApprovals,
      createdAt: new Date(),
    },
  });

  // 승인자들에게 알림
  await notifyApprovers(request, requiredApprovals);

  return request;
}

function getRequiredApprovals(dataLevel: number): ApprovalRequirement[] {
  switch (dataLevel) {
    case 1:
      return [
        { role: 'SYSTEM_ADMIN', required: true },
        { role: 'COMPLIANCE_OFFICER', required: true }, // 이중 승인
      ];
    case 2:
      return [{ role: 'SYSTEM_ADMIN', required: true }];
    case 3:
      return []; // 자동 또는 단일 승인
  }
}

async function approveDeletion(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  comment?: string,
): Promise<DeletionRequest> {
  const request = await prisma.deletionRequest.findUnique({
    where: { id: requestId },
    include: { approvals: true },
  });

  if (!request || request.status !== 'PENDING') {
    throw new InvalidRequestError('Invalid or already processed request');
  }

  // 승인 추가
  await prisma.deletionApproval.create({
    data: {
      requestId,
      approverId: getCurrentUserId(),
      approverRole: getCurrentUserRole(),
      decision,
      comment,
      approvedAt: new Date(),
    },
  });

  // 모든 필수 승인 완료 확인
  const allApprovals = await prisma.deletionApproval.findMany({
    where: { requestId },
  });

  if (decision === 'REJECTED') {
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  } else if (areAllApprovalsComplete(request.requiredApprovals, allApprovals)) {
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    // 삭제 실행
    await executeDeletion(request);
  }

  return prisma.deletionRequest.findUnique({
    where: { id: requestId },
    include: { approvals: true },
  });
}
```

---

## 8. 감사 및 모니터링

### 8.1 감사 로그 항목

```typescript
interface DataLifecycleAuditLog {
  id: string;
  timestamp: Date;
  action: DataLifecycleAction;
  dataId: string;
  dataType: string;
  performedBy: string;
  sourceSystem: string;
  details: {
    previousState?: string;
    newState?: string;
    reason?: string;
    legalBasis?: string;
    approvers?: string[];
    verificationMethod?: string;
  };
  ipAddress: string;
  userAgent: string;
}

type DataLifecycleAction =
  | 'DATA_CREATED'
  | 'DATA_ACCESSED'
  | 'DATA_MODIFIED'
  | 'STATE_TRANSITION' // Active → Retain → Archive
  | 'ARCHIVE_MOVED' // 스토리지 계층 이동
  | 'ARCHIVE_RETRIEVED' // 아카이브 복원
  | 'DELETION_REQUESTED' // 삭제 요청
  | 'DELETION_APPROVED' // 삭제 승인
  | 'DELETION_REJECTED' // 삭제 거부
  | 'DELETION_EXECUTED' // 삭제 실행
  | 'DE_IDENTIFICATION' // 비식별화
  | 'INTEGRITY_CHECK' // 무결성 검증
  | 'INTEGRITY_VIOLATION'; // 무결성 위반 감지
```

### 8.2 보존 현황 대시보드

```sql
-- 보존 현황 통계 쿼리
SELECT
    storage_class,
    data_type,
    COUNT(*) as record_count,
    SUM(data_size_bytes) / 1024 / 1024 as size_mb,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    COUNT(*) FILTER (WHERE retention_expires_at < CURRENT_DATE + INTERVAL '30 days') as expiring_soon
FROM data_inventory
GROUP BY storage_class, data_type
ORDER BY storage_class, data_type;

-- 월간 삭제 현황
SELECT
    DATE_TRUNC('month', deleted_at) as month,
    data_type,
    deletion_method,
    COUNT(*) as deletion_count,
    COUNT(*) FILTER (WHERE triggered_by = 'RETENTION_POLICY') as auto_deleted,
    COUNT(*) FILTER (WHERE triggered_by = 'USER_REQUEST') as user_requested
FROM deletion_log
WHERE deleted_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', deleted_at), data_type, deletion_method
ORDER BY month DESC;
```

### 8.3 알림 설정

```typescript
// retention-alerts.ts
const retentionAlerts = [
  {
    name: 'expiring_soon',
    condition: "retention_expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'",
    threshold: 100,
    recipients: ['data-steward@hospital.kr'],
    frequency: 'WEEKLY',
  },
  {
    name: 'storage_quota_warning',
    condition: 'storage_usage_percent > 80',
    threshold: 80,
    recipients: ['infra@hospital.kr', 'data-steward@hospital.kr'],
    frequency: 'DAILY',
  },
  {
    name: 'deletion_pending',
    condition: 'pending_deletion_requests > 0',
    threshold: 1,
    recipients: ['compliance@hospital.kr'],
    frequency: 'DAILY',
  },
  {
    name: 'integrity_violation',
    condition: 'integrity_check_failed = true',
    threshold: 1,
    recipients: ['security@hospital.kr', 'compliance@hospital.kr'],
    frequency: 'IMMEDIATE',
  },
];
```

---

## 9. 예외 처리

### 9.1 법적 보류 (Legal Hold)

```typescript
// legal-hold.ts
interface LegalHold {
  id: string;
  name: string;
  description: string;
  affectedDataTypes: DataType[];
  affectedPatientIds?: string[];
  issuedBy: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: 'ACTIVE' | 'RELEASED';
  legalCaseReference?: string;
}

async function applyLegalHold(hold: LegalHold): Promise<void> {
  // 1. 법적 보류 등록
  await prisma.legalHold.create({ data: hold });

  // 2. 대상 데이터에 보류 플래그 설정
  for (const dataType of hold.affectedDataTypes) {
    if (hold.affectedPatientIds) {
      await prisma[dataType].updateMany({
        where: { patientId: { in: hold.affectedPatientIds } },
        data: {
          legalHoldId: hold.id,
          isDeletable: false,
        },
      });
    } else {
      // 전체 데이터 유형에 적용
      await prisma[dataType].updateMany({
        data: {
          legalHoldId: hold.id,
          isDeletable: false,
        },
      });
    }
  }

  // 3. 자동 삭제 스케줄러에서 제외
  await excludeFromRetentionPolicy(hold.id);

  // 4. 감사 로그
  await logLegalHold('APPLIED', hold);
}

async function releaseLegalHold(holdId: string): Promise<void> {
  const hold = await prisma.legalHold.findUnique({ where: { id: holdId } });

  // 보류 해제
  await prisma.legalHold.update({
    where: { id: holdId },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });

  // 데이터 플래그 해제
  for (const dataType of hold.affectedDataTypes) {
    await prisma[dataType].updateMany({
      where: { legalHoldId: holdId },
      data: {
        legalHoldId: null,
        isDeletable: true,
      },
    });
  }

  // 감사 로그
  await logLegalHold('RELEASED', hold);
}
```

### 9.2 정보주체 요청 처리

```typescript
// data-subject-request.ts
type RequestType =
  | 'ACCESS' // 열람권 (제35조)
  | 'RECTIFICATION' // 정정권 (제36조)
  | 'DELETION' // 삭제권 (제36조)
  | 'SUSPENSION' // 처리정지권 (제37조)
  | 'PORTABILITY'; // 이동권

interface DataSubjectRequest {
  id: string;
  type: RequestType;
  requesterId: string; // 정보주체 또는 법정대리인
  targetPatientId: string;
  reason: string;
  supportingDocuments?: string[];
  status: 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  responseDeadline: Date; // 10일 이내 (개인정보보호법)
  createdAt: Date;
}

async function processDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
  // 1. 신원 확인
  const isVerified = await verifyRequesterIdentity(request.requesterId);
  if (!isVerified) {
    await rejectRequest(request.id, '신원 확인 실패');
    return;
  }

  // 2. 법적 보존 의무 확인 (삭제 요청의 경우)
  if (request.type === 'DELETION') {
    const hasLegalObligation = await checkLegalRetentionObligation(request.targetPatientId);

    if (hasLegalObligation) {
      await partiallyRejectRequest(request.id, {
        rejectedReason: '의료법 제22조에 따른 법적 보존 의무',
        alternativeAction: '법정 보존 기간 만료 후 자동 삭제 예정',
      });
      return;
    }
  }

  // 3. 요청 처리
  switch (request.type) {
    case 'ACCESS':
      await handleAccessRequest(request);
      break;
    case 'RECTIFICATION':
      await handleRectificationRequest(request);
      break;
    case 'DELETION':
      await handleDeletionRequest(request);
      break;
    case 'SUSPENSION':
      await handleSuspensionRequest(request);
      break;
    case 'PORTABILITY':
      await handlePortabilityRequest(request);
      break;
  }

  // 4. 완료 통지
  await notifyRequester(request.id, 'COMPLETED');
}
```

---

## 10. 기술 구현

### 10.1 보존 정책 엔진

```typescript
// retention-policy-engine.ts
@Injectable()
export class RetentionPolicyEngine {
  private readonly policies: Map<DataType, RetentionPolicy> = new Map();

  constructor(private readonly prisma: PrismaService) {
    this.loadPolicies();
  }

  private loadPolicies(): void {
    this.policies.set('patient_record', {
      retentionPeriod: { years: 10 },
      startEvent: 'LAST_DISCHARGE_DATE',
      archiveAfter: { years: 1 },
      deepArchiveAfter: { years: 5 },
      deletionMethod: 'SECURE_DELETE',
      requiresApproval: true,
      legalBasis: '의료법 제22조',
    });

    this.policies.set('vital_signs', {
      retentionPeriod: { years: 5 },
      startEvent: 'DISCHARGE_DATE',
      archiveAfter: { months: 3 },
      deepArchiveAfter: { years: 2 },
      deletionMethod: 'SECURE_DELETE',
      requiresApproval: true,
      legalBasis: '의료법 시행규칙 제15조',
    });

    this.policies.set('access_log', {
      retentionPeriod: { years: 2 },
      startEvent: 'LOG_DATE',
      archiveAfter: { months: 3 },
      deepArchiveAfter: { years: 1 },
      deletionMethod: 'AUTO_DELETE',
      requiresApproval: false,
      legalBasis: '개인정보보호법 시행령 제48조의2',
    });

    // ... 기타 데이터 유형
  }

  async evaluateRetention(dataId: string, dataType: DataType): Promise<RetentionDecision> {
    const policy = this.policies.get(dataType);
    if (!policy) {
      throw new UnknownDataTypeError(dataType);
    }

    const data = await this.getDataMetadata(dataId, dataType);
    const startDate = this.getStartDate(data, policy.startEvent);
    const expirationDate = this.calculateExpirationDate(startDate, policy.retentionPeriod);

    // 법적 보류 확인
    if (data.legalHoldId) {
      return {
        action: 'HOLD',
        reason: 'Legal hold active',
        legalHoldId: data.legalHoldId,
      };
    }

    const now = new Date();

    // 아카이브 결정
    const archiveDate = this.calculateExpirationDate(startDate, policy.archiveAfter);
    const deepArchiveDate = this.calculateExpirationDate(startDate, policy.deepArchiveAfter);

    if (now > expirationDate) {
      return {
        action: 'DELETE',
        scheduledDate: expirationDate,
        method: policy.deletionMethod,
        requiresApproval: policy.requiresApproval,
      };
    } else if (now > deepArchiveDate) {
      return {
        action: 'DEEP_ARCHIVE',
        scheduledDate: deepArchiveDate,
      };
    } else if (now > archiveDate) {
      return {
        action: 'ARCHIVE',
        scheduledDate: archiveDate,
      };
    }

    return {
      action: 'RETAIN',
      expirationDate,
      daysRemaining: differenceInDays(expirationDate, now),
    };
  }
}
```

### 10.2 자동 삭제 스케줄러

```typescript
// auto-deletion-scheduler.ts
@Injectable()
export class AutoDeletionScheduler {
  private readonly logger = new Logger(AutoDeletionScheduler.name);

  constructor(
    private readonly retentionEngine: RetentionPolicyEngine,
    private readonly deletionService: DeletionService,
    private readonly notificationService: NotificationService,
  ) {}

  // 매일 새벽 2시에 실행
  @Cron('0 2 * * *')
  async runDailyRetentionCheck(): Promise<void> {
    this.logger.log('Starting daily retention check...');

    const dataTypes: DataType[] = ['access_log', 'session_data', 'api_log', 'temporary_files'];

    for (const dataType of dataTypes) {
      await this.processDataType(dataType);
    }

    this.logger.log('Daily retention check completed');
  }

  // 매주 일요일 새벽 3시에 실행 (중요 데이터)
  @Cron('0 3 * * 0')
  async runWeeklyRetentionCheck(): Promise<void> {
    this.logger.log('Starting weekly retention check for sensitive data...');

    const sensitiveDataTypes: DataType[] = ['vital_signs', 'nursing_notes', 'audit_log'];

    for (const dataType of sensitiveDataTypes) {
      await this.processDataType(dataType, { notifyBeforeDelete: true });
    }
  }

  private async processDataType(
    dataType: DataType,
    options: { notifyBeforeDelete?: boolean } = {},
  ): Promise<void> {
    const expiredRecords = await this.findExpiredRecords(dataType);

    for (const record of expiredRecords) {
      const decision = await this.retentionEngine.evaluateRetention(record.id, dataType);

      if (decision.action === 'DELETE') {
        if (decision.requiresApproval) {
          // 승인 필요한 경우 요청 생성
          await this.deletionService.createDeletionRequest({
            dataId: record.id,
            dataType,
            reason: 'Retention period expired',
            legalBasis: decision.legalBasis,
          });
        } else {
          // 자동 삭제
          await this.deletionService.executeAutoDelete(record.id, dataType);
        }
      }
    }
  }

  private async findExpiredRecords(dataType: DataType): Promise<DataRecord[]> {
    const policy = this.retentionEngine.getPolicy(dataType);

    return this.prisma[dataType].findMany({
      where: {
        retentionExpiresAt: { lt: new Date() },
        isDeletable: true,
        legalHoldId: null,
      },
      take: 1000,
    });
  }
}
```

---

## 변경 이력

| 버전  | 일자       | 변경 내용                          |
| ----- | ---------- | ---------------------------------- |
| 1.0.0 | 2026-01-12 | 초안 작성 - 갭 분석 기반 신규 문서 |

---

> **관련 문서**
>
> - [SRS.kr.md](../../SRS.kr.md) - 요구사항 명세
> - [security-requirements.kr.md](security-requirements.kr.md) - 보안 요구사항
> - [database-design.kr.md](../02-design/database-design.kr.md) - 데이터베이스 설계
