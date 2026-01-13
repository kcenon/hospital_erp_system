# 데이터베이스 설계서

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 0.1.0.0 |
| 작성일 | 2025-12-29 |
| 상태 | 초안 |
| 관리자 | kcenon@naver.com |
| DBMS | PostgreSQL 16 |

---

## 1. 데이터베이스 개요

### 1.1 설계 원칙

| 원칙 | 설명 |
|------|------|
| **정규화** | 3NF 기준, 필요시 성능 위해 비정규화 |
| **명명 규칙** | snake_case, 복수형 테이블명 |
| **감사 추적** | 모든 핵심 테이블에 생성/수정/삭제 이력 |
| **소프트 삭제** | 의료 데이터는 물리 삭제 금지 |
| **암호화** | 민감정보 필드 레벨 암호화 |

### 1.2 스키마 구조

```
hospital_erp (database)
├── public (schema) - 기본 스키마
│   ├── users           - 사용자 관리
│   ├── roles           - 역할 정의
│   ├── permissions     - 권한 정의
│   └── user_roles      - 사용자-역할 매핑
│
├── patient (schema) - 환자 관리
│   ├── patients        - 환자 기본정보
│   ├── patient_details - 환자 상세정보 (암호화)
│   └── patient_history - 환자 이력
│
├── admission (schema) - 입퇴원 관리
│   ├── admissions      - 입원 정보
│   ├── transfers       - 전실 이력
│   └── discharges      - 퇴원 정보
│
├── room (schema) - 병실 관리
│   ├── buildings       - 건물
│   ├── floors          - 층
│   ├── rooms           - 병실
│   └── beds            - 병상
│
├── report (schema) - 보고서/일지
│   ├── daily_reports   - 일일 보고서
│   ├── vital_signs     - 바이탈 사인
│   ├── intake_outputs  - 섭취/배설량
│   ├── medications     - 투약 기록
│   └── nursing_notes   - 간호 일지
│
├── rounding (schema) - 라운딩
│   ├── rounds          - 라운딩 세션
│   └── round_records   - 라운딩 기록
│
└── audit (schema) - 감사/로그
    ├── access_logs     - 접근 로그
    ├── change_logs     - 변경 이력
    └── login_history   - 로그인 이력
```

---

## 2. ERD (Entity Relationship Diagram)

### 2.1 핵심 엔터티 관계

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ERD Overview                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐       ┌──────────────┐       ┌──────────────┐                │
│  │  users   │───────│  user_roles  │───────│    roles     │                │
│  └────┬─────┘       └──────────────┘       └──────┬───────┘                │
│       │                                           │                          │
│       │                                    ┌──────┴───────┐                 │
│       │                                    │  permissions │                 │
│       │                                    └──────────────┘                 │
│       │                                                                      │
│       │  ┌──────────────────────────────────────────────────────────────┐  │
│       │  │                      PATIENT DOMAIN                          │  │
│       │  │  ┌──────────┐       ┌──────────────────┐                     │  │
│       │  │  │ patients │───────│ patient_details  │                     │  │
│       │  │  └────┬─────┘       └──────────────────┘                     │  │
│       │  │       │                                                       │  │
│       │  └───────┼───────────────────────────────────────────────────────┘  │
│       │          │                                                          │
│       │          │                                                          │
│       │  ┌───────┴───────────────────────────────────────────────────────┐  │
│       │  │                    ADMISSION DOMAIN                            │  │
│       │  │  ┌──────────────┐   ┌────────────┐   ┌──────────────┐         │  │
│       │  │  │  admissions  │───│  transfers │   │  discharges  │         │  │
│       │  │  └──────┬───────┘   └────────────┘   └──────────────┘         │  │
│       │  │         │                                                      │  │
│       │  └─────────┼──────────────────────────────────────────────────────┘  │
│       │            │                                                         │
│       │            │                                                         │
│       │  ┌─────────┼─────────────────────────────────────────────────────┐  │
│       │  │         │          ROOM DOMAIN                                 │  │
│       │  │  ┌──────┴───────┐   ┌────────┐   ┌────────┐   ┌────────┐     │  │
│       │  │  │     beds     │───│ rooms  │───│ floors │───│buildings│     │  │
│       │  │  └──────────────┘   └────────┘   └────────┘   └────────┘     │  │
│       │  │                                                                │  │
│       │  └────────────────────────────────────────────────────────────────┘  │
│       │                                                                      │
│       │                                                                      │
│       │  ┌────────────────────────────────────────────────────────────────┐ │
│       │  │                      REPORT DOMAIN                              │ │
│       │  │  ┌───────────────┐  ┌─────────────┐  ┌────────────────┐       │ │
│       │  │  │ daily_reports │──│ vital_signs │  │ intake_outputs │       │ │
│       │  │  └───────────────┘  └─────────────┘  └────────────────┘       │ │
│       │  │          │                                                      │ │
│       │  │  ┌───────┴───────┐  ┌────────────────┐                         │ │
│       │  │  │  medications  │  │  nursing_notes │                         │ │
│       │  │  └───────────────┘  └────────────────┘                         │ │
│       │  │                                                                 │ │
│       └──┴─────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 테이블 정의

