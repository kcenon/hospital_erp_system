-- ============================================================================
-- Add Amendment and Missing Fields to Report Schema
-- Aligns vital_signs, nursing_notes, and medications tables with Prisma schema
-- ============================================================================

-- ===========================================================================
-- 1. vital_signs: Add weight, GCS score, and amendment fields
-- ===========================================================================

ALTER TABLE "report"."vital_signs"
    ADD COLUMN "weight" DECIMAL(5, 1),
    ADD COLUMN "gcs_score" INTEGER,
    ADD COLUMN "amended_from_id" UUID,
    ADD COLUMN "amended_by" UUID,
    ADD COLUMN "amendment_reason" TEXT,
    ADD COLUMN "is_amended" BOOLEAN NOT NULL DEFAULT false;

-- FK: amended_from_id -> vital_signs (self-referencing)
ALTER TABLE "report"."vital_signs"
    ADD CONSTRAINT "vital_signs_amended_from_id_fkey"
    FOREIGN KEY ("amended_from_id") REFERENCES "report"."vital_signs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: amended_by -> auth.users
ALTER TABLE "report"."vital_signs"
    ADD CONSTRAINT "vital_signs_amended_by_fkey"
    FOREIGN KEY ("amended_by") REFERENCES "auth"."users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "vital_signs_measured_at_idx" ON "report"."vital_signs"("measured_at");
CREATE INDEX "vital_signs_amended_from_id_idx" ON "report"."vital_signs"("amended_from_id");

-- ===========================================================================
-- 2. nursing_notes: Add parent_note_id for addendum support
-- ===========================================================================

ALTER TABLE "report"."nursing_notes"
    ADD COLUMN "parent_note_id" UUID;

-- FK: parent_note_id -> nursing_notes (self-referencing)
ALTER TABLE "report"."nursing_notes"
    ADD CONSTRAINT "nursing_notes_parent_note_id_fkey"
    FOREIGN KEY ("parent_note_id") REFERENCES "report"."nursing_notes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "nursing_notes_recorded_at_idx" ON "report"."nursing_notes"("recorded_at");
CREATE INDEX "nursing_notes_parent_note_id_idx" ON "report"."nursing_notes"("parent_note_id");

-- ===========================================================================
-- 3. medications: Add prescription, pharmacy, and cancellation fields
-- ===========================================================================

ALTER TABLE "report"."medications"
    ADD COLUMN "prescribed_by" UUID,
    ADD COLUMN "start_date" DATE,
    ADD COLUMN "end_date" DATE,
    ADD COLUMN "pharmacy_verified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "cancelled_by" UUID,
    ADD COLUMN "cancelled_at" TIMESTAMPTZ,
    ADD COLUMN "cancel_reason" TEXT;

-- FK: prescribed_by -> auth.users
ALTER TABLE "report"."medications"
    ADD CONSTRAINT "medications_prescribed_by_fkey"
    FOREIGN KEY ("prescribed_by") REFERENCES "auth"."users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- FK: cancelled_by -> auth.users
ALTER TABLE "report"."medications"
    ADD CONSTRAINT "medications_cancelled_by_fkey"
    FOREIGN KEY ("cancelled_by") REFERENCES "auth"."users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "medications_medication_name_idx" ON "report"."medications"("medication_name");
CREATE INDEX "medications_scheduled_time_idx" ON "report"."medications"("scheduled_time");
CREATE INDEX "medications_prescribed_by_idx" ON "report"."medications"("prescribed_by");
