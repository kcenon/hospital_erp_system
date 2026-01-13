#!/bin/bash
# Database seed script
# Seeds the database with initial/test data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Seeding Hospital ERP database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if backend container is running
if ! docker compose ps backend | grep -q "running"; then
    echo "Error: Backend container is not running."
    echo "Please start the development environment first: ./scripts/dev-start.sh"
    exit 1
fi

# Run Prisma migrations and seed
echo "Running Prisma migrations..."
docker compose exec backend npx prisma migrate deploy

echo "Seeding database..."
docker compose exec backend npx prisma db seed

echo ""
echo "Database seeding completed!"
echo ""
echo "Initial admin user credentials:"
echo "  Email:    admin@hospital.local"
echo "  Password: (check prisma/seed.ts for default password)"
