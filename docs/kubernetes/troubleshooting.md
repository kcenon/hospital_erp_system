# Kubernetes Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered in the Hospital ERP System Kubernetes deployment. For specific operational scenarios, refer to the [runbooks](./runbooks/) directory.

## Quick Diagnostic Commands

```bash
# Check cluster health
kubectl get nodes
kubectl top nodes

# Check namespace resources
kubectl get all -n hospital-erp-system

# Check pod status
kubectl get pods -n hospital-erp-system -o wide

# Check events
kubectl get events -n hospital-erp-system --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n hospital-erp-system
```

## Common Issues

### 1. Pod Startup Issues

#### 1.1 ImagePullBackOff

**Symptoms:**

```bash
$ kubectl get pods -n hospital-erp-system
NAME                       READY   STATUS             RESTARTS   AGE
backend-7d9b8f5c-abc12     0/1     ImagePullBackOff   0          2m
```

**Causes:**

- Image does not exist in registry
- Authentication failure with private registry
- Network connectivity issues

**Diagnosis:**

```bash
# Check pod events
kubectl describe pod <pod-name> -n hospital-erp-system

# Check image pull secrets
kubectl get secrets -n hospital-erp-system | grep regcred

# Verify image exists
docker pull <image-name>:<tag>
```

**Solution:**

```bash
# 1. Verify image name and tag
kubectl get deployment backend -n hospital-erp-system -o jsonpath='{.spec.template.spec.containers[0].image}'

# 2. Update image pull secret if needed
kubectl delete secret regcred -n hospital-erp-system
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n hospital-erp-system

# 3. Restart deployment
kubectl rollout restart deployment/backend -n hospital-erp-system
```

#### 1.2 CrashLoopBackOff

**Symptoms:**

```bash
$ kubectl get pods -n hospital-erp-system
NAME                       READY   STATUS              RESTARTS   AGE
backend-7d9b8f5c-abc12     0/1     CrashLoopBackOff    5          5m
```

**Causes:**

- Application crash on startup
- Missing environment variables
- Database connection failure
- Invalid configuration

**Diagnosis:**

```bash
# Check logs
kubectl logs <pod-name> -n hospital-erp-system
kubectl logs <pod-name> -n hospital-erp-system --previous

# Check environment variables
kubectl exec <pod-name> -n hospital-erp-system -- env | sort

# Check liveness/readiness probes
kubectl describe pod <pod-name> -n hospital-erp-system | grep -A 10 "Liveness\|Readiness"
```

**Solution:**

See detailed runbook: [pod-crash-looping.md](./runbooks/pod-crash-looping.md)

Quick fixes:

```bash
# 1. Check and fix environment variables
kubectl edit deployment backend -n hospital-erp-system

# 2. Check ConfigMap and Secrets
kubectl get configmap -n hospital-erp-system
kubectl get secrets -n hospital-erp-system

# 3. Verify database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -n hospital-erp-system -- \
  psql -h <db-host> -U <db-user> -d <db-name>

# 4. Temporarily disable probes for debugging
kubectl patch deployment backend -n hospital-erp-system -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","livenessProbe":null}]}}}}'
```

#### 1.3 Pending Pods

**Symptoms:**

```bash
$ kubectl get pods -n hospital-erp-system
NAME                       READY   STATUS    RESTARTS   AGE
backend-7d9b8f5c-abc12     0/1     Pending   0          10m
```

**Causes:**

- Insufficient cluster resources (CPU/Memory)
- PersistentVolumeClaim not bound
- Node selector/affinity not satisfied
- Taints and tolerations mismatch

**Diagnosis:**

```bash
# Check pod events
kubectl describe pod <pod-name> -n hospital-erp-system

# Check node resources
kubectl top nodes
kubectl describe nodes

# Check PVC status (if applicable)
kubectl get pvc -n hospital-erp-system
```

**Solution:**

```bash
# 1. Check resource requests
kubectl get deployment backend -n hospital-erp-system -o jsonpath='{.spec.template.spec.containers[0].resources}'

# 2. Scale down non-critical workloads
kubectl scale deployment frontend -n hospital-erp-system --replicas=1

# 3. Add nodes to cluster (if resource constrained)
# (Provider-specific commands)

# 4. Check and fix PVC
kubectl describe pvc <pvc-name> -n hospital-erp-system
```

### 2. Network and Connectivity Issues

