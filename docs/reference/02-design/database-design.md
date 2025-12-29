# Database Design Document

## Document Information

| Item | Content |
|------|---------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Owner | kcenon@naver.com |
| DBMS | PostgreSQL 16 |

---

## 1. Database Overview

### 1.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Normalization** | 3NF baseline, denormalize for performance when needed |
| **Naming Convention** | snake_case, plural table names |
| **Audit Trail** | Create/update/delete history on all core tables |
| **Soft Delete** | Physical deletion prohibited for medical data |
| **Encryption** | Field-level encryption for sensitive information |

### 1.2 Schema Structure

```
hospital_erp (database)
├── public (schema) - Default Schema
│   ├── users           - User Management
│   ├── roles           - Role Definitions
│   ├── permissions     - Permission Definitions
│   └── user_roles      - User-Role Mapping
│
├── patient (schema) - Patient Management
│   ├── patients        - Patient Basic Information
│   ├── patient_details - Patient Details (Encrypted)
│   └── patient_history - Patient History
│
├── admission (schema) - Admission Management
│   ├── admissions      - Admission Information
│   ├── transfers       - Transfer History
│   └── discharges      - Discharge Information
│
├── room (schema) - Room Management
│   ├── buildings       - Buildings
│   ├── floors          - Floors
│   ├── rooms           - Rooms
│   └── beds            - Beds
│
├── report (schema) - Reports/Logs
│   ├── daily_reports   - Daily Reports
│   ├── vital_signs     - Vital Signs
│   ├── intake_outputs  - Intake/Output Records
│   ├── medications     - Medication Records
│   └── nursing_notes   - Nursing Notes
│
├── rounding (schema) - Rounding
│   ├── rounds          - Rounding Sessions
│   └── round_records   - Rounding Records
│
└── audit (schema) - Audit/Logs
    ├── access_logs     - Access Logs
    ├── change_logs     - Change History
    └── login_history   - Login History
```

---

## 2. ERD (Entity Relationship Diagram)

### 2.1 Core Entity Relationships

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

## 3. Table Definitions

### 3.1 User Management (public schema)

#### users

```sql
CREATE TABLE public.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(20) UNIQUE NOT NULL,      -- Employee ID
    username        VARCHAR(50) UNIQUE NOT NULL,       -- Login ID
    password_hash   VARCHAR(255) NOT NULL,             -- bcrypt hash
    name            VARCHAR(100) NOT NULL,             -- Name
    email           VARCHAR(255),                      -- Email
    phone           VARCHAR(20),                       -- Phone
    department      VARCHAR(100),                      -- Department
    position        VARCHAR(100),                      -- Position
    is_active       BOOLEAN DEFAULT true,              -- Active status
    last_login_at   TIMESTAMPTZ,                       -- Last login
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMPTZ                        -- Soft delete
);

CREATE INDEX idx_users_employee_id ON public.users(employee_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_department ON public.users(department);
```

#### roles

```sql
CREATE TABLE public.roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,   -- ADMIN, DOCTOR, NURSE, etc.
    name        VARCHAR(100) NOT NULL,          -- Display name
    description TEXT,                           -- Description
    level       INTEGER DEFAULT 0,              -- Permission level (higher = senior)
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Default role data
INSERT INTO public.roles (code, name, level) VALUES
    ('ADMIN', 'System Administrator', 100),
    ('DOCTOR', 'Doctor', 80),
    ('HEAD_NURSE', 'Head Nurse', 70),
    ('NURSE', 'Nurse', 50),
    ('CLERK', 'Admissions Clerk', 40);
```

#### permissions

```sql
CREATE TABLE public.permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) UNIQUE NOT NULL,  -- patient:read, room:update, etc.
    name        VARCHAR(100) NOT NULL,
    resource    VARCHAR(50) NOT NULL,           -- patient, room, report, etc.
    action      VARCHAR(50) NOT NULL,           -- read, write, update, delete
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission Mapping
CREATE TABLE public.role_permissions (
    role_id       UUID REFERENCES public.roles(id),
    permission_id UUID REFERENCES public.permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role Mapping
CREATE TABLE public.user_roles (
    user_id    UUID REFERENCES public.users(id),
    role_id    UUID REFERENCES public.roles(id),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES public.users(id),
    PRIMARY KEY (user_id, role_id)
);
```

