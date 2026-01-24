# Runbook: Scaling Procedures

## Overview

This runbook provides procedures for scaling the Hospital ERP System components, both manually and automatically.

**Estimated Time**: 5-20 minutes (manual), 0 minutes (auto-scaling)
**Severity**: Varies (performance optimization)
**Related Runbooks**: [High Response Time](./high-response-time.md), [High Error Rate](./high-error-rate.md)

---

## When to Scale

### Indicators for Scaling Up

| Metric                   | Threshold                  | Action                                   |
| ------------------------ | -------------------------- | ---------------------------------------- |
| **CPU Usage**            | > 70% sustained for 5+ min | Scale up replicas or increase CPU limits |
| **Memory Usage**         | > 80% sustained            | Increase memory limits or replicas       |
| **Response Time**        | P95 > 2s                   | Scale up backend replicas                |
| **Error Rate**           | > 5% due to timeouts       | Scale up immediately                     |
| **Request Rate**         | Approaching capacity       | Pre-emptive scaling                      |
| **Database Connections** | > 80% of pool size         | Scale up backend and PgBouncer           |

### Indicators for Scaling Down

| Metric           | Threshold               | Action                            |
| ---------------- | ----------------------- | --------------------------------- |
| **CPU Usage**    | < 30% for 30+ min       | Scale down replicas to save costs |
| **Request Rate** | Significantly decreased | Reduce replicas                   |
| **Memory Usage** | < 40% consistently      | Reduce memory limits              |

---

## Auto-Scaling (HPA)

### Current HPA Configuration

1. **View existing HPAs**

```bash
kubectl get hpa -n hospital-erp-system

# Expected output:
# NAME          REFERENCE            TARGETS         MINPODS   MAXPODS   REPLICAS
# backend-hpa   Deployment/backend   45%/70%         1         3         2
# frontend-hpa  Deployment/frontend  30%/70%         1         3         1
```

2. **Describe HPA details**

```bash
kubectl describe hpa backend-hpa -n hospital-erp-system
```

**Expected Behavior**:

- **Target CPU**: 70%
- **Min Replicas**: 1
- **Max Replicas**: 3
- **Scale up**: When CPU > 70% for 3 minutes
- **Scale down**: When CPU < 70% for 5 minutes

---

### Modify HPA Settings

**Increase max replicas for high traffic**:

```bash
kubectl edit hpa backend-hpa -n hospital-erp-system
```

```yaml
spec:
  minReplicas: 1    → 2 # Increase minimum
  maxReplicas: 3    → 5 # Increase maximum
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  → 60 # More aggressive scaling
```

**Or use kubectl patch**:

```bash
kubectl patch hpa backend-hpa -n hospital-erp-system \
  --type='json' \
  -p='[
    {"op": "replace", "path": "/spec/maxReplicas", "value": 5},
    {"op": "replace", "path": "/spec/minReplicas", "value": 2}
  ]'
```

**Verify changes**:

```bash
kubectl get hpa backend-hpa -n hospital-erp-system
```

---

### Add Memory-Based Scaling

**Edit HPA to include memory metric**:

```bash
kubectl edit hpa backend-hpa -n hospital-erp-system
```

```yaml
spec:
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    # Add memory metric
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

**Scale on either CPU OR memory threshold reached**.

---

### Custom Metrics Scaling (Advanced)

**Scale based on request rate**:

```yaml
# Requires Prometheus Adapter installed
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa-custom
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: '1000' # Scale when > 1000 req/s per pod
```

**Apply custom HPA**:

```bash
kubectl apply -f k8s/monitoring/hpa/backend-hpa-custom.yaml
```

---

## Manual Scaling

### Backend Scaling

**Scale backend deployment**:

```bash
# Scale to specific replica count
kubectl scale deployment/backend -n hospital-erp-system --replicas=5

# Verify scaling
kubectl get deployment backend -n hospital-erp-system

# Monitor rollout
kubectl rollout status deployment/backend -n hospital-erp-system

# Watch pod creation
kubectl get pods -n hospital-erp-system -l app=backend -w
```

**Expected Time**: 30-60 seconds per new pod

**Verify traffic distribution**:

```bash
# Check service endpoints
kubectl get endpoints backend -n hospital-erp-system

# Should list all pod IPs
```

---

### Frontend Scaling

**Scale frontend deployment**:

```bash
kubectl scale deployment/frontend -n hospital-erp-system --replicas=4

# Verify
kubectl get deployment frontend -n hospital-erp-system

# Monitor
kubectl get pods -n hospital-erp-system -l app=frontend -w
```

---

### PgBouncer Scaling

**Scale PgBouncer for high database load**:

```bash
kubectl scale deployment/pgbouncer -n hospital-erp-system --replicas=3