### 3.1 사용자 관리 (public schema)

#### users

```sql
CREATE TABLE public.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(20) UNIQUE NOT NULL,      -- 사번
    username        VARCHAR(50) UNIQUE NOT NULL,       -- 로그인 ID
    password_hash   VARCHAR(255) NOT NULL,             -- bcrypt 해시
    name            VARCHAR(100) NOT NULL,             -- 이름
    email           VARCHAR(255),                      -- 이메일
    phone           VARCHAR(20),                       -- 전화번호
    department      VARCHAR(100),                      -- 부서
    position        VARCHAR(100),                      -- 직위
    is_active       BOOLEAN DEFAULT true,              -- 활성 상태
    last_login_at   TIMESTAMPTZ,                       -- 마지막 로그인
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMPTZ                        -- 소프트 삭제
);

CREATE INDEX idx_users_employee_id ON public.users(employee_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_department ON public.users(department);
```

#### roles

```sql
CREATE TABLE public.roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,   -- ADMIN, DOCTOR, NURSE 등
    name        VARCHAR(100) NOT NULL,          -- 표시 이름
    description TEXT,                           -- 설명
    level       INTEGER DEFAULT 0,              -- 권한 레벨 (높을수록 상위)
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 기본 역할 데이터
INSERT INTO public.roles (code, name, level) VALUES
    ('ADMIN', '시스템 관리자', 100),
    ('DOCTOR', '의사', 80),
    ('HEAD_NURSE', '수간호사', 70),
    ('NURSE', '간호사', 50),
    ('CLERK', '원무과', 40);
```

#### permissions

```sql
CREATE TABLE public.permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) UNIQUE NOT NULL,  -- patient:read, room:update 등
    name        VARCHAR(100) NOT NULL,
    resource    VARCHAR(50) NOT NULL,           -- patient, room, report 등
    action      VARCHAR(50) NOT NULL,           -- read, write, update, delete
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 역할-권한 매핑
CREATE TABLE public.role_permissions (
    role_id       UUID REFERENCES public.roles(id),
    permission_id UUID REFERENCES public.permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- 사용자-역할 매핑
CREATE TABLE public.user_roles (
    user_id    UUID REFERENCES public.users(id),
    role_id    UUID REFERENCES public.roles(id),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES public.users(id),
    PRIMARY KEY (user_id, role_id)
);
```

---

### 3.2 환자 관리 (patient schema)

#### patients

```sql
CREATE TABLE patient.patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number      VARCHAR(20) UNIQUE NOT NULL,   -- 환자 등록번호
    name                VARCHAR(100) NOT NULL,          -- 이름
    birth_date          DATE NOT NULL,                  -- 생년월일
    gender              VARCHAR(10) NOT NULL,           -- M/F
    blood_type          VARCHAR(10),                    -- A+, B-, O+, AB- 등
    phone               VARCHAR(20),                    -- 연락처
    emergency_contact   VARCHAR(100),                   -- 비상 연락처
    emergency_phone     VARCHAR(20),                    -- 비상 연락처 번호
    address             TEXT,                           -- 주소

    -- 기존 시스템 연동 정보
    legacy_patient_id   VARCHAR(50),                    -- 기존 시스템 ID
    legacy_sync_at      TIMESTAMPTZ,                    -- 마지막 동기화 시간

    -- 메타 정보
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_patients_number ON patient.patients(patient_number);
CREATE INDEX idx_patients_name ON patient.patients(name);
CREATE INDEX idx_patients_legacy ON patient.patients(legacy_patient_id);
```

