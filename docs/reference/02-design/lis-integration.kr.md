# LIS (검사정보시스템) 연동 명세서

## 문서 정보

| 항목      | 내용             |
| --------- | ---------------- |
| 문서 버전 | 0.1.0.0          |
| 작성일    | 2025-12-29       |
| 상태      | 초안             |
| 관리자    | kcenon@naver.com |

---

## 1. LIS 개요

### 1.1 LIS란?

**LIS (Laboratory Information System, 검사정보시스템)**는 임상 검사실 운영을 관리하기 위해 설계된 정보 시스템입니다. 검사 오더부터 결과 보고까지의 전체 워크플로우를 처리합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIS 워크플로우 개요                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│   │  오더   │───▶│  검체   │───▶│  검사   │───▶│  결과   │     │
│   │  접수   │    │  채취   │    │  수행   │    │  보고   │     │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘     │
│        │              │              │              │           │
│        ▼              ▼              ▼              ▼           │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    LIS 데이터베이스                       │  │
│   │  - 검사 오더       - 검체 추적                            │  │
│   │  - 검사 결과       - 품질 관리                            │  │
│   │  - 환자 정보       - 장비 인터페이스                       │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 LIS 데이터 분류

| 분류              | 데이터 유형                   | ERP 활용        |
| ----------------- | ----------------------------- | --------------- |
| **환자 인적사항** | 환자 ID, 이름, 생년월일, 성별 | 환자 식별       |
| **검사 오더**     | 오더 ID, 검사 코드, 오더 일시 | 오더 추적       |
| **검사 결과**     | 결과값, 단위, 참고치          | 임상 검토       |
| **결과 상태**     | 대기, 예비, 최종, 수정        | 워크플로우 관리 |
| **검체 정보**     | 채취일, 검체 유형             | 검체 추적       |

### 1.3 주요 검사 항목

| 분류           | 검사 항목                       | 임상적 의의        |
| -------------- | ------------------------------- | ------------------ |
| **혈액학**     | CBC, WBC 감별, 혈색소           | 혈액 세포 분석     |
| **생화학**     | BUN, 크레아티닌, 전해질, 간기능 | 장기 기능 평가     |
| **응고**       | PT, aPTT, INR                   | 출혈/응고 장애     |
| **요검사**     | UA, 요배양                      | 신장/요로감염 평가 |
| **심장표지자** | 트로포닌, BNP, CK-MB            | 심장 질환          |
| **감염표지자** | CRP, 프로칼시토닌, ESR          | 염증/감염          |

---

## 2. 연동 표준

### 2.1 HL7 (Health Level Seven)

**HL7**은 가장 널리 사용되는 의료 데이터 교환 표준입니다. LIS 연동에는 주로 버전 2.x가 사용됩니다.

#### 2.1.1 LIS용 HL7 메시지 유형

| 메시지 유형 | 트리거 이벤트       | 설명              |
| ----------- | ------------------- | ----------------- |
| **ORM^O01** | 오더 메시지         | 새 검사 오더 요청 |
| **ORU^R01** | 관찰 결과           | 검사 결과 보고    |
| **ORL^O22** | 일반 검사 오더 응답 | 오더 확인         |
| **QRY^R02** | 결과 조회           | 결과 요청         |
| **ADT^A01** | 입원/방문 알림      | 환자 입원         |

#### 2.1.2 HL7 v2.x 메시지 구조

```
MSH|^~\&|LIS|LAB|ERP|HOSPITAL|20251229120000||ORU^R01|MSG001|P|2.5
PID|1||12345678^^^HOSP^MR||홍^길동^||19800115|M
OBR|1|ORD001|LAB001|80053^종합대사패널^L|||20251229080000
OBX|1|NM|2345-7^포도당^LN||95|mg/dL|70-100|N|||F
OBX|2|NM|2160-0^크레아티닌^LN||1.1|mg/dL|0.7-1.3|N|||F
OBX|3|NM|3094-0^BUN^LN||15|mg/dL|7-20|N|||F
```