# Verify
kubectl get deployment pgbouncer -n hospital-erp-system
```

**Important**: Ensure total connections don't exceed RDS `max_connections`.

**Calculate safe replica count**:

```
Max PgBouncer replicas = RDS max_connections / (default_pool_size + reserve_pool_size)

Example: 200 / (50 + 10) = 3 replicas max
```

---

## Vertical Scaling (Resource Limits)

### Increase CPU/Memory Limits

**Edit deployment to increase resources**:

```bash
kubectl edit deployment backend -n hospital-erp-system
```

```yaml
spec:
  template:
    spec:
      containers:
      - name: backend
        resources:
          requests:
            cpu: "500m"     → "1000m"   # 1 core
            memory: "512Mi" → "1Gi"     # 1GB
          limits:
            cpu: "1000m"    → "2000m"   # 2 cores
            memory: "1Gi"   → "2Gi"     # 2GB
```

**Apply changes**:

```bash
# Kubernetes will perform rolling update
kubectl rollout status deployment/backend -n hospital-erp-system
```

**Or use kubectl set resources**:

```bash
kubectl set resources deployment/backend -n hospital-erp-system \
  --limits=cpu=2000m,memory=2Gi \
  --requests=cpu=1000m,memory=1Gi
```

**Warning**: This triggers a rolling restart of all pods.

---

### Verify Resource Changes

1. **Check pod resource allocation**

```bash
kubectl describe pod <POD_NAME> -n hospital-erp-system | grep -A 10 "Limits:"
```

2. **Monitor actual usage**

```bash
kubectl top pod <POD_NAME> -n hospital-erp-system

# Compare to limits
```

3. **Check for CPU throttling**

```promql
# Prometheus query
rate(container_cpu_cfs_throttled_seconds_total{pod="<POD_NAME>"}[5m])

# Should be 0 (no throttling)
```

---

## Cluster Auto-Scaling

### Enable Cluster Autoscaler (if not enabled)

**For AWS EKS**:

```bash
# Deploy Cluster Autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Configure for your cluster
kubectl -n kube-system edit deployment cluster-autoscaler
```

```yaml
spec:
  template:
    spec:
      containers:
        - command:
            - ./cluster-autoscaler
            - --cloud-provider=aws
            - --namespace=kube-system
            - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/<CLUSTER_NAME>
            - --balance-similar-node-groups
            - --skip-nodes-with-system-pods=false
```

**Verify Cluster Autoscaler is running**:

```bash
kubectl get pods -n kube-system -l app=cluster-autoscaler
```

---

### Trigger Node Scaling

**Cluster Autoscaler automatically adds nodes when**:

- Pods are pending due to insufficient resources
- Current nodes cannot accommodate requested CPU/Memory

**Force node scaling** (by creating high-resource pod):

```yaml
# test-scale-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-scale-trigger
  namespace: hospital-erp-system
spec:
  containers:
    - name: stress
      image: nginx
      resources:
        requests:
          cpu: '4' # Request 4 cores
          memory: '8Gi' # Request 8GB
```

```bash
kubectl apply -f test-scale-pod.yaml

# Watch node creation
kubectl get nodes -w

# Clean up after testing
kubectl delete pod test-scale-trigger -n hospital-erp-system
```

---

## Scaling Verification

### Post-Scaling Checks

1. **Verify all pods are running**

```bash
kubectl get pods -n hospital-erp-system

# All pods should show "Running" status
```

2. **Check pod distribution across nodes**

```bash
kubectl get pods -n hospital-erp-system -o wide

# Pods should be distributed across multiple nodes
```

3. **Monitor resource usage after scaling**

```bash
kubectl top pods -n hospital-erp-system -l app=backend

# CPU and memory should decrease per pod
```

4. **Test application response time**

```bash
# Run load test
k6 run --vus 200 --duration 60s load-tests/api-test.js

# Check Grafana dashboard
open https://grafana.hospital-erp.example.com/d/backend-performance
```

5. **Verify error rate**

```promql
# Prometheus query
rate(http_requests_total{status=~"5.."}[5m])
/
rate(http_requests_total[5m])

# Should be < 1%
```

---

## Scaling Down Procedure

### Safe Scale-Down Checklist

**Before scaling down**:

- [ ] Traffic is low (off-peak hours)
- [ ] No ongoing incidents
- [ ] CPU/Memory usage < 30% for 30+ minutes
- [ ] Error rate normal (< 1%)

### Manual Scale-Down

```bash
# Scale down backend
kubectl scale deployment/backend -n hospital-erp-system --replicas=2

# Monitor for 10 minutes
kubectl get pods -n hospital-erp-system -l app=backend -w

# Check metrics
kubectl top pods -n hospital-erp-system -l app=backend

# If CPU > 70%, scale back up
kubectl scale deployment/backend -n hospital-erp-system --replicas=3
```

### Gradual Scale-Down

**For large scale-downs, use gradual approach**:

```bash
# Current: 10 replicas, Target: 3 replicas
# Step 1: 10 → 7
kubectl scale deployment/backend -n hospital-erp-system --replicas=7
sleep 300  # Wait 5 minutes