#### patient_details (민감정보 - 암호화)

```sql
CREATE TABLE patient.patient_details (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID UNIQUE REFERENCES patient.patients(id),

    -- 암호화 저장 필드 (pgcrypto 사용)
    ssn_encrypted   BYTEA,                          -- 주민등록번호 (암호화)
    insurance_info  BYTEA,                          -- 보험 정보 (암호화)
    medical_history BYTEA,                          -- 과거 병력 (암호화)
    allergies       BYTEA,                          -- 알레르기 (암호화)

    -- 평문 필드
    notes           TEXT,                           -- 메모

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 암호화 함수 예시
-- INSERT: pgp_sym_encrypt(data, key)
-- SELECT: pgp_sym_decrypt(data, key)
```

---

### 3.3 병실 관리 (room schema)

#### buildings

```sql
CREATE TABLE room.buildings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(10) UNIQUE NOT NULL,   -- A, B, Main 등
    name        VARCHAR(100) NOT NULL,          -- 본관, 별관 등
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### floors

```sql
CREATE TABLE room.floors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES room.buildings(id),
    floor_number INTEGER NOT NULL,              -- 층수
    name        VARCHAR(100),                   -- 3층 병동, ICU 등
    ward_type   VARCHAR(50),                    -- GENERAL, ICU, ER 등
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, floor_number)
);
```

#### rooms

```sql
CREATE TABLE room.rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id        UUID REFERENCES room.floors(id),
    room_number     VARCHAR(20) NOT NULL,       -- 301, 302A 등
    room_type       VARCHAR(50) NOT NULL,       -- SINGLE, DOUBLE, MULTI, ICU
    capacity        INTEGER NOT NULL DEFAULT 1, -- 최대 병상 수
    current_count   INTEGER DEFAULT 0,          -- 현재 환자 수
    status          VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, FULL, MAINTENANCE
    notes           TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_floor ON room.rooms(floor_id);
CREATE INDEX idx_rooms_status ON room.rooms(status);
```

#### beds

```sql
CREATE TABLE room.beds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID REFERENCES room.rooms(id),
    bed_number      VARCHAR(10) NOT NULL,       -- A, B, 1, 2 등
    bed_type        VARCHAR(50),                -- STANDARD, ELECTRIC, ICU
    status          VARCHAR(20) DEFAULT 'EMPTY', -- EMPTY, OCCUPIED, RESERVED, MAINTENANCE

    -- 현재 배정 정보
    current_patient_id   UUID,                  -- 현재 환자 (FK는 admission에서)
    current_admission_id UUID,                  -- 현재 입원 정보

    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(room_id, bed_number)
);

CREATE INDEX idx_beds_room ON room.beds(room_id);
CREATE INDEX idx_beds_status ON room.beds(status);
CREATE INDEX idx_beds_patient ON room.beds(current_patient_id);
```

---

### 3.4 입퇴원 관리 (admission schema)

#### admissions

```sql
CREATE TABLE admission.admissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number    VARCHAR(20) UNIQUE NOT NULL,   -- 입원 번호
    patient_id          UUID NOT NULL REFERENCES patient.patients(id),
    bed_id              UUID REFERENCES room.beds(id),

    -- 입원 정보
    admission_date      DATE NOT NULL,                  -- 입원일
    admission_time      TIME NOT NULL,                  -- 입원 시간
    expected_discharge  DATE,                           -- 예상 퇴원일
    admission_type      VARCHAR(50) NOT NULL,           -- SCHEDULED, EMERGENCY, TRANSFER
    admission_reason    TEXT,                           -- 입원 사유
    diagnosis           TEXT,                           -- 진단명

    -- 담당 정보
    attending_doctor_id UUID REFERENCES public.users(id),  -- 담당의
    primary_nurse_id    UUID REFERENCES public.users(id),  -- 담당 간호사
    admitted_by         UUID REFERENCES public.users(id),  -- 입원 처리자

    -- 상태
    status              VARCHAR(20) DEFAULT 'ACTIVE',   -- ACTIVE, DISCHARGED, TRANSFERRED

    -- 메타
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admissions_patient ON admission.admissions(patient_id);
CREATE INDEX idx_admissions_bed ON admission.admissions(bed_id);
CREATE INDEX idx_admissions_date ON admission.admissions(admission_date);
CREATE INDEX idx_admissions_status ON admission.admissions(status);
CREATE INDEX idx_admissions_doctor ON admission.admissions(attending_doctor_id);
```

#### transfers (전실 이력)

```sql
CREATE TABLE admission.transfers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),

    -- 이전 병상
    from_bed_id     UUID REFERENCES room.beds(id),
    -- 새 병상
    to_bed_id       UUID REFERENCES room.beds(id),

    transfer_date   DATE NOT NULL,
    transfer_time   TIME NOT NULL,
    reason          TEXT,                           -- 전실 사유
    transferred_by  UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfers_admission ON admission.transfers(admission_id);
