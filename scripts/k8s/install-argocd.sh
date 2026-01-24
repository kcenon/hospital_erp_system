#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verify kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install it first."
    exit 1
fi

# Verify cluster connection
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_step "1/6: Creating ArgoCD namespace"
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

print_step "2/6: Installing ArgoCD"
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

print_step "3/6: Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s \
    deployment/argocd-server \
    deployment/argocd-repo-server \
    deployment/argocd-applicationset-controller \
    -n argocd

print_step "4/6: Applying ArgoCD custom configurations"
kubectl apply -k ../k8s/argocd/

print_step "5/6: Retrieving initial admin password"
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

print_info "ArgoCD installation completed successfully!"
echo ""
print_info "Access Information:"
echo "  Username: admin"
echo "  Password: $ARGOCD_PASSWORD"
echo ""
print_warning "Please save the password and change it after first login!"
echo ""

print_step "6/6: Setting up ArgoCD CLI (optional)"
if command -v argocd &> /dev/null; then
    print_info "ArgoCD CLI already installed"
else
    print_info "To install ArgoCD CLI:"
    echo "  macOS: brew install argocd"
    echo "  Linux: curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64"
fi

echo ""
print_info "To access ArgoCD UI:"
echo "  1. Port forward: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  2. Open: https://localhost:8080"
echo "  3. Or use the configured ingress: https://argocd.hospital.example.com"
