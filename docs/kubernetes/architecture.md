# Kubernetes Architecture

## Overview

The Hospital ERP System uses a production-grade Kubernetes architecture designed for high availability, scalability, and security. The system follows cloud-native best practices with GitOps deployment, comprehensive observability, and zero-trust networking.

## High-Level Architecture

```mermaid
graph TB
    subgraph Internet
        Users[Users/Clients]
    end

    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            Ingress[NGINX Ingress Controller]
            CertManager[cert-manager<br/>TLS Certificates]
        end

        subgraph "Application Layer"
            Frontend[Frontend<br/>Next.js<br/>Replicas: 1-3]
            Backend[Backend<br/>NestJS<br/>Replicas: 1-3]
        end

        subgraph "Data Layer"
            Redis[Redis<br/>StatefulSet<br/>HA Mode]
            PgBouncer[PgBouncer<br/>Connection Pooling]
        end

        subgraph "Observability Stack"
            Prometheus[Prometheus<br/>Metrics Collection]
            Grafana[Grafana<br/>Dashboards]
            Loki[Loki<br/>Log Aggregation]
            AlertManager[AlertManager<br/>Alert Routing]
        end

        subgraph "GitOps"
            ArgoCD[ArgoCD<br/>Continuous Deployment]
        end
    end

    subgraph "External Services"
        RDS[(Amazon RDS<br/>PostgreSQL)]
        SecretsManager[AWS Secrets Manager]
        S3[S3<br/>Backups]
    end

    Users -->|HTTPS| Ingress
    Ingress -->|HTTP| Frontend
    Ingress -->|HTTP| Backend
    Frontend -->|API Calls| Backend
    Backend -->|Query| PgBouncer
    Backend -->|Cache| Redis
    PgBouncer -->|Connection Pool| RDS
    Backend -.->|Secrets| SecretsManager
    Prometheus -->|Scrape| Backend
    Prometheus -->|Scrape| Frontend
    Loki -->|Collect Logs| Backend
    Loki -->|Collect Logs| Frontend
    Prometheus -->|Alerts| AlertManager
    ArgoCD -.->|Deploy| Frontend
    ArgoCD -.->|Deploy| Backend
    RDS -.->|Backup| S3
    CertManager -.->|ACME| Ingress
```

## Component Architecture

### 1. Ingress Layer

The ingress layer handles external traffic routing and TLS termination.

```mermaid
graph LR
    subgraph "Ingress Components"
        IC[NGINX Ingress Controller]
        CM[cert-manager]
        CI[ClusterIssuer<br/>Let's Encrypt]
    end

    Internet -->|HTTPS :443| IC
    IC -->|Route /api/*| BackendSvc[Backend Service]
    IC -->|Route /*| FrontendSvc[Frontend Service]
    CM -->|Provision| Cert[TLS Certificates]
    CI -->|ACME Challenge| CM
    Cert -->|Mount| IC
```

**Components:**

- **NGINX Ingress Controller**: Routes external traffic to services
- **cert-manager**: Automates TLS certificate provisioning and renewal
- **ClusterIssuer**: Configures Let's Encrypt for free TLS certificates

**Key Features:**

- Automatic HTTPS with Let's Encrypt
- Path-based routing (`/api/*` → Backend, `/*` → Frontend)
- Rate limiting and request buffering
- WebSocket support for real-time features

### 2. Application Layer

The application layer consists of frontend and backend services with autoscaling capabilities.

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        FE1[Pod 1]
        FE2[Pod 2]
        FE3[Pod 3]
        FE_HPA[HorizontalPodAutoscaler<br/>Min: 1, Max: 10]
    end

    subgraph "Backend (NestJS)"
        BE1[Pod 1]
        BE2[Pod 2]
        BE3[Pod 3]
        BE_HPA[HorizontalPodAutoscaler<br/>Min: 1, Max: 10]
    end

    FE_HPA -.->|Scale| FE1
    FE_HPA -.->|Scale| FE2
    FE_HPA -.->|Scale| FE3

    BE_HPA -.->|Scale| BE1
    BE_HPA -.->|Scale| BE2
    BE_HPA -.->|Scale| BE3

    FE1 -->|REST API| BE1
    FE2 -->|REST API| BE2
    FE3 -->|REST API| BE3