**세그먼트 설명:**

| 세그먼트 | 명칭        | 주요 필드                       |
| -------- | ----------- | ------------------------------- |
| **MSH**  | 메시지 헤더 | 송신/수신 앱, 메시지 유형, 버전 |
| **PID**  | 환자 식별   | 환자 ID, 이름, 생년월일, 성별   |
| **OBR**  | 관찰 요청   | 오더 ID, 검사 코드, 채취 시간   |
| **OBX**  | 관찰 결과   | 결과값, 단위, 참고치, 상태      |

#### 2.1.3 HL7 결과 상태 코드

| 코드  | 의미        | 설명                |
| ----- | ----------- | ------------------- |
| **F** | Final       | 확인된 최종 결과    |
| **P** | Preliminary | 미확인 예비 결과    |
| **C** | Corrected   | 이전 보고 결과 수정 |
| **X** | Cancelled   | 오더/결과 취소      |
| **I** | Pending     | 결과 대기 중        |

### 2.2 FHIR (Fast Healthcare Interoperability Resources)

**FHIR R4**는 RESTful API를 사용하는 현대적 의료 데이터 교환 표준입니다.

#### 2.2.1 검사 결과용 FHIR 리소스

| 리소스               | 설명             | 사용 사례          |
| -------------------- | ---------------- | ------------------ |
| **DiagnosticReport** | 전체 검사 보고서 | 패널/프로파일 결과 |
| **Observation**      | 개별 검사 결과   | 단일 검사값        |
| **ServiceRequest**   | 검사 오더        | 오더 생성          |
| **Specimen**         | 검체 정보        | 검체 추적          |
| **Patient**          | 환자 인적사항    | 환자 식별          |

#### 2.2.2 FHIR DiagnosticReport 예시

```json
{
  "resourceType": "DiagnosticReport",
  "id": "lab-report-001",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
          "code": "LAB",
          "display": "Laboratory"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "24323-8",
        "display": "종합 대사 패널"
      }
    ]
  },
  "subject": {
    "reference": "Patient/12345678"
  },
  "effectiveDateTime": "2025-12-29T08:00:00+09:00",
  "issued": "2025-12-29T12:00:00+09:00",
  "result": [
    { "reference": "Observation/glucose-001" },
    { "reference": "Observation/creatinine-001" },
    { "reference": "Observation/bun-001" }
  ]
}
```

### 2.3 LOINC (Logical Observation Identifiers Names and Codes)

**LOINC**은 검사 항목을 식별하는 국제 표준 코드입니다.

| LOINC 코드 | 성분         | 속성     | 검체      |
| ---------- | ------------ | -------- | --------- |
| 2345-7     | 포도당       | 질량농도 | 혈청/혈장 |
| 2160-0     | 크레아티닌   | 질량농도 | 혈청/혈장 |
| 3094-0     | 요소질소     | 질량농도 | 혈청/혈장 |
| 718-7      | 혈색소       | 질량농도 | 전혈      |
| 4544-3     | 적혈구용적률 | 부피분율 | 전혈      |
| 777-3      | 혈소판       | 수농도   | 전혈      |

---

## 3. 연동 아키텍처