# Step 2: 7 → 5
kubectl scale deployment/backend -n hospital-erp-system --replicas=5
sleep 300

# Step 3: 5 → 3
kubectl scale deployment/backend -n hospital-erp-system --replicas=3
```

**Monitor between each step**:

```bash
kubectl top pods -n hospital-erp-system -l app=backend
```

---

## Rollback Scaling Changes

### Undo Recent Scaling

**If scaling causes issues**:

```bash
# View deployment history
kubectl rollout history deployment/backend -n hospital-erp-system

# Rollback to previous version (includes replica count)
kubectl rollout undo deployment/backend -n hospital-erp-system

# Or scale manually to known-good count
kubectl scale deployment/backend -n hospital-erp-system --replicas=3
```

### Disable Auto-Scaling Temporarily

**Pause HPA during incident**:

```bash
# Delete HPA temporarily
kubectl delete hpa backend-hpa -n hospital-erp-system

# Manually control replicas
kubectl scale deployment/backend -n hospital-erp-system --replicas=5

# Re-enable HPA after incident resolved
kubectl apply -f k8s/base/backend/hpa.yaml
```

---

## Scheduled Scaling

### Pre-emptive Scaling for Known Load

**Example: Scale up before business hours**:

```yaml
# Using CronJob to scale deployment
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-up-business-hours
  namespace: hospital-erp-system
spec:
  schedule: '0 7 * * 1-5' # 7 AM Mon-Fri
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: deployment-scaler
          containers:
            - name: kubectl
              image: bitnami/kubectl:latest
              command:
                - kubectl
                - scale
                - deployment/backend
                - --replicas=5
                - -n
                - hospital-erp-system
          restartPolicy: OnFailure
---
# Scale down after business hours
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-down-after-hours
  namespace: hospital-erp-system
spec:
  schedule: '0 18 * * 1-5' # 6 PM Mon-Fri
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: deployment-scaler
          containers:
            - name: kubectl
              image: bitnami/kubectl:latest
              command:
                - kubectl
                - scale
                - deployment/backend
                - --replicas=2
                - -n
                - hospital-erp-system
          restartPolicy: OnFailure
```

**Deploy scheduled scaling**:

```bash
kubectl apply -f k8s/operations/scheduled-scaling.yaml
```

**Verify CronJobs**:

```bash
kubectl get cronjobs -n hospital-erp-system
```

---

## Load Testing Before Scaling

### Pre-Scaling Load Test

**Always load test before major events**:

```bash
# Example using k6
k6 run --vus 500 --duration 300s load-tests/peak-traffic.js

# Monitor during test
kubectl top pods -n hospital-erp-system
kubectl get hpa -n hospital-erp-system -w
```

**Prometheus queries during load test**:

```promql
# Request rate
sum(rate(http_requests_total[1m])) by (pod)

# Response time P95
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[1m]))
/
sum(rate(http_requests_total[1m]))
```

**Document results**:

```
| Replicas | RPS | P95 Latency | Error Rate | CPU % | Memory % |
|----------|-----|-------------|------------|-------|----------|
| 2        | 800 | 1.2s        | 0.5%       | 85%   | 65%      |
| 3        | 1200| 0.8s        | 0.1%       | 60%   | 55%      |
| 5        | 2000| 0.5s        | 0.05%      | 45%   | 40%      |
```

---

## Escalation

### When to Escalate Scaling Issues

**Escalate if**:

- Auto-scaling not working as expected
- Pods fail to start after scaling
- Cluster Autoscaler cannot add nodes
- Performance does not improve after scaling

**Escalation Path**:

1. **Platform Team**: Infrastructure and Kubernetes issues
2. **Cloud Provider Support**: Node provisioning failures
3. **Engineering Lead**: Architectural scaling limits

---

## Best Practices

### Do's

- ✅ Monitor metrics for 5-10 minutes after scaling
- ✅ Scale gradually for large changes
- ✅ Load test before major events
- ✅ Document scaling decisions and results
- ✅ Use HPA for automatic scaling
- ✅ Set appropriate resource requests and limits

### Don'ts

- ❌ Don't scale down during peak hours
- ❌ Don't exceed cluster capacity
- ❌ Don't disable HPA without good reason
- ❌ Don't scale without monitoring the impact
- ❌ Don't ignore resource limits (can cause OOM)

---

## Related Documentation

- [High Response Time Runbook](./high-response-time.md)
- [Architecture Overview](../architecture.md)
- [Configuration Reference](../configuration.md)
- [HPA Configuration](../configuration.md#horizontal-pod-autoscaler)

---

## Revision History

| Version | Date       | Author      | Changes         |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-01-24 | DevOps Team | Initial version |
