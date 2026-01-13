-- ============================================================================
-- Report Management Schema
-- Related Requirements: REQ-FR-030~045
-- SDS Reference: Section 4.5 (Report Module), Section 5.1
-- ============================================================================

-- CreateEnum: Consciousness (AVPU scale)
CREATE TYPE "report"."Consciousness" AS ENUM ('ALERT', 'VERBAL', 'PAIN', 'UNRESPONSIVE');

-- CreateEnum: MedicationStatus
CREATE TYPE "report"."MedicationStatus" AS ENUM ('SCHEDULED', 'ADMINISTERED', 'HELD', 'REFUSED', 'MISSED');

-- CreateEnum: MedicationRoute
CREATE TYPE "report"."MedicationRoute" AS ENUM ('PO', 'IV', 'IM', 'SC', 'SL', 'TOP', 'INH', 'PR', 'OTHER');

-- CreateEnum: NoteType
CREATE TYPE "report"."NoteType" AS ENUM ('ASSESSMENT', 'PROGRESS', 'PROCEDURE', 'INCIDENT', 'HANDOFF');

-- CreateEnum: PatientStatus
CREATE TYPE "report"."PatientStatus" AS ENUM ('STABLE', 'IMPROVING', 'DECLINING', 'CRITICAL');

-- CreateTable: vital_signs
CREATE TABLE "report"."vital_signs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "temperature" DECIMAL(4, 1),
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "pulse_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "oxygen_saturation" INTEGER,
    "blood_glucose" INTEGER,
    "pain_score" INTEGER,
    "consciousness" "report"."Consciousness",
    "measured_at" TIMESTAMPTZ NOT NULL,
    "measured_by" UUID NOT NULL,
    "notes" TEXT,
    "has_alert" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: intake_outputs
CREATE TABLE "report"."intake_outputs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "record_date" DATE NOT NULL,
    "record_time" TIME NOT NULL,
    "oral_intake" INTEGER NOT NULL DEFAULT 0,
    "iv_intake" INTEGER NOT NULL DEFAULT 0,
    "tube_feeding" INTEGER NOT NULL DEFAULT 0,
    "other_intake" INTEGER NOT NULL DEFAULT 0,
    "urine_output" INTEGER NOT NULL DEFAULT 0,
    "stool_output" INTEGER NOT NULL DEFAULT 0,
    "vomit_output" INTEGER NOT NULL DEFAULT 0,
    "drainage_output" INTEGER NOT NULL DEFAULT 0,
    "other_output" INTEGER NOT NULL DEFAULT 0,
    "recorded_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: medications
CREATE TABLE "report"."medications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "medication_name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "route" "report"."MedicationRoute" NOT NULL,
    "frequency" VARCHAR(100),
    "scheduled_time" TIME,
    "administered_at" TIMESTAMPTZ,
    "administered_by" UUID,
    "status" "report"."MedicationStatus" NOT NULL,
    "hold_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: nursing_notes
CREATE TABLE "report"."nursing_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "note_type" "report"."NoteType" NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "recorded_at" TIMESTAMPTZ NOT NULL,
    "recorded_by" UUID NOT NULL,
    "is_significant" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nursing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: daily_reports
CREATE TABLE "report"."daily_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "report_date" DATE NOT NULL,
    "vitals_summary" JSONB,
    "total_intake" INTEGER,
    "total_output" INTEGER,
    "io_balance" INTEGER,
    "medications_given" INTEGER,
    "medications_held" INTEGER,
    "patient_status" "report"."PatientStatus",
    "summary" TEXT,
    "alerts" JSONB,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" UUID,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: vital_signs indexes
CREATE INDEX "vital_signs_admission_id_measured_at_idx" ON "report"."vital_signs"("admission_id", "measured_at" DESC);
CREATE INDEX "vital_signs_has_alert_idx" ON "report"."vital_signs"("has_alert");
CREATE INDEX "vital_signs_measured_by_idx" ON "report"."vital_signs"("measured_by");