```

**Frontend (Next.js):**

- Server-side rendering (SSR) for optimal performance
- Static asset caching
- Replicas: 1 (dev) / 2 (staging) / 3 (production)
- Resource limits: 512Mi memory, 500m CPU

**Backend (NestJS):**

- RESTful API with TypeScript
- JWT-based authentication
- Replicas: 1 (dev) / 2 (staging) / 3 (production)
- Resource limits: 1Gi memory, 1000m CPU

**Autoscaling Triggers:**

- CPU utilization > 70%
- Memory utilization > 80%
- Custom metrics (requests per second)

### 3. Data Layer

The data layer provides caching and database connection management.

```mermaid
graph TB
    subgraph "Redis Cluster (StatefulSet)"
        Redis1[Redis Pod 1<br/>Leader]
        Redis2[Redis Pod 2<br/>Follower]
        Redis3[Redis Pod 3<br/>Follower]

        Redis1 -.->|Replicate| Redis2
        Redis1 -.->|Replicate| Redis3
    end

    subgraph "PgBouncer"
        PgB1[PgBouncer Pod 1]
        PgB2[PgBouncer Pod 2]
    end

    Backend -->|Cache GET/SET| Redis1
    Backend -->|SQL Query| PgB1
    Backend -->|SQL Query| PgB2

    PgB1 -->|Connection Pool| RDS[(RDS PostgreSQL)]
    PgB2 -->|Connection Pool| RDS
```

**Redis:**

- StatefulSet for persistent storage
- 3 replicas for high availability
- Used for: Session storage, API response caching, rate limiting
- Persistence: RDB snapshots + AOF logs

**PgBouncer:**

- Connection pooling to reduce database load
- Transaction-level pooling mode
- Max connections: 100 per pod
- Reduces connection overhead to RDS

**Amazon RDS PostgreSQL:**

- Managed database service (external to cluster)
- Multi-AZ deployment for failover
- Automated backups to S3
- Point-in-time recovery (PITR)

### 4. Security Architecture

The system implements defense-in-depth security with multiple layers.

```mermaid
graph TB
    subgraph "Security Layers"
        NP[Network Policies<br/>Zero-Trust Networking]
        RBAC[RBAC<br/>Service Accounts]
        PSS[Pod Security Standards<br/>Restricted Profile]
        ES[External Secrets<br/>AWS Secrets Manager]
    end

    subgraph "Network Segmentation"
        FE_Net[Frontend Network]
        BE_Net[Backend Network]
        DB_Net[Database Network]
        Cache_Net[Redis Network]
    end

    NP -->|Enforce| FE_Net
    NP -->|Enforce| BE_Net
    NP -->|Enforce| DB_Net
    NP -->|Enforce| Cache_Net

    FE_Net -->|Allow HTTP| BE_Net
    BE_Net -->|Allow SQL| DB_Net
    BE_Net -->|Allow Redis| Cache_Net

    RBAC -->|Limit Permissions| FE_Net
    RBAC -->|Limit Permissions| BE_Net

    PSS -->|Security Context| FE_Net
    PSS -->|Security Context| BE_Net

    ES -->|Inject Secrets| BE_Net
```

**Network Policies:**

- Default deny-all ingress/egress
- Explicit allow rules for required traffic only
- DNS always allowed for service discovery
- Frontend → Backend only
- Backend → Database, Redis only

**RBAC (Role-Based Access Control):**

- Dedicated service accounts per component
- Least-privilege principle
- Backend: Secrets read access, ConfigMap read access
- Frontend: ConfigMap read access only

**Pod Security Standards:**

- Restricted profile enforced
- `runAsNonRoot: true`
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`
- All Linux capabilities dropped

**External Secrets:**

- Secrets stored in AWS Secrets Manager (not in Git)
- External Secrets Operator syncs secrets to Kubernetes
- Automatic rotation every 90 days
- Secrets include: DB credentials, JWT keys, API keys

### 5. Observability Stack

Comprehensive monitoring, logging, and alerting for production operations.

```mermaid
graph TB
    subgraph "Metrics Pipeline"
        Apps[Applications<br/>Frontend, Backend]
        Prometheus[Prometheus<br/>Metrics Storage]
        Grafana[Grafana<br/>Visualization]
        AM[AlertManager<br/>Alert Routing]
    end

    subgraph "Logging Pipeline"
        Promtail[Promtail<br/>DaemonSet<br/>Log Collector]
        Loki[Loki<br/>Log Aggregation]
    end

    subgraph "Alerting Channels"
        Slack[Slack]
        PagerDuty[PagerDuty]
        Email[Email]
    end

    Apps -->|Expose /metrics| Prometheus
    Prometheus -->|Query| Grafana
    Prometheus -->|Fire Alerts| AM

    Apps -->|stdout/stderr| Promtail
    Promtail -->|Ship Logs| Loki
    Loki -->|Query| Grafana

    AM -->|Critical| PagerDuty
    AM -->|Warning| Slack
    AM -->|Info| Email
```

