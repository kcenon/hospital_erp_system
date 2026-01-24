# Database Migration Jobs for Kubernetes

This directory contains Kubernetes Job and CronJob resources for managing database migrations and backups in the Hospital ERP System.

## Overview

The migration system provides:

- **Manual Migration Jobs**: On-demand database migrations
- **Seed Jobs**: Database seeding for development/staging environments
- **ArgoCD PreSync Hooks**: Automatic migrations during deployment
- **Backup CronJobs**: Scheduled database backups

## Resources

### 1. Database Migration Job (`db-migrate.yaml`)

Manual database migration job using Prisma.

**Usage:**

```bash
# Apply the migration job
kubectl apply -f k8s/jobs/db-migrate.yaml

# Check job status
kubectl get jobs -n hospital-erp-system

# View migration logs
kubectl logs job/db-migrate -n hospital-erp-system
```

**Features:**

- Runs `prisma migrate deploy`
- Uses backend-secrets for database credentials
- Auto-cleanup after 1 hour (TTL: 3600s)
- Max 3 retry attempts

### 2. Database Seed Job (`db-seed.yaml`)

Seeds the database with initial data (development/staging only).

**Usage:**

```bash
# Apply the seed job
kubectl apply -f k8s/jobs/db-seed.yaml

# View seed logs
kubectl logs job/db-seed -n hospital-erp-system
```

**Note:** Only use in non-production environments.

### 3. PreSync Hook (`../base/backend/pre-deploy-hook.yaml`)

ArgoCD hook that runs migrations automatically before deployment.

**Features:**

- Triggered by ArgoCD PreSync event
- Runs in wave 0 (before application deployment)
- Auto-deleted on success
- Ensures migrations complete before pods are updated

**ArgoCD Configuration:**

```yaml
annotations:
  argocd.argoproj.io/hook: PreSync
  argocd.argoproj.io/hook-delete-policy: HookSucceeded
  argocd.argoproj.io/sync-wave: '0'
```

### 4. Database Backup CronJob (`db-backup-cronjob.yaml`)

Scheduled daily backup of the database.

**Schedule:** Daily at 2 AM (KST)

**Storage:**

- Uses PersistentVolumeClaim (`db-backup-pvc`)
- 50Gi storage capacity
- Retains last 3 successful backups
- Retains last 3 failed backups

**Backup Format:**

- PostgreSQL custom format (`-Fc`)
- Filename: `hospital-erp-YYYYMMDD-HHMMSS.sql`
- Location: `/backup/` in PVC

**Usage:**

```bash
# Create PVC first
kubectl apply -f k8s/jobs/db-backup-pvc.yaml

# Apply CronJob
kubectl apply -f k8s/jobs/db-backup-cronjob.yaml

# View CronJob status
kubectl get cronjob -n hospital-erp-system

# View backup jobs
kubectl get jobs -l job-type=backup -n hospital-erp-system

# List backups (requires PVC mount)
kubectl exec -it <backup-pod> -n hospital-erp-system -- ls -lh /backup/
```

### 5. Persistent Volume Claim (`db-backup-pvc.yaml`)

Storage for database backups.

**Specifications:**

- Access Mode: ReadWriteOnce
- Storage: 50Gi
- Storage Class: standard

## Manual Migration Scripts

Located in `scripts/k8s/`:

### run-migration.sh

Run database migration manually.

```bash
# Basic usage
./scripts/k8s/run-migration.sh

# Specify namespace
./scripts/k8s/run-migration.sh -n hospital-erp-system

# Use specific context
./scripts/k8s/run-migration.sh -c production -n hospital-erp-system
```

**Options:**

- `-n, --namespace NAMESPACE`: Kubernetes namespace (default: hospital-erp-system)
- `-c, --context CONTEXT`: Kubernetes context to use
- `-h, --help`: Display help message

**Features:**

- Creates timestamped job
- Waits for completion
- Shows migration logs
- Auto-cleanup after 1 hour

### rollback-migration.sh

Rollback to a previous migration.