### 3.1 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIS 연동 아키텍처                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐│
│   │                    입원환자 ERP 시스템                      ││
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       ││
│   │  │   환자      │  │   라운딩    │  │   대시보드   │       ││
│   │  │   상세      │  │   화면      │  │             │       ││
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       ││
│   │         │                │                │               ││
│   │         └────────────────┼────────────────┘               ││
│   │                          ▼                                 ││
│   │  ┌─────────────────────────────────────────────────────┐ ││
│   │  │               검사 결과 서비스                        │ ││
│   │  │                                                      │ ││
│   │  │  + getLatestResults(patientId): LabResult[]         │ ││
│   │  │  + getResultHistory(patientId, days): LabResult[]   │ ││
│   │  │  + getResultsByCategory(patientId, cat): LabResult[]│ ││
│   │  │                                                      │ ││
│   │  └───────────────────────┬─────────────────────────────┘ ││
│   └──────────────────────────┼───────────────────────────────┘│
│                              │                                 │
│   ┌──────────────────────────┼───────────────────────────────┐│
│   │                          ▼                                ││
│   │  ┌─────────────────────────────────────────────────────┐ ││
│   │  │               LIS 연동 어댑터                         │ ││
│   │  │                                                      │ ││
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │ ││
│   │  │  │ HL7 파서    │  │FHIR 클라이언트│  │ REST 클라이언트│  │ ││
│   │  │  └─────────────┘  └─────────────┘  └────────────┘  │ ││
│   │  │                                                      │ ││
│   │  └───────────────────────┬─────────────────────────────┘ ││
│   │             연동 계층                                     ││
│   └──────────────────────────┼───────────────────────────────┘│
│                              │                                 │
│                              ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │                      병원 LIS                            │ │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │ │
│   │  │  결과   │  │  오더   │  │  환자   │  │   검체    │  │ │
│   │  │   DB   │  │   DB    │  │   DB    │  │    DB     │  │ │
│   │  └─────────┘  └─────────┘  └─────────┘  └───────────┘  │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 연동 패턴

#### 3.2.1 Pull 패턴 (조회 기반)

ERP가 주기적으로 LIS에서 새 결과를 조회합니다.

```typescript
// 새 검사 결과를 가져오는 스케줄 작업
@Cron('*/5 * * * *') // 5분마다
async syncLabResults(): Promise<void> {
  const patients = await this.getActiveInpatients();

  for (const patient of patients) {
    const results = await this.lisAdapter.getNewResults(
      patient.lisPatientId,
      patient.lastSyncTime
    );

    if (results.length > 0) {
      await this.labResultsService.saveResults(patient.id, results);
      await this.notifyIfCritical(patient, results);
    }
  }
}
```

#### 3.2.2 Push 패턴 (이벤트 기반)

LIS가 결과 발생 시 ERP로 전송합니다 (실시간에 권장).

```typescript
// LIS 결과 알림을 위한 웹훅 엔드포인트
@Post('lis/results')
async receiveLabResult(@Body() hl7Message: string): Promise<void> {
  const parsedResult = this.hl7Parser.parse(hl7Message);

  const patient = await this.patientService.findByLisId(
    parsedResult.patientId
  );

  if (patient) {
    await this.labResultsService.saveResult(patient.id, parsedResult);

    // 위험 수치에 대한 실시간 알림
    if (parsedResult.isCritical) {
      await this.alertService.sendCriticalAlert(patient, parsedResult);
    }
  }
}
```

### 3.4 pacs_bridge 연동 옵션 (권장)

기존 pacs_bridge 인프라를 보유한 병원이나 빠른 개발을 원하는 신규 구현의 경우, **pacs_bridge** 프로젝트를 활용하면 사전 구축된 프로토콜 변환 계층을 사용할 수 있습니다.

