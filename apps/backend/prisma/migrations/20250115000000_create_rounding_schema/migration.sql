-- ============================================================================
-- Rounding Management Schema
-- Related Requirements: REQ-FR-050~054
-- SDS Reference: Section 4.6 (Rounding Module), Section 4.6.2 (State Machine)
-- ============================================================================

-- CreateEnum: RoundType
CREATE TYPE "rounding"."RoundType" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT');

-- CreateEnum: RoundStatus
CREATE TYPE "rounding"."RoundStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum: PatientStatus (for round records)
CREATE TYPE "rounding"."PatientStatus" AS ENUM ('STABLE', 'IMPROVING', 'DECLINING', 'CRITICAL');

-- ============================================================================
-- Round Number Sequence
-- ============================================================================

-- CreateSequence: round_number_seq
CREATE SEQUENCE "rounding"."round_number_seq" START 1;

-- CreateTable: round_sequences (for daily round number management)
CREATE TABLE "rounding"."round_sequences" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "round_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: round_sequences_date_key
CREATE UNIQUE INDEX "round_sequences_date_key" ON "rounding"."round_sequences"("date");

-- ============================================================================
-- Rounds Table
-- ============================================================================

-- CreateTable: rounds
CREATE TABLE "rounding"."rounds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "round_number" VARCHAR(20) NOT NULL,
    "floor_id" UUID NOT NULL,
    "round_type" "rounding"."RoundType" NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "scheduled_time" TIME,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "paused_at" TIMESTAMPTZ,
    "status" "rounding"."RoundStatus" NOT NULL DEFAULT 'PLANNED',
    "lead_doctor_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: rounds_round_number_key
CREATE UNIQUE INDEX "rounds_round_number_key" ON "rounding"."rounds"("round_number");

-- CreateIndex: rounds_floor_id_scheduled_date_idx (for daily round queries)
CREATE INDEX "rounds_floor_id_scheduled_date_idx" ON "rounding"."rounds"("floor_id", "scheduled_date");

-- CreateIndex: rounds_status_idx (for active rounds)
CREATE INDEX "rounds_status_idx" ON "rounding"."rounds"("status");