**Prometheus:**

- Scrapes metrics from all pods every 15 seconds
- Retention: 30 days
- Metrics: CPU, memory, request rate, error rate, latency

**Grafana:**

- Pre-built dashboards for: Application overview, Kubernetes cluster, Database performance
- LogQL queries for Loki logs
- Alerting visualization

**Loki:**

- Log aggregation from all pods
- Structured logging with JSON format
- Retention: 7 days
- LogQL for querying logs

**AlertManager:**

- Routes alerts based on severity
- Critical → PagerDuty (24/7 on-call)
- Warning → Slack (#hospital-erp-alerts)
- Info → Email

**Key Alerts:**

- High error rate (>5% for 5 minutes)
- High response time (P95 > 500ms for 5 minutes)
- Pod crash looping
- High CPU/memory usage (>90% for 10 minutes)

### 6. GitOps Deployment

ArgoCD manages continuous deployment with Git as the single source of truth.

```mermaid
graph LR
    subgraph "Git Repository"
        Manifests[Kubernetes Manifests<br/>k8s/]
        Overlays[Environment Overlays<br/>dev/staging/prod]
    end

    subgraph "ArgoCD"
        App[Application CRDs]
        Sync[Auto-Sync Engine]
    end

    subgraph "Kubernetes Cluster"
        Dev[Development Namespace]
        Staging[Staging Namespace]
        Prod[Production Namespace]
    end

    Manifests -->|Monitor| App
    Overlays -->|Monitor| App
    App -->|Sync| Sync
    Sync -->|Deploy| Dev
    Sync -->|Deploy| Staging
    Sync -->|Deploy| Prod
```

**ArgoCD Features:**

- Automatic synchronization every 3 minutes
- Git webhook triggers for faster deployment
- Rollback capability to any previous Git commit
- Health status monitoring for all resources
- Self-healing: Detects and fixes configuration drift

**Deployment Flow:**

1. Developer commits changes to `k8s/` directory
2. ArgoCD detects changes via Git polling or webhook
3. ArgoCD applies changes to target environment
4. Health checks ensure successful deployment
5. Rollback automatically if health checks fail

**Environment Progression:**

- Development → Auto-deploy on every commit
- Staging → Auto-deploy after successful dev deployment
- Production → Manual approval required (via ArgoCD UI)

## Network Topology

```mermaid
graph TB
    subgraph "Internet (Public)"
        Users[Users/Clients]
        LetsEncrypt[Let's Encrypt<br/>ACME Server]
    end

    subgraph "Kubernetes Cluster (VPC)"
        subgraph "Public Subnet"
            Ingress[NGINX Ingress<br/>LoadBalancer Service]
        end

        subgraph "Private Subnet 1"
            Frontend[Frontend Pods]
            Backend[Backend Pods]
        end

        subgraph "Private Subnet 2"
            Redis[Redis StatefulSet]
            PgBouncer[PgBouncer]
        end

        subgraph "Private Subnet 3 (Monitoring)"
            Prometheus[Prometheus]
            Loki[Loki]
            Grafana[Grafana]
        end
    end

    subgraph "AWS Services (External)"
        RDS[(RDS PostgreSQL<br/>Multi-AZ)]
        SM[Secrets Manager]
        S3[S3<br/>Backups]
    end

    Users -->|HTTPS :443| Ingress
    LetsEncrypt -->|ACME Challenge :80| Ingress
    Ingress -->|HTTP| Frontend
    Ingress -->|HTTP| Backend
    Frontend -->|HTTP| Backend
    Backend -->|Redis| Redis
    Backend -->|PostgreSQL| PgBouncer
    PgBouncer -->|PostgreSQL| RDS
    Backend -.->|HTTPS| SM
    Prometheus -->|Scrape| Backend
    Prometheus -->|Scrape| Frontend
    Loki -->|Collect| Backend
    Loki -->|Collect| Frontend
    RDS -.->|Backup| S3
```

**Network Segmentation:**

- **Public Subnet**: Only ingress controller exposed to internet
- **Private Subnet 1**: Application pods (no direct internet access)
- **Private Subnet 2**: Data layer (restricted access)
- **Private Subnet 3**: Monitoring stack (internal only)

**Network Policies:**

- Default deny all traffic
- Explicit allow rules for required communication
- Egress to AWS services via VPC endpoints (no internet gateway)

## Data Flow Diagrams

### User Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Ingress
    participant Frontend
    participant Backend
    participant Redis
    participant PgBouncer
    participant RDS

    User->>Ingress: HTTPS Request
    Ingress->>Frontend: Route to Next.js
    Frontend->>Backend: API Call (JWT in header)
    Backend->>Backend: Validate JWT
    Backend->>Redis: Check cache

    alt Cache hit
        Redis-->>Backend: Return cached data
        Backend-->>Frontend: JSON response
    else Cache miss
        Backend->>PgBouncer: SQL query
        PgBouncer->>RDS: Execute query
        RDS-->>PgBouncer: Query result
        PgBouncer-->>Backend: Result set
        Backend->>Redis: Store in cache (TTL: 5m)
        Backend-->>Frontend: JSON response
    end

    Frontend-->>Ingress: HTML response
    Ingress-->>User: HTTPS Response
```

### Monitoring Data Flow

```mermaid
sequenceDiagram
    participant App as Application Pod
    participant Promtail
    participant Prometheus
    participant Loki
    participant Grafana
    participant AlertManager

    App->>App: Log to stdout
    App->>App: Expose /metrics endpoint

    Promtail->>App: Read container logs
    Promtail->>Loki: Ship logs

    Prometheus->>App: Scrape /metrics (15s interval)
    Prometheus->>Prometheus: Evaluate alert rules

    alt Alert condition met
        Prometheus->>AlertManager: Fire alert
        AlertManager->>AlertManager: Group and deduplicate
        AlertManager->>Slack/PagerDuty: Send notification
    end

    Grafana->>Prometheus: Query metrics
    Grafana->>Loki: Query logs
    Grafana->>Grafana: Render dashboards
```

### Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Repository
    participant ArgoCD
    participant K8s as Kubernetes API
    participant Pods as Application Pods

    Dev->>Git: git push (k8s manifests)
    Git->>ArgoCD: Webhook trigger
    ArgoCD->>Git: Fetch latest manifests
    ArgoCD->>ArgoCD: Compare with cluster state

    alt Changes detected
        ArgoCD->>K8s: Apply manifests
        K8s->>Pods: Rolling update
        Pods->>Pods: Health checks

        alt Health checks pass
            Pods->>K8s: Report healthy
            K8s->>ArgoCD: Sync successful
        else Health checks fail
            Pods->>K8s: Report unhealthy
            K8s->>ArgoCD: Sync failed
            ArgoCD->>K8s: Rollback to previous version
        end
    end

    ArgoCD->>ArgoCD: Update sync status
```

## Scalability and High Availability

### Horizontal Pod Autoscaling

| Component | Min Replicas       | Max Replicas | Target CPU | Target Memory |
| --------- | ------------------ | ------------ | ---------- | ------------- |
| Frontend  | 1 (dev) / 3 (prod) | 10           | 70%        | 80%           |
| Backend   | 1 (dev) / 3 (prod) | 10           | 70%        | 80%           |
| PgBouncer | 2                  | 5            | 60%        | -             |
| Redis     | 3 (fixed)          | 3 (fixed)    | -          | -             |

### Pod Disruption Budgets

| Component | Min Available | Max Unavailable |
| --------- | ------------- | --------------- |
| Frontend  | 50%           | -               |
| Backend   | 50%           | -               |
| Redis     | 2             | 1               |

**Purpose**: Ensures minimum availability during voluntary disruptions (node drains, cluster upgrades).

### Resource Limits and Requests

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
| --------- | ----------- | --------- | -------------- | ------------ |
| Frontend  | 100m        | 500m      | 128Mi          | 512Mi        |
| Backend   | 250m        | 1000m     | 512Mi          | 1Gi          |
| Redis     | 100m        | 500m      | 256Mi          | 512Mi        |
| PgBouncer | 50m         | 200m      | 64Mi           | 128Mi        |

### Multi-AZ Deployment

```mermaid
graph TB
    subgraph "Availability Zone 1"
        Node1[Node 1]
        FE1[Frontend Pod 1]
        BE1[Backend Pod 1]
        Redis1[Redis Leader]

        Node1 --> FE1
        Node1 --> BE1
        Node1 --> Redis1
    end

    subgraph "Availability Zone 2"
        Node2[Node 2]
        FE2[Frontend Pod 2]
        BE2[Backend Pod 2]
        Redis2[Redis Follower]

        Node2 --> FE2
        Node2 --> BE2
        Node2 --> Redis2
    end

    subgraph "Availability Zone 3"
        Node3[Node 3]
        FE3[Frontend Pod 3]
        BE3[Backend Pod 3]
        Redis3[Redis Follower]

        Node3 --> FE3
        Node3 --> BE3
        Node3 --> Redis3
    end

    Redis1 -.->|Replicate| Redis2
    Redis1 -.->|Replicate| Redis3
```

**Pod Anti-Affinity:**

- Pods of the same type are spread across different availability zones
- Prevents single AZ failure from taking down all instances
- Configured via `topologySpreadConstraints`

## Disaster Recovery

### Backup Strategy

| Component            | Backup Method       | Frequency            | Retention       |
| -------------------- | ------------------- | -------------------- | --------------- |
| RDS PostgreSQL       | Automated snapshots | Daily                | 7 days          |
| RDS PostgreSQL       | Manual snapshots    | Before major changes | 30 days         |
| Redis                | RDB snapshots       | Every 5 minutes      | 1 day           |
| Kubernetes manifests | Git repository      | On every commit      | Indefinite      |
| Secrets              | AWS Secrets Manager | Continuous           | Version history |

### Recovery Time Objectives

| Scenario         | RTO          | RPO              | Recovery Procedure                      |
| ---------------- | ------------ | ---------------- | --------------------------------------- |
| Pod failure      | < 1 minute   | 0 (no data loss) | Automatic (Kubernetes)                  |
| Node failure     | < 5 minutes  | 0 (no data loss) | Automatic (Pod rescheduling)            |
| AZ failure       | < 10 minutes | 0 (no data loss) | Automatic (Multi-AZ)                    |
| Database failure | < 30 minutes | < 5 minutes      | Restore from RDS snapshot               |
| Cluster failure  | < 2 hours    | < 1 hour         | Rebuild cluster, restore from Git + RDS |
| Region failure   | < 4 hours    | < 1 hour         | Failover to DR region (manual)          |

### Health Checks

All pods implement:

- **Liveness probe**: Detects crashed/frozen processes (restart pod)
- **Readiness probe**: Detects when pod is ready to serve traffic (add to service endpoints)
- **Startup probe**: Allows slow-starting containers extra time to initialize

```yaml
# Example health checks (Backend)
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

## Configuration Management

### Kustomize Overlays

The system uses Kustomize for environment-specific configuration:

```
k8s/
├── base/                    # Base configuration (shared)
│   ├── backend/
│   ├── frontend/
│   ├── redis/
│   └── kustomization.yaml
└── overlays/
    ├── development/         # Dev-specific overrides
    │   ├── patches/
    │   └── kustomization.yaml
    ├── staging/             # Staging-specific overrides
    │   ├── patches/
    │   └── kustomization.yaml
    └── production/          # Prod-specific overrides
        ├── patches/
        └── kustomization.yaml
```

**Environment Differences:**

- **Development**: Lower resource limits, 1 replica, debug logging enabled
- **Staging**: Production-like resources, 2 replicas, info logging
- **Production**: Full resources, 3+ replicas, warn/error logging, stricter security

### ConfigMaps vs Secrets

| Configuration Type   | Storage                                | Example                                      |
| -------------------- | -------------------------------------- | -------------------------------------------- |
| Non-sensitive config | ConfigMap (in Git)                     | API endpoints, feature flags, timeout values |
| Sensitive config     | External Secrets (AWS Secrets Manager) | DB passwords, JWT keys, API keys             |

## Technology Stack Summary

| Layer              | Technology                | Version |
| ------------------ | ------------------------- | ------- |
| Orchestration      | Kubernetes                | 1.28+   |
| GitOps             | ArgoCD                    | 2.9+    |
| Manifests          | Kustomize                 | 5.0+    |
| Ingress            | NGINX Ingress Controller  | 1.9+    |
| TLS                | cert-manager              | 1.13+   |
| Secrets            | External Secrets Operator | 0.9+    |
| Monitoring         | Prometheus                | 2.47+   |
| Logging            | Loki                      | 2.9+    |
| Dashboards         | Grafana                   | 10.2+   |
| Caching            | Redis                     | 7.2+    |
| Connection Pooling | PgBouncer                 | 1.21+   |
| Database           | PostgreSQL (RDS)          | 15+     |

## References

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [External Secrets Operator](https://external-secrets.io/)
