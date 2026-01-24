# ArgoCD GitOps Configuration

This directory contains ArgoCD configuration for GitOps-based continuous deployment of the Hospital ERP System.

## Overview

ArgoCD automatically syncs the Kubernetes cluster state with the Git repository, ensuring declarative and version-controlled deployments.

## Architecture

```
Git Repository (Source of Truth)
       ↓
  ArgoCD (Sync)
       ↓
Kubernetes Cluster (Target)
```

## Directory Structure

```
k8s/argocd/
├── README.md                      # This file
├── ingress.yaml                   # ArgoCD UI ingress configuration
├── project.yaml                   # AppProject with RBAC
├── kustomization.yaml            # Kustomize configuration
└── applications/
    ├── production.yaml           # Production environment application
    ├── staging.yaml              # Staging environment application
    └── development.yaml          # Development environment application
```

## Installation

### 1. Install ArgoCD

Use the provided installation script:

```bash
./scripts/k8s/install-argocd.sh
```

Or manually:

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s \
    deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### 2. Apply ArgoCD Configurations

```bash
# Apply all ArgoCD resources
kubectl apply -k k8s/argocd/
```

### 3. Access ArgoCD UI

#### Option 1: Port Forward (Development)

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open: https://localhost:8080

#### Option 2: Ingress (Production)

Access via configured ingress: https://argocd.hospital.example.com

**Note**: Update the hostname in `ingress.yaml` to match your domain.

### 4. Login

- Username: `admin`
- Password: Retrieved from step 1

**Important**: Change the password after first login!

```bash
argocd account update-password
```

## Applications

### Production

- **Name**: `hospital-erp-production`
- **Source**: `main` branch
- **Path**: `k8s/overlays/production`
- **Namespace**: `hospital-erp-system`
- **Sync**: Automated with self-heal

### Staging

- **Name**: `hospital-erp-staging`
- **Source**: `develop` branch
- **Path**: `k8s/overlays/staging`
- **Namespace**: `hospital-erp-staging`
- **Sync**: Automated with self-heal

### Development

- **Name**: `hospital-erp-development`
- **Source**: `develop` branch
- **Path**: `k8s/overlays/development`
- **Namespace**: `hospital-erp-dev`
- **Sync**: Automated with self-heal

## Sync Policies

All applications are configured with:

- **Automated Sync**: Changes in Git automatically trigger deployment
- **Self-Heal**: Cluster state automatically reverts to Git state if manually changed
- **Prune**: Resources removed from Git are deleted from cluster
- **Retry**: Failed syncs retry with exponential backoff

## Common Operations

### Manual Sync

Force a manual sync of an application:

```bash
./scripts/k8s/argocd-sync.sh hospital-erp-production
```

Or using ArgoCD CLI:

```bash
argocd app sync hospital-erp-production
```

### Rollback

Rollback to a previous revision:

```bash
# List revisions
argocd app history hospital-erp-production

# Rollback to specific revision
./scripts/k8s/argocd-rollback.sh hospital-erp-production 5
```

### View Application Status

```bash
# Using CLI
argocd app get hospital-erp-production

# Using kubectl
kubectl get applications -n argocd

# View detailed status
argocd app get hospital-erp-production --show-operation
```

### View Sync Diff

See what will be deployed before syncing:

```bash
argocd app diff hospital-erp-production
```

### Pause Auto-Sync

Temporarily disable auto-sync:

```bash
argocd app set hospital-erp-production --sync-policy none
```

Re-enable auto-sync:

```bash
argocd app set hospital-erp-production --sync-policy automated --auto-prune --self-heal
```

## Troubleshooting

### Application Not Syncing

1. Check application status:

   ```bash
   argocd app get hospital-erp-production
   ```

2. View sync errors:

   ```bash
   argocd app get hospital-erp-production --show-operation
   ```

3. Check ArgoCD logs:
   ```bash
   kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
   ```

### Out of Sync Issues

If auto-sync is enabled but application shows "OutOfSync":

1. Check if manual changes were made to cluster
2. Review sync policy settings
3. Force sync:
   ```bash
   argocd app sync hospital-erp-production --force
   ```

### Health Check Failures

View resource health status:

```bash
argocd app get hospital-erp-production --show-params
```

Check individual resource status:

```bash
kubectl get all -n hospital-erp-system
```

## Security Best Practices

### 1. Change Default Password

After installation, immediately change the admin password:

```bash
argocd account update-password
```

### 2. Configure RBAC

The `project.yaml` includes RBAC roles:

- **read-only**: View-only access for monitoring
- **ci-role**: CI/CD automation access

Create additional roles as needed.

### 3. Enable SSO (Optional)

Configure SSO integration for team authentication:

```yaml
# argocd-cm ConfigMap
data:
  url: https://argocd.hospital.example.com
  dex.config: |
    connectors:
      - type: github
        id: github
        name: GitHub
        config:
          clientID: $GITHUB_CLIENT_ID
          clientSecret: $GITHUB_CLIENT_SECRET
          orgs:
            - name: your-organization
```

### 4. Network Policies

Ensure NetworkPolicies are applied to restrict ArgoCD access.

### 5. TLS/SSL

The ingress configuration includes TLS with cert-manager:

- Issuer: `letsencrypt-prod`
- Secret: `argocd-tls`

Update the cluster issuer if using a different certificate provider.

## GitOps Workflow

### Standard Deployment Flow

1. **Develop**: Make changes in feature branch
2. **Test**: Deploy to development environment (auto-sync from `develop`)
3. **Stage**: Merge to `develop`, auto-deploy to staging
4. **Verify**: QA testing in staging environment
5. **Release**: Merge to `main`, auto-deploy to production
6. **Monitor**: Watch ArgoCD and application metrics

### Emergency Rollback

In case of production issues:

```bash
# View recent revisions
argocd app history hospital-erp-production

# Rollback to last known good revision
./scripts/k8s/argocd-rollback.sh hospital-erp-production <revision-number>
```

## Monitoring

### ArgoCD Metrics

ArgoCD exposes Prometheus metrics at:

- `/metrics` endpoint on each component

Configure Prometheus to scrape these endpoints (see `k8s/monitoring/prometheus/`).

### Key Metrics to Monitor

- `argocd_app_sync_total`: Total sync operations
- `argocd_app_health_status`: Application health status
- `argocd_app_sync_status`: Sync status (Synced/OutOfSync)

### Grafana Dashboards

Import official ArgoCD Grafana dashboard:

- Dashboard ID: 14584

## References

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)
- [GitOps Principles](https://opengitops.dev/)

## Support

For issues or questions:

1. Check [ArgoCD Troubleshooting Guide](https://argo-cd.readthedocs.io/en/stable/operator-manual/troubleshooting/)
2. Review application logs in ArgoCD UI
3. Check Kubernetes events: `kubectl get events -n <namespace>`