#### 2.1 Service Not Reachable

**Symptoms:**

- Cannot access application via ingress
- Internal service-to-service communication fails

**Diagnosis:**

```bash
# Check service endpoints
kubectl get endpoints -n hospital-erp-system

# Test service connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -n hospital-erp-system -- bash
# Inside pod:
curl http://backend-service:3000/health

# Check ingress
kubectl get ingress -n hospital-erp-system
kubectl describe ingress hospital-erp-ingress -n hospital-erp-system

# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -n hospital-erp-system -- nslookup backend-service
```

**Solution:**

```bash
# 1. Verify service selector matches pod labels
kubectl get service backend -n hospital-erp-system -o yaml | grep selector -A 5
kubectl get pods -n hospital-erp-system --show-labels

# 2. Check NetworkPolicies
kubectl get networkpolicy -n hospital-erp-system
kubectl describe networkpolicy <policy-name> -n hospital-erp-system

# 3. Verify ingress controller is running
kubectl get pods -n ingress-nginx

# 4. Check ingress annotations
kubectl get ingress hospital-erp-ingress -n hospital-erp-system -o yaml
```

#### 2.2 Database Connection Issues

**Symptoms:**

- Backend pods crash with database connection errors
- "ECONNREFUSED" or timeout errors in logs

**Diagnosis:**

```bash
# Check backend logs
kubectl logs -l app=backend -n hospital-erp-system | grep -i "database\|connection"

# Test database connectivity
kubectl run -it --rm psql-debug --image=postgres:15 --restart=Never -n hospital-erp-system -- \
  psql -h <db-host> -U <db-user> -d <db-name> -c "SELECT 1"

# Check PgBouncer (if used)
kubectl logs -l app=pgbouncer -n hospital-erp-system

# Verify secrets
kubectl get secret db-credentials -n hospital-erp-system -o jsonpath='{.data}' | jq 'map_values(@base64d)'
```

**Solution:**

See detailed runbook: [database-connection-issues.md](./runbooks/database-connection-issues.md)

Quick fixes:

```bash
# 1. Check database credentials
kubectl exec deployment/backend -n hospital-erp-system -- env | grep DB

# 2. Verify database host is reachable
kubectl run -it --rm debug --image=busybox --restart=Never -n hospital-erp-system -- \
  nc -zv <db-host> 5432

# 3. Check connection pool settings
kubectl get configmap backend-config -n hospital-erp-system -o yaml

# 4. Restart backend pods
kubectl rollout restart deployment/backend -n hospital-erp-system
```

### 3. Performance Issues

#### 3.1 High Response Time

**Symptoms:**

- Slow API responses
- Frontend timeout errors
- High latency in monitoring dashboards

**Diagnosis:**

```bash
# Check pod resource usage
kubectl top pods -n hospital-erp-system

# Check HPA status
kubectl get hpa -n hospital-erp-system
kubectl describe hpa backend-hpa -n hospital-erp-system

# Check backend metrics
kubectl port-forward svc/backend 3000:3000 -n hospital-erp-system
curl http://localhost:3000/metrics

# Check database query performance
kubectl exec deployment/backend -n hospital-erp-system -- \
  node -e "require('./dist/scripts/check-slow-queries')"
```

**Solution:**

See detailed runbook: [high-response-time.md](./runbooks/high-response-time.md)

Quick fixes:

```bash
# 1. Scale up replicas
kubectl scale deployment backend -n hospital-erp-system --replicas=5

# 2. Check and optimize HPA
kubectl edit hpa backend-hpa -n hospital-erp-system

# 3. Verify Redis cache is working
kubectl exec deployment/redis -n hospital-erp-system -- redis-cli INFO stats

# 4. Check PgBouncer connections
kubectl exec deployment/pgbouncer -n hospital-erp-system -- psql pgbouncer -c "SHOW POOLS"
```

#### 3.2 High Error Rate

**Symptoms:**

- Increased 5xx errors
- Application errors in logs
- Alert firing from Prometheus

**Diagnosis:**

```bash
# Check error logs
kubectl logs -l app=backend -n hospital-erp-system | grep -i "error\|exception"

# Check ingress metrics
kubectl logs -l app.kubernetes.io/name=ingress-nginx -n ingress-nginx | grep " 5[0-9][0-9] "

# Check Prometheus metrics
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Open http://localhost:9090 and query: rate(http_requests_total{status=~"5.."}[5m])
```

