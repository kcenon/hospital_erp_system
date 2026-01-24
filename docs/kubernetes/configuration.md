# Configuration Reference

This document provides a comprehensive reference for all configuration options in the Hospital ERP System Kubernetes deployment.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [ConfigMaps](#configmaps)
4. [Secrets](#secrets)
5. [Resource Limits](#resource-limits)
6. [Health Check Configuration](#health-check-configuration)
7. [Scaling Configuration](#scaling-configuration)
8. [Network Configuration](#network-configuration)

## Overview

The Hospital ERP System uses a combination of **ConfigMaps** for non-sensitive configuration and **Secrets** for sensitive data. Environment-specific configurations are managed using Kustomize overlays.

### Configuration Sources

| Type                 | Storage                                | Example                                |
| -------------------- | -------------------------------------- | -------------------------------------- |
| Non-sensitive config | ConfigMap (in Git)                     | API endpoints, log levels, timeouts    |
| Sensitive config     | External Secrets (AWS Secrets Manager) | Database passwords, JWT keys, API keys |
| Resource limits      | Deployment manifests                   | CPU/memory requests and limits         |

### Environment Differences

| Configuration   | Development | Staging         | Production |
| --------------- | ----------- | --------------- | ---------- |
| Replicas        | 1           | 2               | 3+         |
| Log level       | debug       | info            | warn       |
| Resource limits | Minimal     | Production-like | Full       |
| TLS enabled     | No          | Yes             | Yes        |
| Autoscaling     | Disabled    | Enabled         | Enabled    |

## Environment Variables

### Backend Configuration

#### Application Settings

| Variable    | Description         | Default      | Example                                |
| ----------- | ------------------- | ------------ | -------------------------------------- |
| `NODE_ENV`  | Node.js environment | `production` | `development`, `staging`, `production` |
| `PORT`      | HTTP server port    | `3000`       | `3000`                                 |
| `LOG_LEVEL` | Logging verbosity   | `info`       | `debug`, `info`, `warn`, `error`       |

#### Authentication & Security

| Variable                 | Description           | Default | Example                   | Secret? |
| ------------------------ | --------------------- | ------- | ------------------------- | ------- |
| `JWT_SECRET`             | JWT signing key       | -       | `<64-char-random-string>` | ✅ Yes  |
| `JWT_REFRESH_SECRET`     | JWT refresh token key | -       | `<64-char-random-string>` | ✅ Yes  |
| `JWT_ACCESS_EXPIRATION`  | Access token TTL      | `1h`    | `15m`, `1h`, `24h`        | No      |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL     | `7d`    | `7d`, `30d`               | No      |
| `ENCRYPTION_KEY`         | Data encryption key   | -       | `<32-char-key>`           | ✅ Yes  |

#### Database Connection

| Variable            | Description           | Default        | Example             | Secret? |
| ------------------- | --------------------- | -------------- | ------------------- | ------- |
| `DATABASE_HOST`     | PostgreSQL hostname   | -              | `pgbouncer-service` | No      |
| `DATABASE_PORT`     | PostgreSQL port       | `5432`         | `5432`              | No      |
| `DATABASE_NAME`     | Database name         | `hospital_erp` | `hospital_erp`      | No      |
| `DATABASE_USER`     | Database username     | -              | `hospitaladmin`     | ✅ Yes  |
| `DATABASE_PASSWORD` | Database password     | -              | `<strong-password>` | ✅ Yes  |
| `DATABASE_SSL`      | Enable SSL connection | `true`         | `true`, `false`     | No      |
| `DATABASE_POOL_MIN` | Min connections       | `2`            | `2`, `5`, `10`      | No      |
| `DATABASE_POOL_MAX` | Max connections       | `10`           | `10`, `20`, `50`    | No      |

#### Redis Configuration

| Variable           | Description          | Default         | Example                 | Secret? |
| ------------------ | -------------------- | --------------- | ----------------------- | ------- |
| `REDIS_HOST`       | Redis hostname       | `redis-service` | `redis-service`         | No      |
| `REDIS_PORT`       | Redis port           | `6379`          | `6379`                  | No      |
| `REDIS_PASSWORD`   | Redis password       | -               | `<redis-password>`      | ✅ Yes  |
| `REDIS_DB`         | Redis database index | `0`             | `0`, `1`, `2`           | No      |
| `REDIS_KEY_PREFIX` | Cache key prefix     | `hospital_erp:` | `hospital_erp:`, `app:` | No      |

#### CORS Configuration

| Variable           | Description       | Default | Example                        |
| ------------------ | ----------------- | ------- | ------------------------------ |
| `CORS_ORIGIN`      | Allowed origins   | -       | `https://hospital.example.com` |
| `CORS_CREDENTIALS` | Allow credentials | `true`  | `true`, `false`                |

#### Rate Limiting

| Variable                  | Description                 | Default | Example             |
| ------------------------- | --------------------------- | ------- | ------------------- |
| `RATE_LIMIT_TTL`          | Rate limit window (seconds) | `60`    | `60`, `300`, `3600` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window     | `100`   | `50`, `100`, `1000` |

### Frontend Configuration

#### Application Settings

| Variable               | Description      | Default               | Example                            |
| ---------------------- | ---------------- | --------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API URL  | -                     | `https://api.hospital.example.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Hospital ERP System` | `Hospital ERP System`              |
| `NEXT_PUBLIC_APP_URL`  | Application URL  | -                     | `https://hospital.example.com`     |

**Note**: All `NEXT_PUBLIC_*` variables are exposed to the browser.

## ConfigMaps

### Backend ConfigMap

Location: `k8s/base/configs/backend-config.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  labels:
    app.kubernetes.io/name: backend
    app.kubernetes.io/component: config
data:
  NODE_ENV: 'production'
  PORT: '3000'
  JWT_ACCESS_EXPIRATION: '1h'
  JWT_REFRESH_EXPIRATION: '7d'
  LOG_LEVEL: 'info'
  CORS_ORIGIN: 'https://hospital.example.com'
```

### Frontend ConfigMap

Location: `k8s/base/configs/frontend-config.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  labels:
    app.kubernetes.io/name: frontend
    app.kubernetes.io/component: config
data:
  NEXT_PUBLIC_API_URL: 'https://api.hospital.example.com'
  NEXT_PUBLIC_APP_NAME: 'Hospital ERP System'
  NEXT_PUBLIC_APP_URL: 'https://hospital.example.com'
```

### Environment-Specific Overrides

#### Development

File: `k8s/overlays/development/configmap-env.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  NODE_ENV: 'development'
  LOG_LEVEL: 'debug'
  CORS_ORIGIN: 'http://localhost:3001'
```

#### Staging

File: `k8s/overlays/staging/configmap-env.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  NODE_ENV: 'staging'
  LOG_LEVEL: 'info'
  CORS_ORIGIN: 'https://staging.hospital-erp.example.com'
```

#### Production

File: `k8s/overlays/production/configmap-env.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  NODE_ENV: 'production'
  LOG_LEVEL: 'warn'
  CORS_ORIGIN: 'https://hospital.example.com'
```

### Updating ConfigMaps

```bash
# Edit ConfigMap directly (not recommended - changes not in Git)
kubectl edit configmap backend-config -n hospital-erp-system

# Update via Git (recommended)
# 1. Edit k8s/base/configs/backend-config.yaml or overlay
# 2. Commit changes to Git
# 3. Apply changes
kubectl apply -k k8s/overlays/production

# Restart pods to pick up new configuration
kubectl rollout restart deployment/backend -n hospital-erp-system
```

## Secrets

### Secret Management with External Secrets

Secrets are stored in **AWS Secrets Manager** and synced to Kubernetes using the **External Secrets Operator**.

#### Database Credentials

AWS Secret Name: `hospital-erp/database/credentials`

```json
{
  "username": "hospitaladmin",
  "password": "<strong-password>",
  "host": "hospital-erp-db.xxxxx.us-east-1.rds.amazonaws.com",
  "port": "5432",
  "database": "hospital_erp"
}
```

Kubernetes Secret: `database-credentials`

Mapped to environment variables:

- `DATABASE_USER` ← `username`
- `DATABASE_PASSWORD` ← `password`
- `DATABASE_HOST` ← `host`
- `DATABASE_PORT` ← `port`
- `DATABASE_NAME` ← `database`

#### Backend Application Secrets

AWS Secret Name: `hospital-erp/backend/secrets`

```json
{
  "JWT_SECRET": "<64-char-random-string>",
  "JWT_REFRESH_SECRET": "<64-char-random-string>",
  "ENCRYPTION_KEY": "<32-char-key>"
}
```

Kubernetes Secret: `backend-secrets`

Mapped to environment variables:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`

#### Redis Password

AWS Secret Name: `hospital-erp/redis/password`

```json
{
  "password": "<redis-password>"
}
```

Kubernetes Secret: `redis-password`

Mapped to environment variable:

- `REDIS_PASSWORD` ← `password`

### Creating Secrets in AWS Secrets Manager

```bash
# Database credentials
aws secretsmanager create-secret \
  --name hospital-erp/database/credentials \
  --description "RDS PostgreSQL credentials" \
  --secret-string '{
    "username": "hospitaladmin",
    "password": "CHANGE_ME_STRONG_PASSWORD",
    "host": "hospital-erp-db.xxxxx.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "database": "hospital_erp"
  }'

# Backend secrets
aws secretsmanager create-secret \
  --name hospital-erp/backend/secrets \
  --description "Backend application secrets" \
  --secret-string '{
    "JWT_SECRET": "CHANGE_ME_64_CHAR_STRING",
    "JWT_REFRESH_SECRET": "CHANGE_ME_ANOTHER_64_CHAR_STRING",
    "ENCRYPTION_KEY": "CHANGE_ME_32_CHAR_KEY"
  }'
```

### Updating Secrets

```bash
# Update secret in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id hospital-erp/database/credentials \
  --secret-string '{
    "username": "hospitaladmin",
    "password": "NEW_PASSWORD",
    "host": "hospital-erp-db.xxxxx.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "database": "hospital_erp"
  }'

# External Secrets Operator will sync automatically (within 1 minute)
# Verify sync status
kubectl get externalsecrets -n hospital-erp-system
kubectl describe externalsecret database-credentials -n hospital-erp-system

# Restart pods to use new secret values
kubectl rollout restart deployment/backend -n hospital-erp-system
```

### Secret Rotation

Secrets should be rotated regularly:

| Secret Type        | Rotation Frequency | Procedure                                 |
| ------------------ | ------------------ | ----------------------------------------- |
| Database passwords | Every 90 days      | Update AWS Secrets Manager → Restart pods |
| JWT keys           | Every 180 days     | Update AWS Secrets Manager → Restart pods |
| API keys           | Every 90 days      | Update AWS Secrets Manager → Restart pods |

**Automated rotation** (planned for future implementation):

- Use AWS Secrets Manager rotation lambdas
- Configure External Secrets Operator to detect changes
- Implement rolling pod restart on secret update

## Resource Limits

### Pod Resource Configuration

#### Backend

```yaml
resources:
  requests:
    memory: '512Mi'
    cpu: '250m'
  limits:
    memory: '1Gi'
    cpu: '1000m'
```

- **Requests**: Guaranteed resources (scheduler uses this for placement)
- **Limits**: Maximum resources (pod throttled/killed if exceeded)

#### Frontend

```yaml
resources:
  requests:
    memory: '128Mi'
    cpu: '100m'
  limits:
    memory: '512Mi'
    cpu: '500m'
```

#### Redis

```yaml
resources:
  requests:
    memory: '256Mi'
    cpu: '100m'
  limits:
    memory: '512Mi'
    cpu: '500m'
```

#### PgBouncer

```yaml
resources:
  requests:
    memory: '64Mi'
    cpu: '50m'
  limits:
    memory: '128Mi'
    cpu: '200m'
```

### Environment-Specific Resource Limits

| Component | Environment | Memory Request | Memory Limit | CPU Request | CPU Limit |
| --------- | ----------- | -------------- | ------------ | ----------- | --------- |
| Backend   | Development | 256Mi          | 512Mi        | 100m        | 500m      |
| Backend   | Staging     | 512Mi          | 1Gi          | 250m        | 1000m     |
| Backend   | Production  | 512Mi          | 1Gi          | 250m        | 1000m     |
| Frontend  | Development | 64Mi           | 256Mi        | 50m         | 250m      |
| Frontend  | Staging     | 128Mi          | 512Mi        | 100m        | 500m      |
| Frontend  | Production  | 128Mi          | 512Mi        | 100m        | 500m      |

### Adjusting Resource Limits

```bash
# Edit deployment directly (not recommended)
kubectl edit deployment backend -n hospital-erp-system

# Update via Git (recommended)
# 1. Edit k8s/base/backend/deployment.yaml or overlay
# 2. Modify resources section
# 3. Apply changes
kubectl apply -k k8s/overlays/production

# Monitor resource usage
kubectl top pods -n hospital-erp-system
```

## Health Check Configuration

### Liveness Probe

Determines if a pod is healthy and should be restarted if failing.

#### Backend Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

- **initialDelaySeconds**: Wait 30s before first check (allows app startup)
- **periodSeconds**: Check every 10s
- **timeoutSeconds**: Timeout after 5s
- **failureThreshold**: Restart after 3 consecutive failures

### Readiness Probe

Determines if a pod is ready to receive traffic.

#### Backend Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Startup Probe

Allows slow-starting containers extra time to initialize.

#### Backend Startup Probe

```yaml
startupProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 30 # 30 * 10s = 5 minutes max startup time
```

### Health Check Endpoints

| Endpoint        | Purpose         | Expected Response                                                    |
| --------------- | --------------- | -------------------------------------------------------------------- |
| `/health/live`  | Liveness check  | `200 OK` with `{"status": "ok"}`                                     |
| `/health/ready` | Readiness check | `200 OK` with `{"status": "ready", "database": "ok", "redis": "ok"}` |

## Scaling Configuration

### Horizontal Pod Autoscaling (HPA)

#### Backend HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 1
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

**Configuration:**

- **minReplicas**: Minimum pods (1 for dev, 3 for prod)
- **maxReplicas**: Maximum pods during scale-out
- **CPU target**: Scale when average CPU > 70%
- **Memory target**: Scale when average memory > 80%

#### Environment-Specific HPA

| Environment | Min Replicas | Max Replicas | CPU Target | Memory Target |
| ----------- | ------------ | ------------ | ---------- | ------------- |
| Development | 1            | 3            | 80%        | 80%           |
| Staging     | 2            | 5            | 70%        | 80%           |
| Production  | 3            | 10           | 70%        | 80%           |

### Pod Disruption Budgets (PDB)

Ensures minimum availability during voluntary disruptions (node drains, upgrades).

#### Backend PDB

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
spec:
  minAvailable: 50%
  selector:
    matchLabels:
      app.kubernetes.io/name: backend
```

**Configuration:**

- **minAvailable**: At least 50% of pods must remain running during disruption
- Alternative: Use `maxUnavailable: 1` to allow only 1 pod down at a time

## Network Configuration

### Service Configuration

#### Backend Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: backend
  ports:
    - port: 3000
      targetPort: 3000
      protocol: TCP
      name: http
```

**Configuration:**

- **type**: `ClusterIP` (internal only), `LoadBalancer` (external), `NodePort` (debug)
- **port**: Service port (accessed by other pods)
- **targetPort**: Container port

### Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hospital-erp-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - hospital.example.com
        - api.hospital.example.com
      secretName: hospital-erp-tls
  rules:
    - host: hospital.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 3001
    - host: api.hospital.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 3000
```

**Annotations:**

- `cert-manager.io/cluster-issuer`: Automatic TLS certificate provisioning
- `nginx.ingress.kubernetes.io/ssl-redirect`: Force HTTPS
- `nginx.ingress.kubernetes.io/rate-limit`: Rate limiting (requests per minute)

### Network Policies

Network policies enforce zero-trust networking.

#### Default Deny Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

#### Backend Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: frontend
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: redis
      ports:
        - protocol: TCP
          port: 6379
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: pgbouncer
      ports:
        - protocol: TCP
          port: 5432
    # Allow DNS
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
      ports:
        - protocol: UDP
          port: 53
```

## Configuration Best Practices

### Security

1. **Never store secrets in Git**
   - Use External Secrets Operator
   - Store in AWS Secrets Manager or equivalent

2. **Use read-only root filesystem**

   ```yaml
   securityContext:
     readOnlyRootFilesystem: true
   ```

3. **Run as non-root user**
   ```yaml
   securityContext:
     runAsNonRoot: true
     runAsUser: 1000
   ```

### Performance

1. **Set appropriate resource requests**
   - Too low: Pods starved of resources
   - Too high: Wasted cluster capacity

2. **Configure health checks carefully**
   - `initialDelaySeconds`: Allow enough startup time
   - `periodSeconds`: Balance responsiveness vs. overhead

3. **Use connection pooling**
   - Database: PgBouncer
   - Redis: Configure pool size appropriately

### Reliability

1. **Always set Pod Disruption Budgets**
   - Prevents all pods from being evicted during upgrades

2. **Use HPA for production**
   - Automatically handles traffic spikes

3. **Implement health checks**
   - Liveness: Detect deadlocks
   - Readiness: Avoid sending traffic to unhealthy pods

## References

- [Kubernetes Configuration Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Kustomize Documentation](https://kustomize.io/)
- [External Secrets Operator](https://external-secrets.io/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)

---

For deployment procedures, see [deployment-guide.md](deployment-guide.md).
