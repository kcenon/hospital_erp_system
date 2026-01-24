# Runbook: Database Connection Issues

## Overview

This runbook provides procedures for diagnosing and resolving database connection issues in the Hospital ERP System.

**Estimated Time**: 15-35 minutes
**Severity**: Critical
**Related Runbooks**: [High Error Rate](./high-error-rate.md), [Pod Crash Looping](./pod-crash-looping.md), [High Response Time](./high-response-time.md)

---

## Symptoms

- **Application Errors**: `ECONNREFUSED`, `Connection timeout`, `Too many connections`
- **User Impact**: Failed database operations, service unavailable
- **Prometheus Alert**: `DatabaseConnectionFailure` firing
- **Log Patterns**: Connection pool exhausted, query timeouts

---

## Impact

| Connection Failure        | User Impact            | Business Impact                         |
| ------------------------- | ---------------------- | --------------------------------------- |
| **Complete outage**       | All DB operations fail | Critical revenue loss, data unavailable |
| **Intermittent failures** | Some requests timeout  | User frustration, partial data loss     |
| **Slow connections**      | High latency, timeouts | Poor user experience                    |

---

## Detection

### Prometheus Query

```promql
# Database connection errors
rate(database_connection_errors_total[5m]) > 0
```

### Alert Definition

```yaml
# Located in k8s/monitoring/prometheus/alerts/database-alerts.yaml
alert: DatabaseConnectionFailure
expr: |
  rate(database_connection_errors_total[5m]) > 1
for: 2m
labels:
  severity: critical
annotations:
  summary: 'Database connection failures detected: {{ $value }}/s'
```

---

## Investigation Steps

### Step 1: Verify Connectivity (5 minutes)

1. **Test PgBouncer reachability from backend**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  nc -zv pgbouncer 5432

# Expected: "pgbouncer (10.x.x.x:5432) open"
# Error: "Connection refused" or timeout → PgBouncer issue
```

2. **Check PgBouncer pod status**

```bash
kubectl get pods -n hospital-erp-system -l app=pgbouncer

# Expected output:
# NAME                         READY   STATUS    RESTARTS   AGE
# pgbouncer-7d9f8b5c6d-xyz     1/1     Running   0          5h
```

3. **Verify PgBouncer service**

```bash
kubectl get svc pgbouncer -n hospital-erp-system

# Should show ClusterIP and port 5432
```

4. **Check service endpoints**

```bash
kubectl get endpoints pgbouncer -n hospital-erp-system

# Should list pod IPs
# Empty endpoints → PgBouncer pods not healthy
```

---

### Step 2: Analyze PgBouncer Logs (5 minutes)

1. **View PgBouncer logs**

```bash
kubectl logs -n hospital-erp-system -l app=pgbouncer --tail=100
```

**Common Error Patterns**:

| Log Message                       | Cause                    | Action         |
| --------------------------------- | ------------------------ | -------------- |
| `no more connections allowed`     | Max connections reached  | → Resolution 1 |
| `server conn crashed`             | RDS unreachable          | → Step 3       |
| `login failed`                    | Wrong credentials        | → Resolution 2 |
| `SSL error`                       | SSL/TLS misconfiguration | → Resolution 3 |
| `closing because: client timeout` | Connection leak          | → Resolution 4 |

2. **Check PgBouncer statistics**

```bash
kubectl exec -n hospital-erp-system deployment/pgbouncer -- \
  psql -h localhost -p 5432 -U pgbouncer -d pgbouncer -c "SHOW STATS;"
```

**Key Metrics**:

```
 database    | total_xact_count | total_query_count | avg_query_time
-------------|------------------|-------------------|---------------
 hospital_db | 125000           | 500000            | 15ms
```

3. **View pool status**

```bash
kubectl exec -n hospital-erp-system deployment/pgbouncer -- \
  psql -h localhost -p 5432 -U pgbouncer -d pgbouncer -c "SHOW POOLS;"
```

**Expected Output**:

```
 database    | user         | cl_active | cl_waiting | sv_active | sv_idle | maxwait
-------------|--------------|-----------|------------|-----------|---------|--------
 hospital_db | hospital_user| 15        | 0          | 15        | 10      | 0
```

**Problem Indicators**:

- `cl_waiting > 0` → Backend waiting for connections
- `sv_active ≈ max_connections` → Pool saturated
- `maxwait > 5` → Long connection wait time

---

### Step 3: Check RDS Connectivity (10 minutes)

1. **Test RDS connection from PgBouncer**

```bash
# Get RDS endpoint from ConfigMap
kubectl get configmap pgbouncer-config -n hospital-erp-system -o yaml | grep host

