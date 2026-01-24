# Runbook: Pod Crash Looping

## Overview

This runbook provides procedures for diagnosing and resolving pod crash loop issues in the Hospital ERP System.

**Estimated Time**: 15-30 minutes
**Severity**: Critical
**Related Runbooks**: [High Error Rate](./high-error-rate.md), [Database Connection Issues](./database-connection-issues.md)

---

## Symptoms

- **Kubernetes Event**: Pod in `CrashLoopBackOff` state
- **User Impact**: Service degradation or complete outage
- **Prometheus Alert**: `PodCrashLooping` firing
- **Log Patterns**: Repeated container restarts

---

## Impact

| Crash Pattern               | User Impact                              | Business Impact       |
| --------------------------- | ---------------------------------------- | --------------------- |
| **All replicas crashing**   | Complete service outage                  | Critical revenue loss |
| **Partial replica crashes** | Degraded performance, some requests fail | User frustration      |
| **Single pod crashing**     | Minimal impact, reduced capacity         | Monitoring alert only |

---

## Detection

### Kubernetes Status Check

```bash
kubectl get pods -n hospital-erp-system

# Output showing crash loop:
# NAME                       READY   STATUS             RESTARTS   AGE
# backend-7d9f8b5c6d-abcde   0/1     CrashLoopBackOff   5          10m
```

### Prometheus Alert

```yaml
# Located in k8s/monitoring/prometheus/alerts/pod-alerts.yaml
alert: PodCrashLooping
expr: |
  rate(kube_pod_container_status_restarts_total[15m]) > 0
for: 5m
labels:
  severity: critical
annotations:
  summary: 'Pod {{ $labels.pod }} is crash looping'
```

---

## Investigation Steps

### Step 1: Identify Crashing Pods (2 minutes)

1. **List pods with crash loop status**

```bash
kubectl get pods -n hospital-erp-system --field-selector status.phase!=Running

# Expected output:
# NAME                       READY   STATUS             RESTARTS   AGE
# backend-7d9f8b5c6d-xyz     0/1     CrashLoopBackOff   8          15m
```

2. **Check restart count**

```bash
kubectl get pods -n hospital-erp-system -l app=backend \
  -o custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount

# High restart count indicates persistent issue
```

3. **View pod events**

```bash
kubectl describe pod <POD_NAME> -n hospital-erp-system | grep -A 20 "Events:"
```

**Common Event Messages**:
| Event Message | Meaning |
|---------------|---------|
| `Back-off restarting failed container` | Container crashes immediately after start |
| `OOMKilled` | Out of memory, container exceeded memory limit |
| `Error: ImagePullBackOff` | Cannot pull container image |
| `CrashLoopBackOff` | Container exits with non-zero code repeatedly |

---

### Step 2: Examine Container Logs (5 minutes)

1. **View current pod logs**

```bash
kubectl logs -n hospital-erp-system <POD_NAME> --tail=100
```

2. **View logs from previous crash**

```bash
kubectl logs -n hospital-erp-system <POD_NAME> --previous --tail=200
```

**Most useful for crash diagnosis!**

3. **Stream logs in real-time**

```bash
kubectl logs -n hospital-erp-system <POD_NAME> -f
```

**Common Crash Patterns in Logs**:

| Log Message                          | Likely Cause                       | Action                    |
| ------------------------------------ | ---------------------------------- | ------------------------- |
| `Cannot connect to database`         | Database unreachable               | → Step 3 (Database)       |
| `Error: Cannot find module`          | Missing npm dependency             | → Resolution 3            |
| `EADDRINUSE: address already in use` | Port conflict in config            | → Resolution 4            |
| `JavaScript heap out of memory`      | Memory leak or insufficient memory | → Resolution 5            |
| `UnhandledPromiseRejection`          | Application bug                    | → Resolution 6 (Rollback) |
| `Permission denied`                  | RBAC or file permission issue      | → Step 4                  |
| `Secret not found`                   | Missing Kubernetes secret          | → Resolution 2            |