#### 3.4.1 pacs_bridge 활용 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                   pacs_bridge를 통한 LIS 연동                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    입원환자 ERP 시스템                         │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│   │  │   환자      │  │   회진      │  │  대시보드   │          │  │
│   │  │   상세      │  │   화면      │  │             │          │  │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │  │
│   │         └────────────────┼────────────────┘                  │  │
│   │                          ▼                                    │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │              검사 결과 서비스                              ││  │
│   │  │              (pacs_bridge REST API 호출)                 ││  │
│   │  └───────────────────────┬─────────────────────────────────┘│  │
│   └──────────────────────────┼──────────────────────────────────┘  │
│                              │ REST API (HTTP/JSON)                 │
│   ┌──────────────────────────┼──────────────────────────────────┐  │
│   │          pacs_bridge 연동 계층                                │  │
│   │                          ▼                                    │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ││  │
│   │  │  │ HL7 v2.x     │  │ FHIR R4      │  │ 메시지       │  ││  │
│   │  │  │ 게이트웨이   │  │ 게이트웨이   │  │ 큐           │  ││  │
│   │  │  │ (MLLP/TLS)   │  │ (REST)       │  │              │  ││  │
│   │  │  └──────────────┘  └──────────────┘  └──────────────┘  ││  │
│   │  │                   프로토콜 변환                           ││  │
│   │  └───────────────────────┬─────────────────────────────────┘│  │
│   └──────────────────────────┼──────────────────────────────────┘  │
│                              │ HL7 v2.x / FHIR R4                   │
│   ┌──────────────────────────┼──────────────────────────────────┐  │
│   │                          ▼                                    │  │
│   │  ┌─────────────────────────────────────────────────────────┐│  │
│   │  │                      병원 LIS                            ││  │
│   │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  ││  │
│   │  │  │  결과   │  │  오더   │  │  환자   │  │   검체    │  ││  │
│   │  │  │   DB   │  │   DB    │  │   DB    │  │    DB     │  ││  │
│   │  │  └─────────┘  └─────────┘  └─────────┘  └───────────┘  ││  │
│   │  └─────────────────────────────────────────────────────────┘│  │
│   │                      외부 시스템                               │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.4.2 LIS 연동을 위한 pacs_bridge 기능

| 기능                    | 설명                                         | 장점                                 |
| ----------------------- | -------------------------------------------- | ------------------------------------ |
| **HL7 v2.x 게이트웨이** | MLLP 전송을 포함한 완전한 HL7 v2.x 파서/빌더 | HL7 파싱을 처음부터 구현할 필요 없음 |
| **FHIR R4 게이트웨이**  | RESTful FHIR R4 클라이언트/서버              | 최신 API 지원 즉시 사용 가능         |
| **메시지 큐**           | 재시도 로직을 포함한 안정적인 메시지 큐잉    | 네트워크 장애를 우아하게 처리        |
| **프로토콜 변환**       | HL7/FHIR/JSON 간 자동 변환                   | ERP를 위한 통합 REST API             |
| **감사 로깅**           | 내장 의료 등급 감사 추적                     | 규정 준수 준비 완료                  |
| **TLS/mTLS 지원**       | 보안 통신 채널                               | 보안 인프라 포함                     |

#### 3.4.3 연동 코드 예시

```typescript
// pacs_bridge REST API를 사용한 검사 결과 조회
@Injectable()
export class LabResultsService {
  private readonly pacsBridgeUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.pacsBridgeUrl = process.env.PACS_BRIDGE_URL;
  }

  // pacs_bridge를 통한 검사 결과 조회 (간소화 - HL7 파싱 불필요)
  async getLabResults(patientId: string): Promise<LabResult[]> {
    const url = `${this.pacsBridgeUrl}/api/lab-results/${patientId}`;

    const response = await this.httpService.get<LabResultDto[]>(url, {
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
        Accept: 'application/json',
      },
    });

    return response.data.map((dto) => this.mapToLabResult(dto));
  }

  // 실시간 검사 결과 알림 구독
  async subscribeToResults(
    patientId: string,
    callback: (result: LabResult) => void,
  ): Promise<void> {
    const wsUrl = `${this.pacsBridgeUrl.replace('http', 'ws')}/ws/lab-results/${patientId}`;
    // pacs_bridge가 HL7 ORU^R01 → JSON 변환을 자동으로 처리
    this.websocketClient.connect(wsUrl, callback);
  }

  // pacs_bridge REST API 응답은 이미 파싱된 JSON
  private mapToLabResult(dto: LabResultDto): LabResult {
    return {
      id: dto.id,
      patientId: dto.patientId,
      testCode: dto.loincCode,
      testName: dto.testName,
      value: dto.value,
      unit: dto.unit,
      referenceRangeLow: dto.refRangeLow,
      referenceRangeHigh: dto.refRangeHigh,
      status: dto.status,
      abnormalFlag: dto.abnormalFlag,
      criticalFlag: dto.isCritical,
      resultDateTime: new Date(dto.resultDateTime),
      // ... 기타 필드
    };
  }
}
```

