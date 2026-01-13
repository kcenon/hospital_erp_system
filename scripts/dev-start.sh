#!/bin/bash
# Development environment start script
# Starts all services defined in docker-compose.yml

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Starting Hospital ERP development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists, create from example if not
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cat > .env << 'EOF'
# Database
DB_PASSWORD=hospital_dev_password

# JWT Secrets (change in production)
JWT_ACCESS_SECRET=dev-access-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Encryption
ENCRYPTION_KEY=32-byte-hex-key-for-aes-256-encryption
EOF
    echo ".env file created."
fi

# Start services
echo "Starting Docker containers..."
docker compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "Service Status:"
docker compose ps

echo ""
echo "Development environment started successfully!"
echo ""
echo "Services available at:"
echo "  - Frontend:   http://localhost:3001"
echo "  - Backend:    http://localhost:3000"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis:      localhost:6379"
echo ""
echo "To view logs: docker compose logs -f [service_name]"
echo "To stop:      ./scripts/dev-stop.sh"
