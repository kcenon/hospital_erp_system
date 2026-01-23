# Kubernetes Manifests

This directory contains Kubernetes manifests for the Hospital ERP System using Kustomize for environment-specific configurations.

## Directory Structure

```
k8s/
├── base/                          # Base configurations (shared across all environments)
│   ├── kustomization.yaml         # Base kustomization file
│   ├── namespace.yaml             # Namespace definition
│   ├── backend/                   # Backend (NestJS) deployment and service
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── frontend/                  # Frontend (Next.js) deployment and service
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── database/                  # PostgreSQL manifests (TODO)
│   ├── cache/                     # Redis manifests (TODO)
│   ├── ingress/                   # Ingress controller configuration (TODO)
│   ├── configmaps/                # ConfigMaps for application configuration (TODO)
│   ├── secrets/                   # External Secrets configuration (TODO)
│   ├── network-policies/          # Network policies for security (TODO)
│   ├── rbac/                      # RBAC and service accounts (TODO)
│   └── pdb/                       # Pod Disruption Budgets (TODO)
├── overlays/                      # Environment-specific configurations
│   ├── development/               # Development environment
│   │   └── kustomization.yaml
│   ├── staging/                   # Staging environment
│   │   └── kustomization.yaml
│   └── production/                # Production environment
│       └── kustomization.yaml
└── monitoring/                    # Monitoring stack (Prometheus, Grafana, Loki)
```

## Usage

### Preview manifests

```bash
# Base configuration
kubectl kustomize k8s/base

# Development environment
kubectl kustomize k8s/overlays/development

# Staging environment
kubectl kustomize k8s/overlays/staging

# Production environment
kubectl kustomize k8s/overlays/production
```

### Apply manifests

```bash
# Apply to development environment
kubectl apply -k k8s/overlays/development

# Apply to staging environment
kubectl apply -k k8s/overlays/staging

# Apply to production environment
kubectl apply -k k8s/overlays/production
```

### Delete resources

```bash
kubectl delete -k k8s/overlays/development
```

## Environment Differences

| Component         | Development      | Staging              | Production        |
| ----------------- | ---------------- | -------------------- | ----------------- |
| Namespace         | hospital-erp-dev | hospital-erp-staging | hospital-erp-prod |
| Backend replicas  | 1                | 2                    | 3                 |
| Frontend replicas | 1                | 2                    | 3                 |
| Image tag         | dev              | staging              | stable            |

## Security Features

- Pod Security Standards: `restricted` profile enforced
- Security contexts configured for all containers:
  - `runAsNonRoot: true`
  - `readOnlyRootFilesystem: true`
  - `allowPrivilegeEscalation: false`
  - All capabilities dropped

## Labels

All resources include standard Kubernetes recommended labels:

- `app.kubernetes.io/name`: Component name
- `app.kubernetes.io/component`: Component type (api, web, etc.)
- `app.kubernetes.io/part-of`: hospital-erp-system
- `app.kubernetes.io/managed-by`: kustomize
- `environment`: Environment name (development, staging, production)

## Related Issues

- #117 - Kubernetes Deployment Implementation (Epic)
- #118 - Kubernetes Base Manifests Structure Setup (This issue)
- #119 - Backend Deployment and Service Configuration
- #120 - Frontend Deployment and Service Configuration
- #121 - Ingress Controller and TLS Configuration
- #122 - ConfigMaps and External Secrets Setup
- #123 - Redis Cluster Configuration
- #124 - Network Policies Implementation
- #125 - RBAC and Service Accounts Setup
- #126 - HorizontalPodAutoscaler Configuration
- #127 - Pod Disruption Budgets Setup
- #128 - Prometheus and Grafana Monitoring Stack
- #129 - Loki Logging Stack Setup
- #130 - Alerting Rules Configuration