---

### Step 3: Check Database and Dependencies (5 minutes)

1. **Test database connectivity**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  nc -zv pgbouncer 5432

# Expected: "pgbouncer (10.x.x.x:5432) open"
```

2. **Verify PgBouncer health**

```bash
kubectl get pods -n hospital-erp-system -l app=pgbouncer

# All pods should be "Running"
```

3. **Test Redis connectivity**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  nc -zv redis-ha 6379

# Expected: "redis-ha (10.x.x.x:6379) open"
```

4. **Check service endpoints**

```bash
kubectl get endpoints -n hospital-erp-system pgbouncer redis-ha

# Endpoints should show IP addresses
```

See [Database Connection Issues](./database-connection-issues.md) for troubleshooting.

---

### Step 4: Validate Configuration (5 minutes)

1. **Check ConfigMap**

```bash
kubectl get configmap backend-config -n hospital-erp-system -o yaml
```

**Validate critical keys**:

```yaml
data:
  DATABASE_HOST: 'pgbouncer' # ✓ Correct service name
  DATABASE_PORT: '5432' # ✓ Correct port
  REDIS_HOST: 'redis-ha' # ✓ Correct service name
  NODE_ENV: 'production' # ✓ Valid environment
```

2. **Verify Secrets exist**

```bash
kubectl get secrets -n hospital-erp-system

# Check for required secrets:
# - database-credentials
# - redis-password
# - jwt-secret
```

3. **Inspect pod environment variables**

```bash
kubectl exec -n hospital-erp-system <POD_NAME> -- env | grep -E "DATABASE|REDIS|NODE"
```

4. **Check RBAC permissions**

```bash
kubectl describe serviceaccount backend -n hospital-erp-system
kubectl get rolebindings -n hospital-erp-system | grep backend
```

---

### Step 5: Analyze Resource Limits (3 minutes)

1. **Check pod resource usage**

```bash
kubectl top pod <POD_NAME> -n hospital-erp-system

# Compare to limits:
kubectl describe pod <POD_NAME> -n hospital-erp-system | grep -A 5 "Limits:"
```

2. **Check for OOMKill events**

```bash
kubectl get events -n hospital-erp-system --field-selector reason=OOMKilling

# Or in pod description
kubectl describe pod <POD_NAME> -n hospital-erp-system | grep -i oom
```

3. **Review memory trends in Grafana**

```bash
open https://grafana.hospital-erp.example.com/d/pod-resources
```

**Prometheus Query**:

```promql
# Memory usage vs limit
container_memory_usage_bytes{pod="<POD_NAME>"}
/
container_spec_memory_limit_bytes{pod="<POD_NAME>"} * 100
```

---

### Step 6: Review Recent Changes (5 minutes)

1. **Check deployment history**

```bash
kubectl rollout history deployment/backend -n hospital-erp-system

# Compare current vs previous revision
kubectl rollout history deployment/backend -n hospital-erp-system --revision=<CURRENT>
kubectl rollout history deployment/backend -n hospital-erp-system --revision=<PREVIOUS>
```

2. **Review ArgoCD application status**

```bash
kubectl get application backend -n argocd -o yaml
```

3. **Check recent Git commits**

```bash
# In your application repository
git log --oneline -10 --graph
```

---

## Resolution Procedures

### Resolution 1: Fix Database Connection (5 minutes)

**When to use**: Logs show database connection errors

```bash
# Verify database service is running
kubectl get svc pgbouncer -n hospital-erp-system

# Check service endpoints
kubectl get endpoints pgbouncer -n hospital-erp-system

# If endpoints are empty, check PgBouncer deployment
kubectl get pods -l app=pgbouncer -n hospital-erp-system

# Restart PgBouncer if needed
kubectl rollout restart deployment/pgbouncer -n hospital-erp-system
```

