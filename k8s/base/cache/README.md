# Redis Cache Configuration

This directory contains Kubernetes manifests for Redis cache deployment.

## Architecture

### Development/Staging (Self-Hosted)

Uses a single-replica StatefulSet with persistent storage:

```
┌─────────────────────────────────────────┐
│ Hospital ERP Kubernetes Cluster         │
│                                          │
│   ┌─────────────────────────────┐       │
│   │ Redis StatefulSet           │       │
│   │   - 1 replica               │       │
│   │   - AOF persistence         │       │
│   │   - 256MB memory limit      │       │
│   │   - Password authentication │       │
│   └─────────────────────────────┘       │
│             │                            │
│             ▼                            │
│   ┌─────────────────────────────┐       │
│   │ PersistentVolumeClaim       │       │
│   │   - 5Gi storage             │       │
│   │   - ReadWriteOnce           │       │
│   └─────────────────────────────┘       │
└─────────────────────────────────────────┘
```

### Production (Managed Redis - AWS ElastiCache)

For production environments, use AWS ElastiCache for Redis:

```
┌─────────────────────────────────────────┐
│ Hospital ERP Kubernetes Cluster         │
│                                          │
│   ┌─────────────────────────────┐       │
│   │ Backend Pods                │       │
│   │   - Connects via REDIS_HOST │       │
│   │   - Uses redis-credentials  │       │
│   └─────────────┬───────────────┘       │
│                 │                        │
└─────────────────┼────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ AWS ElastiCache Redis Cluster           │
│   - Multi-AZ deployment                 │
│   - Automatic failover                  │
│   - Encryption at rest & in transit     │
│   - Managed backups                     │
└─────────────────────────────────────────┘
```

## Files

| File                     | Description                        |
| ------------------------ | ---------------------------------- |
| `redis-config.yaml`      | ConfigMap with Redis configuration |
| `redis-statefulset.yaml` | StatefulSet for self-hosted Redis  |
| `redis-service.yaml`     | ClusterIP and Headless services    |
| `kustomization.yaml`     | Kustomize configuration            |

## Configuration

### Memory Settings

- `maxmemory`: 256MB (adjustable via overlay patches)
- `maxmemory-policy`: allkeys-lru (evict least recently used keys)

### Persistence

- **AOF (Append Only File)**: Enabled with `everysec` sync
- **RDB Snapshots**: Configured for periodic backups

### Security

- Password authentication required
- Protected mode enabled
- Network policies restrict access to backend pods only

## Production Setup (AWS ElastiCache)

For production, skip the self-hosted Redis by removing it from the overlay:

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

# Exclude self-hosted Redis components
patchesStrategicMerge:
  - redis-managed-patch.yaml
```

Then configure the External Secret to point to ElastiCache:

```yaml
# AWS Secrets Manager secret should contain:
{
  'host': 'hospital-erp.xxxxx.0001.apn2.cache.amazonaws.com',
  'port': '6379',
  'password': '<auth-token>',
  'url': 'redis://:password@host:port',
}
```

## Monitoring

Redis metrics are exposed via `redis_exporter` sidecar:

- **Port**: 9121
- **Path**: /metrics
- **Prometheus scrape**: Enabled via pod annotations

### Key Metrics

- `redis_connected_clients`
- `redis_used_memory`
- `redis_commands_processed_total`
- `redis_keyspace_hits_total` / `redis_keyspace_misses_total`

## Troubleshooting

### Check Redis Connection

```bash
kubectl exec -it redis-0 -n hospital-erp-system -- redis-cli -a $REDIS_PASSWORD ping
```

### View Redis Logs

```bash
kubectl logs redis-0 -n hospital-erp-system -c redis
```

### Check Memory Usage

```bash
kubectl exec -it redis-0 -n hospital-erp-system -- redis-cli -a $REDIS_PASSWORD info memory
```
