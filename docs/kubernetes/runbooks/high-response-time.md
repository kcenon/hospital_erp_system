# Runbook: High Response Time

## Overview

This runbook provides procedures for investigating and resolving high response time issues in the Hospital ERP System.

**Estimated Time**: 20-40 minutes
**Severity**: High
**Related Runbooks**: [High Error Rate](./high-error-rate.md), [Database Connection Issues](./database-connection-issues.md), [Scaling Procedures](./scaling-procedures.md)

---

## Symptoms

- **Prometheus Alert**: `HighResponseTime` firing
- **User Impact**: Slow page loads, API timeouts
- **Grafana Dashboard**: P95 latency > 2s on "Response Time" panel
- **APM Traces**: Long-running transactions

---

## Impact

| Latency (P95)  | User Experience                 | Action Required            |
| -------------- | ------------------------------- | -------------------------- |
| **< 500ms**    | Excellent, no action            | None                       |
| **500ms - 1s** | Good, monitor                   | Investigate if trending up |
| **1s - 2s**    | Degraded, users notice slowness | Investigate immediately    |
| **> 2s**       | Poor, timeouts likely           | Critical investigation     |
| **> 5s**       | Severe, user frustration        | Immediate escalation       |

---

## Detection

### Prometheus Query

```promql
# P95 response time over 2 seconds
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
) > 2
```

### Alert Definition

```yaml
# Located in k8s/monitoring/prometheus/alerts/backend-alerts.yaml
alert: HighResponseTime
expr: |
  histogram_quantile(0.95,
    sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
  ) > 2
for: 5m
labels:
  severity: warning
annotations:
  summary: 'High response time: {{ $value }}s (P95)'
```

---

## Investigation Steps

### Step 1: Identify Slow Endpoints (5 minutes)

1. **Check Grafana dashboard for slow endpoints**

```bash
open https://grafana.hospital-erp.example.com/d/backend-performance
```

2. **Query slowest endpoints in Prometheus**

```promql
# Top 10 slowest endpoints (P95)
topk(10,
  histogram_quantile(0.95,
    sum(rate(http_request_duration_seconds_bucket[5m])) by (endpoint, le)
  )
)
```

**Expected Output**:

```
/api/patients/search → 8.5s
/api/reports/generate → 4.2s
/api/appointments/list → 2.1s
```

3. **Analyze traffic distribution**

```promql
# Request rate by endpoint
sum(rate(http_requests_total[5m])) by (endpoint)
```

---

### Step 2: Check Resource Utilization (5 minutes)

1. **CPU usage per pod**

```bash
kubectl top pods -n hospital-erp-system -l app=backend

# Expected output:
# NAME                       CPU(cores)   MEMORY(bytes)
# backend-7d9f8b5c6d-abcde   450m         512Mi
# backend-7d9f8b5c6d-fghij   920m         768Mi  ← High CPU!
```

2. **Memory usage trends**

```promql
# Memory usage percentage
container_memory_usage_bytes{pod=~"backend.*"}
/
container_spec_memory_limit_bytes{pod=~"backend.*"} * 100
```

3. **Check for CPU throttling**

```promql
# CPU throttling ratio
rate(container_cpu_cfs_throttled_seconds_total{pod=~"backend.*"}[5m])
```

**Interpretation**:

- **CPU > 80%**: Scale up replicas or increase CPU limits
- **Memory > 80%**: Possible memory leak, check for GC pressure
- **Throttling > 0**: Increase CPU limits

---

### Step 3: Analyze Database Performance (10 minutes)

1. **Check database query performance**

```bash
# Execute slow query log analysis on RDS
# (This requires RDS CLI access or Console)
aws rds describe-db-log-files \
  --db-instance-identifier hospital-erp-prod \
  --filename-contains slowquery
```

2. **Monitor PgBouncer latency**

```bash
kubectl logs -n hospital-erp-system -l app=pgbouncer --tail=100 | \
  grep -E "query_time|transaction_time"
```

3. **Check active database connections**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  psql -h pgbouncer -p 5432 -U hospital_user -d hospital_db -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

**Expected Output**:

```
 count
-------
    15  ← Should be < 50
```

4. **Identify long-running queries**

```sql
-- Execute via kubectl exec
SELECT
  pid,
  now() - query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC
LIMIT 10;
```

**Common Slow Query Patterns**:

| Query Pattern                                             | Likely Cause                      | Action                      |
| --------------------------------------------------------- | --------------------------------- | --------------------------- |
| `SELECT * FROM patients WHERE name LIKE '%search%'`       | Full table scan, missing index    | Add index on `name` column  |
| `SELECT * FROM appointments WHERE created_at BETWEEN ...` | No index on date column           | Add index on `created_at`   |
| `JOIN patients p, appointments a, doctors d ...`          | Large join without proper indexes | Optimize query with indexes |

---

### Step 4: Check Redis Performance (5 minutes)

1. **Monitor Redis latency**

```bash
kubectl exec -n hospital-erp-system -c redis statefulset/redis-ha-server-0 -- \
  redis-cli --latency-history
```

**Expected Output**:

```
min: 0, max: 1, avg: 0.15 (96 samples)  ← Should be < 1ms
```

2. **Check cache hit rate**

```bash
kubectl exec -n hospital-erp-system -c redis statefulset/redis-ha-server-0 -- \
  redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"
```

**Calculate hit rate**:

```
Hit Rate = keyspace_hits / (keyspace_hits + keyspace_misses)
Target: > 80%
```

3. **Identify slow commands**

```bash
kubectl exec -n hospital-erp-system -c redis statefulset/redis-ha-server-0 -- \
  redis-cli SLOWLOG GET 10
```

---

### Step 5: Review Network Performance (5 minutes)

1. **Check pod-to-pod latency**

```bash
# Test from backend to PgBouncer
kubectl exec -n hospital-erp-system deployment/backend -- \
  time nc -zv pgbouncer 5432
```

2. **Test DNS resolution time**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  time nslookup pgbouncer.hospital-erp-system.svc.cluster.local
```

3. **Check Network Policy restrictions**

```bash
kubectl get networkpolicies -n hospital-erp-system
kubectl describe networkpolicy backend-network-policy -n hospital-erp-system
```

---

### Step 6: Examine Application Logs (5 minutes)

1. **Search for slow operations in logs**

```bash
kubectl logs -n hospital-erp-system -l app=backend --tail=200 | \
  grep -E "slow|timeout|duration"
```

2. **Query Loki for slow transactions**

```logql
{app="backend"}
| json
| duration > 2000  # > 2 seconds
| line_format "{{.method}} {{.path}} took {{.duration}}ms"
```

3. **Check for N+1 query patterns**

```logql
{app="backend"} |~ "SELECT.*FROM.*WHERE.*IN"
```

---

## Resolution Procedures

### Resolution 1: Add Database Indexes (15 minutes)

**When to use**: Identified slow queries due to missing indexes

```bash
# Connect to database via PgBouncer
kubectl exec -it -n hospital-erp-system deployment/backend -- \
  psql -h pgbouncer -p 5432 -U hospital_user -d hospital_db
```

```sql
-- Example: Add index on frequently searched column
CREATE INDEX CONCURRENTLY idx_patients_name_trgm
ON patients USING gin (name gin_trgm_ops);

-- Example: Composite index for date range queries
CREATE INDEX CONCURRENTLY idx_appointments_patient_date
ON appointments (patient_id, appointment_date DESC);

-- Verify index usage
EXPLAIN ANALYZE
SELECT * FROM patients WHERE name ILIKE '%john%';
```

**Note**: `CONCURRENTLY` prevents table locking during index creation.

**Verification**:

```sql
-- Check query plan uses index
EXPLAIN SELECT * FROM patients WHERE name ILIKE '%john%';
-- Should show "Index Scan" instead of "Seq Scan"
```

---

### Resolution 2: Optimize Application Code (Variable time)

**When to use**: N+1 queries or inefficient data fetching

**Example: Fix N+1 Query**

```typescript
// Before (N+1 query)
const patients = await this.patientRepository.find();
for (const patient of patients) {
  patient.appointments = await this.appointmentRepository.findByPatientId(patient.id);
}

// After (Single query with join)
const patients = await this.patientRepository
  .createQueryBuilder('patient')
  .leftJoinAndSelect('patient.appointments', 'appointment')
  .getMany();
```

**Deploy fix**:

```bash
# Commit changes to repository
git add src/patients/patients.service.ts
git commit -m "fix(patients): resolve N+1 query in patient listing"
git push origin feature/optimize-patient-queries

# ArgoCD will auto-deploy
kubectl get applications -n argocd
```

---

### Resolution 3: Increase Cache TTL (5 minutes)

**When to use**: Low cache hit rate, frequent cache misses

```typescript
// Update cache TTL in backend configuration
// src/config/cache.config.ts
export const cacheConfig = {
  ttl: 3600, // Increase from 300s to 1 hour
  max: 1000, // Increase cache size
};
```

**Or update ConfigMap**:

```bash
kubectl edit configmap backend-config -n hospital-erp-system

