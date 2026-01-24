# Runbook: High Error Rate

## Overview

This runbook provides step-by-step procedures for investigating and resolving high error rates in the Hospital ERP System.

**Estimated Time**: 15-30 minutes
**Severity**: High
**Related Runbooks**: [High Response Time](./high-response-time.md), [Database Connection Issues](./database-connection-issues.md)

---

## Symptoms

- **Prometheus Alert**: `HighErrorRate` firing
- **User Impact**: Users experiencing failed requests, 5xx errors
- **Grafana Dashboard**: Error rate > 5% on "HTTP Errors" panel
- **Log Patterns**: Increased ERROR/CRITICAL level logs

---

## Impact

| Severity     | User Impact                                    | Business Impact                       |
| ------------ | ---------------------------------------------- | ------------------------------------- |
| **Critical** | Complete service failure, all requests failing | Revenue loss, reputation damage       |
| **High**     | Partial service degradation, > 10% error rate  | User frustration, potential data loss |
| **Medium**   | Intermittent errors, 5-10% error rate          | Reduced user satisfaction             |

---

## Detection

### Prometheus Query

```promql
# Error rate over 5-minute window
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m])) > 0.05
```

### Alert Definition

```yaml
# Located in k8s/monitoring/prometheus/alerts/backend-alerts.yaml
alert: HighErrorRate
expr: |
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m])) > 0.05
for: 2m
labels:
  severity: critical
annotations:
  summary: 'High error rate detected: {{ $value }}%'
```

---

## Investigation Steps

### Step 1: Verify the Alert (2 minutes)

1. **Check Grafana Dashboard**

```bash
# Open the dashboard
open https://grafana.hospital-erp.example.com/d/backend-overview
```

2. **Confirm error rate in Prometheus**

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090

# Query in browser: http://localhost:9090
# Run query:
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

3. **Identify affected endpoints**

```promql
# Top 5 endpoints with errors
topk(5, sum by (endpoint) (rate(http_requests_total{status=~"5.."}[5m])))
```

**Expected Output**:

```
/api/patients/search → 45 errors/min
/api/appointments/create → 12 errors/min
```

---

### Step 2: Check Backend Pod Health (3 minutes)

1. **List backend pods status**

```bash
kubectl get pods -n hospital-erp-system -l app=backend

# Expected output:
# NAME                       READY   STATUS    RESTARTS   AGE
# backend-7d9f8b5c6d-abcde   1/1     Running   0          2h
# backend-7d9f8b5c6d-fghij   1/1     Running   3          2h  ← High restarts!
```

2. **Check for CrashLoopBackOff or OOMKilled**

```bash
kubectl describe pods -n hospital-erp-system -l app=backend | grep -A 5 "State:"
```

3. **View recent pod events**

```bash
kubectl get events -n hospital-erp-system --field-selector involvedObject.kind=Pod --sort-by='.lastTimestamp' | tail -20
```

---

### Step 3: Analyze Logs (5 minutes)

1. **Tail backend logs for errors**

```bash
kubectl logs -n hospital-erp-system -l app=backend --tail=100 -f | grep -i error
```

2. **Check Loki for aggregated errors**

```bash
# Port-forward to Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Open: http://localhost:3000/explore
# LogQL query:
{app="backend"} |= "ERROR" | json | __error__="" | level="error"
```

3. **Search for common error patterns**

```logql
# Database connection errors
{app="backend"} |~ "connection refused|timeout|ECONNREFUSED"

# OOM errors
{app="backend"} |~ "out of memory|OOMKilled"

# Unhandled exceptions
{app="backend"} |~ "UnhandledPromiseRejection|TypeError|ReferenceError"
```

**Common Error Patterns**:

| Error Message                     | Likely Cause                | Action                                          |
| --------------------------------- | --------------------------- | ----------------------------------------------- |
| `ECONNREFUSED`                    | Database/Redis unavailable  | → Step 4 (Database)                             |
| `TimeoutError`                    | Slow query or network issue | → [High Response Time](./high-response-time.md) |
| `TypeError: Cannot read property` | Application bug             | → Rollback deployment                           |
| `OOMKilled`                       | Memory leak                 | → [Pod Crash Looping](./pod-crash-looping.md)   |

---

### Step 4: Check Database Connectivity (5 minutes)

1. **Test PgBouncer health**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- nc -zv pgbouncer 5432

# Expected: "pgbouncer (10.x.x.x:5432) open"
```

2. **Check PgBouncer connection pool**

```bash
kubectl logs -n hospital-erp-system -l app=pgbouncer --tail=50 | grep -E "pool|connection"
```

3. **Verify RDS connectivity from backend**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  psql -h pgbouncer -p 5432 -U hospital_user -d hospital_db -c "\conninfo"
```

**If connection fails**, see [Database Connection Issues](./database-connection-issues.md).

---

### Step 5: Check Redis Availability (3 minutes)

1. **Test Redis connectivity**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  redis-cli -h redis-ha -p 6379 ping

# Expected: "PONG"
```

2. **Check Redis memory usage**

```bash
kubectl exec -n hospital-erp-system -c redis statefulset/redis-ha-server-0 -- \
  redis-cli INFO memory | grep used_memory_human
