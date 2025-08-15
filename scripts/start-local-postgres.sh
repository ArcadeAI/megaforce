#!/bin/bash

# Start local development with PostgreSQL
echo "🐘 Starting Megaforce with Local PostgreSQL..."

# Set environment for PostgreSQL
export DATABASE_TYPE=postgresql
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=megaforce
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres

# Start services with PostgreSQL profile
cd "$(dirname "$0")/../api"
docker-compose --profile postgresql up -d

echo "✅ Services started!"
echo "📊 PostgreSQL: http://localhost:5432"
echo "🚀 API: http://localhost:8000"
echo "📝 API Docs: http://localhost:8000/docs"
echo ""
echo "To run database migrations:"
echo "  cd api && uv run alembic upgrade head"
echo ""
echo "To stop services:"
echo "  ./scripts/stop-local.sh"
