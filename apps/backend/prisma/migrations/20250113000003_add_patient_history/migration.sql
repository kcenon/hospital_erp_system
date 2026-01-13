-- ============================================================================
-- Hospital ERP Patient History (Audit Trail) Schema
-- Related Requirements: REQ-FR-001~006, REQ-NFR-020
-- SDS Reference: Section 4.2.3 (Entity Design), Section 5.3 (Encrypted Fields)
-- ============================================================================

-- CreateTable: patient_history (Audit Trail)
CREATE TABLE "patient"."patient_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_type" VARCHAR(20) NOT NULL,
    "field_name" VARCHAR(100),
    "old_value" TEXT,
    "new_value" TEXT,

    CONSTRAINT "patient_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "patient_history_change_type_check" CHECK ("change_type" IN ('CREATE', 'UPDATE', 'DELETE'))
);

-- CreateIndex: patient_history_patient_id_idx
CREATE INDEX "patient_history_patient_id_idx" ON "patient"."patient_history"("patient_id");

-- CreateIndex: patient_history_changed_at_idx
CREATE INDEX "patient_history_changed_at_idx" ON "patient"."patient_history"("changed_at" DESC);

-- CreateIndex: patient_history_patient_id_changed_at_idx (Composite index for audit queries)
CREATE INDEX "patient_history_patient_id_changed_at_idx" ON "patient"."patient_history"("patient_id", "changed_at" DESC);

-- CreateIndex: patient_history_changed_by_idx
CREATE INDEX "patient_history_changed_by_idx" ON "patient"."patient_history"("changed_by");

-- AddForeignKey: patient_history -> patients
ALTER TABLE "patient"."patient_history" ADD CONSTRAINT "patient_history_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"."patients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Patient Number Generation Function
-- Generates patient numbers in format: P{YEAR}{6-digit sequence}
-- Example: P2025000001
-- ============================================================================

-- Function: Generate patient number atomically
CREATE OR REPLACE FUNCTION "patient".generate_patient_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    current_year INTEGER;
    next_value INTEGER;
    result VARCHAR(20);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Insert new year record or update existing one atomically
    INSERT INTO "patient"."patient_sequences" ("year", "last_value", "updated_at")
    VALUES (current_year, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("year") DO UPDATE
    SET "last_value" = "patient"."patient_sequences"."last_value" + 1,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "last_value" INTO next_value;

    -- Format: P + YEAR + 6-digit padded sequence
    result := 'P' || current_year::TEXT || LPAD(next_value::TEXT, 6, '0');

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Patient History Trigger Function
-- Automatically records changes to patient table
-- ============================================================================

-- Function: Record patient changes to history
CREATE OR REPLACE FUNCTION "patient".record_patient_history()
RETURNS TRIGGER AS $$
DECLARE
    change_type_value VARCHAR(20);
    field_record RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        change_type_value := 'CREATE';
        INSERT INTO "patient"."patient_history" (
            "patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value"
        ) VALUES (
            NEW.id,
            COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
            change_type_value,
            NULL,
            NULL,
            NEW.patient_number
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        change_type_value := 'UPDATE';
        -- Track changes for each field
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), change_type_value, 'name', OLD.name, NEW.name);
        END IF;
        IF OLD.phone IS DISTINCT FROM NEW.phone THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), change_type_value, 'phone', OLD.phone, NEW.phone);
        END IF;
        IF OLD.address IS DISTINCT FROM NEW.address THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), change_type_value, 'address', OLD.address, NEW.address);
        END IF;
        IF OLD.emergency_contact_name IS DISTINCT FROM NEW.emergency_contact_name THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), change_type_value, 'emergency_contact_name', OLD.emergency_contact_name, NEW.emergency_contact_name);
        END IF;
        IF OLD.emergency_contact_phone IS DISTINCT FROM NEW.emergency_contact_phone THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), change_type_value, 'emergency_contact_phone', OLD.emergency_contact_phone, NEW.emergency_contact_phone);
        END IF;
        IF OLD.emergency_contact_relation IS DISTINCT FROM NEW.emergency_contact_relation THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), change_type_value, 'emergency_contact_relation', OLD.emergency_contact_relation, NEW.emergency_contact_relation);
        END IF;
        IF OLD.blood_type IS DISTINCT FROM NEW.blood_type THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), change_type_value, 'blood_type', OLD.blood_type, NEW.blood_type);
        END IF;
        -- Track soft delete
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            INSERT INTO "patient"."patient_history" ("patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value")
            VALUES (NEW.id, COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID), 'DELETE', 'deleted_at', NULL, NEW.deleted_at::TEXT);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        change_type_value := 'DELETE';
        INSERT INTO "patient"."patient_history" (
            "patient_id", "changed_by", "change_type", "field_name", "old_value", "new_value"
        ) VALUES (
            OLD.id,
            COALESCE(current_setting('app.current_user_id', TRUE)::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
            change_type_value,
            NULL,
            OLD.patient_number,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Automatically record patient changes
CREATE TRIGGER patient_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "patient"."patients"
    FOR EACH ROW EXECUTE FUNCTION "patient".record_patient_history();