---

### 3.2 Patient Management (patient schema)

#### patients

```sql
CREATE TABLE patient.patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number      VARCHAR(20) UNIQUE NOT NULL,   -- Patient registration number
    name                VARCHAR(100) NOT NULL,          -- Name
    birth_date          DATE NOT NULL,                  -- Date of birth
    gender              VARCHAR(10) NOT NULL,           -- M/F
    blood_type          VARCHAR(10),                    -- A+, B-, O+, AB-, etc.
    phone               VARCHAR(20),                    -- Contact number
    emergency_contact   VARCHAR(100),                   -- Emergency contact
    emergency_phone     VARCHAR(20),                    -- Emergency contact phone
    address             TEXT,                           -- Address

    -- Legacy system integration info
    legacy_patient_id   VARCHAR(50),                    -- Legacy system ID
    legacy_sync_at      TIMESTAMPTZ,                    -- Last sync time

    -- Meta information
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_patients_number ON patient.patients(patient_number);
CREATE INDEX idx_patients_name ON patient.patients(name);
CREATE INDEX idx_patients_legacy ON patient.patients(legacy_patient_id);
```

#### patient_details (Sensitive Information - Encrypted)

```sql
CREATE TABLE patient.patient_details (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID UNIQUE REFERENCES patient.patients(id),

    -- Encrypted storage fields (using pgcrypto)
    ssn_encrypted   BYTEA,                          -- National ID (encrypted)
    insurance_info  BYTEA,                          -- Insurance info (encrypted)
    medical_history BYTEA,                          -- Medical history (encrypted)
    allergies       BYTEA,                          -- Allergies (encrypted)

    -- Plain text fields
    notes           TEXT,                           -- Notes

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Encryption function examples
-- INSERT: pgp_sym_encrypt(data, key)
-- SELECT: pgp_sym_decrypt(data, key)
```

---

### 3.3 Room Management (room schema)

#### buildings

```sql
CREATE TABLE room.buildings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(10) UNIQUE NOT NULL,   -- A, B, Main, etc.
    name        VARCHAR(100) NOT NULL,          -- Main Building, Annex, etc.
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### floors

```sql
CREATE TABLE room.floors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES room.buildings(id),
    floor_number INTEGER NOT NULL,              -- Floor number
    name        VARCHAR(100),                   -- 3rd Floor Ward, ICU, etc.
    ward_type   VARCHAR(50),                    -- GENERAL, ICU, ER, etc.
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
    room_number     VARCHAR(20) NOT NULL,       -- 301, 302A, etc.
    room_type       VARCHAR(50) NOT NULL,       -- SINGLE, DOUBLE, MULTI, ICU
    capacity        INTEGER NOT NULL DEFAULT 1, -- Maximum bed count
    current_count   INTEGER DEFAULT 0,          -- Current patient count
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
    bed_number      VARCHAR(10) NOT NULL,       -- A, B, 1, 2, etc.
    bed_type        VARCHAR(50),                -- STANDARD, ELECTRIC, ICU
    status          VARCHAR(20) DEFAULT 'EMPTY', -- EMPTY, OCCUPIED, RESERVED, MAINTENANCE

    -- Current assignment info
    current_patient_id   UUID,                  -- Current patient (FK via admission)
    current_admission_id UUID,                  -- Current admission info

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

### 3.4 Admission Management (admission schema)

#### admissions

