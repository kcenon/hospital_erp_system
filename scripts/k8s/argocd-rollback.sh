#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required arguments are provided
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <app-name> <revision>"
    echo "Example: $0 hospital-erp-production 5"
    echo ""
    echo "Available applications:"
    echo "  - hospital-erp-production"
    echo "  - hospital-erp-staging"
    echo "  - hospital-erp-development"
    exit 1
fi

APP_NAME=$1
REVISION=$2

# Verify ArgoCD CLI is installed
if ! command -v argocd &> /dev/null; then
    print_error "ArgoCD CLI is not installed. Please install it first:"
    echo "  brew install argocd"
    echo "  or visit: https://argo-cd.readthedocs.io/en/stable/cli_installation/"
    exit 1
fi

print_info "Starting rollback for $APP_NAME to revision $REVISION"

# Get current revision
CURRENT_REVISION=$(argocd app get $APP_NAME -o json | jq -r '.status.sync.revision' | cut -c1-7)
print_info "Current revision: $CURRENT_REVISION"

# Confirm rollback
print_warning "This will rollback $APP_NAME to revision $REVISION"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Rollback cancelled"
    exit 0
fi

# Perform rollback
print_info "Rolling back $APP_NAME to revision $REVISION..."
argocd app rollback $APP_NAME $REVISION --prune

# Wait for sync to complete
print_info "Waiting for sync to complete..."
argocd app wait $APP_NAME --health --timeout 600

# Get new revision
NEW_REVISION=$(argocd app get $APP_NAME -o json | jq -r '.status.sync.revision' | cut -c1-7)

print_info "Rollback completed successfully"
print_info "Previous revision: $CURRENT_REVISION"
print_info "Current revision: $NEW_REVISION"

# Show application status
print_info "Application status:"
argocd app get $APP_NAME