CREATE INDEX idx_transfers_date ON admission.transfers(transfer_date);
```

#### discharges (퇴원 정보)

```sql
CREATE TABLE admission.discharges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id        UUID UNIQUE NOT NULL REFERENCES admission.admissions(id),

    discharge_date      DATE NOT NULL,
    discharge_time      TIME NOT NULL,
    discharge_type      VARCHAR(50) NOT NULL,       -- NORMAL, TRANSFER, DEATH, AMA
    discharge_reason    TEXT,
    discharge_summary   TEXT,                       -- 퇴원 요약
    follow_up_plan      TEXT,                       -- 추후 관리 계획

    discharged_by       UUID REFERENCES public.users(id),

    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discharges_date ON admission.discharges(discharge_date);
```

---

### 3.5 보고서 및 일지 (report schema)

#### daily_reports (일일 보고서)

```sql
CREATE TABLE report.daily_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    report_date     DATE NOT NULL,

    -- 전체 상태 요약
    general_condition   VARCHAR(50),            -- GOOD, FAIR, POOR, CRITICAL
    consciousness_level VARCHAR(50),            -- ALERT, DROWSY, STUPOR, COMA
    pain_level          INTEGER CHECK (pain_level BETWEEN 0 AND 10),

    -- 수면/활동
    sleep_quality       VARCHAR(50),            -- GOOD, FAIR, POOR
    mobility_status     VARCHAR(50),            -- INDEPENDENT, ASSISTED, BEDRIDDEN

    -- 식사
    meal_intake_rate    INTEGER,                -- 0-100%
    diet_type           VARCHAR(50),            -- REGULAR, SOFT, LIQUID, NPO

    -- 배변
    bowel_movement      BOOLEAN,
    urination_status    VARCHAR(50),            -- NORMAL, FOLEY, DIFFICULTY

    -- 특이사항
    notes               TEXT,

    -- 작성자
    recorded_by         UUID REFERENCES public.users(id),
    reviewed_by         UUID REFERENCES public.users(id),
    reviewed_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(admission_id, report_date)
);

