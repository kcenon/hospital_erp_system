#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default values
NAMESPACE="${NAMESPACE:-hospital-erp-system}"
CONTEXT="${CONTEXT:-}"

# Function to print colored messages
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display usage
usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Run database migration in Kubernetes cluster.

Options:
  -n, --namespace NAMESPACE    Kubernetes namespace (default: hospital-erp-system)
  -c, --context CONTEXT        Kubernetes context to use
  -h, --help                   Display this help message

Environment Variables:
  NAMESPACE                    Kubernetes namespace
  CONTEXT                      Kubernetes context

Examples:
  $0
  $0 -n hospital-erp-system
  $0 -c production -n hospital-erp-system

EOF
  exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    -c|--context)
      CONTEXT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Set kubectl context if specified
if [[ -n "$CONTEXT" ]]; then
  log_info "Using context: $CONTEXT"
  KUBECTL_CMD="kubectl --context=$CONTEXT"
else
  KUBECTL_CMD="kubectl"
fi

# Check if namespace exists
if ! $KUBECTL_CMD get namespace "$NAMESPACE" &>/dev/null; then
  log_error "Namespace '$NAMESPACE' does not exist"
  exit 1
fi

log_info "Running database migration in namespace: $NAMESPACE"

# Apply the migration job
JOB_NAME="db-migrate-$(date +%Y%m%d-%H%M%S)"
log_info "Creating migration job: $JOB_NAME"

# Create temporary job manifest
TEMP_JOB_FILE=$(mktemp)
cat > "$TEMP_JOB_FILE" <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: $JOB_NAME
  namespace: $NAMESPACE
  labels:
    app: hospital-erp
    component: database
    job-type: migration
spec:
  ttlSecondsAfterFinished: 3600
  template:
    metadata:
      labels:
        app: hospital-erp
        component: database
        job-type: migration
    spec:
      serviceAccountName: backend-sa
      restartPolicy: OnFailure
      containers:
        - name: migrate
          image: hospital-erp/backend:latest
          imagePullPolicy: IfNotPresent
          command:
            - npx
            - prisma
            - migrate
            - deploy
          envFrom:
            - secretRef:
                name: backend-secrets
          env:
            - name: NODE_ENV
              value: production
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
  backoffLimit: 3
EOF

# Apply the job
if $KUBECTL_CMD apply -f "$TEMP_JOB_FILE"; then
  log_info "Migration job created successfully"
else
  log_error "Failed to create migration job"
  rm -f "$TEMP_JOB_FILE"
  exit 1
fi

rm -f "$TEMP_JOB_FILE"

# Wait for job to complete
log_info "Waiting for migration to complete..."
if $KUBECTL_CMD wait --for=condition=complete --timeout=300s "job/$JOB_NAME" -n "$NAMESPACE"; then
  log_info "Migration completed successfully"

  # Show job logs
  log_info "Migration logs:"
  $KUBECTL_CMD logs "job/$JOB_NAME" -n "$NAMESPACE"

  exit 0
else
  log_error "Migration failed or timed out"

  # Show job logs
  log_error "Migration logs:"
  $KUBECTL_CMD logs "job/$JOB_NAME" -n "$NAMESPACE"

  # Show job status
  log_error "Job status:"
  $KUBECTL_CMD describe "job/$JOB_NAME" -n "$NAMESPACE"

  exit 1
fi