-- CreateIndex: rounds_lead_doctor_id_idx (for doctor's rounds)
CREATE INDEX "rounds_lead_doctor_id_idx" ON "rounding"."rounds"("lead_doctor_id");

-- CreateIndex: rounds_scheduled_date_idx
CREATE INDEX "rounds_scheduled_date_idx" ON "rounding"."rounds"("scheduled_date");

-- CreateIndex: rounds_round_type_idx
CREATE INDEX "rounds_round_type_idx" ON "rounding"."rounds"("round_type");

-- ============================================================================
-- Round Records Table
-- ============================================================================

-- CreateTable: round_records
CREATE TABLE "rounding"."round_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "round_id" UUID NOT NULL,
    "admission_id" UUID NOT NULL,
    "visit_order" INTEGER NOT NULL,
    "patient_status" "rounding"."PatientStatus",
    "chief_complaint" TEXT,
    "observation" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "orders" TEXT,
    "visited_at" TIMESTAMPTZ,
    "visit_duration" INTEGER,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "round_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: round_records_round_id_admission_id_key (unique constraint)
CREATE UNIQUE INDEX "round_records_round_id_admission_id_key" ON "rounding"."round_records"("round_id", "admission_id");

-- CreateIndex: round_records_round_id_idx (for round detail queries)
CREATE INDEX "round_records_round_id_idx" ON "rounding"."round_records"("round_id");

-- CreateIndex: round_records_admission_id_idx (for patient round history)
CREATE INDEX "round_records_admission_id_idx" ON "rounding"."round_records"("admission_id");

-- CreateIndex: round_records_recorded_by_idx
CREATE INDEX "round_records_recorded_by_idx" ON "rounding"."round_records"("recorded_by");

-- CreateIndex: round_records_visit_order_idx
CREATE INDEX "round_records_visit_order_idx" ON "rounding"."round_records"("round_id", "visit_order");

-- ============================================================================
-- Foreign Keys
-- ============================================================================

-- AddForeignKey: round_records -> rounds
ALTER TABLE "rounding"."round_records" ADD CONSTRAINT "round_records_round_id_fkey"
    FOREIGN KEY ("round_id") REFERENCES "rounding"."rounds"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Round Number Generator Function
-- ============================================================================

-- Function: Generate round number (format: R2025011501)
CREATE OR REPLACE FUNCTION "rounding".generate_round_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VARCHAR AS $$
DECLARE
    v_seq INTEGER;
    v_round_number VARCHAR(20);
BEGIN
    -- Insert or update sequence for the date
    INSERT INTO "rounding"."round_sequences" ("date", "last_value")
    VALUES (p_date, 1)
    ON CONFLICT ("date") DO UPDATE
    SET "last_value" = "rounding"."round_sequences"."last_value" + 1,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "last_value" INTO v_seq;

    -- Generate round number: R + YYYYMMDD + 2-digit sequence
    v_round_number := 'R' || TO_CHAR(p_date, 'YYYYMMDD') || LPAD(v_seq::TEXT, 2, '0');

    RETURN v_round_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- State Transition Function
-- ============================================================================

-- Function: Validate and execute state transitions
CREATE OR REPLACE FUNCTION "rounding".transition_round_status(
    p_round_id UUID,
    p_new_status VARCHAR,
    p_user_id UUID
)
RETURNS "rounding"."rounds" AS $$
DECLARE
    v_round "rounding"."rounds";
    v_current_status VARCHAR;
    v_valid_next_statuses TEXT;
BEGIN
    -- Get current round
    SELECT * INTO v_round FROM "rounding"."rounds" WHERE id = p_round_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Round not found: %', p_round_id;
    END IF;

    v_current_status := v_round.status::TEXT;

    -- Define valid transitions
    CASE v_current_status
        WHEN 'PLANNED' THEN
            v_valid_next_statuses := 'IN_PROGRESS,CANCELLED';
        WHEN 'IN_PROGRESS' THEN
            v_valid_next_statuses := 'PAUSED,COMPLETED';
        WHEN 'PAUSED' THEN
            v_valid_next_statuses := 'IN_PROGRESS,COMPLETED,CANCELLED';
        WHEN 'COMPLETED' THEN
            v_valid_next_statuses := '';
        WHEN 'CANCELLED' THEN
            v_valid_next_statuses := '';
        ELSE
            RAISE EXCEPTION 'Unknown status: %', v_current_status;
    END CASE;

    -- Validate transition
    IF v_valid_next_statuses = '' OR
       NOT (p_new_status = ANY(string_to_array(v_valid_next_statuses, ','))) THEN
        RAISE EXCEPTION 'Invalid state transition from % to %', v_current_status, p_new_status;
    END IF;

    -- Update timestamps based on new status
    UPDATE "rounding"."rounds" SET
        status = p_new_status::"rounding"."RoundStatus",
        started_at = CASE
            WHEN p_new_status = 'IN_PROGRESS' AND started_at IS NULL THEN NOW()
            ELSE started_at
        END,
        paused_at = CASE
            WHEN p_new_status = 'PAUSED' THEN NOW()
            ELSE NULL
        END,
        completed_at = CASE
            WHEN p_new_status = 'COMPLETED' THEN NOW()
            ELSE completed_at
        END,
        updated_at = NOW()
    WHERE id = p_round_id
    RETURNING * INTO v_round;

    RETURN v_round;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Function: updated_at trigger for rounding schema
CREATE OR REPLACE FUNCTION "rounding".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: update_rounds_updated_at
CREATE TRIGGER update_rounds_updated_at
    BEFORE UPDATE ON "rounding"."rounds"
    FOR EACH ROW EXECUTE FUNCTION "rounding".update_updated_at_column();

-- Trigger: update_round_records_updated_at
CREATE TRIGGER update_round_records_updated_at
    BEFORE UPDATE ON "rounding"."round_records"
    FOR EACH ROW EXECUTE FUNCTION "rounding".update_updated_at_column();

-- Trigger: update_round_sequences_updated_at
CREATE TRIGGER update_round_sequences_updated_at
    BEFORE UPDATE ON "rounding"."round_sequences"
    FOR EACH ROW EXECUTE FUNCTION "rounding".update_updated_at_column();

-- ============================================================================
-- Views
-- ============================================================================

-- View: Rounding patient list view
CREATE VIEW "rounding"."round_patient_list" AS
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
FROM "rounding"."rounds" r
CROSS JOIN "admission"."admissions" a
JOIN "room"."beds" b ON a.bed_id = b.id
JOIN "room"."rooms" rm ON b.room_id = rm.id
JOIN "room"."floors" f ON rm.floor_id = f.id
LEFT JOIN "rounding"."round_records" rr ON rr.round_id = r.id AND rr.admission_id = a.id
WHERE f.id = r.floor_id AND a.status = 'ACTIVE';