**Update connection string if incorrect**:

```bash
kubectl edit configmap backend-config -n hospital-erp-system

# Ensure:
# DATABASE_HOST: "pgbouncer.hospital-erp-system.svc.cluster.local"
# Or simply: "pgbouncer" (same namespace)
```

---

### Resolution 2: Create Missing Secrets (3 minutes)

**When to use**: Logs show "Secret not found" or permission errors

```bash
# List current secrets
kubectl get secrets -n hospital-erp-system

# Create missing database secret
kubectl create secret generic database-credentials \
  -n hospital-erp-system \
  --from-literal=username=hospital_user \
  --from-literal=password=<PASSWORD>

# Verify secret was created
kubectl get secret database-credentials -n hospital-erp-system -o yaml
```

**For production, use AWS Secrets Manager**:

```bash
# Install External Secrets Operator
kubectl apply -f k8s/base/secrets/external-secret.yaml

# Verify sync
kubectl get externalsecret -n hospital-erp-system
```

---

### Resolution 3: Fix Missing Dependencies (10 minutes)

**When to use**: `Cannot find module` error in logs

**Rebuild container image**:

```bash
# In application repository
cd apps/backend

# Ensure dependencies are in package.json
npm install --save <missing-package>

# Update package-lock.json
npm install

# Commit and push
git add package.json package-lock.json
git commit -m "fix(deps): add missing dependency"
git push origin main

# Rebuild image (CI/CD will trigger)
# Or manually:
docker build -t hospital-erp/backend:v1.2.3 .
docker push hospital-erp/backend:v1.2.3

# Update Kustomize image tag
cd ../../k8s/overlays/production
kustomize edit set image hospital-erp/backend:v1.2.3

# ArgoCD will auto-sync
```

---

### Resolution 4: Fix Port Configuration (3 minutes)

**When to use**: `EADDRINUSE: address already in use` error

```bash
kubectl edit configmap backend-config -n hospital-erp-system

# Ensure port matches container port:
data:
  PORT: "3000"  # Must match deployment containerPort
```

**Verify deployment configuration**:

```bash
kubectl get deployment backend -n hospital-erp-system -o yaml | grep -A 3 ports:

# Should show:
# ports:
# - containerPort: 3000
#   protocol: TCP
```

---

### Resolution 5: Increase Memory Limit (5 minutes)

**When to use**: OOMKilled events, `heap out of memory` errors

```bash
kubectl edit deployment backend -n hospital-erp-system
```

**Update resources**:

```yaml
resources:
  requests:
    memory: "512Mi"  → "1Gi"
  limits:
    memory: "1Gi"    → "2Gi"
```

**For Node.js apps, also increase heap size**:

```bash
kubectl edit configmap backend-config -n hospital-erp-system

# Add:
data:
  NODE_OPTIONS: "--max-old-space-size=1536"  # 1.5GB
```

**Monitor pod after restart**:

```bash
kubectl get pods -n hospital-erp-system -l app=backend -w
```

---

### Resolution 6: Rollback to Previous Version (5 minutes)

**When to use**: Recent deployment introduced crash, no quick fix available

```bash
# Rollback deployment
kubectl rollout undo deployment/backend -n hospital-erp-system

# Monitor rollback progress
kubectl rollout status deployment/backend -n hospital-erp-system

# Verify pods are running
kubectl get pods -n hospital-erp-system -l app=backend
```

**Or rollback to specific revision**:

```bash
# Find working revision
kubectl rollout history deployment/backend -n hospital-erp-system

# Rollback to revision 3
kubectl rollout undo deployment/backend -n hospital-erp-system --to-revision=3
```

**Pause ArgoCD auto-sync to prevent re-deploy**:

```bash
kubectl patch application backend -n argocd \
  --type merge -p '{"spec":{"syncPolicy":{"automated":null}}}'
```

---

### Resolution 7: Fix RBAC Permissions (5 minutes)

