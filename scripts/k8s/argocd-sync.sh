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
if [ $# -lt 1 ]; then
    print_error "Usage: $0 <app-name> [--force]"
    echo "Example: $0 hospital-erp-production"
    echo "Example: $0 hospital-erp-staging --force"
    echo ""
    echo "Available applications:"
    echo "  - hospital-erp-production"
    echo "  - hospital-erp-staging"
    echo "  - hospital-erp-development"
    exit 1
fi

APP_NAME=$1
FORCE_FLAG=""

if [ "$2" == "--force" ]; then
    FORCE_FLAG="--force"
    print_warning "Force sync enabled - this will override any manual changes"
fi

# Verify ArgoCD CLI is installed
if ! command -v argocd &> /dev/null; then
    print_error "ArgoCD CLI is not installed. Please install it first:"
    echo "  brew install argocd"
    echo "  or visit: https://argo-cd.readthedocs.io/en/stable/cli_installation/"
    exit 1
fi

print_info "Syncing $APP_NAME with Git repository..."

# Perform sync
argocd app sync $APP_NAME $FORCE_FLAG --prune

# Wait for sync to complete
print_info "Waiting for sync to complete..."
argocd app wait $APP_NAME --health --timeout 600

print_info "Sync completed successfully"

# Show application status
print_info "Application status:"
argocd app get $APP_NAME
