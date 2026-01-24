# Kubernetes Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cluster Setup](#cluster-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools

Ensure the following tools are installed before proceeding:

| Tool       | Version | Installation                                                                    |
| ---------- | ------- | ------------------------------------------------------------------------------- |
| kubectl    | 1.28+   | [Install kubectl](https://kubernetes.io/docs/tasks/tools/)                      |
| kustomize  | 5.0+    | [Install kustomize](https://kubectl.docs.kubernetes.io/installation/kustomize/) |
| helm       | 3.12+   | [Install helm](https://helm.sh/docs/intro/install/)                             |
| argocd CLI | 2.9+    | [Install argocd](https://argo-cd.readthedocs.io/en/stable/cli_installation/)    |
| AWS CLI    | 2.x     | [Install AWS CLI](https://aws.amazon.com/cli/)                                  |

```bash
# Verify installations
kubectl version --client
kustomize version
helm version
argocd version --client
aws --version
```

### AWS Resources (Required)

Before deploying, ensure these AWS resources exist:

- [ ] **RDS PostgreSQL Instance**
  - Engine: PostgreSQL 15+
  - Multi-AZ: Enabled
  - Instance class: db.t3.medium (minimum for staging/prod)
  - Storage: 100 GB with autoscaling enabled
  - Backup retention: 7 days

- [ ] **AWS Secrets Manager**
  - Secrets created for: Database credentials, JWT keys, API keys
  - KMS key for encryption

- [ ] **S3 Bucket**
  - For RDS backups (optional, RDS automated backups enabled)
  - For application file uploads (if applicable)

- [ ] **IAM Roles**
  - EKS cluster role
  - EKS node group role
  - External Secrets Operator IRSA role

### Kubernetes Cluster Requirements

| Resource     | Development    | Staging         | Production      |
| ------------ | -------------- | --------------- | --------------- |
| Nodes        | 2              | 3               | 3+ (multi-AZ)   |
| Node type    | t3.medium      | t3.large        | t3.xlarge       |
| Total vCPU   | 4              | 12              | 16+             |
| Total Memory | 8 GB           | 24 GB           | 32 GB+          |
| Storage      | 50 GB per node | 100 GB per node | 200 GB per node |

### Network Requirements

- **Public subnets**: For load balancers (ingress controller)
- **Private subnets**: For application and data pods
- **VPC endpoints** (recommended): For AWS services (Secrets Manager, S3, ECR)
- **Security groups**:
  - Allow inbound 443 (HTTPS) to ingress controller
  - Allow inbound 80 (HTTP) for ACME challenge (Let's Encrypt)
  - Allow inbound 6443 (Kubernetes API) for kubectl access

## Cluster Setup

### Option 1: Amazon EKS (Recommended for Production)

#### 1.1 Create EKS Cluster

```bash
# Set variables
export CLUSTER_NAME=hospital-erp-cluster
export REGION=us-east-1
export K8S_VERSION=1.28

# Create EKS cluster
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --version $K8S_VERSION \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed \
  --zones ${REGION}a,${REGION}b,${REGION}c

# Wait for cluster to be ready (10-20 minutes)
aws eks wait cluster-active --name $CLUSTER_NAME --region $REGION
```

#### 1.2 Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION

# Verify connectivity
kubectl get nodes
kubectl get namespaces
```

#### 1.3 Install EBS CSI Driver (for persistent volumes)

```bash
# Create IAM policy and role for EBS CSI driver
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster $CLUSTER_NAME \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name AmazonEKS_EBS_CSI_DriverRole

# Install EBS CSI driver add-on
aws eks create-addon --cluster-name $CLUSTER_NAME --addon-name aws-ebs-csi-driver \
  --service-account-role-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AmazonEKS_EBS_CSI_DriverRole
```

### Option 2: Kind (For Local Development)

```bash
# Create kind cluster with ingress-ready configuration
cat <<EOF | kind create cluster --name hospital-erp --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
- role: worker
EOF

# Verify cluster
kubectl cluster-info --context kind-hospital-erp
```

### Option 3: Minikube (For Local Development)

```bash
# Start minikube with sufficient resources
minikube start \
  --cpus=4 \
  --memory=8192 \
  --disk-size=50g \
  --kubernetes-version=v1.28.0

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server
```

## Environment Configuration

### 1. External Secrets Operator Setup

#### 1.1 Install External Secrets Operator

```bash
# Add helm repository
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install operator
helm install external-secrets \
  external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --set installCRDs=true

# Verify installation
kubectl get pods -n external-secrets
kubectl get crd | grep externalsecrets
```

#### 1.2 Create IAM Role for External Secrets (EKS only)

```bash
# Create IRSA for External Secrets
eksctl create iamserviceaccount \
  --name external-secrets-sa \
  --namespace hospital-erp-system \
  --cluster $CLUSTER_NAME \
  --attach-policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite \
  --approve
```

#### 1.3 Configure Secrets in AWS Secrets Manager

```bash
# Database credentials
aws secretsmanager create-secret \
  --name hospital-erp/database/credentials \
  --description "RDS PostgreSQL credentials" \
  --secret-string '{
    "username": "hospitaladmin",
    "password": "CHANGE_ME_STRONG_PASSWORD",
    "host": "hospital-erp-db.xxxx.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "database": "hospital_erp"
  }'

# Backend application secrets
aws secretsmanager create-secret \
  --name hospital-erp/backend/secrets \
  --description "Backend application secrets" \
  --secret-string '{
    "JWT_SECRET": "CHANGE_ME_RANDOM_64_CHAR_STRING",
    "JWT_REFRESH_SECRET": "CHANGE_ME_ANOTHER_RANDOM_64_CHAR_STRING",
    "ENCRYPTION_KEY": "CHANGE_ME_32_CHAR_KEY"
  }'

# Redis connection
aws secretsmanager create-secret \
  --name hospital-erp/redis/password \
  --description "Redis password" \
  --secret-string '{
    "password": "CHANGE_ME_REDIS_PASSWORD"
  }'

# Verify secrets created
aws secretsmanager list-secrets --filters Key=name,Values=hospital-erp/
```

### 2. Create Namespace and Labels

```bash
# Create namespace
kubectl create namespace hospital-erp-system

# Label namespace for monitoring
kubectl label namespace hospital-erp-system \
  environment=production \
  app.kubernetes.io/part-of=hospital-erp-system

# Verify namespace
kubectl get namespace hospital-erp-system --show-labels
```

### 3. Configure Environment Variables

#### 3.1 Development Environment

```bash
# Edit development kustomization
cat > k8s/overlays/development/configmap-env.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  NODE_ENV: "development"
  LOG_LEVEL: "debug"
  API_BASE_URL: "http://localhost:3000"
  FRONTEND_URL: "http://localhost:3001"
  CORS_ORIGINS: "http://localhost:3001,http://localhost:3000"
EOF
```

#### 3.2 Staging Environment

```bash
# Edit staging kustomization
cat > k8s/overlays/staging/configmap-env.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  NODE_ENV: "staging"
  LOG_LEVEL: "info"
  API_BASE_URL: "https://api.staging.hospital-erp.example.com"
  FRONTEND_URL: "https://staging.hospital-erp.example.com"
  CORS_ORIGINS: "https://staging.hospital-erp.example.com"
EOF
```

#### 3.3 Production Environment

```bash
# Edit production kustomization
cat > k8s/overlays/production/configmap-env.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "warn"
  API_BASE_URL: "https://api.hospital-erp.example.com"
  FRONTEND_URL: "https://hospital-erp.example.com"
  CORS_ORIGINS: "https://hospital-erp.example.com"
EOF
```

## Deployment Steps

### Step 1: Install Core Infrastructure

#### 1.1 Install NGINX Ingress Controller

```bash
# Add helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb"

# Wait for LoadBalancer IP/hostname
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Get LoadBalancer address
kubectl get service -n ingress-nginx ingress-nginx-controller
```

**Expected output:**

```
NAME                       TYPE           EXTERNAL-IP
ingress-nginx-controller   LoadBalancer   a1b2c3.us-east-1.elb.amazonaws.com
```

#### 1.2 Install cert-manager (TLS Certificates)

```bash
# Install cert-manager CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s

# Verify installation
kubectl get pods -n cert-manager
```

### Step 2: Deploy Monitoring Stack (Optional but Recommended)

#### 2.1 Install Prometheus and Grafana

```bash
# Add helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack (Prometheus + Grafana + Alertmanager)
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.enabled=true \
  --set grafana.adminPassword=CHANGE_ME_ADMIN_PASSWORD

# Verify installation
kubectl get pods -n monitoring
```

#### 2.2 Deploy Loki for Log Aggregation

```bash
# Apply Loki stack from k8s/monitoring/loki
kubectl apply -k k8s/monitoring/loki

# Verify Loki deployment
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki
kubectl get pods -n monitoring -l app.kubernetes.io/name=promtail
```

### Step 3: Deploy Application

#### 3.1 Preview Manifests (Dry Run)

```bash
# Preview what will be deployed (development environment)
kubectl kustomize k8s/overlays/development

# Preview staging environment
kubectl kustomize k8s/overlays/staging

# Preview production environment
kubectl kustomize k8s/overlays/production
```

#### 3.2 Deploy to Development Environment

```bash
# Apply development manifests
kubectl apply -k k8s/overlays/development

# Watch deployment progress
kubectl get pods -n hospital-erp-system --watch
```

**Expected output:**

```
NAME                        READY   STATUS    RESTARTS   AGE
backend-xxx-yyy             1/1     Running   0          2m
frontend-xxx-zzz            1/1     Running   0          2m
redis-0                     1/1     Running   0          3m
```

#### 3.3 Deploy to Staging/Production

```bash
# Apply staging manifests
kubectl apply -k k8s/overlays/staging

# Or apply production manifests
kubectl apply -k k8s/overlays/production

# Monitor deployment
kubectl rollout status deployment/backend -n hospital-erp-system
kubectl rollout status deployment/frontend -n hospital-erp-system
```

### Step 4: Configure DNS

#### 4.1 Get LoadBalancer Address

```bash
# Get ingress controller external IP/hostname
kubectl get service -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

**Output example:**

```
a1b2c3d4e5f6-1234567890.us-east-1.elb.amazonaws.com
```

#### 4.2 Create DNS Records

Create the following DNS records in your domain registrar or Route 53:

| Type  | Name                         | Value                      | TTL |
| ----- | ---------------------------- | -------------------------- | --- |
| CNAME | www.hospital-erp.example.com | a1b2c3...elb.amazonaws.com | 300 |
| CNAME | api.hospital-erp.example.com | a1b2c3...elb.amazonaws.com | 300 |

**AWS Route 53 example:**

```bash
# Get hosted zone ID
export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='example.com.'].Id" \
  --output text)

# Get LoadBalancer DNS name
export LB_DNS=$(kubectl get service -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Create CNAME record for frontend
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.hospital-erp.example.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$LB_DNS'"}]
      }
    }]
  }'

# Create CNAME record for backend API
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.hospital-erp.example.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$LB_DNS'"}]
      }
    }]
  }'
```

### Step 5: Verify TLS Certificate Provisioning

```bash
# Check cert-manager certificate status
kubectl get certificate -n hospital-erp-system

# Check certificate details
kubectl describe certificate hospital-erp-tls -n hospital-erp-system

# Check ClusterIssuer status
kubectl describe clusterissuer letsencrypt-prod
```

**Expected certificate status:**

```
NAME                READY   SECRET              AGE
hospital-erp-tls    True    hospital-erp-tls    5m
```

**If certificate is not ready:**

```bash
# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager -f

# Check ACME challenge status
kubectl get challenges -n hospital-erp-system
```

## Verification

### 1. Health Checks

```bash
# Check all pods are running
kubectl get pods -n hospital-erp-system

# Check pod logs
kubectl logs -n hospital-erp-system deployment/backend --tail=50
kubectl logs -n hospital-erp-system deployment/frontend --tail=50

# Check services
kubectl get services -n hospital-erp-system

# Check ingress
kubectl get ingress -n hospital-erp-system
```

### 2. Endpoint Testing

```bash
# Test backend health endpoint (internal)
kubectl run test-pod --image=curlimages/curl --rm -it --restart=Never -- \
  curl http://backend-service.hospital-erp-system.svc.cluster.local:3000/health

# Test frontend (internal)
kubectl run test-pod --image=curlimages/curl --rm -it --restart=Never -- \
  curl http://frontend-service.hospital-erp-system.svc.cluster.local:3001

# Test public endpoints (external)
curl https://www.hospital-erp.example.com
curl https://api.hospital-erp.example.com/health
```

### 3. Database Connectivity

```bash
# Test database connection from backend pod
kubectl exec -n hospital-erp-system deployment/backend -it -- \
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    });
    pool.query('SELECT NOW()', (err, res) => {
      if (err) console.error('Connection failed:', err);
      else console.log('Connection successful:', res.rows[0]);
      pool.end();
    });
  "
```

### 4. Redis Connectivity

```bash
# Test Redis connection
kubectl exec -n hospital-erp-system statefulset/redis -it -- redis-cli ping

# Check Redis replication status
kubectl exec -n hospital-erp-system redis-0 -it -- redis-cli info replication
```

### 5. Monitoring Verification

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Open browser to http://localhost:9090/targets
# Verify all hospital-erp-system targets are UP

# Check Grafana dashboards
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open browser to http://localhost:3000
# Login with admin / CHANGE_ME_ADMIN_PASSWORD
# Navigate to Dashboards → Browse → Kubernetes
```

### 6. Log Verification

```bash
# Check logs in Loki
kubectl port-forward -n monitoring svc/loki 3100:3100

# Query logs via LogQL
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={namespace="hospital-erp-system"}' | jq .
```

## Troubleshooting

### Common Issues

#### Issue: Pods stuck in `Pending` state

**Diagnosis:**

```bash
kubectl describe pod <POD_NAME> -n hospital-erp-system
```

**Possible causes:**

1. **Insufficient resources**: Node doesn't have enough CPU/memory

   ```bash
   kubectl top nodes
   kubectl describe node <NODE_NAME>
   ```

   **Solution**: Scale up node group or reduce resource requests

2. **Pod affinity constraints**: No node matches affinity rules

   ```bash
   kubectl get pods -n hospital-erp-system -o wide
   ```

   **Solution**: Adjust pod affinity/anti-affinity rules

3. **PersistentVolumeClaim not bound**:
   ```bash
   kubectl get pvc -n hospital-erp-system
   ```
   **Solution**: Check storage class exists and has available capacity

#### Issue: Pods in `CrashLoopBackOff` state

**Diagnosis:**

```bash
kubectl logs <POD_NAME> -n hospital-erp-system --previous
kubectl describe pod <POD_NAME> -n hospital-erp-system
```

**Possible causes:**

1. **Application error on startup**: Check logs for exceptions
   **Solution**: Fix application code or configuration

2. **Failed health checks**: Liveness probe failing

   ```bash
   kubectl describe pod <POD_NAME> -n hospital-erp-system | grep -A 10 "Liveness"
   ```

   **Solution**: Increase `initialDelaySeconds` or fix health check endpoint

3. **Missing secrets/configmaps**:
   ```bash
   kubectl get secrets -n hospital-erp-system
   kubectl get configmaps -n hospital-erp-system
   ```
   **Solution**: Create missing secrets or verify External Secrets sync

#### Issue: `ImagePullBackOff` or `ErrImagePull`

**Diagnosis:**

```bash
kubectl describe pod <POD_NAME> -n hospital-erp-system | grep -A 10 "Events"
```

**Possible causes:**

1. **Image doesn't exist**: Verify image tag in deployment
   **Solution**: Build and push correct image to registry

2. **Authentication failure**: Cluster can't pull from private registry
   ```bash
   kubectl get secrets -n hospital-erp-system | grep docker
   ```
   **Solution**: Create `imagePullSecrets` with registry credentials

#### Issue: External Secrets not syncing

**Diagnosis:**

```bash
kubectl get externalsecrets -n hospital-erp-system
kubectl get secretstores -n hospital-erp-system
kubectl describe externalsecret <NAME> -n hospital-erp-system
```

**Possible causes:**

1. **IAM permissions missing**: IRSA role doesn't have Secrets Manager access
   **Solution**: Attach `SecretsManagerReadWrite` policy to IRSA role

2. **Secret doesn't exist in AWS**: Verify secret name matches

   ```bash
   aws secretsmanager list-secrets --filters Key=name,Values=hospital-erp/
   ```

   **Solution**: Create secret in AWS Secrets Manager

3. **ClusterSecretStore not configured**:
   ```bash
   kubectl describe clustersecretstore aws-secrets-manager
   ```
   **Solution**: Apply `k8s/base/external-secrets/cluster-secret-store.yaml`

#### Issue: Ingress returns 502/503 errors

**Diagnosis:**

```bash
kubectl get ingress -n hospital-erp-system
kubectl describe ingress hospital-erp-ingress -n hospital-erp-system
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=100
```

**Possible causes:**

1. **Backend pods not ready**: Readiness probes failing

   ```bash
   kubectl get pods -n hospital-erp-system -o wide
   kubectl describe pod <POD_NAME> -n hospital-erp-system
   ```

   **Solution**: Fix readiness probe failures (check logs)

2. **Service selector mismatch**: Service not routing to pods

   ```bash
   kubectl get endpoints -n hospital-erp-system
   ```

   **Solution**: Verify service selector matches pod labels

3. **Network policy blocking traffic**:
   ```bash
   kubectl get networkpolicies -n hospital-erp-system
   ```
   **Solution**: Adjust network policies to allow ingress → backend traffic

#### Issue: TLS certificate not issued

**Diagnosis:**

```bash
kubectl get certificate -n hospital-erp-system
kubectl describe certificate hospital-erp-tls -n hospital-erp-system
kubectl get challenges -n hospital-erp-system
kubectl describe challenge <CHALLENGE_NAME> -n hospital-erp-system
```

**Possible causes:**

1. **DNS not resolving**: Domain doesn't point to LoadBalancer

   ```bash
   nslookup www.hospital-erp.example.com
   ```

   **Solution**: Create/update DNS records

2. **ACME challenge failing**: HTTP-01 challenge can't reach ingress

   ```bash
   curl -I http://www.hospital-erp.example.com/.well-known/acme-challenge/test
   ```

   **Solution**: Ensure port 80 is open on LoadBalancer security group

3. **Rate limit exceeded**: Let's Encrypt rate limit hit
   **Solution**: Wait 1 hour or use staging ClusterIssuer for testing

## Rollback Procedures

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/backend -n hospital-erp-system

# Rollback to previous version
kubectl rollout undo deployment/backend -n hospital-erp-system

# Rollback to specific revision
kubectl rollout undo deployment/backend -n hospital-erp-system --to-revision=2

# Monitor rollback progress
kubectl rollout status deployment/backend -n hospital-erp-system
```

### Rollback via ArgoCD (GitOps)

```bash
# List application history
argocd app history hospital-erp-production

# Rollback to specific Git commit
argocd app rollback hospital-erp-production <REVISION_ID>

# Sync application
argocd app sync hospital-erp-production
```

### Emergency Rollback (Delete All Resources)

```bash
# Delete all resources in namespace
kubectl delete -k k8s/overlays/production

# Wait for cleanup
kubectl get pods -n hospital-erp-system

# Re-deploy previous version from Git
git checkout <PREVIOUS_COMMIT>
kubectl apply -k k8s/overlays/production
```

## Post-Deployment Tasks

### 1. Configure Monitoring Alerts

```bash
# Apply alerting rules
kubectl apply -k k8s/monitoring/prometheus/

# Verify PrometheusRules created
kubectl get prometheusrules -n monitoring
```

### 2. Set Up Log Retention Policies

```bash
# Configure Loki retention (edit ConfigMap)
kubectl edit configmap loki-config -n monitoring

# Update retention period to 7 days
# data:
#   config.yaml: |
#     limits_config:
#       retention_period: 168h
```

### 3. Enable Automatic Backups

```bash
# Verify RDS automated backups enabled
aws rds describe-db-instances \
  --db-instance-identifier hospital-erp-db \
  --query 'DBInstances[0].BackupRetentionPeriod'

# Should return: 7 (days)
```

### 4. Document Deployment

Create deployment record:

- Deployment timestamp
- Git commit SHA
- Deployed environment (dev/staging/prod)
- Deployed by (operator name)
- Any custom configuration applied

### 5. Run Smoke Tests

Execute end-to-end smoke tests to verify all functionality:

- User login/logout
- Patient creation/retrieval
- Room booking
- Report generation

## Next Steps

- [ ] Configure horizontal pod autoscaling thresholds (see [architecture.md](architecture.md#scalability-and-high-availability))
- [ ] Set up disaster recovery runbooks (see [runbooks/](runbooks/))
- [ ] Implement GitOps with ArgoCD (see [../argocd/README.md](../argocd/README.md))
- [ ] Configure monitoring dashboards (see [Grafana documentation](https://grafana.com/docs/))
- [ ] Set up alerting channels (Slack, PagerDuty, Email)

## Support

For troubleshooting beyond this guide:

- Check runbooks in `/docs/kubernetes/runbooks/`
- Review [troubleshooting.md](troubleshooting.md) (when available)
- Contact DevOps team via Slack: `#hospital-erp-devops`
- File GitHub issue: https://github.com/kcenon/hospital_erp_system/issues