**When to use**: `Permission denied` errors, cannot access Kubernetes resources

```bash
# View current ServiceAccount
kubectl get serviceaccount backend -n hospital-erp-system

# Check RoleBinding
kubectl get rolebinding backend-role-binding -n hospital-erp-system -o yaml
```

**Create missing RoleBinding**:

```yaml
# k8s/base/rbac/rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-role-binding
  namespace: hospital-erp-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: backend-role
subjects:
  - kind: ServiceAccount
    name: backend
    namespace: hospital-erp-system
```

```bash
kubectl apply -f k8s/base/rbac/rolebinding.yaml
```

---

## Verification Steps

After applying resolution:

1. **Wait for pod to stabilize (3-5 minutes)**

```bash
kubectl get pods -n hospital-erp-system -l app=backend -w

# Wait until:
# NAME                       READY   STATUS    RESTARTS   AGE
# backend-7d9f8b5c6d-new     1/1     Running   0          2m
```

2. **Verify restart count stopped increasing**

```bash
# Wait 5 minutes, then check:
kubectl get pods -n hospital-erp-system -l app=backend

# RESTARTS should remain 0
```

3. **Check pod logs for errors**

```bash
kubectl logs -n hospital-erp-system -l app=backend --tail=50

# Should show healthy startup logs, no errors
```

4. **Test application health endpoint**

```bash
kubectl exec -n hospital-erp-system deployment/backend -- \
  curl -f http://localhost:3000/health

# Should return: {"status":"ok"}
```

5. **Monitor Prometheus alert**

```bash
# Alert should resolve
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open http://localhost:9090/alerts
```

---

## Escalation

If crash loop persists after 30 minutes:

1. **Capture debugging information**

```bash
# Collect all relevant logs and events
kubectl logs -n hospital-erp-system <POD_NAME> --previous > crash-logs.txt
kubectl describe pod <POD_NAME> -n hospital-erp-system > pod-describe.txt
kubectl get events -n hospital-erp-system --sort-by='.lastTimestamp' > events.txt
```

2. **Create incident**
   - Slack: Post in `#incidents` channel
   - Template: "POD CRASH LOOP: <pod_name>, Restarts: <count>, Started: <timestamp>"

3. **Page on-call engineer**

```bash
pd-alert --severity critical --service backend --message "Pod crash loop unresolved after 30min"
```

4. **Engage application team**
   - Backend team lead
   - Application architect (if architectural issue)

---

## Prevention

### Short-term (Implement within 24 hours)

1. **Add startup probe** (prevent premature traffic)

```yaml
# k8s/base/backend/deployment.yaml
startupProbe:
  httpGet:
    path: /health
    port: 3000
  failureThreshold: 30
  periodSeconds: 10
```

2. **Increase readiness probe initial delay**

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 30 # Give app time to initialize
  periodSeconds: 10
```

### Long-term (Implement within 1 week)

1. **Implement graceful shutdown**

```typescript
// src/main.ts
async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully`);
  await app.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

2. **Add container lifecycle hooks**

```yaml
lifecycle:
  preStop:
    exec:
      command: ['/bin/sh', '-c', 'sleep 15'] # Delay for connection draining
```

3. **Implement dependency health checks at startup**

```typescript
// src/health/health.controller.ts
@Get('/health/startup')
async checkStartup() {
  await this.databaseService.ping();
  await this.redisService.ping();
  return { status: 'ok' };
}
```

4. **Set up automated testing in CI**
   - Integration tests with dependencies
   - Load testing before production deploy

---

## Related Documentation

- [High Error Rate Runbook](./high-error-rate.md)
- [Database Connection Issues Runbook](./database-connection-issues.md)
- [Architecture Overview](../architecture.md)
- [Deployment Guide](../deployment-guide.md)

---

## Revision History

| Version | Date       | Author      | Changes         |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-01-24 | DevOps Team | Initial version |