#### 3.4.4 pacs_bridge 연동의 장점

| 측면                | 직접 연동            | pacs_bridge 연동         |
| ------------------- | -------------------- | ------------------------ |
| **개발 시간**       | 4-6주                | 1-2주                    |
| **HL7 파서**        | 처음부터 구현        | 사전 구축 및 테스트 완료 |
| **FHIR 클라이언트** | 처음부터 구현        | 사전 구축 및 테스트 완료 |
| **오류 처리**       | 커스텀 구현          | 프로덕션 준비 완료       |
| **보안**            | 커스텀 TLS/인증 설정 | 내장 TLS/OAuth2          |
| **모니터링**        | 커스텀 구현          | 내장 메트릭/로그         |
| **유지보수**        | 전체 소유권          | 공유 인프라              |

#### 3.4.5 pacs_bridge 사용 시점

**권장 상황:**

- 병원이 이미 pacs_system을 PACS 연동에 사용 중이거나 사용 예정인 경우
- 빠른 시장 출시가 필요한 경우
- LIS가 표준 HL7 v2.x 또는 FHIR R4 프로토콜을 사용하는 경우
- 여러 외부 시스템(LIS, EMR, PACS)과의 연동이 필요한 경우

**직접 연동 고려 상황:**

- LIS가 독자적/비표준 프로토콜을 사용하는 경우
- 병원에 기존 연동 미들웨어가 있는 경우
- pacs_bridge에서 지원하지 않는 특정 커스터마이징이 필요한 경우
- 최소한의 외부 의존성을 선호하는 경우

---

## 4. 데이터 모델

### 4.1 검사 결과 엔티티

```typescript
// 검사 결과 도메인 엔티티
interface LabResult {
  id: string;
  patientId: string;

  // 오더 정보
  orderId: string;
  orderDateTime: Date;

  // 검사 정보
  testCode: string; // LOINC 코드 권장
  testName: string;
  category: LabCategory; // CHEM, HEME, COAG 등

  // 결과 정보
  value: string | number;
  unit: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeText?: string;

  // 상태 및 플래그
  status: ResultStatus; // FINAL, PRELIMINARY, CORRECTED
  abnormalFlag?: AbnormalFlag; // L, H, LL, HH, N
  criticalFlag: boolean;

  // 타임스탬프
  collectionDateTime: Date;
  resultDateTime: Date;
  receivedDateTime: Date;

  // 출처 추적
  lisResultId: string;
  lisOrderId: string;
}

enum LabCategory {
  CHEMISTRY = 'CHEM', // 생화학
  HEMATOLOGY = 'HEME', // 혈액학
  COAGULATION = 'COAG', // 응고
  URINALYSIS = 'UA', // 요검사
  MICROBIOLOGY = 'MICRO', // 미생물
  IMMUNOLOGY = 'IMMU', // 면역
  BLOOD_BANK = 'BB', // 혈액은행
}

enum ResultStatus {
  PENDING = 'P', // 대기
  PRELIMINARY = 'PR', // 예비
  FINAL = 'F', // 최종
  CORRECTED = 'C', // 수정
  CANCELLED = 'X', // 취소
}

enum AbnormalFlag {
  LOW = 'L', // 저
  HIGH = 'H', // 고
  CRITICAL_LOW = 'LL', // 위험 저
  CRITICAL_HIGH = 'HH', // 위험 고
  NORMAL = 'N', // 정상
  ABNORMAL = 'A', // 비정상
}
```