CREATE INDEX idx_daily_reports_admission ON report.daily_reports(admission_id);
CREATE INDEX idx_daily_reports_date ON report.daily_reports(report_date);
```

#### vital_signs (바이탈 사인)

```sql
CREATE TABLE report.vital_signs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    measured_at     TIMESTAMPTZ NOT NULL,

    -- 바이탈 수치
    temperature     DECIMAL(4,1),               -- 체온 (°C)
    systolic_bp     INTEGER,                    -- 수축기 혈압 (mmHg)
    diastolic_bp    INTEGER,                    -- 이완기 혈압 (mmHg)
    pulse_rate      INTEGER,                    -- 맥박 (bpm)
    respiratory_rate INTEGER,                   -- 호흡수 (/min)
    oxygen_saturation INTEGER,                  -- 산소포화도 (%)
    blood_glucose   INTEGER,                    -- 혈당 (mg/dL)

    -- 측정 방법/위치
    temp_site       VARCHAR(20),                -- ORAL, AXILLARY, TYMPANIC, RECTAL
    bp_position     VARCHAR(20),                -- SITTING, LYING, STANDING

    notes           TEXT,
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vital_signs_admission ON report.vital_signs(admission_id);
CREATE INDEX idx_vital_signs_measured ON report.vital_signs(measured_at);
```

#### intake_outputs (섭취/배설량)

```sql
CREATE TABLE report.intake_outputs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    record_date     DATE NOT NULL,
    record_time     TIME NOT NULL,

    -- 섭취량 (ml)
    oral_intake     INTEGER DEFAULT 0,          -- 경구 섭취
    iv_intake       INTEGER DEFAULT 0,          -- 수액
    other_intake    INTEGER DEFAULT 0,          -- 기타

    -- 배설량 (ml)
    urine_output    INTEGER DEFAULT 0,          -- 소변
    stool_output    INTEGER DEFAULT 0,          -- 대변
    vomit_output    INTEGER DEFAULT 0,          -- 구토
    drainage_output INTEGER DEFAULT 0,          -- 배액
    other_output    INTEGER DEFAULT 0,          -- 기타

    notes           TEXT,
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_io_admission ON report.intake_outputs(admission_id);
CREATE INDEX idx_io_date ON report.intake_outputs(record_date);
```

#### medications (투약 기록)

```sql
CREATE TABLE report.medications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),

    -- 약품 정보
    medication_name VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100) NOT NULL,      -- 100mg, 500ml 등
    route           VARCHAR(50) NOT NULL,       -- PO, IV, IM, SC, TOPICAL
    frequency       VARCHAR(50),                -- QD, BID, TID, PRN 등

    -- 투약 시간
    scheduled_time  TIMESTAMPTZ,                -- 예정 시간
    administered_at TIMESTAMPTZ,                -- 실제 투약 시간

    -- 상태
    status          VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, ADMINISTERED, MISSED, HELD
    hold_reason     TEXT,                       -- 보류 사유

    -- 기록자
    ordered_by      UUID REFERENCES public.users(id),  -- 처방의
    administered_by UUID REFERENCES public.users(id),  -- 투약자

    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medications_admission ON report.medications(admission_id);
CREATE INDEX idx_medications_scheduled ON report.medications(scheduled_time);
CREATE INDEX idx_medications_status ON report.medications(status);
```

#### nursing_notes (간호 일지)

```sql
CREATE TABLE report.nursing_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    note_datetime   TIMESTAMPTZ NOT NULL,

    -- 분류
    category        VARCHAR(50),                -- ASSESSMENT, INTERVENTION, EVALUATION
    priority        VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT

    -- 내용
    subjective      TEXT,                       -- 주관적 호소 (S)
    objective       TEXT,                       -- 객관적 관찰 (O)
    assessment      TEXT,                       -- 사정 (A)
    plan            TEXT,                       -- 계획 (P)
    intervention    TEXT,                       -- 수행
    evaluation      TEXT,                       -- 평가

    -- 작성자
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nursing_notes_admission ON report.nursing_notes(admission_id);
CREATE INDEX idx_nursing_notes_datetime ON report.nursing_notes(note_datetime);
CREATE INDEX idx_nursing_notes_priority ON report.nursing_notes(priority);
```

---

### 3.6 라운딩 (rounding schema)

#### rounds (라운딩 세션)

```sql
CREATE TABLE rounding.rounds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_date      DATE NOT NULL,
    round_type      VARCHAR(50) NOT NULL,       -- MORNING, AFTERNOON, NIGHT, EMERGENCY
    floor_id        UUID REFERENCES room.floors(id),

    -- 담당자
    lead_doctor_id  UUID REFERENCES public.users(id),

    -- 상태
    status          VARCHAR(20) DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,

    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rounds_date ON rounding.rounds(round_date);
CREATE INDEX idx_rounds_floor ON rounding.rounds(floor_id);
CREATE INDEX idx_rounds_status ON rounding.rounds(status);
```

#### round_records (라운딩 기록)

```sql
CREATE TABLE rounding.round_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id        UUID NOT NULL REFERENCES rounding.rounds(id),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),

    -- 순서
    visit_order     INTEGER,
    visited_at      TIMESTAMPTZ,

    -- 관찰 내용
    patient_status  VARCHAR(50),                -- STABLE, IMPROVING, DECLINING, CRITICAL
    chief_complaint TEXT,                       -- 주호소
    observation     TEXT,                       -- 관찰 사항
    plan            TEXT,                       -- 향후 계획
    orders          TEXT,                       -- 지시 사항

    -- 기록자
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(round_id, admission_id)
);