```sql
CREATE TABLE admission.admissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number    VARCHAR(20) UNIQUE NOT NULL,   -- Admission number
    patient_id          UUID NOT NULL REFERENCES patient.patients(id),
    bed_id              UUID REFERENCES room.beds(id),

    -- Admission information
    admission_date      DATE NOT NULL,                  -- Admission date
    admission_time      TIME NOT NULL,                  -- Admission time
    expected_discharge  DATE,                           -- Expected discharge date
    admission_type      VARCHAR(50) NOT NULL,           -- SCHEDULED, EMERGENCY, TRANSFER
    admission_reason    TEXT,                           -- Reason for admission
    diagnosis           TEXT,                           -- Diagnosis

    -- Responsible staff
    attending_doctor_id UUID REFERENCES public.users(id),  -- Attending doctor
    primary_nurse_id    UUID REFERENCES public.users(id),  -- Primary nurse
    admitted_by         UUID REFERENCES public.users(id),  -- Admission processor

    -- Status
    status              VARCHAR(20) DEFAULT 'ACTIVE',   -- ACTIVE, DISCHARGED, TRANSFERRED

    -- Meta
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admissions_patient ON admission.admissions(patient_id);
CREATE INDEX idx_admissions_bed ON admission.admissions(bed_id);
CREATE INDEX idx_admissions_date ON admission.admissions(admission_date);
CREATE INDEX idx_admissions_status ON admission.admissions(status);
CREATE INDEX idx_admissions_doctor ON admission.admissions(attending_doctor_id);
```

#### transfers (Transfer History)

```sql
CREATE TABLE admission.transfers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),

    -- Previous bed
    from_bed_id     UUID REFERENCES room.beds(id),
    -- New bed
    to_bed_id       UUID REFERENCES room.beds(id),

    transfer_date   DATE NOT NULL,
    transfer_time   TIME NOT NULL,
    reason          TEXT,                           -- Transfer reason
    transferred_by  UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfers_admission ON admission.transfers(admission_id);
CREATE INDEX idx_transfers_date ON admission.transfers(transfer_date);
```

#### discharges (Discharge Information)

```sql
CREATE TABLE admission.discharges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id        UUID UNIQUE NOT NULL REFERENCES admission.admissions(id),

    discharge_date      DATE NOT NULL,
    discharge_time      TIME NOT NULL,
    discharge_type      VARCHAR(50) NOT NULL,       -- NORMAL, TRANSFER, DEATH, AMA
    discharge_reason    TEXT,
    discharge_summary   TEXT,                       -- Discharge summary
    follow_up_plan      TEXT,                       -- Follow-up care plan

    discharged_by       UUID REFERENCES public.users(id),

    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discharges_date ON admission.discharges(discharge_date);
```

---

### 3.5 Reports and Logs (report schema)

#### daily_reports (Daily Reports)

