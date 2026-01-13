-- ============================================================================
-- Admission Management Schema
-- Related Requirements: REQ-FR-020~025
-- SDS Reference: Section 4.4 (Admission/Discharge Module)
-- ============================================================================

-- CreateEnum: AdmissionType
CREATE TYPE "admission"."AdmissionType" AS ENUM ('SCHEDULED', 'EMERGENCY', 'TRANSFER_IN');

-- CreateEnum: AdmissionStatus
CREATE TYPE "admission"."AdmissionStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'TRANSFERRED');

-- CreateEnum: DischargeType
CREATE TYPE "admission"."DischargeType" AS ENUM ('NORMAL', 'AMA', 'TRANSFER_OUT', 'DEATH', 'OTHER');

-- CreateTable: admissions
CREATE TABLE "admission"."admissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "bed_id" UUID NOT NULL,
    "admission_number" VARCHAR(20) NOT NULL,
    "admission_date" DATE NOT NULL,
    "admission_time" VARCHAR(10) NOT NULL,
    "admission_type" "admission"."AdmissionType" NOT NULL,
    "diagnosis" TEXT,
    "chief_complaint" TEXT,
    "attending_doctor_id" UUID NOT NULL,
    "primary_nurse_id" UUID,
    "status" "admission"."AdmissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expected_discharge_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transfers
CREATE TABLE "admission"."transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "from_bed_id" UUID NOT NULL,
    "to_bed_id" UUID NOT NULL,
    "transfer_date" DATE NOT NULL,
    "transfer_time" VARCHAR(10) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "transferred_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: discharges
CREATE TABLE "admission"."discharges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admission_id" UUID NOT NULL,
    "discharge_date" DATE NOT NULL,
    "discharge_time" VARCHAR(10) NOT NULL,
    "discharge_type" "admission"."DischargeType" NOT NULL,
    "discharge_diagnosis" TEXT,
    "discharge_summary" TEXT,
    "follow_up_instructions" TEXT,
    "follow_up_date" DATE,
    "discharged_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable: admission_sequences
CREATE TABLE "admission"."admission_sequences" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: admissions_admission_number_key
CREATE UNIQUE INDEX "admissions_admission_number_key" ON "admission"."admissions"("admission_number");

-- CreateIndex: admissions_patient_id_idx
CREATE INDEX "admissions_patient_id_idx" ON "admission"."admissions"("patient_id");

-- CreateIndex: admissions_bed_id_idx
CREATE INDEX "admissions_bed_id_idx" ON "admission"."admissions"("bed_id");

-- CreateIndex: admissions_status_idx
CREATE INDEX "admissions_status_idx" ON "admission"."admissions"("status");

-- CreateIndex: admissions_attending_doctor_id_idx
CREATE INDEX "admissions_attending_doctor_id_idx" ON "admission"."admissions"("attending_doctor_id");

-- CreateIndex: admissions_admission_date_idx
CREATE INDEX "admissions_admission_date_idx" ON "admission"."admissions"("admission_date");

-- CreateIndex: admissions_patient_id_status_idx
CREATE INDEX "admissions_patient_id_status_idx" ON "admission"."admissions"("patient_id", "status");

-- CreateIndex: transfers_admission_id_idx
CREATE INDEX "transfers_admission_id_idx" ON "admission"."transfers"("admission_id");

-- CreateIndex: transfers_from_bed_id_idx
CREATE INDEX "transfers_from_bed_id_idx" ON "admission"."transfers"("from_bed_id");

-- CreateIndex: transfers_to_bed_id_idx
CREATE INDEX "transfers_to_bed_id_idx" ON "admission"."transfers"("to_bed_id");

-- CreateIndex: transfers_transfer_date_idx
CREATE INDEX "transfers_transfer_date_idx" ON "admission"."transfers"("transfer_date");

-- CreateIndex: discharges_admission_id_key
CREATE UNIQUE INDEX "discharges_admission_id_key" ON "admission"."discharges"("admission_id");

-- CreateIndex: discharges_discharge_date_idx
CREATE INDEX "discharges_discharge_date_idx" ON "admission"."discharges"("discharge_date");

-- CreateIndex: admission_sequences_year_key
CREATE UNIQUE INDEX "admission_sequences_year_key" ON "admission"."admission_sequences"("year");

-- AddForeignKey: transfers -> admissions
ALTER TABLE "admission"."transfers" ADD CONSTRAINT "transfers_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "admission"."admissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: discharges -> admissions
ALTER TABLE "admission"."discharges" ADD CONSTRAINT "discharges_admission_id_fkey"
    FOREIGN KEY ("admission_id") REFERENCES "admission"."admissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Function: updated_at trigger for admission schema
CREATE OR REPLACE FUNCTION "admission".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_admissions_updated_at
    BEFORE UPDATE ON "admission"."admissions"
    FOR EACH ROW EXECUTE FUNCTION "admission".update_updated_at_column();

CREATE TRIGGER update_admission_sequences_updated_at
    BEFORE UPDATE ON "admission"."admission_sequences"
    FOR EACH ROW EXECUTE FUNCTION "admission".update_updated_at_column();