**Solution:**

See detailed runbook: [high-error-rate.md](./runbooks/high-error-rate.md)

### 4. Resource Issues

#### 4.1 Out of Memory (OOM)

**Symptoms:**

```bash
$ kubectl get pods -n hospital-erp-system
NAME                       READY   STATUS      RESTARTS   AGE
backend-7d9b8f5c-abc12     0/1     OOMKilled   3          10m
```

**Diagnosis:**

```bash
# Check pod events
kubectl describe pod <pod-name> -n hospital-erp-system

# Check resource limits
kubectl get deployment backend -n hospital-erp-system -o jsonpath='{.spec.template.spec.containers[0].resources}'

# Check actual memory usage
kubectl top pods -n hospital-erp-system
```

**Solution:**

```bash
# 1. Increase memory limits
kubectl set resources deployment backend -n hospital-erp-system \
  --limits=memory=2Gi \
  --requests=memory=1Gi

# 2. Check for memory leaks
kubectl logs <pod-name> -n hospital-erp-system | grep -i "heap\|memory"

# 3. Enable heap profiling (Node.js)
kubectl exec deployment/backend -n hospital-erp-system -- \
  node --expose-gc --max-old-space-size=2048 dist/main.js
```

#### 4.2 CPU Throttling

**Symptoms:**

- High CPU usage but pods not scaling
- Slow application performance
- CPU throttling metrics in monitoring

**Diagnosis:**

```bash
# Check CPU usage
kubectl top pods -n hospital-erp-system

# Check CPU limits
kubectl get deployment backend -n hospital-erp-system -o jsonpath='{.spec.template.spec.containers[0].resources}'

# Check throttling metrics (if Prometheus is set up)
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Query: rate(container_cpu_cfs_throttled_seconds_total[5m])
```

**Solution:**

```bash
# 1. Increase CPU limits
kubectl set resources deployment backend -n hospital-erp-system \
  --limits=cpu=2000m \
  --requests=cpu=1000m

# 2. Review HPA configuration
kubectl edit hpa backend-hpa -n hospital-erp-system

# 3. Optimize application code for CPU efficiency
```

### 5. Storage Issues

#### 5.1 PersistentVolumeClaim Pending

**Symptoms:**

```bash
$ kubectl get pvc -n hospital-erp-system
NAME              STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
redis-data-0      Pending                                      gp3            5m
```

**Diagnosis:**

```bash
# Check PVC events
kubectl describe pvc redis-data-0 -n hospital-erp-system

# Check StorageClass
kubectl get storageclass

# Check available PVs
kubectl get pv
```

**Solution:**

```bash
# 1. Verify StorageClass exists
kubectl get storageclass gp3

# 2. Create StorageClass if missing (AWS example)
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  fsType: ext4
volumeBindingMode: WaitForFirstConsumer
EOF

# 3. Delete and recreate PVC
kubectl delete pvc redis-data-0 -n hospital-erp-system
kubectl apply -f k8s/base/redis/statefulset.yaml
```

#### 5.2 Disk Space Full

**Symptoms:**

- Pods fail with "no space left on device"
- Log ingestion stops

**Diagnosis:**

```bash
# Check disk usage on nodes
kubectl get nodes -o wide
kubectl debug node/<node-name> -it --image=ubuntu -- df -h

# Check pod disk usage
kubectl exec <pod-name> -n hospital-erp-system -- df -h
```

**Solution:**

```bash
# 1. Clean up unused images
kubectl debug node/<node-name> -it --image=ubuntu -- crictl rmi --prune

# 2. Increase PVC size
kubectl edit pvc <pvc-name> -n hospital-erp-system
# Update spec.resources.requests.storage

# 3. Enable log rotation
kubectl logs <pod-name> -n hospital-erp-system --tail=1000 > temp.log
```

### 6. Security Issues

#### 6.1 RBAC Permission Denied

**Symptoms:**

```
Error from server (Forbidden): pods is forbidden: User "system:serviceaccount:hospital-erp-system:backend" cannot list resource "pods"
```

**Diagnosis:**

```bash
# Check ServiceAccount
kubectl get serviceaccount -n hospital-erp-system

# Check RoleBindings
kubectl get rolebinding -n hospital-erp-system
kubectl describe rolebinding <binding-name> -n hospital-erp-system

# Test permissions
kubectl auth can-i list pods --as=system:serviceaccount:hospital-erp-system:backend -n hospital-erp-system
```