# Update:
# CACHE_TTL: "3600"
# CACHE_MAX_SIZE: "1000"

# Restart backend to apply
kubectl rollout restart deployment/backend -n hospital-erp-system
```

---

### Resolution 4: Scale Up Resources (5 minutes)

**When to use**: CPU/Memory saturation

**Option A: Increase CPU/Memory Limits**

```bash
kubectl edit deployment backend -n hospital-erp-system

# Update resources:
resources:
  requests:
    cpu: "500m"    → "1000m"
    memory: "512Mi" → "1Gi"
  limits:
    cpu: "1000m"   → "2000m"
    memory: "1Gi"   → "2Gi"
```

**Option B: Scale Horizontally**

```bash
# Increase replicas
kubectl scale deployment/backend -n hospital-erp-system --replicas=5

# Or update HPA
kubectl edit hpa backend-hpa -n hospital-erp-system
# maxReplicas: 3 → 5
```

See [Scaling Procedures](./scaling-procedures.md) for details.

---

### Resolution 5: Optimize PgBouncer Settings (10 minutes)

**When to use**: Database connection pool exhaustion

```bash
kubectl edit configmap pgbouncer-config -n hospital-erp-system
```

**Recommended Settings**:

```ini
[pgbouncer]
pool_mode = transaction  # Use transaction pooling
max_client_conn = 2000   # Increase from 1000
default_pool_size = 50   # Increase from 25
reserve_pool_size = 10   # Add reserve pool
max_db_connections = 100 # Increase from 50

# Performance tuning
server_idle_timeout = 600
query_timeout = 30
```

**Restart PgBouncer**:

```bash
kubectl rollout restart deployment/pgbouncer -n hospital-erp-system
kubectl rollout status deployment/pgbouncer -n hospital-erp-system
```

---

### Resolution 6: Implement Request Caching (20 minutes)

**When to use**: Repeated identical requests

**Add HTTP caching middleware**:

```typescript
// src/common/interceptors/cache.interceptor.ts
import { CacheInterceptor, ExecutionContext } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') return undefined;

    // Cache key includes query params
    return `${method}:${url}`;
  }
}

// Apply globally
@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpCacheInterceptor }],
})
export class AppModule {}
```

---

## Verification Steps

After applying resolution:

1. **Monitor response time for 10 minutes**

```promql
# P95 latency should drop below 1s
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

2. **Check affected endpoints**

```bash
# Re-run slow endpoint query
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Then query in Prometheus UI
```

3. **Load test to confirm improvement**

```bash
# Example using k6
k6 run --vus 100 --duration 60s load-tests/api-test.js
```

4. **Verify resource utilization stabilized**

```bash
kubectl top pods -n hospital-erp-system -l app=backend
```

---

## Escalation

If response time remains high after 40 minutes:

1. **Engage Database Team**
   - Slack: `@database-team` in `#incidents`
   - Escalation path: Database Admin → Senior DBA

2. **Contact AWS Support** (if RDS performance issue)
   - Open AWS Support ticket
   - Priority: High
   - Issue: Database performance degradation

3. **Notify Stakeholders**
   - Engineering Manager
   - Product Owner (if user-facing)
   - CTO (if critical severity)

---

## Prevention

### Short-term (Implement within 48 hours)

1. **Set up query performance monitoring**

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

2. **Add slow query logging**

```yaml
# RDS Parameter Group
log_min_duration_statement: 1000 # Log queries > 1s
```

3. **Implement request timeout**

```typescript
// src/main.ts
app.use(timeout('10s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});
```

### Long-term (Implement within 2 weeks)

1. **Database connection pooling optimization**
   - Analyze connection usage patterns
   - Right-size PgBouncer pool settings

2. **Implement read replicas**
   - Offload read-heavy queries to RDS read replicas
   - Use routing logic: writes → primary, reads → replicas

3. **Add APM tracing** (e.g., OpenTelemetry, Datadog APM)
   - Distributed tracing across services
   - Automatic slow transaction detection

4. **Database query review process**
   - Require EXPLAIN ANALYZE for new queries
   - Pre-production performance testing

---

## Related Documentation

- [High Error Rate Runbook](./high-error-rate.md)
- [Database Connection Issues Runbook](./database-connection-issues.md)
- [Scaling Procedures Runbook](./scaling-procedures.md)
- [Architecture Overview](../architecture.md)
- [Configuration Reference](../configuration.md)

---

## Revision History

| Version | Date       | Author      | Changes         |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-01-24 | DevOps Team | Initial version |
