#!/bin/bash

# Start local development with Supabase
echo "☁️ Starting Megaforce with Supabase..."

# Set environment for Supabase
export DATABASE_TYPE=supabase

# Start services without PostgreSQL profile (uses Supabase)
cd "$(dirname "$0")/../api"
docker-compose up -d

echo "✅ Services started!"
echo "☁️ Database: Supabase (configured in .env)"
echo "🚀 API: http://localhost:8000"
echo "📝 API Docs: http://localhost:8000/docs"
echo ""
echo "Make sure your .env file has:"
echo "  DATABASE_TYPE=supabase"
echo "  SUPABASE_DATABASE_URL=your_supabase_connection_string"
echo ""
echo "To stop services:"
echo "  ./scripts/stop-local.sh"