```bash
# Rollback to specific migration
./scripts/k8s/rollback-migration.sh 20240101000000_initial_schema

# With namespace
./scripts/k8s/rollback-migration.sh -n hospital-erp-system 20240101000000_initial_schema
```

**Options:**

- Migration name (required)
- `-n, --namespace NAMESPACE`: Kubernetes namespace
- `-c, --context CONTEXT`: Kubernetes context
- `-h, --help`: Display help message

**Safety Features:**

- Confirmation prompt before rollback
- Shows migration name being rolled back
- Warns about potential data loss

## Deployment Workflow

### Development/Staging

1. **Manual Migration**:

   ```bash
   ./scripts/k8s/run-migration.sh -n hospital-erp-staging
   ```

2. **Seed Database** (optional):
   ```bash
   kubectl apply -f k8s/jobs/db-seed.yaml
   ```

### Production

1. **ArgoCD Automatic Migration**:
   - Migrations run automatically via PreSync hook
   - No manual intervention needed

2. **Manual Migration** (if needed):

   ```bash
   ./scripts/k8s/run-migration.sh -n hospital-erp-system -c production
   ```

3. **Verify Backups**:
   ```bash
   kubectl get cronjob/db-backup -n hospital-erp-system
   kubectl get jobs -l job-type=backup -n hospital-erp-system
   ```

## Rollback Procedure

1. **Identify Migration to Rollback**:

   ```bash
   # View migration history in a backend pod
   kubectl exec -it <backend-pod> -n hospital-erp-system -- npx prisma migrate status
   ```

2. **Execute Rollback**:

   ```bash
   ./scripts/k8s/rollback-migration.sh -n hospital-erp-system <migration-name>
   ```

3. **Verify State**:

   ```bash
   kubectl logs job/db-rollback-<timestamp> -n hospital-erp-system
   ```

4. **Re-apply Migrations** (if needed):
   ```bash
   ./scripts/k8s/run-migration.sh -n hospital-erp-system
   ```

## Backup and Restore

### Manual Backup

```bash
# Trigger backup manually
kubectl create job --from=cronjob/db-backup db-backup-manual -n hospital-erp-system

# Wait for completion
kubectl wait --for=condition=complete job/db-backup-manual -n hospital-erp-system

# View backup logs
kubectl logs job/db-backup-manual -n hospital-erp-system
```

### Restore from Backup

```bash
# 1. Copy backup file from PVC
kubectl cp <backup-pod>:/backup/hospital-erp-20240101-020000.sql ./backup.sql -n hospital-erp-system

# 2. Restore to database (requires pg_restore)
kubectl exec -i <postgres-pod> -n hospital-erp-system -- pg_restore -d hospital_erp < ./backup.sql
```

## Troubleshooting

### Migration Job Failed

```bash
# View job details
kubectl describe job/db-migrate -n hospital-erp-system

# View pod logs
kubectl logs -l job-name=db-migrate -n hospital-erp-system

# Check secrets
kubectl get secret backend-secrets -n hospital-erp-system
```

### Backup CronJob Not Running

```bash
# Check CronJob status
kubectl get cronjob/db-backup -n hospital-erp-system

# View recent jobs
kubectl get jobs -l job-type=backup -n hospital-erp-system

# Check PVC
kubectl get pvc db-backup-pvc -n hospital-erp-system
```

### PreSync Hook Issues

```bash
# View ArgoCD application status
argocd app get hospital-erp-production

# View hook logs
kubectl logs -l argocd.argoproj.io/hook=PreSync -n hospital-erp-system
```

## Security Considerations

- Migration jobs use service account `backend-sa` with minimal permissions
- Database credentials stored in Kubernetes Secrets (`backend-secrets`)
- Backups stored in PersistentVolume (ensure encryption at rest)
- CronJob runs as non-root user (postgres:16-alpine)

## References

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [Kubernetes CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [ArgoCD Resource Hooks](https://argo-cd.readthedocs.io/en/stable/user-guide/resource_hooks/)
