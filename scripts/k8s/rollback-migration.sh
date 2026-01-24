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
MIGRATION_NAME=""

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
Usage: $0 [OPTIONS] MIGRATION_NAME

Rollback database migration in Kubernetes cluster.

Arguments:
  MIGRATION_NAME               Name of the migration to rollback to

Options:
  -n, --namespace NAMESPACE    Kubernetes namespace (default: hospital-erp-system)
  -c, --context CONTEXT        Kubernetes context to use
  -h, --help                   Display this help message

Environment Variables:
  NAMESPACE                    Kubernetes namespace
  CONTEXT                      Kubernetes context

Examples:
  $0 20240101000000_initial_schema
  $0 -n hospital-erp-system 20240101000000_initial_schema
  $0 -c production -n hospital-erp-system 20240101000000_initial_schema

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
      if [[ -z "$MIGRATION_NAME" ]]; then
        MIGRATION_NAME="$1"
        shift
      else
        log_error "Unknown option: $1"
        usage
      fi
      ;;
  esac
done

# Validate migration name
if [[ -z "$MIGRATION_NAME" ]]; then
  log_error "Migration name is required"
  usage
fi

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

log_warn "WARNING: Rolling back migration to: $MIGRATION_NAME"
log_warn "This operation may cause data loss. Are you sure? (yes/no)"
read -r confirmation

if [[ "$confirmation" != "yes" ]]; then
  log_info "Rollback cancelled"
  exit 0
fi

log_info "Running migration rollback in namespace: $NAMESPACE"

# Create rollback job
JOB_NAME="db-rollback-$(date +%Y%m%d-%H%M%S)"
log_info "Creating rollback job: $JOB_NAME"

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
    job-type: rollback
spec:
  ttlSecondsAfterFinished: 3600
  template:
    metadata:
      labels:
        app: hospital-erp
        component: database
        job-type: rollback
    spec:
      serviceAccountName: backend-sa
      restartPolicy: OnFailure
      containers:
        - name: rollback
          image: hospital-erp/backend:latest
          imagePullPolicy: IfNotPresent
          command:
            - npx
            - prisma
            - migrate
            - resolve
            - --rolled-back
            - $MIGRATION_NAME
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
  backoffLimit: 1
EOF

# Apply the job
if $KUBECTL_CMD apply -f "$TEMP_JOB_FILE"; then
  log_info "Rollback job created successfully"
else
  log_error "Failed to create rollback job"
  rm -f "$TEMP_JOB_FILE"
  exit 1
fi

rm -f "$TEMP_JOB_FILE"

# Wait for job to complete
log_info "Waiting for rollback to complete..."
if $KUBECTL_CMD wait --for=condition=complete --timeout=300s "job/$JOB_NAME" -n "$NAMESPACE"; then
  log_info "Rollback completed successfully"

  # Show job logs
  log_info "Rollback logs:"
  $KUBECTL_CMD logs "job/$JOB_NAME" -n "$NAMESPACE"

  log_warn "Please verify the database state and run 'prisma migrate deploy' if needed"

  exit 0
else
  log_error "Rollback failed or timed out"

  # Show job logs
  log_error "Rollback logs:"
  $KUBECTL_CMD logs "job/$JOB_NAME" -n "$NAMESPACE"

  # Show job status
  log_error "Job status:"
  $KUBECTL_CMD describe "job/$JOB_NAME" -n "$NAMESPACE"

  exit 1
fi
