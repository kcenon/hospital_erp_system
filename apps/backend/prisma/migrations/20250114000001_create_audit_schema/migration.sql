-- ============================================================================
-- Audit Schema Tables and Functions
-- Related Requirements: REQ-NFR-030~033
-- SDS Reference: Section 4.7.2 (Audit Log Service), Section 7.4 (Audit Logging Design)
-- Compliance: Personal Information Protection Act (2-year retention)
-- ============================================================================

-- ============================================================================
-- Enum Types
-- ============================================================================

-- CreateEnum: DeviceType
CREATE TYPE "audit"."DeviceType" AS ENUM ('PC', 'TABLET', 'MOBILE');

-- CreateEnum: AuditAction
CREATE TYPE "audit"."AuditAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE');

-- ============================================================================
-- Login History Table
-- Tracks all login attempts (success and failure)
-- ============================================================================

CREATE TABLE "audit"."login_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,                              -- NULL if login failed for unknown user
    "username" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,           -- Supports IPv6
    "user_agent" TEXT,
    "device_type" "audit"."DeviceType",
    "browser" VARCHAR(50),
    "os" VARCHAR(50),
    "login_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_at" TIMESTAMPTZ,
    "session_id" VARCHAR(100),
    "success" BOOLEAN NOT NULL,
    "failure_reason" VARCHAR(100),               -- INVALID_PASSWORD, USER_NOT_FOUND, ACCOUNT_LOCKED
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- Indexes for login_history
CREATE INDEX "idx_login_history_user_time" ON "audit"."login_history"("user_id", "login_at" DESC);
CREATE INDEX "idx_login_history_ip" ON "audit"."login_history"("ip_address", "login_at" DESC);
CREATE INDEX "idx_login_history_created" ON "audit"."login_history"("created_at" DESC);

-- ============================================================================
-- Access Logs Table
-- Tracks patient information access for compliance
-- ============================================================================

CREATE TABLE "audit"."access_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "user_role" VARCHAR(50),
    "ip_address" VARCHAR(45) NOT NULL,

    -- Access details
    "resource_type" VARCHAR(50) NOT NULL,        -- patient, admission, vital_sign, etc.
    "resource_id" UUID NOT NULL,
    "action" "audit"."AuditAction" NOT NULL,

    -- Request info
    "request_path" VARCHAR(255),
    "request_method" VARCHAR(10),

    -- For patient access specifically
    "patient_id" UUID,
    "accessed_fields" TEXT[],                    -- Array of field names accessed

    -- Result
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_code" VARCHAR(50),
    "error_message" TEXT,

    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes for access_logs
CREATE INDEX "idx_access_logs_user_time" ON "audit"."access_logs"("user_id", "created_at" DESC);
CREATE INDEX "idx_access_logs_patient" ON "audit"."access_logs"("patient_id", "created_at" DESC);
CREATE INDEX "idx_access_logs_resource" ON "audit"."access_logs"("resource_type", "resource_id", "created_at" DESC);
CREATE INDEX "idx_access_logs_created" ON "audit"."access_logs"("created_at" DESC);

-- ============================================================================
-- Change Logs Table
-- Tracks data changes with before/after values
-- ============================================================================

CREATE TABLE "audit"."change_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(45),

    -- Change details
    "table_schema" VARCHAR(50) NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "record_id" UUID NOT NULL,
    "action" "audit"."AuditAction" NOT NULL,

    -- Change data
    "old_values" JSONB,                          -- Before values (for UPDATE/DELETE)
    "new_values" JSONB,                          -- After values (for CREATE/UPDATE)
    "changed_fields" TEXT[],                     -- List of changed field names

    "change_reason" TEXT,                        -- Optional reason for change
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes for change_logs
CREATE INDEX "idx_change_logs_user_time" ON "audit"."change_logs"("user_id", "created_at" DESC);
CREATE INDEX "idx_change_logs_table" ON "audit"."change_logs"("table_schema", "table_name", "created_at" DESC);
CREATE INDEX "idx_change_logs_record" ON "audit"."change_logs"("record_id", "created_at" DESC);
CREATE INDEX "idx_change_logs_created" ON "audit"."change_logs"("created_at" DESC);

-- ============================================================================
-- Archive Tables for Retention Policy
-- ============================================================================

CREATE TABLE "audit"."login_history_archive" (
    LIKE "audit"."login_history" INCLUDING ALL
);

CREATE TABLE "audit"."access_logs_archive" (
    LIKE "audit"."access_logs" INCLUDING ALL
);

CREATE TABLE "audit"."change_logs_archive" (
    LIKE "audit"."change_logs" INCLUDING ALL
);