```

3. **Monitor Redis errors**

```bash
kubectl logs -n hospital-erp-system statefulset/redis-ha-server-0 --tail=50 | grep -i error
```

---

### Step 6: Review Recent Deployments (2 minutes)

1. **Check recent rollouts**

```bash
kubectl rollout history deployment/backend -n hospital-erp-system

# Look for recent changes
```

2. **Compare current vs previous revision**

```bash
kubectl rollout history deployment/backend -n hospital-erp-system --revision=<CURRENT>
kubectl rollout history deployment/backend -n hospital-erp-system --revision=<PREVIOUS>
```

3. **Check ArgoCD sync status**

```bash
kubectl get applications -n argocd
```

---

## Resolution Procedures

### Resolution 1: Rollback Recent Deployment (5 minutes)

**When to use**: Recent deployment correlates with error spike

```bash
# Rollback to previous revision
kubectl rollout undo deployment/backend -n hospital-erp-system

# Monitor rollback progress
kubectl rollout status deployment/backend -n hospital-erp-system

# Verify error rate decreased
# (Check Grafana dashboard or Prometheus query)
```

**Expected Time**: 2-3 minutes for rollout completion

---

### Resolution 2: Scale Up Resources (3 minutes)

**When to use**: Pods under high load, CPU/memory saturation

```bash
# Increase replica count
kubectl scale deployment/backend -n hospital-erp-system --replicas=5

# Verify scaling
kubectl get pods -n hospital-erp-system -l app=backend

# Check if HPA needs adjustment
kubectl get hpa -n hospital-erp-system
```

---

### Resolution 3: Restart Unhealthy Pods (2 minutes)

**When to use**: Specific pods showing high restart count

```bash
# Delete unhealthy pod (will be recreated)
kubectl delete pod -n hospital-erp-system <POD_NAME>

# Monitor new pod startup
kubectl get pods -n hospital-erp-system -l app=backend -w
```

---

### Resolution 4: Fix Database Connection Pool (5 minutes)

**When to use**: PgBouncer connection pool exhausted

```bash
# Increase PgBouncer max connections
kubectl edit configmap pgbouncer-config -n hospital-erp-system

# Change:
# max_client_conn = 1000  → 2000
# default_pool_size = 25  → 50

# Restart PgBouncer
kubectl rollout restart deployment/pgbouncer -n hospital-erp-system
```

See [Database Connection Issues](./database-connection-issues.md) for details.

---

### Resolution 5: Clear Redis Cache (2 minutes)

**When to use**: Corrupted cache causing errors

```bash
# Flush Redis cache (use with caution!)
kubectl exec -n hospital-erp-system -c redis statefulset/redis-ha-server-0 -- \
  redis-cli FLUSHDB

# Restart backend to reconnect
kubectl rollout restart deployment/backend -n hospital-erp-system
```

**Warning**: This will clear all cached data. Performance may degrade temporarily.

---

## Verification Steps

After applying resolution:

1. **Monitor error rate for 5 minutes**

```promql
# Should drop below 1%
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

2. **Check Grafana dashboard**: Error rate panel should be green

3. **Verify pod stability**

```bash
kubectl get pods -n hospital-erp-system -l app=backend
# All pods should show "1/1 Running" with 0 restarts
```

4. **Test affected endpoints**

```bash
# Replace with actual affected endpoint
curl -I https://api.hospital-erp.example.com/api/patients/search
# Should return 200 OK
```

---

## Escalation

If error rate persists after 30 minutes:

1. **Page on-call engineer**
   - Use PagerDuty: `pd-alert --severity critical --service backend`

2. **Create incident in Slack**
   - Channel: `#incidents`
   - Template: "HIGH ERROR RATE: <error_rate>%, Affected: <endpoints>, Started: <timestamp>"

3. **Notify stakeholders**
   - Engineering Lead
   - Product Manager (if user-facing impact)

4. **Escalate to vendor support** (if third-party service issue)
   - AWS Support (RDS issues)
   - Redis Labs (Redis cluster issues)

---

## Prevention

### Short-term (Implement within 24 hours)

1. **Add circuit breaker pattern**

```typescript
// Example NestJS interceptor
@Injectable()
export class CircuitBreakerInterceptor {
  private failureCount = 0;
  private threshold = 10;

  intercept(context, next) {
    if (this.failureCount > this.threshold) {
      throw new ServiceUnavailableException('Circuit breaker open');
    }
    return next.handle().pipe(
      catchError((err) => {
        this.failureCount++;
        throw err;
      }),
    );
  }
}
```

2. **Increase health check frequency**

```yaml
# k8s/base/backend/deployment.yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  periodSeconds: 5 # ← Reduce from 10s
  failureThreshold: 2 # ← Reduce from 3
```

### Long-term (Implement within 1 week)

1. **Implement retry logic with exponential backoff**
2. **Add request rate limiting at ingress level**
3. **Set up synthetic monitoring** (e.g., Datadog Synthetics)
4. **Conduct chaos engineering tests** (e.g., Chaos Mesh pod failures)

---

## Related Documentation

- [High Response Time Runbook](./high-response-time.md)
- [Pod Crash Looping Runbook](./pod-crash-looping.md)
- [Database Connection Issues Runbook](./database-connection-issues.md)
- [Architecture Overview](../architecture.md)
- [Troubleshooting Guide](../troubleshooting.md)

---

## Revision History

| Version | Date       | Author      | Changes         |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-01-24 | DevOps Team | Initial version |
