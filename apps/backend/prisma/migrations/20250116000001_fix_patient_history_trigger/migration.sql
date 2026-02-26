-- ============================================================================
-- Fix Patient History Trigger
-- Remove DELETE event to avoid FK constraint violation with ON DELETE CASCADE
-- Soft deletes are already tracked via UPDATE handler (deleted_at field)
-- ============================================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS patient_history_trigger ON "patient"."patients";

-- Recreate trigger for INSERT and UPDATE only (not DELETE)
CREATE TRIGGER patient_history_trigger
    AFTER INSERT OR UPDATE ON "patient"."patients"
    FOR EACH ROW EXECUTE FUNCTION "patient".record_patient_history();
