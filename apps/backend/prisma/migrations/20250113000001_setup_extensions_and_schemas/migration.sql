-- ============================================================================
-- Hospital ERP Multi-Schema Architecture Setup
-- Related Requirements: REQ-NFR-040~043
-- SDS Reference: Section 5.1 (Logical Data Model), Section 5.2 (Schema-Table Mapping)
-- ============================================================================

-- Enable Extensions
-- pgcrypto: For field-level encryption (SSN, insurance numbers, etc.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- uuid-ossp: For UUID generation (alternative to gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Create Schemas for Multi-Schema Architecture
-- ============================================================================

-- Patient schema: Patient data
CREATE SCHEMA IF NOT EXISTS "patient";

-- Admission schema: Admission records
CREATE SCHEMA IF NOT EXISTS "admission";

-- Report schema: Vital signs, I/O, medications, nursing notes
CREATE SCHEMA IF NOT EXISTS "report";

-- Rounding schema: Rounding sessions
CREATE SCHEMA IF NOT EXISTS "rounding";

-- Audit schema: Access and change logs
CREATE SCHEMA IF NOT EXISTS "audit";

-- ============================================================================
-- Patient Schema Tables
-- Related Requirements: REQ-FR-001~004
-- ============================================================================

-- CreateEnum: Gender
CREATE TYPE "patient"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable: patients
CREATE TABLE "patient"."patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_number" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" "patient"."Gender" NOT NULL,
    "blood_type" VARCHAR(10),
    "phone" VARCHAR(20),
    "address" TEXT,
    "emergency_contact_name" VARCHAR(100),
    "emergency_contact_phone" VARCHAR(20),
    "emergency_contact_relation" VARCHAR(50),
    "legacy_patient_id" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: patient_details
CREATE TABLE "patient"."patient_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "ssn_encrypted" BYTEA,
    "medical_history_encrypted" BYTEA,
    "allergies" TEXT,
    "insurance_type" VARCHAR(50),
    "insurance_number_encrypted" BYTEA,
    "insurance_company" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable: patient_sequences
CREATE TABLE "patient"."patient_sequences" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: patients_patient_number_key
CREATE UNIQUE INDEX "patients_patient_number_key" ON "patient"."patients"("patient_number");

-- CreateIndex: patients_patient_number_idx
CREATE INDEX "patients_patient_number_idx" ON "patient"."patients"("patient_number");

-- CreateIndex: patients_name_idx
CREATE INDEX "patients_name_idx" ON "patient"."patients"("name");

-- CreateIndex: patients_legacy_patient_id_idx
CREATE INDEX "patients_legacy_patient_id_idx" ON "patient"."patients"("legacy_patient_id");

-- CreateIndex: patients_deleted_at_idx
CREATE INDEX "patients_deleted_at_idx" ON "patient"."patients"("deleted_at");

-- CreateIndex: patient_details_patient_id_key
CREATE UNIQUE INDEX "patient_details_patient_id_key" ON "patient"."patient_details"("patient_id");

-- CreateIndex: patient_sequences_year_key
CREATE UNIQUE INDEX "patient_sequences_year_key" ON "patient"."patient_sequences"("year");

-- AddForeignKey: patient_details -> patients
ALTER TABLE "patient"."patient_details" ADD CONSTRAINT "patient_details_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"."patients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Function: updated_at trigger for patient schema
CREATE OR REPLACE FUNCTION "patient".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON "patient"."patients"
    FOR EACH ROW EXECUTE FUNCTION "patient".update_updated_at_column();

CREATE TRIGGER update_patient_details_updated_at
    BEFORE UPDATE ON "patient"."patient_details"
    FOR EACH ROW EXECUTE FUNCTION "patient".update_updated_at_column();

CREATE TRIGGER update_patient_sequences_updated_at
    BEFORE UPDATE ON "patient"."patient_sequences"
    FOR EACH ROW EXECUTE FUNCTION "patient".update_updated_at_column();

-- ============================================================================
-- Helper Functions for Encryption (using pgcrypto)
-- ============================================================================

-- Function: Encrypt sensitive data using pgcrypto
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(
    plain_text TEXT,
    encryption_key TEXT
) RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(plain_text, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Decrypt sensitive data using pgcrypto
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(
    encrypted_data BYTEA,
    encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