```sql
CREATE TABLE report.daily_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    report_date     DATE NOT NULL,

    -- Overall condition summary
    general_condition   VARCHAR(50),            -- GOOD, FAIR, POOR, CRITICAL
    consciousness_level VARCHAR(50),            -- ALERT, DROWSY, STUPOR, COMA
    pain_level          INTEGER CHECK (pain_level BETWEEN 0 AND 10),

    -- Sleep/Activity
    sleep_quality       VARCHAR(50),            -- GOOD, FAIR, POOR
    mobility_status     VARCHAR(50),            -- INDEPENDENT, ASSISTED, BEDRIDDEN

    -- Meals
    meal_intake_rate    INTEGER,                -- 0-100%
    diet_type           VARCHAR(50),            -- REGULAR, SOFT, LIQUID, NPO

    -- Bowel
    bowel_movement      BOOLEAN,
    urination_status    VARCHAR(50),            -- NORMAL, FOLEY, DIFFICULTY

    -- Notes
    notes               TEXT,

    -- Author
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

#### vital_signs (Vital Signs)

```sql
CREATE TABLE report.vital_signs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    measured_at     TIMESTAMPTZ NOT NULL,

    -- Vital values
    temperature     DECIMAL(4,1),               -- Temperature (°C)
    systolic_bp     INTEGER,                    -- Systolic blood pressure (mmHg)
    diastolic_bp    INTEGER,                    -- Diastolic blood pressure (mmHg)
    pulse_rate      INTEGER,                    -- Pulse rate (bpm)
    respiratory_rate INTEGER,                   -- Respiratory rate (/min)
    oxygen_saturation INTEGER,                  -- Oxygen saturation (%)
    blood_glucose   INTEGER,                    -- Blood glucose (mg/dL)

    -- Measurement method/location
    temp_site       VARCHAR(20),                -- ORAL, AXILLARY, TYMPANIC, RECTAL
    bp_position     VARCHAR(20),                -- SITTING, LYING, STANDING

    notes           TEXT,
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vital_signs_admission ON report.vital_signs(admission_id);
CREATE INDEX idx_vital_signs_measured ON report.vital_signs(measured_at);
```

#### intake_outputs (Intake/Output Records)

```sql
CREATE TABLE report.intake_outputs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    record_date     DATE NOT NULL,
    record_time     TIME NOT NULL,

    -- Intake (ml)
    oral_intake     INTEGER DEFAULT 0,          -- Oral intake
    iv_intake       INTEGER DEFAULT 0,          -- IV fluids
    other_intake    INTEGER DEFAULT 0,          -- Other

    -- Output (ml)
    urine_output    INTEGER DEFAULT 0,          -- Urine
    stool_output    INTEGER DEFAULT 0,          -- Stool
    vomit_output    INTEGER DEFAULT 0,          -- Vomit
    drainage_output INTEGER DEFAULT 0,          -- Drainage
    other_output    INTEGER DEFAULT 0,          -- Other

    notes           TEXT,
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_io_admission ON report.intake_outputs(admission_id);
CREATE INDEX idx_io_date ON report.intake_outputs(record_date);
```

#### medications (Medication Records)

```sql
CREATE TABLE report.medications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),

    -- Medication information
    medication_name VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100) NOT NULL,      -- 100mg, 500ml, etc.
    route           VARCHAR(50) NOT NULL,       -- PO, IV, IM, SC, TOPICAL
    frequency       VARCHAR(50),                -- QD, BID, TID, PRN, etc.

    -- Administration time
    scheduled_time  TIMESTAMPTZ,                -- Scheduled time
    administered_at TIMESTAMPTZ,                -- Actual administration time

    -- Status
    status          VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, ADMINISTERED, MISSED, HELD
    hold_reason     TEXT,                       -- Reason for hold

    -- Recorder
    ordered_by      UUID REFERENCES public.users(id),  -- Ordering physician
    administered_by UUID REFERENCES public.users(id),  -- Administering staff

    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medications_admission ON report.medications(admission_id);
CREATE INDEX idx_medications_scheduled ON report.medications(scheduled_time);
CREATE INDEX idx_medications_status ON report.medications(status);
```

#### nursing_notes (Nursing Notes)

```sql
CREATE TABLE report.nursing_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),
    note_datetime   TIMESTAMPTZ NOT NULL,

    -- Classification
    category        VARCHAR(50),                -- ASSESSMENT, INTERVENTION, EVALUATION
    priority        VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT

    -- Content
    subjective      TEXT,                       -- Subjective findings (S)
    objective       TEXT,                       -- Objective findings (O)
    assessment      TEXT,                       -- Assessment (A)
    plan            TEXT,                       -- Plan (P)
    intervention    TEXT,                       -- Intervention
    evaluation      TEXT,                       -- Evaluation

    -- Author
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nursing_notes_admission ON report.nursing_notes(admission_id);
CREATE INDEX idx_nursing_notes_datetime ON report.nursing_notes(note_datetime);
CREATE INDEX idx_nursing_notes_priority ON report.nursing_notes(priority);
```

---

### 3.6 Rounding (rounding schema)

#### rounds (Rounding Sessions)

```sql
CREATE TABLE rounding.rounds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_date      DATE NOT NULL,
    round_type      VARCHAR(50) NOT NULL,       -- MORNING, AFTERNOON, NIGHT, EMERGENCY
    floor_id        UUID REFERENCES room.floors(id),

    -- Lead physician
    lead_doctor_id  UUID REFERENCES public.users(id),

    -- Status
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

#### round_records (Rounding Records)