-- CreateIndex: intake_outputs indexes
CREATE INDEX "intake_outputs_admission_id_record_date_idx" ON "report"."intake_outputs"("admission_id", "record_date");
CREATE INDEX "intake_outputs_recorded_by_idx" ON "report"."intake_outputs"("recorded_by");

-- CreateIndex: medications indexes
CREATE INDEX "medications_admission_id_administered_at_idx" ON "report"."medications"("admission_id", "administered_at");
CREATE INDEX "medications_admission_id_status_idx" ON "report"."medications"("admission_id", "status");
CREATE INDEX "medications_administered_by_idx" ON "report"."medications"("administered_by");

-- CreateIndex: nursing_notes indexes
CREATE INDEX "nursing_notes_admission_id_recorded_at_idx" ON "report"."nursing_notes"("admission_id", "recorded_at" DESC);
CREATE INDEX "nursing_notes_admission_id_note_type_idx" ON "report"."nursing_notes"("admission_id", "note_type");
CREATE INDEX "nursing_notes_recorded_by_idx" ON "report"."nursing_notes"("recorded_by");
CREATE INDEX "nursing_notes_is_significant_idx" ON "report"."nursing_notes"("is_significant");

-- CreateIndex: daily_reports indexes
CREATE UNIQUE INDEX "daily_reports_admission_id_report_date_key" ON "report"."daily_reports"("admission_id", "report_date");
CREATE INDEX "daily_reports_admission_id_report_date_idx" ON "report"."daily_reports"("admission_id", "report_date" DESC);
CREATE INDEX "daily_reports_report_date_idx" ON "report"."daily_reports"("report_date");

-- AddForeignKey: vital_signs -> admissions
ALTER TABLE "report"."vital_signs" ADD CONSTRAINT "vital_signs_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "admission"."admissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: intake_outputs -> admissions
ALTER TABLE "report"."intake_outputs" ADD CONSTRAINT "intake_outputs_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "admission"."admissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: medications -> admissions
ALTER TABLE "report"."medications" ADD CONSTRAINT "medications_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "admission"."admissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: nursing_notes -> admissions
ALTER TABLE "report"."nursing_notes" ADD CONSTRAINT "nursing_notes_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "admission"."admissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: daily_reports -> admissions
ALTER TABLE "report"."daily_reports" ADD CONSTRAINT "daily_reports_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "admission"."admissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Function: updated_at trigger for report schema
CREATE OR REPLACE FUNCTION "report".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_intake_outputs_updated_at
    BEFORE UPDATE ON "report"."intake_outputs"
    FOR EACH ROW EXECUTE FUNCTION "report".update_updated_at_column();

CREATE TRIGGER update_nursing_notes_updated_at
    BEFORE UPDATE ON "report"."nursing_notes"
    FOR EACH ROW EXECUTE FUNCTION "report".update_updated_at_column();

-- ============================================================================
-- Alert Detection Function for Vital Signs
-- Automatically sets has_alert flag when vital signs are outside normal ranges
-- ============================================================================