# Test connection from PgBouncer pod
kubectl exec -n hospital-erp-system deployment/pgbouncer -- \
  nc -zv <RDS_ENDPOINT> 5432
```

2. **Check RDS instance status in AWS Console**

```bash
# Using AWS CLI
aws rds describe-db-instances \
  --db-instance-identifier hospital-erp-prod \
  --query 'DBInstances[0].DBInstanceStatus'

# Expected: "available"
# Other states: "backing-up", "modifying", "stopping" → Check AWS console
```

3. **Verify Security Group rules**

```bash
aws rds describe-db-instances \
  --db-instance-identifier hospital-erp-prod \
  --query 'DBInstances[0].VpcSecurityGroups'

# Ensure security group allows traffic from EKS cluster
```

4. **Check RDS connection count**

```bash
kubectl exec -n hospital-erp-system deployment/pgbouncer -- \
  psql -h <RDS_ENDPOINT> -p 5432 -U hospital_user -d hospital_db -c \
  "SELECT count(*) FROM pg_stat_activity;"
```

**Warning Thresholds** (for db.t3.medium):

- < 50 connections: Healthy
- 50-80 connections: Monitor
- 80-100 connections: Critical (approaching max_connections=100)

---

### Step 4: Inspect Application Connection Pool (5 minutes)

1. **Check backend connection pool configuration**

```bash
kubectl get configmap backend-config -n hospital-erp-system -o yaml | \
  grep -E "DB_POOL|CONNECTION"
```

**Recommended Settings** (NestJS/TypeORM):

```yaml
DB_POOL_SIZE: '20' # Max connections per backend pod
DB_CONNECTION_TIMEOUT: '30000' # 30 seconds
DB_IDLE_TIMEOUT: '10000' # 10 seconds
```

2. **View backend logs for connection errors**

```bash
kubectl logs -n hospital-erp-system -l app=backend --tail=100 | \
  grep -i -E "connection|timeout|econnrefused"
```

3. **Calculate total expected connections**

```bash
# Formula: (Backend replicas × Pool size per pod) + Buffer
kubectl get deployment backend -n hospital-erp-system -o jsonpath='{.spec.replicas}'

# Example: 3 replicas × 20 pool size = 60 total connections needed
```

---

### Step 5: Check Network Policies (3 minutes)

1. **List network policies affecting database access**

```bash
kubectl get networkpolicies -n hospital-erp-system
```

2. **Describe backend network policy**

```bash
kubectl describe networkpolicy backend-network-policy -n hospital-erp-system
```

**Ensure egress rules allow**:

```yaml
egress:
  - to:
      - podSelector:
          matchLabels:
            app: pgbouncer
    ports:
      - protocol: TCP
        port: 5432
```

3. **Test with temporary policy bypass** (only for testing!)

```bash
# Delete network policy temporarily
kubectl delete networkpolicy backend-network-policy -n hospital-erp-system

# Test connection
kubectl exec -n hospital-erp-system deployment/backend -- \
  nc -zv pgbouncer 5432

# Restore policy
kubectl apply -f k8s/base/network-policies/backend-policy.yaml
```

---

## Resolution Procedures

### Resolution 1: Increase PgBouncer Connection Limits (5 minutes)

**When to use**: `no more connections allowed`, pool saturated

```bash
kubectl edit configmap pgbouncer-config -n hospital-erp-system
```

**Update configuration**:

```ini
[pgbouncer]
max_client_conn = 2000        # Increase from 1000
default_pool_size = 50        # Increase from 25
reserve_pool_size = 10        # Add reserve
max_db_connections = 100      # Must be ≤ RDS max_connections
max_user_connections = 100    # Per user limit

# Timeouts
server_connect_timeout = 30   # Increase from 15
query_timeout = 60            # Increase if long queries expected
```

**Restart PgBouncer to apply**:

```bash
kubectl rollout restart deployment/pgbouncer -n hospital-erp-system

# Monitor restart
kubectl rollout status deployment/pgbouncer -n hospital-erp-system

# Verify new settings
kubectl exec -n hospital-erp-system deployment/pgbouncer -- \
  psql -h localhost -p 5432 -U pgbouncer -d pgbouncer -c "SHOW CONFIG;"