-- ============================================================================
-- Retention Policy Function
-- Archives and removes old audit logs based on retention period
-- ============================================================================

CREATE OR REPLACE FUNCTION "audit".archive_old_logs(retention_days INTEGER)
RETURNS TABLE (
    login_history_archived INTEGER,
    access_logs_archived INTEGER,
    change_logs_archived INTEGER
) AS $$
DECLARE
    v_login_count INTEGER := 0;
    v_access_count INTEGER := 0;
    v_change_count INTEGER := 0;
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    v_cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;

    -- Archive login history
    INSERT INTO "audit".login_history_archive
    SELECT * FROM "audit".login_history
    WHERE created_at < v_cutoff_date;

    GET DIAGNOSTICS v_login_count = ROW_COUNT;

    DELETE FROM "audit".login_history
    WHERE created_at < v_cutoff_date;

    -- Archive access logs
    INSERT INTO "audit".access_logs_archive
    SELECT * FROM "audit".access_logs
    WHERE created_at < v_cutoff_date;

    GET DIAGNOSTICS v_access_count = ROW_COUNT;

    DELETE FROM "audit".access_logs
    WHERE created_at < v_cutoff_date;

    -- Archive change logs
    INSERT INTO "audit".change_logs_archive
    SELECT * FROM "audit".change_logs
    WHERE created_at < v_cutoff_date;

    GET DIAGNOSTICS v_change_count = ROW_COUNT;

    DELETE FROM "audit".change_logs
    WHERE created_at < v_cutoff_date;

    RETURN QUERY SELECT v_login_count, v_access_count, v_change_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Automatic Audit Trigger Function
-- Generic trigger for tracking data changes across tables
-- ============================================================================

CREATE OR REPLACE FUNCTION "audit".log_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_username VARCHAR(50);
    v_ip_address VARCHAR(45);
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[];
    v_action "audit"."AuditAction";
    v_key TEXT;
BEGIN
    -- Get current user context (set by application)
    v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
    v_username := COALESCE(NULLIF(current_setting('app.current_username', true), ''), 'system');
    v_ip_address := NULLIF(current_setting('app.current_ip_address', true), '');

    -- Determine action type
    v_action := CASE TG_OP
        WHEN 'INSERT' THEN 'CREATE'::"audit"."AuditAction"
        WHEN 'UPDATE' THEN 'UPDATE'::"audit"."AuditAction"
        WHEN 'DELETE' THEN 'DELETE'::"audit"."AuditAction"
    END;

    -- Set old/new values based on operation
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        v_old_values := to_jsonb(OLD);
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_new_values := to_jsonb(NEW);
    END IF;

    -- Calculate changed fields for UPDATE
    IF TG_OP = 'UPDATE' THEN
        SELECT ARRAY_AGG(key)
        INTO v_changed_fields
        FROM (
            SELECT key
            FROM jsonb_each(v_new_values)
            WHERE v_old_values->key IS DISTINCT FROM v_new_values->key
        ) AS changed;
    END IF;

    -- Insert change log record
    INSERT INTO "audit".change_logs (
        user_id,
        username,
        ip_address,
        table_schema,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields
    ) VALUES (
        COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
        v_username,
        v_ip_address,
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_action,
        v_old_values,
        v_new_values,
        v_changed_fields
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper Function: Set Current User Context
-- Call this at the beginning of each request to set audit context
-- ============================================================================

CREATE OR REPLACE FUNCTION "audit".set_user_context(
    p_user_id UUID,
    p_username VARCHAR(50),
    p_ip_address VARCHAR(45) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::TEXT, ''), true);
    PERFORM set_config('app.current_username', COALESCE(p_username, ''), true);
    PERFORM set_config('app.current_ip_address', COALESCE(p_ip_address, ''), true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Function: Clear User Context
-- Call this at the end of each request
-- ============================================================================

CREATE OR REPLACE FUNCTION "audit".clear_user_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_username', '', true);
    PERFORM set_config('app.current_ip_address', '', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE "audit"."login_history" IS 'Tracks all user login attempts for security audit';
COMMENT ON TABLE "audit"."access_logs" IS 'Tracks patient information access for compliance (Medical Service Act)';
COMMENT ON TABLE "audit"."change_logs" IS 'Tracks data changes with before/after values for audit trail';
COMMENT ON FUNCTION "audit".archive_old_logs IS 'Archives audit logs older than specified retention period (2 years for compliance)';
COMMENT ON FUNCTION "audit".log_changes IS 'Generic trigger function for automatic change logging';
COMMENT ON FUNCTION "audit".set_user_context IS 'Sets user context for audit logging at request start';
COMMENT ON FUNCTION "audit".clear_user_context IS 'Clears user context at request end';