```sql
CREATE TABLE rounding.round_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id        UUID NOT NULL REFERENCES rounding.rounds(id),
    admission_id    UUID NOT NULL REFERENCES admission.admissions(id),

    -- Order
    visit_order     INTEGER,
    visited_at      TIMESTAMPTZ,

    -- Observation content
    patient_status  VARCHAR(50),                -- STABLE, IMPROVING, DECLINING, CRITICAL
    chief_complaint TEXT,                       -- Chief complaint
    observation     TEXT,                       -- Observations
    plan            TEXT,                       -- Future plan
    orders          TEXT,                       -- Instructions

    -- Recorder
    recorded_by     UUID REFERENCES public.users(id),

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(round_id, admission_id)
);

CREATE INDEX idx_round_records_round ON rounding.round_records(round_id);
CREATE INDEX idx_round_records_admission ON rounding.round_records(admission_id);
```

---

### 3.7 Audit Logs (audit schema)

#### access_logs

```sql
CREATE TABLE audit.access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES public.users(id),

    -- Access information
    resource_type   VARCHAR(50) NOT NULL,       -- patient, report, room
    resource_id     UUID,
    action          VARCHAR(50) NOT NULL,       -- VIEW, CREATE, UPDATE, DELETE

    -- Request information
    ip_address      INET,
    user_agent      TEXT,
    request_path    VARCHAR(500),

    -- Result
    success         BOOLEAN DEFAULT true,
    error_message   TEXT,

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning (monthly)
CREATE INDEX idx_access_logs_user ON audit.access_logs(user_id);
CREATE INDEX idx_access_logs_resource ON audit.access_logs(resource_type, resource_id);
CREATE INDEX idx_access_logs_created ON audit.access_logs(created_at);
```

#### change_logs

```sql
CREATE TABLE audit.change_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES public.users(id),

    -- Change target
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,

    -- Change content
    operation       VARCHAR(20) NOT NULL,       -- INSERT, UPDATE, DELETE
    old_values      JSONB,                      -- Previous values
    new_values      JSONB,                      -- New values
    changed_fields  TEXT[],                     -- List of changed fields

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_change_logs_table ON audit.change_logs(table_name, record_id);
CREATE INDEX idx_change_logs_created ON audit.change_logs(created_at);
```

---

## 4. Index Strategy

### 4.1 Primary Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| patients | patient_number | Patient number search |
| patients | name | Name search |
| admissions | (patient_id, status) | Active admission by patient |
| beds | status | Vacant bed search |
| vital_signs | (admission_id, measured_at) | Vital history by patient |
| access_logs | (created_at, user_id) | Audit log query |

### 4.2 Composite Indexes

```sql
-- Room status query optimization
CREATE INDEX idx_beds_room_status ON room.beds(room_id, status);

-- Latest vitals by patient
CREATE INDEX idx_vital_signs_admission_time
    ON report.vital_signs(admission_id, measured_at DESC);

-- Daily report query
CREATE INDEX idx_daily_reports_date_admission
    ON report.daily_reports(report_date, admission_id);
```

---

## 5. Data Migration

### 5.1 Google Sheets Data Migration

```sql
-- Temporary staging table
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

-- Migration procedure (example)
CREATE OR REPLACE PROCEDURE migration.import_patients()
LANGUAGE plpgsql AS $$
BEGIN
    -- Data cleansing and migration logic
    INSERT INTO patient.patients (patient_number, name, birth_date, ...)
    SELECT
        generate_patient_number(),
        trim(raw_name),
        to_date(raw_birth, 'YYYY-MM-DD'),
        ...
    FROM migration.staging_patients
    WHERE import_status = 'PENDING';

    -- Status update
    UPDATE migration.staging_patients
    SET import_status = 'COMPLETED', imported_at = CURRENT_TIMESTAMP
    WHERE import_status = 'PENDING';
END;
$$;
```

---

## 6. Backup and Recovery

### 6.1 Backup Policy

| Type | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| Full Backup | Daily | 30 days | pg_dump + S3 |
| Incremental | Hourly | 7 days | WAL Archiving |
| Point-in-Time | Real-time | 7 days | WAL + RDS Auto |

### 6.2 Recovery Procedure

```bash
# Point-in-time recovery (AWS RDS)
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier hospital-erp-prod \
    --target-db-instance-identifier hospital-erp-recovery \
    --restore-time "2025-12-29T10:30:00Z"
```

---

## Appendix: Prisma Schema (Reference)

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

// ... remaining model definitions
```