```

---

### Resolution 2: Fix Database Credentials (5 minutes)

**When to use**: `login failed`, authentication errors

```bash
# Verify current secret
kubectl get secret database-credentials -n hospital-erp-system -o yaml

# Decode and verify password
kubectl get secret database-credentials -n hospital-erp-system \
  -o jsonpath='{.data.password}' | base64 -d

# If incorrect, update secret
kubectl create secret generic database-credentials \
  -n hospital-erp-system \
  --from-literal=username=hospital_user \
  --from-literal=password=<CORRECT_PASSWORD> \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart PgBouncer to use new credentials
kubectl rollout restart deployment/pgbouncer -n hospital-erp-system
```

**For AWS Secrets Manager integration**:

```bash
# Update secret in AWS
aws secretsmanager update-secret \
  --secret-id hospital-erp/database/credentials \
  --secret-string '{"username":"hospital_user","password":"NEW_PASSWORD"}'

# Trigger External Secrets sync
kubectl annotate externalsecret database-credentials \
  -n hospital-erp-system \
  force-sync=$(date +%s) --overwrite
```

---

### Resolution 3: Fix SSL Configuration (10 minutes)

**When to use**: SSL/TLS errors

**Update PgBouncer to require SSL**:

```bash
kubectl edit configmap pgbouncer-config -n hospital-erp-system
```

```ini
[databases]
hospital_db = host=<RDS_ENDPOINT> port=5432 dbname=hospital_db sslmode=require

[pgbouncer]
server_tls_sslmode = require
server_tls_protocols = secure
```

**For RDS, download and mount RDS CA certificate**:

```bash
# Download RDS CA bundle
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Create ConfigMap with certificate
kubectl create configmap rds-ca-cert \
  -n hospital-erp-system \
  --from-file=ca-cert.pem=global-bundle.pem

# Update PgBouncer deployment to mount certificate
kubectl edit deployment pgbouncer -n hospital-erp-system
```

```yaml
volumeMounts:
  - name: rds-ca
    mountPath: /etc/ssl/certs/rds-ca.pem
    subPath: ca-cert.pem
volumes:
  - name: rds-ca
    configMap:
      name: rds-ca-cert
```

---

### Resolution 4: Fix Connection Leaks (15 minutes)

**When to use**: Connection pool grows over time, idle connections

**Identify long-running connections**:

```bash
kubectl exec -n hospital-erp-system deployment/pgbouncer -- \
  psql -h <RDS_ENDPOINT> -p 5432 -U hospital_user -d hospital_db -c \
  "SELECT pid, usename, state, state_change, query
   FROM pg_stat_activity
   WHERE state != 'idle'
     AND state_change < now() - interval '5 minutes'
   ORDER BY state_change;"
```

**Kill long-running queries** (use with caution!):

```sql
-- Terminate specific connection
SELECT pg_terminate_backend(<PID>);

-- Terminate all idle connections older than 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '10 minutes';
```

**Fix application code to properly close connections**:

```typescript
// BAD: Connection leak
async function badExample() {
  const connection = await pool.getConnection();
  await connection.query('SELECT * FROM patients');
  // ❌ Forgot to release!
}

// GOOD: Properly release connection
async function goodExample() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT * FROM patients');
  } finally {
    connection.release(); // ✅ Always release
  }
}

// BEST: Use transaction manager
async function bestExample() {
  await this.dataSource.transaction(async (manager) => {
    await manager.query('SELECT * FROM patients');
    // ✅ Auto-released on transaction end
  });
}
```

---

### Resolution 5: Increase RDS Max Connections (20 minutes)

**When to use**: RDS connection limit reached, cannot scale application

**Calculate required max_connections**:

```
max_connections = (Backend replicas × Pool size × Safety margin)
                + PgBouncer connections
                + Admin connections

Example: (5 × 20 × 1.5) + 50 + 10 = 210
```

**Update RDS parameter group**:

```bash
# Create custom parameter group if not exists
aws rds create-db-parameter-group \
  --db-parameter-group-name hospital-erp-custom \
  --db-parameter-group-family postgres14 \
  --description "Custom params for Hospital ERP"

# Modify max_connections
aws rds modify-db-parameter-group \
  --db-parameter-group-name hospital-erp-custom \
  --parameters "ParameterName=max_connections,ParameterValue=250,ApplyMethod=pending-reboot"

# Apply parameter group to instance
aws rds modify-db-instance \
  --db-instance-identifier hospital-erp-prod \
  --db-parameter-group-name hospital-erp-custom \
  --apply-immediately