CREATE INDEX idx_round_records_round ON rounding.round_records(round_id);
CREATE INDEX idx_round_records_admission ON rounding.round_records(admission_id);
```

---

### 3.7 감사 로그 (audit schema)

관련 요구사항: REQ-NFR-030~033
준수 법규: 개인정보보호법 (2년 보존), 의료법

#### Enum 타입

```sql
-- 로그인 기기 유형
CREATE TYPE audit.DeviceType AS ENUM ('PC', 'TABLET', 'MOBILE');

-- 감사 작업 유형
CREATE TYPE audit.AuditAction AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE');
```

#### login_history

보안 감사를 위한 모든 로그인 시도(성공/실패) 추적

```sql
CREATE TABLE audit.login_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,                       -- 알 수 없는 사용자 로그인 실패 시 NULL
    username        VARCHAR(50) NOT NULL,
    ip_address      VARCHAR(45) NOT NULL,       -- IPv6 지원
    user_agent      TEXT,
    device_type     audit.DeviceType,
    browser         VARCHAR(50),
    os              VARCHAR(50),
    login_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_at       TIMESTAMPTZ,
    session_id      VARCHAR(100),
    success         BOOLEAN NOT NULL,
    failure_reason  VARCHAR(100),               -- INVALID_PASSWORD, USER_NOT_FOUND, ACCOUNT_LOCKED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_history_user_time ON audit.login_history(user_id, login_at DESC);
CREATE INDEX idx_login_history_ip ON audit.login_history(ip_address, login_at DESC);
CREATE INDEX idx_login_history_created ON audit.login_history(created_at DESC);
```

#### access_logs

의료법 준수를 위한 환자 정보 접근 추적

```sql
CREATE TABLE audit.access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    username        VARCHAR(50) NOT NULL,
    user_role       VARCHAR(50),
    ip_address      VARCHAR(45) NOT NULL,

    -- 접근 정보
    resource_type   VARCHAR(50) NOT NULL,       -- patient, admission, vital_sign 등
    resource_id     UUID NOT NULL,
    action          audit.AuditAction NOT NULL,

    -- 요청 정보
    request_path    VARCHAR(255),
    request_method  VARCHAR(10),

    -- 환자 접근 전용
    patient_id      UUID,
    accessed_fields TEXT[],                     -- 접근한 필드명 배열

    -- 결과
    success         BOOLEAN NOT NULL DEFAULT true,
    error_code      VARCHAR(50),
    error_message   TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_logs_user_time ON audit.access_logs(user_id, created_at DESC);
CREATE INDEX idx_access_logs_patient ON audit.access_logs(patient_id, created_at DESC);
CREATE INDEX idx_access_logs_resource ON audit.access_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_access_logs_created ON audit.access_logs(created_at DESC);
```

#### change_logs

감사 추적을 위한 변경 전/후 값 추적

```sql
CREATE TABLE audit.change_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    username        VARCHAR(50) NOT NULL,
    ip_address      VARCHAR(45),

    -- 변경 정보
    table_schema    VARCHAR(50) NOT NULL,
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,
    action          audit.AuditAction NOT NULL,

    -- 변경 데이터
    old_values      JSONB,                      -- 이전 값 (UPDATE/DELETE용)
    new_values      JSONB,                      -- 새 값 (CREATE/UPDATE용)
    changed_fields  TEXT[],                     -- 변경된 필드명 목록

    change_reason   TEXT,                       -- 선택적 변경 사유
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_change_logs_user_time ON audit.change_logs(user_id, created_at DESC);
CREATE INDEX idx_change_logs_table ON audit.change_logs(table_schema, table_name, created_at DESC);
CREATE INDEX idx_change_logs_record ON audit.change_logs(record_id, created_at DESC);
CREATE INDEX idx_change_logs_created ON audit.change_logs(created_at DESC);
```

#### 아카이브 테이블

보존 정책 준수를 위해 아카이브 테이블은 메인 테이블 구조를 미러링

```sql
CREATE TABLE audit.login_history_archive (LIKE audit.login_history INCLUDING ALL);
CREATE TABLE audit.access_logs_archive (LIKE audit.access_logs INCLUDING ALL);
CREATE TABLE audit.change_logs_archive (LIKE audit.change_logs INCLUDING ALL);
```

#### 감사 헬퍼 함수

```sql
-- 보존 기간 기반 오래된 로그 아카이브 (법적 준수를 위해 2년)
CREATE FUNCTION audit.archive_old_logs(retention_days INTEGER)
RETURNS TABLE (login_history_archived INT, access_logs_archived INT, change_logs_archived INT);