### 4.2 데이터베이스 스키마

```sql
-- 검사 결과 테이블
CREATE TABLE lab.lab_results (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id            UUID NOT NULL REFERENCES patient.patients(id),

    -- 오더 정보
    order_id              VARCHAR(50) NOT NULL,
    order_datetime        TIMESTAMPTZ NOT NULL,

    -- 검사 정보
    test_code             VARCHAR(20) NOT NULL,  -- LOINC 코드
    test_name             VARCHAR(200) NOT NULL,
    category              VARCHAR(10) NOT NULL,

    -- 결과 정보
    value_numeric         DECIMAL(18, 6),
    value_text            VARCHAR(500),
    unit                  VARCHAR(50),
    reference_range_low   DECIMAL(18, 6),
    reference_range_high  DECIMAL(18, 6),
    reference_range_text  VARCHAR(200),

    -- 상태 및 플래그
    status                VARCHAR(10) NOT NULL DEFAULT 'P',
    abnormal_flag         VARCHAR(5),
    is_critical           BOOLEAN DEFAULT FALSE,

    -- 타임스탬프
    collection_datetime   TIMESTAMPTZ NOT NULL,
    result_datetime       TIMESTAMPTZ NOT NULL,
    received_datetime     TIMESTAMPTZ DEFAULT NOW(),

    -- 출처 추적
    lis_result_id         VARCHAR(100) NOT NULL,
    lis_order_id          VARCHAR(100),

    -- 감사
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),

    -- 제약조건
    CONSTRAINT uq_lis_result UNIQUE (lis_result_id)
);

-- 자주 사용하는 쿼리용 인덱스
CREATE INDEX idx_lab_results_patient ON lab.lab_results(patient_id);
CREATE INDEX idx_lab_results_patient_date ON lab.lab_results(patient_id, result_datetime DESC);
CREATE INDEX idx_lab_results_category ON lab.lab_results(patient_id, category);
CREATE INDEX idx_lab_results_critical ON lab.lab_results(is_critical) WHERE is_critical = TRUE;
CREATE INDEX idx_lab_results_status ON lab.lab_results(status);
```

---

## 5. API 명세

### 5.1 검사 결과 엔드포인트

#### GET /api/patients/{patientId}/lab-results

환자의 검사 결과를 조회합니다.

**쿼리 파라미터:**

| 파라미터       | 타입     | 설명                        |
| -------------- | -------- | --------------------------- |
| `category`     | string   | 분류별 필터 (CHEM, HEME 등) |
| `startDate`    | ISO 날짜 | 이 날짜부터의 결과          |
| `endDate`      | ISO 날짜 | 이 날짜까지의 결과          |
| `status`       | string   | 상태별 필터 (F, P, C)       |
| `criticalOnly` | boolean  | 위험값만                    |
| `limit`        | number   | 최대 결과 수 (기본: 50)     |

**응답:**