**Solution:**

```bash
# 1. Verify ServiceAccount is assigned to pod
kubectl get deployment backend -n hospital-erp-system -o jsonpath='{.spec.template.spec.serviceAccount}'

# 2. Create or update RoleBinding
kubectl apply -f k8s/base/rbac/backend-role.yaml
kubectl apply -f k8s/base/rbac/backend-rolebinding.yaml

# 3. Restart pods to apply new permissions
kubectl rollout restart deployment/backend -n hospital-erp-system
```

#### 6.2 Network Policy Blocking Traffic

**Symptoms:**

- Service unreachable despite correct configuration
- Connection timeouts between pods

**Diagnosis:**

```bash
# Check NetworkPolicies
kubectl get networkpolicy -n hospital-erp-system
kubectl describe networkpolicy <policy-name> -n hospital-erp-system

# Test connectivity from source pod
kubectl exec -it <source-pod> -n hospital-erp-system -- curl http://<target-service>:80
```

**Solution:**

```bash
# 1. Temporarily disable NetworkPolicy for testing
kubectl delete networkpolicy <policy-name> -n hospital-erp-system

# 2. Update NetworkPolicy to allow traffic
kubectl edit networkpolicy <policy-name> -n hospital-erp-system

# 3. Verify pod labels match policy selectors
kubectl get pods -n hospital-erp-system --show-labels
```

### 7. ConfigMap and Secret Issues

#### 7.1 ConfigMap/Secret Not Mounted

**Symptoms:**

- Environment variables missing in pod
- Configuration files not found

**Diagnosis:**

```bash
# Check if ConfigMap/Secret exists
kubectl get configmap -n hospital-erp-system
kubectl get secret -n hospital-erp-system

# Check pod mounts
kubectl describe pod <pod-name> -n hospital-erp-system | grep -A 10 "Mounts:"

# Verify environment variables
kubectl exec <pod-name> -n hospital-erp-system -- env | sort
```

**Solution:**

```bash
# 1. Create ConfigMap/Secret if missing
kubectl create configmap backend-config \
  --from-file=config.yaml \
  -n hospital-erp-system

# 2. Verify deployment references correct ConfigMap
kubectl get deployment backend -n hospital-erp-system -o yaml | grep -A 10 "configMap"

# 3. Restart pods to pick up changes
kubectl rollout restart deployment/backend -n hospital-erp-system
```

#### 7.2 Secret Values Incorrect

**Diagnosis:**

```bash
# Decode secret values
kubectl get secret db-credentials -n hospital-erp-system -o jsonpath='{.data}' | jq 'map_values(@base64d)'

# Check which pods use the secret
kubectl get pods -n hospital-erp-system -o json | jq -r '.items[] | select(.spec.containers[].env[]?.valueFrom.secretKeyRef.name=="db-credentials") | .metadata.name'
```

**Solution:**

```bash
# 1. Update secret
kubectl delete secret db-credentials -n hospital-erp-system
kubectl create secret generic db-credentials \
  --from-literal=username=<username> \
  --from-literal=password=<password> \
  -n hospital-erp-system

# 2. Restart affected pods
kubectl rollout restart deployment/backend -n hospital-erp-system

# 3. Verify new secret is loaded
kubectl exec deployment/backend -n hospital-erp-system -- env | grep DB
```

### 8. Monitoring and Logging Issues

#### 8.1 Metrics Not Appearing in Prometheus

**Diagnosis:**

```bash
# Check Prometheus targets
kubectl port-forward svc/prometheus -n monitoring 9090:9090
# Open http://localhost:9090/targets

# Check ServiceMonitor
kubectl get servicemonitor -n hospital-erp-system

# Verify /metrics endpoint
kubectl port-forward svc/backend -n hospital-erp-system 3000:3000
curl http://localhost:3000/metrics
```

**Solution:**

```bash
# 1. Create ServiceMonitor if missing
kubectl apply -f k8s/monitoring/backend-servicemonitor.yaml

# 2. Verify Prometheus scrape config
kubectl get prometheus -n monitoring -o yaml | grep -A 20 "serviceMonitorSelector"

# 3. Check pod annotations
kubectl get pods -n hospital-erp-system -o jsonpath='{.items[0].metadata.annotations}'
```

#### 8.2 Logs Not Appearing in Loki

