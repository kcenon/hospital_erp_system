-- ============================================================================
-- Add Missing Schema Fields
-- Aligns database schema with Prisma schema.prisma definitions
-- ============================================================================

-- ===========================================================================
-- 1. Patient table: Add missing columns
-- ===========================================================================

-- Add dnr_status column
ALTER TABLE "patient"."patients"
    ADD COLUMN "dnr_status" BOOLEAN;

-- Add primary_diagnosis column
ALTER TABLE "patient"."patients"
    ADD COLUMN "primary_diagnosis" VARCHAR(255);

-- Add icd10_code column
ALTER TABLE "patient"."patients"
    ADD COLUMN "icd10_code" VARCHAR(10);

-- ===========================================================================
-- 2. Patient details table: Rename allergies to allergies_encrypted + type
-- ===========================================================================

-- Drop old allergies column and add allergies_encrypted as BYTEA
ALTER TABLE "patient"."patient_details"
    DROP COLUMN IF EXISTS "allergies",
    ADD COLUMN "allergies_encrypted" BYTEA;

-- Add medical_history_encrypted if not exists (schema has it, migration had it)
-- (already exists from initial migration - no action needed)

-- ===========================================================================
-- 3. Admission table: Add missing columns
-- ===========================================================================

-- Add admitted_from column
ALTER TABLE "admission"."admissions"
    ADD COLUMN "admitted_from" VARCHAR(50);

-- Add dietary_restrictions column
ALTER TABLE "admission"."admissions"
    ADD COLUMN "dietary_restrictions" TEXT;

-- Add special_instructions column
ALTER TABLE "admission"."admissions"
    ADD COLUMN "special_instructions" TEXT;

-- Add deleted_at column for soft delete support
ALTER TABLE "admission"."admissions"
    ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- ===========================================================================
-- 4. Time column type changes: VARCHAR(10) -> TIME
-- ===========================================================================

-- Admission: admission_time VARCHAR -> TIME
ALTER TABLE "admission"."admissions"
    ALTER COLUMN "admission_time" TYPE TIME USING "admission_time"::TIME;

-- Transfer: transfer_time VARCHAR -> TIME
ALTER TABLE "admission"."transfers"
    ALTER COLUMN "transfer_time" TYPE TIME USING "transfer_time"::TIME;

-- Discharge: discharge_time VARCHAR -> TIME
ALTER TABLE "admission"."discharges"
    ALTER COLUMN "discharge_time" TYPE TIME USING "discharge_time"::TIME;

-- ===========================================================================
-- 5. Missing indexes
-- ===========================================================================

-- Admission indexes
CREATE INDEX IF NOT EXISTS "admissions_primary_nurse_id_idx"
    ON "admission"."admissions"("primary_nurse_id");

CREATE INDEX IF NOT EXISTS "admissions_created_by_idx"
    ON "admission"."admissions"("created_by");

CREATE INDEX IF NOT EXISTS "admissions_bed_id_status_idx"
    ON "admission"."admissions"("bed_id", "status");

-- Transfer index
CREATE INDEX IF NOT EXISTS "transfers_transferred_by_idx"
    ON "admission"."transfers"("transferred_by");
