-- ============================================================================
-- Fix Rounding PatientStatus Enum Name
-- Rename "rounding"."PatientStatus" to "rounding"."RoundPatientStatus"
-- to match Prisma schema enum definition (RoundPatientStatus @@schema("rounding"))
-- ============================================================================

ALTER TYPE "rounding"."PatientStatus" RENAME TO "RoundPatientStatus";