**Diagnosis:**

```bash
# Check Loki status
kubectl get pods -n monitoring -l app=loki

# Check Promtail (log collector) status
kubectl get pods -n monitoring -l app=promtail
kubectl logs -l app=promtail -n monitoring

# Test log query
kubectl port-forward svc/grafana -n monitoring 3000:3000
# Open Grafana and query logs
```

**Solution:**

```bash
# 1. Verify Promtail DaemonSet is running on all nodes
kubectl get daemonset promtail -n monitoring
kubectl describe daemonset promtail -n monitoring

# 2. Check Promtail configuration
kubectl get configmap promtail-config -n monitoring -o yaml

# 3. Restart Promtail
kubectl rollout restart daemonset/promtail -n monitoring
```

## Advanced Debugging Techniques

### Debug Container Injection

```bash
# Inject ephemeral debug container into running pod
kubectl debug <pod-name> -n hospital-erp-system -it --image=nicolaka/netshoot --target=backend
```

### Node Debugging

```bash
# Debug node directly
kubectl debug node/<node-name> -it --image=ubuntu
```

### Network Packet Capture

```bash
# Capture network traffic
kubectl sniff <pod-name> -n hospital-erp-system -o capture.pcap
```

### Enable Verbose Logging

```bash
# Increase log level temporarily
kubectl set env deployment/backend -n hospital-erp-system LOG_LEVEL=debug
```

## Performance Profiling

### CPU Profiling (Node.js)

```bash
# Start profiling
kubectl exec deployment/backend -n hospital-erp-system -- \
  node --prof dist/main.js

# Generate profile
kubectl exec deployment/backend -n hospital-erp-system -- \
  node --prof-process isolate-*.log > profile.txt
```

### Memory Profiling (Node.js)

```bash
# Capture heap snapshot
kubectl exec deployment/backend -n hospital-erp-system -- \
  kill -SIGUSR2 <process-pid>

# Download heap snapshot
kubectl cp hospital-erp-system/<pod-name>:/app/heapdump-*.heapsnapshot ./heapdump.heapsnapshot
```

## Cluster-Level Troubleshooting

### Check Control Plane Health

```bash
# Check API server
kubectl get --raw /healthz

# Check component status
kubectl get componentstatuses

# Check API server logs (if accessible)
kubectl logs -n kube-system kube-apiserver-<node-name>
```

### Check etcd Health

```bash
# Port-forward to etcd
kubectl port-forward -n kube-system etcd-<node-name> 2379:2379

# Check etcd status
ETCDCTL_API=3 etcdctl --endpoints=https://localhost:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  endpoint health
```

### Check DNS Resolution

```bash
# Test CoreDNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup kubernetes.default

# Check CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns
```

## Emergency Procedures

### Force Delete Stuck Pod

```bash
# Grace period 0 (use with caution)
kubectl delete pod <pod-name> -n hospital-erp-system --grace-period=0 --force
```

### Drain Node for Maintenance

```bash
# Safely evict pods
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon after maintenance
kubectl uncordon <node-name>
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/backend -n hospital-erp-system

# Rollback to previous revision
kubectl rollout undo deployment/backend -n hospital-erp-system

# Rollback to specific revision
kubectl rollout undo deployment/backend -n hospital-erp-system --to-revision=3
```

## Best Practices

1. **Always check events first**: `kubectl get events -n hospital-erp-system --sort-by='.lastTimestamp'`
2. **Use labels for filtering**: `kubectl logs -l app=backend -n hospital-erp-system`
3. **Collect logs before deleting pods**: `kubectl logs <pod-name> > pod.log`
4. **Test changes in development environment first**
5. **Use `kubectl diff` before applying changes**: `kubectl diff -f manifest.yaml`
6. **Keep kubectl and cluster versions in sync**
7. **Monitor resource usage regularly**: `kubectl top nodes` and `kubectl top pods`

## Getting Help

- **Runbooks**: Check [runbooks directory](./runbooks/) for specific scenarios
- **Grafana Dashboards**: http://grafana.hospital-erp.example.com
- **Prometheus Alerts**: http://alertmanager.hospital-erp.example.com
- **ArgoCD UI**: http://argocd.hospital-erp.example.com

## References

- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller Docs](https://kubernetes.github.io/ingress-nginx/)
- [Prometheus Operator Docs](https://prometheus-operator.dev/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
