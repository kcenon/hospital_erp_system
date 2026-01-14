# Database Design Document

## Document Information

| Item             | Content          |
| ---------------- | ---------------- |
| Document Version | 0.1.0.0          |
| Created Date     | 2025-12-29       |
| Status           | Draft            |
| Owner            | kcenon@naver.com |
| DBMS             | PostgreSQL 16    |

---

## 1. Database Overview

### 1.1 Design Principles

| Principle             | Description                                           |
| --------------------- | ----------------------------------------------------- |
| **Normalization**     | 3NF baseline, denormalize for performance when needed |
| **Naming Convention** | snake_case, plural table names                        |
| **Audit Trail**       | Create/update/delete history on all core tables       |
| **Soft Delete**       | Physical deletion prohibited for medical data         |
| **Encryption**        | Field-level encryption for sensitive information      |

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

Related Requirements: REQ-FR-050~054
SDS Reference: Section 4.6 (Rounding Module), Section 4.6.2 (State Machine)

#### Enum Types

```sql
-- Round type enumeration
CREATE TYPE rounding.RoundType AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT');

-- Round status enumeration (state machine states)
CREATE TYPE rounding.RoundStatus AS ENUM ('PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- Patient status enumeration for round records
CREATE TYPE rounding.PatientStatus AS ENUM ('STABLE', 'IMPROVING', 'DECLINING', 'CRITICAL');
```

#### round_sequences (Round Number Sequence)

```sql
CREATE TABLE rounding.round_sequences (
    id              SERIAL PRIMARY KEY,
    date            DATE NOT NULL UNIQUE,
    last_value      INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### rounds (Rounding Sessions)

```sql
CREATE TABLE rounding.rounds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_number    VARCHAR(20) NOT NULL UNIQUE, -- R2025011501 (R + YYYYMMDD + sequence)
    floor_id        UUID NOT NULL REFERENCES room.floors(id),
    round_type      rounding.RoundType NOT NULL,
    scheduled_date  DATE NOT NULL,
    scheduled_time  TIME,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    paused_at       TIMESTAMPTZ,
    status          rounding.RoundStatus NOT NULL DEFAULT 'PLANNED',
    lead_doctor_id  UUID NOT NULL,              -- References public.users
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      UUID NOT NULL               -- References public.users
);

CREATE INDEX idx_rounds_floor_date ON rounding.rounds(floor_id, scheduled_date);
CREATE INDEX idx_rounds_status ON rounding.rounds(status);
CREATE INDEX idx_rounds_lead_doctor ON rounding.rounds(lead_doctor_id);
CREATE INDEX idx_rounds_scheduled_date ON rounding.rounds(scheduled_date);
CREATE INDEX idx_rounds_round_type ON rounding.rounds(round_type);
```

#### round_records (Rounding Records)

```sql
CREATE TABLE rounding.round_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id        UUID NOT NULL REFERENCES rounding.rounds(id) ON DELETE CASCADE,
    admission_id    UUID NOT NULL,              -- References admission.admissions
    visit_order     INTEGER NOT NULL,           -- Order in which patient was visited
    patient_status  rounding.PatientStatus,
    chief_complaint TEXT,                       -- Patient's main complaint
    observation     TEXT,                       -- Doctor's observations
    assessment      TEXT,                       -- Clinical assessment
    plan            TEXT,                       -- Treatment plan
    orders          TEXT,                       -- New orders (medications, tests, etc.)
    visited_at      TIMESTAMPTZ,
    visit_duration  INTEGER,                    -- Duration in seconds
    recorded_by     UUID NOT NULL,              -- References public.users
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, admission_id)
);

CREATE INDEX idx_round_records_round ON rounding.round_records(round_id);
CREATE INDEX idx_round_records_admission ON rounding.round_records(admission_id);
CREATE INDEX idx_round_records_recorded_by ON rounding.round_records(recorded_by);
CREATE INDEX idx_round_records_visit_order ON rounding.round_records(round_id, visit_order);
```

#### Round Number Generator Function

```sql
CREATE OR REPLACE FUNCTION rounding.generate_round_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VARCHAR AS $$
DECLARE
    v_seq INTEGER;
    v_round_number VARCHAR(20);