```

**Reboot RDS instance** (DOWNTIME REQUIRED):

```bash
aws rds reboot-db-instance \
  --db-instance-identifier hospital-erp-prod

# Monitor reboot
aws rds wait db-instance-available \
  --db-instance-identifier hospital-erp-prod
```

**Note**: Consider upgrading RDS instance class instead for better performance.

---

### Resolution 6: Add Read Replica for Load Distribution (30 minutes)

**When to use**: Read-heavy workload saturating primary

**Create RDS read replica**:

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier hospital-erp-prod-replica-1 \
  --source-db-instance-identifier hospital-erp-prod \
  --db-instance-class db.t3.medium \
  --availability-zone us-east-1b

# Wait for replica to be available
aws rds wait db-instance-available \
  --db-instance-identifier hospital-erp-prod-replica-1
```

**Deploy separate PgBouncer for read replica**:

```bash
# Create ConfigMap for read replica
kubectl create configmap pgbouncer-readonly-config \
  -n hospital-erp-system \
  --from-file=pgbouncer.ini=k8s/base/database/pgbouncer-readonly.ini

# Deploy read-only PgBouncer
kubectl apply -f k8s/base/database/pgbouncer-readonly-deployment.yaml
```

**Update application to use read replica**:

```typescript
// src/database/database.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,  // Primary (writes)
      // ... other config
    }),
    TypeOrmModule.forRoot({
      name: 'readonly',
      type: 'postgres',
      host: process.env.DB_READONLY_HOST,  // Replica (reads)
      // ... other config
    }),
  ],
})
export class DatabaseModule {}

// Use in repository
@InjectRepository(Patient, 'readonly')
private readonly readonlyPatientRepo: Repository<Patient>
```

---

## Verification Steps

After applying resolution:

1. **Test connection from backend**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  psql -h pgbouncer -p 5432 -U hospital_user -d hospital_db -c "\conninfo"

# Expected: "You are connected to database..."
```

2. **Check PgBouncer pool status**

```bash
kubectl exec -n hospital-erp-system deployment/pgbouncer -- \
  psql -h localhost -p 5432 -U pgbouncer -d pgbouncer -c "SHOW POOLS;"

# cl_waiting should be 0
```

3. **Monitor connection errors in Prometheus**

```promql
rate(database_connection_errors_total[5m])

# Should be 0
```

4. **Verify application logs**

```bash
kubectl logs -n hospital-erp-system -l app=backend --tail=50 | \
  grep -i -E "connection|database"

# Should show successful connections, no errors
```

---

## Escalation

If connection issues persist after 35 minutes:

1. **Engage database team**
   - Slack: `@database-team` in `#incidents`
   - Provide: PgBouncer logs, RDS metrics, connection counts

2. **Open AWS Support case** (if RDS issue suspected)
   - Severity: High (production impact)
   - Category: Database connectivity
   - Attach: RDS logs, enhanced monitoring data

3. **Notify stakeholders**
   - Engineering Manager
   - VP Engineering (if prolonged outage)

---

## Prevention

### Short-term (Implement within 24 hours)

1. **Set up connection pool monitoring**

```yaml
# Add Prometheus ServiceMonitor for PgBouncer
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: pgbouncer
spec:
  selector:
    matchLabels:
      app: pgbouncer
  endpoints:
    - port: metrics
```

2. **Configure connection pool alerts**

```yaml
alert: PgBouncerPoolExhaustion
expr: |
  pgbouncer_pools_cl_waiting > 5
for: 2m
labels:
  severity: warning
annotations:
  summary: 'PgBouncer pool saturated: {{ $value }} waiting clients'
```

### Long-term (Implement within 2 weeks)

1. **Implement connection retry logic**

```typescript
// src/database/database.config.ts
export const databaseConfig = {
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  autoLoadEntities: true,
};
```

2. **Add circuit breaker for database operations**
3. **Set up automated scaling for PgBouncer**
4. **Implement database query timeout enforcement**
5. **Regular connection pool audits**

---

## Related Documentation

- [High Error Rate Runbook](./high-error-rate.md)
- [Pod Crash Looping Runbook](./pod-crash-looping.md)
- [Architecture Overview](../architecture.md)
- [Configuration Reference](../configuration.md)

---

## Revision History

| Version | Date       | Author      | Changes         |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-01-24 | DevOps Team | Initial version |
