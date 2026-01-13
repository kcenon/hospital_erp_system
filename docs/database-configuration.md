# Database Configuration Guide

## Overview

The Hospital ERP system uses PostgreSQL 16.x with a multi-schema architecture for logical domain separation. This document describes the database setup, configuration options, and best practices.

## Schema Architecture

The database is organized into 7 schemas for logical separation:

```
hospital_erp (database)
├── public      - Users, roles, permissions (auth)
├── patient     - Patient data and details
├── room        - Room and bed management
├── admission   - Admission/transfer/discharge records
├── report      - Vital signs, I/O, medications, nursing notes
├── rounding    - Rounding sessions and records
└── audit       - Access logs, change logs, login history
```

### Schema Responsibilities

| Schema | Purpose | Tables |
|--------|---------|--------|
| `public` | Authentication and authorization | users, roles, permissions, user_roles |
| `patient` | Patient master data | patients, patient_details, patient_sequences |
| `room` | Hospital infrastructure | buildings, floors, rooms, beds |
| `admission` | Patient stay management | admissions, transfers, discharges |
| `report` | Clinical documentation | vital_signs, intake_outputs, medications, nursing_notes |
| `rounding` | Ward rounds | rounds, round_records |
| `audit` | Compliance and security | access_logs, change_logs, login_history |

## Prerequisites

### PostgreSQL Installation

- **Version**: PostgreSQL 16.x recommended
- **Required Extensions**:
  - `pgcrypto` - Field-level encryption for sensitive data (SSN, insurance numbers)
  - `uuid-ossp` - UUID generation (optional, `gen_random_uuid()` is also available)

### Installing Extensions

```sql
-- Enable extensions (requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Environment Configuration

### Database URL

Configure the database connection in `.env`:

```bash
# Development
DATABASE_URL="postgresql://hospital_user:password@localhost:5432/hospital_erp_dev"

# Production (with connection pooling)
DATABASE_URL="postgresql://hospital_user:password@db.example.com:5432/hospital_erp_prod?connection_limit=10&pool_timeout=30"
```

### Connection Pool Settings

| Parameter | Development | Production | Description |
|-----------|-------------|------------|-------------|
| `connection_limit` | 5 | 10-20 | Maximum connections per client |
| `pool_timeout` | 10 | 30 | Seconds to wait for available connection |
| `statement_cache_size` | 100 | 500 | Number of prepared statements to cache |

### Recommended Production Settings

```bash
# PostgreSQL connection with recommended settings
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30&connect_timeout=10&socket_timeout=30"
```

## Encryption

### Field-Level Encryption

Sensitive data (SSN, insurance numbers, medical history) is encrypted using `pgcrypto`:

```sql
-- Encrypt data
SELECT pgp_sym_encrypt('sensitive-data', 'encryption-key');

-- Decrypt data
SELECT pgp_sym_decrypt(encrypted_column, 'encryption-key');
```

### Encryption Key Management

```bash
# .env configuration
ENCRYPTION_KEY="32-character-encryption-key-here"
```

**Important**:
- Use a strong, randomly generated key (minimum 32 characters)
- Store keys securely (environment variables, secrets manager)
- Never commit encryption keys to version control

## Migration Management

### Running Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations in development
npm run db:migrate

# Deploy migrations in production
npm run db:migrate:deploy

# Reset database (development only - DESTRUCTIVE)
npm run db:reset
```

### Migration Best Practices

1. **Always backup before migrations** in production
2. **Test migrations** in staging environment first
3. **Use transactional migrations** where possible
4. **Keep migrations small and focused**

## Prisma Configuration

### Multi-Schema Setup

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "patient", "room", "admission", "report", "rounding", "audit"]
}
```

### Model Schema Assignment

```prisma
model Patient {
  // ... fields
  @@schema("patient")
}
```

## Performance Tuning

### Indexing Strategy

- Primary keys use UUID for global uniqueness
- Foreign keys are indexed for join performance
- Common query fields have dedicated indexes
- Soft-delete columns (`deleted_at`) are indexed for filtered queries

### Connection Pool Sizing

Formula for pool size: `connections = (core_count * 2) + effective_spindle_count`

| Server Type | CPU Cores | Recommended Pool Size |
|-------------|-----------|----------------------|
| Small (dev) | 2 | 5-10 |
| Medium | 4 | 10-20 |
| Large | 8+ | 20-40 |

## Backup and Recovery

### Recommended Backup Strategy

1. **Daily full backups** using `pg_dump`
2. **Point-in-time recovery** using WAL archiving
3. **Offsite backup storage** for disaster recovery

### Example Backup Script

```bash
#!/bin/bash
pg_dump -h localhost -U hospital_user -d hospital_erp_prod \
  --format=custom \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"
```

## Monitoring

### Key Metrics to Monitor

- Connection pool utilization
- Query execution time
- Lock contention
- Disk space usage
- Replication lag (if applicable)

### Health Check Query

```sql
SELECT
  numbackends as active_connections,
  xact_commit as total_commits,
  xact_rollback as total_rollbacks,
  blks_read as blocks_read,
  blks_hit as cache_hits
FROM pg_stat_database
WHERE datname = 'hospital_erp_prod';
```

## Troubleshooting

### Common Issues

1. **Connection exhaustion**: Increase pool size or reduce connection holding time
2. **Slow queries**: Check indexes, analyze query plans with `EXPLAIN ANALYZE`
3. **Lock timeouts**: Review transaction isolation levels, reduce transaction scope

### Useful Diagnostic Queries

```sql
-- Active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND query_start IS NOT NULL
ORDER BY duration DESC;

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Prisma Multi-Schema Support](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#multi-schema-support)
- [pgcrypto Extension](https://www.postgresql.org/docs/current/pgcrypto.html)
- SDS Section 5.1: Logical Data Model
- SDS Section 5.2: Schema-Table Mapping
