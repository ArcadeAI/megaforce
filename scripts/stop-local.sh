#!/bin/bash

# Stop all local development services
echo "🛑 Stopping Megaforce local services..."

cd "$(dirname "$0")/../api"
docker-compose --profile postgresql down

echo "✅ All services stopped!"
echo "💾 PostgreSQL data is preserved in Docker volume 'postgres_data'"
echo ""
echo "To completely remove PostgreSQL data:"
echo "  docker volume rm api_postgres_data"
