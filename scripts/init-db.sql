-- Database initialization script for Hospital ERP System
-- This script runs on first container initialization

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS "room";
CREATE SCHEMA IF NOT EXISTS "patient";
CREATE SCHEMA IF NOT EXISTS "admission";
CREATE SCHEMA IF NOT EXISTS "report";
CREATE SCHEMA IF NOT EXISTS "rounding";
CREATE SCHEMA IF NOT EXISTS "audit";

-- Grant permissions to hospital_user
GRANT ALL ON SCHEMA "room" TO hospital_user;
GRANT ALL ON SCHEMA "patient" TO hospital_user;
GRANT ALL ON SCHEMA "admission" TO hospital_user;
GRANT ALL ON SCHEMA "report" TO hospital_user;
GRANT ALL ON SCHEMA "rounding" TO hospital_user;
GRANT ALL ON SCHEMA "audit" TO hospital_user;
