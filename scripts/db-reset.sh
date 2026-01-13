#!/bin/bash
# Database reset script
# Drops and recreates the database with initial schemas

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Resetting Hospital ERP database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if postgres container is running
if ! docker compose ps postgres | grep -q "running"; then
    echo "Error: PostgreSQL container is not running."
    echo "Please start the development environment first: ./scripts/dev-start.sh"
    exit 1
fi

# Confirm reset
read -p "This will delete all data. Are you sure? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

echo "Stopping backend container to release database connections..."
docker compose stop backend

echo "Dropping and recreating database..."
docker compose exec postgres psql -U hospital_user -d postgres -c "DROP DATABASE IF EXISTS hospital_erp_dev;"
docker compose exec postgres psql -U hospital_user -d postgres -c "CREATE DATABASE hospital_erp_dev;"

echo "Re-initializing database with schemas..."
docker compose exec postgres psql -U hospital_user -d hospital_erp_dev -f /docker-entrypoint-initdb.d/init.sql

echo "Restarting backend container..."
docker compose start backend

echo ""
echo "Database reset completed!"
echo ""
echo "To seed initial data, run: ./scripts/db-seed.sh"
