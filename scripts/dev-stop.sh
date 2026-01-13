#!/bin/bash
# Development environment stop script
# Stops all services defined in docker-compose.yml

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Stopping Hospital ERP development environment..."

# Stop services
docker compose down

echo ""
echo "Development environment stopped successfully!"
echo ""
echo "Note: Data volumes are preserved. To remove them, run:"
echo "  docker compose down -v"