BEGIN
    INSERT INTO rounding.round_sequences (date, last_value)
    VALUES (p_date, 1)
    ON CONFLICT (date) DO UPDATE
    SET last_value = rounding.round_sequences.last_value + 1,
        updated_at = CURRENT_TIMESTAMP
    RETURNING last_value INTO v_seq;

    v_round_number := 'R' || TO_CHAR(p_date, 'YYYYMMDD') || LPAD(v_seq::TEXT, 2, '0');
    RETURN v_round_number;
END;
$$ LANGUAGE plpgsql;
```

#### State Transition Function

```sql
CREATE OR REPLACE FUNCTION rounding.transition_round_status(
    p_round_id UUID,
    p_new_status VARCHAR,
    p_user_id UUID
)
RETURNS rounding.rounds AS $$
DECLARE
    v_round rounding.rounds;
    v_current_status VARCHAR;
    v_valid_next_statuses TEXT;
BEGIN
    SELECT * INTO v_round FROM rounding.rounds WHERE id = p_round_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Round not found: %', p_round_id;
    END IF;

    v_current_status := v_round.status::TEXT;

    -- Define valid transitions
    CASE v_current_status
        WHEN 'PLANNED' THEN v_valid_next_statuses := 'IN_PROGRESS,CANCELLED';
        WHEN 'IN_PROGRESS' THEN v_valid_next_statuses := 'PAUSED,COMPLETED';
        WHEN 'PAUSED' THEN v_valid_next_statuses := 'IN_PROGRESS,COMPLETED,CANCELLED';
        WHEN 'COMPLETED' THEN v_valid_next_statuses := '';
        WHEN 'CANCELLED' THEN v_valid_next_statuses := '';
        ELSE RAISE EXCEPTION 'Unknown status: %', v_current_status;
    END CASE;

    -- Validate transition
    IF v_valid_next_statuses = '' OR
       NOT (p_new_status = ANY(string_to_array(v_valid_next_statuses, ','))) THEN
        RAISE EXCEPTION 'Invalid state transition from % to %', v_current_status, p_new_status;
    END IF;

    -- Update timestamps based on new status
    UPDATE rounding.rounds SET
        status = p_new_status::rounding.RoundStatus,
        started_at = CASE WHEN p_new_status = 'IN_PROGRESS' AND started_at IS NULL THEN NOW() ELSE started_at END,
        paused_at = CASE WHEN p_new_status = 'PAUSED' THEN NOW() ELSE NULL END,
        completed_at = CASE WHEN p_new_status = 'COMPLETED' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = p_round_id
    RETURNING * INTO v_round;

    RETURN v_round;
END;
$$ LANGUAGE plpgsql;
```

#### Round Patient List View

```sql
CREATE VIEW rounding.round_patient_list AS
SELECT
    r.id AS round_id,
    r.round_number,
    r.status AS round_status,
    r.round_type,
    r.scheduled_date,
    r.lead_doctor_id,
    a.id AS admission_id,
    a.patient_id,
    a.diagnosis,
    a.admission_date,
    b.id AS bed_id,
    rm.room_number,
    b.bed_number,
    f.id AS floor_id,
    f.name AS floor_name,
    rr.id AS record_id,
    rr.visit_order,
    rr.patient_status,
    rr.visited_at
FROM rounding.rounds r
CROSS JOIN admission.admissions a
JOIN room.beds b ON a.bed_id = b.id
JOIN room.rooms rm ON b.room_id = rm.id
JOIN room.floors f ON rm.floor_id = f.id
LEFT JOIN rounding.round_records rr ON rr.round_id = r.id AND rr.admission_id = a.id
WHERE f.id = r.floor_id AND a.status = 'ACTIVE';
```

#### State Machine Diagram

```
State Machine: PLANNED → IN_PROGRESS → (PAUSED ↔ IN_PROGRESS) → COMPLETED/CANCELLED

┌─────────┐     start      ┌─────────────┐
│ PLANNED │───────────────▶│ IN_PROGRESS │
└────┬────┘                └─────┬───┬───┘
     │                           │   │
     │ cancel                    │   │ pause
     │                           │   │
     ▼                           │   ▼
┌───────────┐                    │ ┌────────┐
│ CANCELLED │◀───────────────────┤ │ PAUSED │
└───────────┘      cancel        │ └───┬────┘
                                 │     │
                                 │     │ resume
                                 │     │
                   complete      │     │
                                 ▼     ▼
                           ┌───────────┐
                           │ COMPLETED │
                           └───────────┘
