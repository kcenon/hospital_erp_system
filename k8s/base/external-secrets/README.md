# External Secrets Operator Setup

This directory contains External Secrets Operator configuration for secure secrets management.

## Prerequisites

### 1. Install External Secrets Operator

```bash
# Add Helm repository
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install External Secrets Operator
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --wait
```

### 2. Configure AWS IRSA (IAM Roles for Service Accounts)

Create an IAM role with the following policy for Secrets Manager access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
      "Resource": "arn:aws:secretsmanager:ap-northeast-2:*:secret:hospital-erp/*"
    }
  ]
}
```

### 3. Create Secrets in AWS Secrets Manager

Create the following secrets in AWS Secrets Manager:

- `hospital-erp/database` - Database credentials
- `hospital-erp/backend` - Backend application secrets (JWT keys, API keys)
- `hospital-erp/redis` - Redis authentication

Example secret structure for `hospital-erp/database`:

```json
{
  "url": "postgresql://user:password@host:5432/dbname",
  "host": "your-rds-endpoint",
  "port": "5432",
  "username": "db_user",
  "password": "db_password",
  "database": "hospital_erp"
}
```

## Files

- `cluster-secret-store.yaml` - ClusterSecretStore configuration for AWS Secrets Manager
- `external-secret-database.yaml` - ExternalSecret for database credentials
- `external-secret-backend.yaml` - ExternalSecret for backend secrets
- `external-secret-redis.yaml` - ExternalSecret for Redis credentials

## Verification

```bash
# Check ClusterSecretStore status
kubectl get clustersecretstore aws-secrets-manager -o yaml

# Check ExternalSecrets sync status
kubectl get externalsecret -n hospital-erp-system

# Verify secrets are created
kubectl get secrets -n hospital-erp-system
```

## Troubleshooting

If secrets are not syncing:

1. Check External Secrets Operator logs: `kubectl logs -n external-secrets -l app.kubernetes.io/name=external-secrets`
2. Verify IRSA configuration: `kubectl describe sa -n hospital-erp-system`
3. Check SecretStore status: `kubectl describe clustersecretstore aws-secrets-manager`
