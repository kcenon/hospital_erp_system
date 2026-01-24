# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery (DR) procedures for the Hospital ERP System running on Kubernetes. The plan ensures business continuity by defining backup, restore, and failover procedures.

## Table of Contents

1. [RTO and RPO Targets](#rto-and-rpo-targets)
2. [Backup Strategy](#backup-strategy)
3. [Recovery Procedures](#recovery-procedures)
4. [Failover Procedures](#failover-procedures)
5. [Testing and Validation](#testing-and-validation)
6. [Communication Plan](#communication-plan)
7. [Emergency Contacts](#emergency-contacts)

## RTO and RPO Targets

### Recovery Objectives

| Component                | RPO (Recovery Point Objective)  | RTO (Recovery Time Objective) | Notes                              |
| ------------------------ | ------------------------------- | ----------------------------- | ---------------------------------- |
| **Database**             | 15 minutes                      | 1 hour                        | Automated backups every 15 minutes |
| **Application State**    | 5 minutes                       | 30 minutes                    | Stateless, quick re-deployment     |
| **Redis Cache**          | N/A (transient data)            | 10 minutes                    | Rebuild from database              |
| **Kubernetes Manifests** | Real-time (Git)                 | 15 minutes                    | GitOps with ArgoCD                 |
| **Secrets**              | Real-time (AWS Secrets Manager) | 10 minutes                    | External secrets operator          |
| **Monitoring Data**      | 1 hour                          | 2 hours                       | Prometheus long-term storage       |
| **Logs**                 | 1 hour                          | 2 hours                       | Loki retention policy              |

### Definitions

- **RPO**: Maximum acceptable amount of data loss measured in time
- **RTO**: Maximum acceptable time to restore service after disaster

## Backup Strategy

### 1. Database Backups

#### Automated Backups (Primary)

The database uses automated backups via CronJob running every 15 minutes:

```bash
# View backup CronJob
kubectl get cronjob db-backup -n hospital-erp-system

# Check recent backup jobs
kubectl get jobs -n hospital-erp-system -l app=db-backup --sort-by=.status.startTime

# View backup logs
kubectl logs -l job-name=db-backup-<timestamp> -n hospital-erp-system
```

**Backup Configuration:**

- **Frequency**: Every 15 minutes
- **Retention**: 30 days
- **Location**: AWS S3 bucket `s3://hospital-erp-backups/postgres/`
- **Type**: Full pg_dump with compression
- **Encryption**: AES-256 server-side encryption

**Backup Script** (executed by CronJob):

```bash
#!/bin/bash
# This script is run by the db-backup CronJob

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"
S3_BUCKET="s3://hospital-erp-backups/postgres"

# Create backup
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  | gzip > /tmp/${BACKUP_FILE}

# Upload to S3
aws s3 cp /tmp/${BACKUP_FILE} ${S3_BUCKET}/${BACKUP_FILE}

# Cleanup local file
rm /tmp/${BACKUP_FILE}

# Delete backups older than 30 days
aws s3 ls ${S3_BUCKET}/ | while read -r line; do
  fileName=$(echo $line | awk '{print $4}')
  fileDate=$(echo $fileName | grep -oP '\d{8}' | head -1)
  if [ -n "$fileDate" ]; then
    fileDateUnix=$(date -d "$fileDate" +%s)
    cutoffDate=$(date -d "30 days ago" +%s)
    if [ $fileDateUnix -lt $cutoffDate ]; then
      aws s3 rm ${S3_BUCKET}/${fileName}
    fi
  fi
done
```

#### Manual Backup

To create an immediate backup:

```bash
# Trigger backup job manually
kubectl create job --from=cronjob/db-backup db-backup-manual-$(date +%s) -n hospital-erp-system

# Monitor backup progress
kubectl logs -f job/db-backup-manual-<timestamp> -n hospital-erp-system

# Verify backup in S3
aws s3 ls s3://hospital-erp-backups/postgres/ --recursive | tail -10
```

#### AWS RDS Automated Backups (Secondary)

If using AWS RDS, automated backups are also enabled:

- **Daily snapshots**: Retained for 7 days
- **Point-in-time recovery**: Enabled (up to 5 minutes before failure)
- **Cross-region replication**: Enabled to `us-west-2` (DR region)

```bash
# List RDS snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier hospital-erp-production \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier hospital-erp-production \
  --db-snapshot-identifier hospital-erp-manual-$(date +%Y%m%d-%H%M%S)
```

### 2. Kubernetes Resource Backups

#### GitOps with ArgoCD (Primary)

All Kubernetes manifests are stored in Git and deployed via ArgoCD:

- **Repository**: `https://github.com/<org>/hospital_erp_system`
- **Sync frequency**: Automatic (every 3 minutes)
- **Backup**: Git repository itself is the backup

```bash
# View current deployed manifests
argocd app manifests hospital-erp-production

# Export current cluster state
kubectl get all -n hospital-erp-system -o yaml > cluster-state-$(date +%Y%m%d).yaml

# Backup ArgoCD configuration
argocd app get hospital-erp-production -o yaml > argocd-app-backup.yaml
```

#### Velero for Cluster-Wide Backups (Secondary)

Velero is configured for periodic cluster backups:

```bash
# Check Velero backups
velero backup get

# Create manual backup
velero backup create hospital-erp-manual-$(date +%s) \
  --include-namespaces hospital-erp-system

# View backup details
velero backup describe hospital-erp-manual-<timestamp>

# Check backup location
velero backup-location get
```

**Velero Configuration:**

- **Schedule**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Storage**: S3 bucket `s3://hospital-erp-velero-backups/`
- **Includes**: All resources in `hospital-erp-system` namespace

### 3. Secrets Backup

Secrets are stored in **AWS Secrets Manager** and synchronized to Kubernetes using External Secrets Operator:

```bash
# List secrets in AWS Secrets Manager
aws secretsmanager list-secrets \
  --filters Key=tag-key,Values=application Key=tag-value,Values=hospital-erp \
  --query 'SecretList[*].Name'

# Backup specific secret
aws secretsmanager get-secret-value \
  --secret-id hospital-erp/production/database \
  --output json > secrets-backup-$(date +%Y%m%d).json.enc

# Encrypt backup
gpg --symmetric --cipher-algo AES256 secrets-backup-$(date +%Y%m%d).json.enc
```

### 4. Persistent Volume Backups

#### Redis Data (StatefulSet)

Redis data is ephemeral cache, but persistent volumes are backed up:

```bash
# Check PVC
kubectl get pvc -n hospital-erp-system -l app=redis

# Create PVC snapshot (AWS EBS)
aws ec2 create-snapshot \
  --volume-id <volume-id> \
  --description "Redis backup $(date +%Y%m%d-%H%M%S)"

# List snapshots
aws ec2 describe-snapshots \
  --owner-ids self \
  --filters "Name=tag:Application,Values=hospital-erp" \
  --query 'Snapshots[*].[SnapshotId,StartTime,Description]' \
  --output table
```

### 5. Monitoring and Logging Backups

#### Prometheus Long-Term Storage

Prometheus metrics are exported to long-term storage (Thanos or Cortex):

```bash
# Verify long-term storage
kubectl logs -n monitoring prometheus-0 | grep "remote_write"

# Check remote write configuration
kubectl get prometheus -n monitoring -o jsonpath='{.spec.remoteWrite}'
```

#### Loki Log Retention

Loki retains logs for 30 days:

```bash
# Check Loki retention configuration
kubectl get configmap loki-config -n monitoring -o yaml | grep retention

# Manual log export
kubectl logs -n hospital-erp-system --all-containers --since=24h > logs-$(date +%Y%m%d).txt
```

## Recovery Procedures

### Scenario 1: Complete Database Loss

**Impact**: Total database unavailability

**Procedure**:

1. **Identify most recent backup**:

```bash
# List recent backups
aws s3 ls s3://hospital-erp-backups/postgres/ --recursive | tail -20

# Select backup (latest or specific point-in-time)
BACKUP_FILE="backup_20260124_140000.sql.gz"
```

2. **Download backup**:

```bash
# Download from S3
aws s3 cp s3://hospital-erp-backups/postgres/${BACKUP_FILE} /tmp/${BACKUP_FILE}

# Decompress
gunzip /tmp/${BACKUP_FILE}
```

3. **Restore database**:

```bash
# Stop application to prevent writes
kubectl scale deployment backend -n hospital-erp-system --replicas=0

# Restore database (if RDS)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier hospital-erp-restored \
  --db-snapshot-identifier <snapshot-id>

# Or restore via psql (if self-hosted)
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME < /tmp/backup_20260124_140000.sql
```

4. **Verify data integrity**:

```bash
# Connect to database
kubectl run -it --rm psql-verify --image=postgres:15 --restart=Never -n hospital-erp-system -- \
  psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME

# Run verification queries
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM patients;
SELECT MAX(created_at) FROM appointments;
```

5. **Restart application**:

```bash
# Scale backend back up
kubectl scale deployment backend -n hospital-erp-system --replicas=3

# Monitor logs
kubectl logs -f deployment/backend -n hospital-erp-system

# Verify health endpoints
kubectl get pods -n hospital-erp-system
curl https://api.hospital-erp.example.com/health
```

6. **Validate**:

```bash
# Run smoke tests
kubectl apply -f k8s/tests/smoke-test-job.yaml
kubectl logs -f job/smoke-test -n hospital-erp-system

# Check metrics
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Query: up{job="backend"}
```

**Expected Time**: 45-60 minutes

### Scenario 2: Namespace Deletion

**Impact**: All resources in hospital-erp-system namespace deleted

**Procedure**:

1. **Recreate namespace**:

```bash
# Create namespace
kubectl apply -f k8s/base/namespace.yaml

# Or via ArgoCD (preferred)
argocd app sync hospital-erp-production
```

2. **Wait for ArgoCD to reconcile** (if GitOps is intact):

```bash
# Monitor sync
argocd app sync hospital-erp-production --prune

# Check sync status
argocd app get hospital-erp-production
```

3. **Manual restore (if ArgoCD is also down)**:

```bash
# Apply base manifests
kubectl apply -k k8s/overlays/production/

# Verify resources
kubectl get all -n hospital-erp-system

# Check pod status
kubectl get pods -n hospital-erp-system --watch
```

4. **Restore secrets**:

```bash
# External Secrets Operator will automatically sync
kubectl get externalsecrets -n hospital-erp-system

# Verify secrets are created
kubectl get secrets -n hospital-erp-system
```

5. **Verify application health**:

```bash
# Check ingress
kubectl get ingress -n hospital-erp-system

# Test endpoints
curl -I https://hospital-erp.example.com
curl https://api.hospital-erp.example.com/health
```

**Expected Time**: 15-30 minutes

### Scenario 3: Entire Cluster Failure

**Impact**: Complete Kubernetes cluster unavailability

**Procedure**:

1. **Provision new cluster**:

```bash
# Create new EKS cluster (AWS example)
eksctl create cluster \
  --name hospital-erp-dr \
  --region us-west-2 \
  --version 1.28 \
  --nodegroup-name standard-workers \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5
```

2. **Install core components**:

```bash
# Install ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/aws/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install External Secrets Operator
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
```

3. **Restore from Velero backup** (if available):

```bash
# Install Velero
velero install \
  --provider aws \
  --bucket hospital-erp-velero-backups \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1

# List backups
velero backup get

# Restore most recent backup
velero restore create --from-backup <backup-name>

# Monitor restore
velero restore describe <restore-name>
```

4. **Deploy via GitOps (if Velero not used)**:

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create ArgoCD application
kubectl apply -f k8s/argocd/applications/production.yaml

# Sync application
argocd app sync hospital-erp-production
```

5. **Restore database** (follow Scenario 1 procedure)

6. **Update DNS**:

```bash
# Get new Load Balancer address
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Update DNS A record to point to new load balancer
# (Use Route53, CloudFlare, etc.)
```

7. **Verify full system**:

```bash
# Test all endpoints
curl https://hospital-erp.example.com
curl https://api.hospital-erp.example.com/health

# Run integration tests
kubectl apply -f k8s/tests/integration-test-job.yaml

# Monitor metrics
kubectl port-forward svc/prometheus -n monitoring 9090:9090
```

**Expected Time**: 2-4 hours

### Scenario 4: Corrupted Application State

**Impact**: Application data integrity issues

**Procedure**:

1. **Identify corruption scope**:

```bash
# Check application logs
kubectl logs -l app=backend -n hospital-erp-system | grep -i "error\|corruption"

# Run database integrity check
kubectl exec deployment/backend -n hospital-erp-system -- \
  npm run db:check-integrity
```

2. **Determine restore point**:

```bash
# List backups around the corruption time
aws s3 ls s3://hospital-erp-backups/postgres/ | grep "backup_20260124"

# Check database query logs (if available)
aws rds describe-db-log-files --db-instance-identifier hospital-erp-production
```

3. **Create pre-restore backup**:

```bash
# Backup current state (even if corrupted)
kubectl create job --from=cronjob/db-backup db-backup-pre-restore-$(date +%s) -n hospital-erp-system
```

4. **Restore to clean state** (follow Scenario 1 procedure, selecting appropriate backup)

5. **Replay transactions** (if possible):

```bash
# Extract and replay transactions from write-ahead log
# (Database-specific procedure)
```

**Expected Time**: 1-2 hours

## Failover Procedures

### Regional Failover (Multi-Region Setup)

If a multi-region deployment is configured:

1. **Trigger DNS failover**:

```bash
# Update Route53 health check
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://dns-failover.json
```

2. **Promote read replica to primary** (database):

```bash
# Promote RDS read replica
aws rds promote-read-replica \
  --db-instance-identifier hospital-erp-dr-replica

# Wait for promotion
aws rds wait db-instance-available \
  --db-instance-identifier hospital-erp-dr-replica
```

3. **Update backend configuration**:

```bash
# Update ConfigMap with new database endpoint
kubectl patch configmap backend-config -n hospital-erp-system \
  --patch '{"data":{"DATABASE_HOST":"<new-db-endpoint>"}}'

# Restart backend
kubectl rollout restart deployment/backend -n hospital-erp-system
```

4. **Verify failover**:

```bash
# Check application health
curl https://api.hospital-erp.example.com/health

# Monitor error rates
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Query: rate(http_requests_total{status=~"5.."}[5m])
```

## Testing and Validation

### Backup Verification

Run monthly backup verification tests:

```bash
# Restore backup to test environment
./scripts/test-backup-restore.sh

# Run data integrity checks
kubectl exec deployment/backend -n hospital-erp-test -- npm run db:verify

# Generate verification report
./scripts/generate-dr-report.sh
```

### DR Drill Schedule

| Drill Type                | Frequency     | Duration | Participants                |
| ------------------------- | ------------- | -------- | --------------------------- |
| **Backup restore test**   | Monthly       | 2 hours  | DevOps team                 |
| **Database failover**     | Quarterly     | 4 hours  | DevOps, Backend team        |
| **Full cluster recovery** | Semi-annually | 8 hours  | All engineering             |
| **Regional failover**     | Annually      | 1 day    | All engineering, Management |

### Validation Checklist

After any recovery procedure:

- [ ] All pods running and healthy
- [ ] Database connectivity verified
- [ ] Redis cache operational
- [ ] Health endpoints returning 200 OK
- [ ] Ingress routing correctly
- [ ] TLS certificates valid
- [ ] Monitoring and alerting functional
- [ ] Logs being collected
- [ ] Authentication working
- [ ] Critical API endpoints tested
- [ ] Integration tests passing
- [ ] Performance within acceptable range
- [ ] No data loss beyond RPO
- [ ] Recovery completed within RTO

## Communication Plan

### Incident Communication Flow

```
Disaster Detected
       ↓
Incident Commander Assigned
       ↓
┌──────┴───────┬──────────────┬────────────────┐
↓              ↓              ↓                ↓
Engineering  Management   Users/Customers   Stakeholders
Team         Team         (Status Page)     (Email/Slack)
```

### Communication Templates

#### Initial Incident Report

```
Subject: [P0] Hospital ERP System Outage - DR Initiated

Priority: P0
Status: Recovery in Progress
Impact: Full system unavailability
Estimated Recovery Time: <X> hours

Details:
- Incident detected at: <timestamp>
- Root cause: <cause>
- Recovery procedure: <procedure>
- Current step: <step>

Next Update: <timestamp>
Incident Commander: <name>
```

#### Recovery Complete Notification

```
Subject: [RESOLVED] Hospital ERP System Restored

Status: Resolved
Downtime: <duration>
Root Cause: <cause>
Data Loss: <RPO achieved>

Actions Taken:
- <action 1>
- <action 2>

Verification:
- All systems operational
- No data loss beyond RPO
- Monitoring confirmed healthy

Post-Incident Review: Scheduled for <date>
```

### Status Page Updates

Use automated status page updates:

```bash
# Update status page (StatusPage.io example)
curl -X POST https://api.statuspage.io/v1/pages/<page-id>/incidents \
  -H "Authorization: OAuth <token>" \
  -d "incident[name]=Database Outage - Recovery in Progress" \
  -d "incident[status]=investigating" \
  -d "incident[body]=We are currently restoring database from backup..."
```

## Emergency Contacts

### On-Call Rotation

| Role                   | Primary           | Secondary               | Escalation          |
| ---------------------- | ----------------- | ----------------------- | ------------------- |
| **Incident Commander** | DevOps Lead       | SRE Lead                | CTO                 |
| **Database Expert**    | DBA               | Senior Backend Engineer | Engineering Manager |
| **Kubernetes Expert**  | Platform Engineer | DevOps Engineer         | Infrastructure Lead |
| **Application Owner**  | Backend Lead      | Full-Stack Lead         | VP Engineering      |

### External Contacts

| Service          | Contact                | Purpose               |
| ---------------- | ---------------------- | --------------------- |
| **AWS Support**  | support@aws.amazon.com | Infrastructure issues |
| **RDS Support**  | Premium Support        | Database recovery     |
| **DNS Provider** | support@<provider>     | DNS failover          |

## Post-Disaster Procedures

### Post-Incident Review (PIR)

Schedule within 48 hours of incident resolution:

1. **Timeline reconstruction**: Document all events
2. **Root cause analysis**: Identify failure points
3. **Recovery effectiveness**: Measure against RTO/RPO
4. **Action items**: Identify improvements
5. **Documentation updates**: Update runbooks

### Continuous Improvement

- Review and update DR plan quarterly
- Test backups monthly
- Update contact information immediately when changed
- Document lessons learned from each incident
- Automate recovery procedures where possible

## Appendix

### Quick Reference Commands

```bash
# Emergency database backup
kubectl create job --from=cronjob/db-backup emergency-backup-$(date +%s) -n hospital-erp-system

# Scale down application
kubectl scale deployment backend frontend -n hospital-erp-system --replicas=0

# Check last successful backup
aws s3 ls s3://hospital-erp-backups/postgres/ --recursive | tail -1

# Restore from Velero
velero restore create --from-backup <backup-name>

# DNS failover (Route53)
aws route53 change-resource-record-sets --hosted-zone-id <zone-id> --change-batch file://failover.json
```

### Related Documentation

- [Troubleshooting Guide](./troubleshooting.md)
- [Runbooks](./runbooks/)
- [Architecture Documentation](./architecture.md)
- [Security Documentation](./security.md)

## Revision History

| Version | Date       | Changes                        | Author        |
| ------- | ---------- | ------------------------------ | ------------- |
| 1.0     | 2026-01-24 | Initial disaster recovery plan | Platform Team |