```

---

### 3.7 Audit Logs (audit schema)

Related Requirements: REQ-NFR-030~033
Compliance: Personal Information Protection Act (2-year retention), Medical Service Act

#### Enum Types

```sql
-- Device type for login history
CREATE TYPE audit.DeviceType AS ENUM ('PC', 'TABLET', 'MOBILE');

-- Audit action types
CREATE TYPE audit.AuditAction AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE');
```

#### login_history

Tracks all user login attempts (success and failure) for security audit.

```sql
CREATE TABLE audit.login_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,                       -- NULL if login failed for unknown user
    username        VARCHAR(50) NOT NULL,
    ip_address      VARCHAR(45) NOT NULL,       -- Supports IPv6
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

Tracks patient information access for compliance with Medical Service Act.

```sql
CREATE TABLE audit.access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    username        VARCHAR(50) NOT NULL,
    user_role       VARCHAR(50),
    ip_address      VARCHAR(45) NOT NULL,

    -- Access details
    resource_type   VARCHAR(50) NOT NULL,       -- patient, admission, vital_sign, etc.
    resource_id     UUID NOT NULL,
    action          audit.AuditAction NOT NULL,

    -- Request info
    request_path    VARCHAR(255),
    request_method  VARCHAR(10),

    -- For patient access specifically
    patient_id      UUID,
    accessed_fields TEXT[],                     -- Array of field names accessed

    -- Result
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

Tracks data changes with before/after values for audit trail.

```sql
CREATE TABLE audit.change_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    username        VARCHAR(50) NOT NULL,
    ip_address      VARCHAR(45),

    -- Change details
    table_schema    VARCHAR(50) NOT NULL,
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,
    action          audit.AuditAction NOT NULL,

    -- Change data
    old_values      JSONB,                      -- Before values (for UPDATE/DELETE)
    new_values      JSONB,                      -- After values (for CREATE/UPDATE)
    changed_fields  TEXT[],                     -- List of changed field names

    change_reason   TEXT,                       -- Optional reason for change
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_change_logs_user_time ON audit.change_logs(user_id, created_at DESC);
CREATE INDEX idx_change_logs_table ON audit.change_logs(table_schema, table_name, created_at DESC);
CREATE INDEX idx_change_logs_record ON audit.change_logs(record_id, created_at DESC);
CREATE INDEX idx_change_logs_created ON audit.change_logs(created_at DESC);
```

#### Archive Tables

For retention policy compliance, archive tables mirror the main tables structure.

```sql
CREATE TABLE audit.login_history_archive (LIKE audit.login_history INCLUDING ALL);
CREATE TABLE audit.access_logs_archive (LIKE audit.access_logs INCLUDING ALL);
CREATE TABLE audit.change_logs_archive (LIKE audit.change_logs INCLUDING ALL);
```

#### Audit Helper Functions

```sql
-- Archive old logs based on retention period (2 years for compliance)
CREATE FUNCTION audit.archive_old_logs(retention_days INTEGER)
RETURNS TABLE (login_history_archived INT, access_logs_archived INT, change_logs_archived INT);

-- Generic trigger for automatic change logging
CREATE FUNCTION audit.log_changes() RETURNS TRIGGER;

-- Set user context at request start (for audit tracking)
CREATE FUNCTION audit.set_user_context(p_user_id UUID, p_username VARCHAR(50), p_ip_address VARCHAR(45));

-- Clear user context at request end
CREATE FUNCTION audit.clear_user_context();
```

---

## 4. Index Strategy

### 4.1 Primary Indexes

| Table       | Index                       | Purpose                     |
| ----------- | --------------------------- | --------------------------- |
| patients    | patient_number              | Patient number search       |
| patients    | name                        | Name search                 |
| admissions  | (patient_id, status)        | Active admission by patient |
| beds        | status                      | Vacant bed search           |
| vital_signs | (admission_id, measured_at) | Vital history by patient    |
| access_logs | (created_at, user_id)       | Audit log query             |

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

| Type          | Frequency | Retention | Method         |
| ------------- | --------- | --------- | -------------- |
| Full Backup   | Daily     | 30 days   | pg_dump + S3   |
| Incremental   | Hourly    | 7 days    | WAL Archiving  |
| Point-in-Time | Real-time | 7 days    | WAL + RDS Auto |

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