```json
{
  "data": [
    {
      "id": "uuid",
      "testCode": "2345-7",
      "testName": "포도당",
      "category": "CHEM",
      "value": 95,
      "unit": "mg/dL",
      "referenceRange": {
        "low": 70,
        "high": 100,
        "text": "70-100 mg/dL"
      },
      "status": "F",
      "abnormalFlag": "N",
      "isCritical": false,
      "collectionDateTime": "2025-12-29T08:00:00+09:00",
      "resultDateTime": "2025-12-29T12:00:00+09:00"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /api/patients/{patientId}/lab-results/latest

검사 유형별로 그룹화된 최근 결과를 조회합니다.

#### GET /api/patients/{patientId}/lab-results/{testCode}/trend

특정 검사의 시계열 추이를 조회합니다.

---

## 6. 보안 고려사항

### 6.1 데이터 보호

| 측면               | 요구사항  | 구현                  |
| ------------------ | --------- | --------------------- |
| **전송 중 암호화** | TLS 1.3   | 모든 API 호출에 HTTPS |
| **저장 시 암호화** | AES-256   | 데이터베이스 암호화   |
| **접근 제어**      | 역할 기반 | 권한 있는 직원만      |
| **감사 로깅**      | 모든 접근 | 모든 결과 조회 기록   |
| **데이터 보존**    | 5년 이상  | 의료법 준수           |

### 6.2 위험 수치 알림

```typescript
// 위험 수치 임계값 (예시)
const criticalThresholds = {
  '2345-7': { low: 40, high: 500 }, // 포도당 mg/dL
  '2160-0': { low: null, high: 10 }, // 크레아티닌 mg/dL
  '2823-3': { low: 2.5, high: 6.5 }, // 칼륨 mEq/L
  '2951-2': { low: 120, high: 160 }, // 나트륨 mEq/L
  '718-7': { low: 7, high: 20 }, // 혈색소 g/dL
  '777-3': { low: 50000, high: null }, // 혈소판 /uL
};
```

---

## 7. 구현 체크리스트

### Phase 1: 기반 구축

- [ ] LIS 벤더 및 연동 방식 정의
- [ ] LIS API 문서 / HL7 명세 확보
- [ ] 개발/테스트 LIS 환경 구축
- [ ] LIS 어댑터 인터페이스 구현
- [ ] lab_results 데이터베이스 스키마 생성

### Phase 2: 핵심 연동

- [ ] HL7 메시지 파서 구현 (해당 시)
- [ ] FHIR 클라이언트 구현 (해당 시)
- [ ] 결과 동기화 서비스 구현
- [ ] 검사 결과 API 엔드포인트 생성
- [ ] 결과 캐싱 구현

### Phase 3: UI 연동

- [ ] 환자 상세 화면에 검사 결과 추가
- [ ] 라운딩 화면에 검사 결과 추가
- [ ] 결과 추이 차트 구현
- [ ] 위험 수치 알림 구현

### Phase 4: 테스트 및 검증

- [ ] 파서/어댑터 단위 테스트
- [ ] LIS 연동 통합 테스트
- [ ] 결과 정확성 검증
- [ ] 성능 테스트
- [ ] 보안 감사

---

## 8. 벤더별 참고사항

### 8.1 국내 주요 LIS 벤더

| 벤더                       | 일반 인터페이스    | 비고               |
| -------------------------- | ------------------ | ------------------ |
| **유투바이오**             | HL7 v2.x, Web API  | 중소 병원에 일반적 |
| **랩지노믹스**             | HL7 v2.x           | 유전자 검사 특화   |
| **SCL (서울의과학연구소)** | HL7 v2.x, REST API | 수탁검사 기관      |
| **GC녹십자의료재단**       | HL7 v2.x           | 대규모 네트워크    |
| **삼광의료재단**           | HL7 v2.x           | 넓은 커버리지      |

### 8.2 연동 시 고려사항

1. **메시지 문자셋**: 국내 병원은 주로 EUC-KR 또는 UTF-8 사용
2. **환자 ID 매칭**: 시스템 간 일관된 ID 형식 확보
3. **검사 코드 매핑**: 벤더 고유 코드를 LOINC에 매핑
4. **결과 형식**: 숫자 vs 텍스트 결과 처리
5. **시간대**: 일관된 타임스탬프 처리 (KST)

---

## 9. 참조

- [HL7 International](https://www.hl7.org/)
- [FHIR R4 Specification](https://www.hl7.org/fhir/)
- [LOINC](https://loinc.org/)
- [IHE Laboratory Technical Framework](https://www.ihe.net/Technical_Frameworks/#laboratory)

---

## 변경 이력

| 일자       | 버전    | 변경 내용      |
| ---------- | ------- | -------------- |
| 2025-12-29 | 0.1.0.0 | 최초 문서 생성 |

---

_최종 수정: 2025-12-29_