-- 자동 변경 로깅을 위한 범용 트리거
CREATE FUNCTION audit.log_changes() RETURNS TRIGGER;

-- 요청 시작 시 사용자 컨텍스트 설정 (감사 추적용)
CREATE FUNCTION audit.set_user_context(p_user_id UUID, p_username VARCHAR(50), p_ip_address VARCHAR(45));

-- 요청 종료 시 사용자 컨텍스트 제거
CREATE FUNCTION audit.clear_user_context();
```

---

## 4. 인덱스 전략

### 4.1 주요 인덱스

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| patients | patient_number | 환자번호 검색 |
| patients | name | 이름 검색 |
| admissions | (patient_id, status) | 환자별 활성 입원 조회 |
| beds | status | 빈 병상 검색 |
| vital_signs | (admission_id, measured_at) | 환자별 바이탈 이력 |
| access_logs | (created_at, user_id) | 감사 로그 조회 |

### 4.2 복합 인덱스

```sql
-- 병실 현황 조회 최적화
CREATE INDEX idx_beds_room_status ON room.beds(room_id, status);

-- 환자별 최신 바이탈 조회
CREATE INDEX idx_vital_signs_admission_time
    ON report.vital_signs(admission_id, measured_at DESC);

-- 일일 보고서 조회
CREATE INDEX idx_daily_reports_date_admission
    ON report.daily_reports(report_date, admission_id);
```

---

## 5. 데이터 마이그레이션

### 5.1 구글 시트 데이터 이관

```sql
-- 임시 스테이징 테이블
CREATE TABLE migration.staging_patients (
    row_number      INTEGER,
    raw_name        VARCHAR(200),
    raw_birth       VARCHAR(50),
    raw_room        VARCHAR(50),
    raw_admit_date  VARCHAR(50),
    raw_diagnosis   TEXT,
    import_status   VARCHAR(20) DEFAULT 'PENDING',
    error_message   TEXT,
    imported_at     TIMESTAMPTZ
);

-- 마이그레이션 프로시저 (예시)
CREATE OR REPLACE PROCEDURE migration.import_patients()
LANGUAGE plpgsql AS $$
BEGIN
    -- 데이터 정제 및 이관 로직
    INSERT INTO patient.patients (patient_number, name, birth_date, ...)
    SELECT
        generate_patient_number(),
        trim(raw_name),
        to_date(raw_birth, 'YYYY-MM-DD'),
        ...
    FROM migration.staging_patients
    WHERE import_status = 'PENDING';

    -- 상태 업데이트
    UPDATE migration.staging_patients
    SET import_status = 'COMPLETED', imported_at = CURRENT_TIMESTAMP
    WHERE import_status = 'PENDING';
END;
$$;
```

---

## 6. 백업 및 복구

### 6.1 백업 정책

| 유형 | 주기 | 보관 기간 | 방식 |
|------|------|----------|------|
| Full Backup | 일 1회 | 30일 | pg_dump + S3 |
| Incremental | 1시간 | 7일 | WAL Archiving |
| Point-in-Time | 실시간 | 7일 | WAL + RDS 자동 |

### 6.2 복구 절차

```bash
# 특정 시점 복구 (AWS RDS)
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier hospital-erp-prod \
    --target-db-instance-identifier hospital-erp-recovery \
    --restore-time "2025-12-29T10:30:00Z"
```

---

## 부록: Prisma 스키마 (참고)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  employeeId  String   @unique @map("employee_id")
  username    String   @unique
  passwordHash String  @map("password_hash")
  name        String
  email       String?
  phone       String?
  department  String?
  position    String?
  isActive    Boolean  @default(true) @map("is_active")
  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  roles       UserRole[]
  admissions  Admission[] @relation("AttendingDoctor")

  @@map("users")
}

model Patient {
  id            String   @id @default(uuid())
  patientNumber String   @unique @map("patient_number")
  name          String
  birthDate     DateTime @map("birth_date") @db.Date
  gender        String
  bloodType     String?  @map("blood_type")
  phone         String?
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  admissions    Admission[]

  @@map("patients")
}

// ... 나머지 모델 정의
```