CREATE OR REPLACE FUNCTION "report".check_vital_alerts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.has_alert := false;

    -- Temperature alert (normal: 36.1-37.8 C)
    IF NEW.temperature IS NOT NULL AND (NEW.temperature < 36.1 OR NEW.temperature > 37.8) THEN
        NEW.has_alert := true;
    END IF;

    -- SpO2 alert (normal: >= 95%)
    IF NEW.oxygen_saturation IS NOT NULL AND NEW.oxygen_saturation < 95 THEN
        NEW.has_alert := true;
    END IF;

    -- Systolic BP alert (normal: 90-140 mmHg)
    IF NEW.systolic_bp IS NOT NULL AND (NEW.systolic_bp < 90 OR NEW.systolic_bp > 140) THEN
        NEW.has_alert := true;
    END IF;

    -- Diastolic BP alert (normal: 60-90 mmHg)
    IF NEW.diastolic_bp IS NOT NULL AND (NEW.diastolic_bp < 60 OR NEW.diastolic_bp > 90) THEN
        NEW.has_alert := true;
    END IF;

    -- Pulse rate alert (normal: 60-100 bpm)
    IF NEW.pulse_rate IS NOT NULL AND (NEW.pulse_rate < 60 OR NEW.pulse_rate > 100) THEN
        NEW.has_alert := true;
    END IF;

    -- Respiratory rate alert (normal: 12-20 /min)
    IF NEW.respiratory_rate IS NOT NULL AND (NEW.respiratory_rate < 12 OR NEW.respiratory_rate > 20) THEN
        NEW.has_alert := true;
    END IF;

    -- Pain score alert (significant: > 7)
    IF NEW.pain_score IS NOT NULL AND NEW.pain_score > 7 THEN
        NEW.has_alert := true;
    END IF;

    -- Consciousness alert (not ALERT)
    IF NEW.consciousness IS NOT NULL AND NEW.consciousness != 'ALERT' THEN
        NEW.has_alert := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vital_alert_check
    BEFORE INSERT OR UPDATE ON "report"."vital_signs"
    FOR EACH ROW EXECUTE FUNCTION "report".check_vital_alerts();

-- ============================================================================
-- Validation Constraints
-- ============================================================================

-- Vital signs range constraints
ALTER TABLE "report"."vital_signs"
    ADD CONSTRAINT "vital_signs_temperature_check" CHECK (temperature IS NULL OR (temperature >= 30.0 AND temperature <= 45.0)),
    ADD CONSTRAINT "vital_signs_systolic_bp_check" CHECK (systolic_bp IS NULL OR (systolic_bp >= 50 AND systolic_bp <= 250)),
    ADD CONSTRAINT "vital_signs_diastolic_bp_check" CHECK (diastolic_bp IS NULL OR (diastolic_bp >= 30 AND diastolic_bp <= 150)),
    ADD CONSTRAINT "vital_signs_pulse_rate_check" CHECK (pulse_rate IS NULL OR (pulse_rate >= 30 AND pulse_rate <= 250)),
    ADD CONSTRAINT "vital_signs_respiratory_rate_check" CHECK (respiratory_rate IS NULL OR (respiratory_rate >= 5 AND respiratory_rate <= 60)),
    ADD CONSTRAINT "vital_signs_oxygen_saturation_check" CHECK (oxygen_saturation IS NULL OR (oxygen_saturation >= 50 AND oxygen_saturation <= 100)),
    ADD CONSTRAINT "vital_signs_pain_score_check" CHECK (pain_score IS NULL OR (pain_score >= 0 AND pain_score <= 10));

-- Intake/Output non-negative constraints
ALTER TABLE "report"."intake_outputs"
    ADD CONSTRAINT "intake_outputs_oral_intake_check" CHECK (oral_intake >= 0),
    ADD CONSTRAINT "intake_outputs_iv_intake_check" CHECK (iv_intake >= 0),
    ADD CONSTRAINT "intake_outputs_tube_feeding_check" CHECK (tube_feeding >= 0),
    ADD CONSTRAINT "intake_outputs_other_intake_check" CHECK (other_intake >= 0),
    ADD CONSTRAINT "intake_outputs_urine_output_check" CHECK (urine_output >= 0),
    ADD CONSTRAINT "intake_outputs_stool_output_check" CHECK (stool_output >= 0),
    ADD CONSTRAINT "intake_outputs_vomit_output_check" CHECK (vomit_output >= 0),
    ADD CONSTRAINT "intake_outputs_drainage_output_check" CHECK (drainage_output >= 0),
    ADD CONSTRAINT "intake_outputs_other_output_check" CHECK (other_output >= 0);
