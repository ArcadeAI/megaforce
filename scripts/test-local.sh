#!/bin/bash

# Test local deployment using existing comprehensive test suite
echo "🧪 Testing Local Megaforce Deployment"
echo "====================================="

cd "$(dirname "$0")/.."

# Check prerequisites
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.template .env
    echo "⚠️  Please edit .env with your API keys before running tests"
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
fi

# Check required environment variables
if [ -z "$OPENAI_API_KEY" ] || [ -z "$ARCADE_API_KEY" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Missing required API keys in .env file:"
    echo "   - OPENAI_API_KEY"
    echo "   - ARCADE_API_KEY" 
    echo "   - ANTHROPIC_API_KEY"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Backup original .env
cp .env .env.test_backup

# Test 1: PostgreSQL setup
echo "🐘 Test 1: PostgreSQL Setup"
echo "----------------------------"

# Set PostgreSQL mode
echo "Setting DATABASE_TYPE=postgresql..."
sed -i.bak 's/^DATABASE_TYPE=.*/DATABASE_TYPE=postgresql/' .env 2>/dev/null || echo "DATABASE_TYPE=postgresql" >> .env

echo "Starting PostgreSQL services..."
./scripts/start-local-postgres.sh

echo "Waiting for services to start..."
sleep 15

echo "Running database migrations..."
cd api && uv run alembic upgrade head
cd ..

echo ""
echo "🚀 Running comprehensive API test suite (PostgreSQL)..."
echo "This will test the complete workflow: register → login → create content → generate comments → post to Twitter"
echo ""

# Run the comprehensive test
if ./tests/test_api_guide.sh; then
    echo ""
    echo "✅ PostgreSQL test PASSED!"
    POSTGRES_SUCCESS=true
else
    echo ""
    echo "❌ PostgreSQL test FAILED!"
    echo "Check logs with: docker-compose logs api"
    POSTGRES_SUCCESS=false
fi

echo ""
echo "Stopping PostgreSQL services..."
./scripts/stop-local.sh
sleep 5

# Test 2: Supabase setup (if configured)
echo ""
echo "☁️ Test 2: Supabase Setup"
echo "-------------------------"

# Check if Supabase is configured
if grep -q "SUPABASE_DATABASE_URL=postgresql://" .env && ! grep -q "YOUR-PROJECT-REF" .env; then
    echo "Setting DATABASE_TYPE=supabase..."
    sed -i.bak 's/^DATABASE_TYPE=.*/DATABASE_TYPE=supabase/' .env
    
    echo "Starting Supabase services..."
    ./scripts/start-local-supabase.sh
    
    echo "Waiting for services to start..."
    sleep 15
    
    echo ""
    echo "🚀 Running comprehensive API test suite (Supabase)..."
    echo ""
    
    # Run the comprehensive test
    if ./tests/test_api_guide.sh; then
        echo ""
        echo "✅ Supabase test PASSED!"
        SUPABASE_SUCCESS=true
    else
        echo ""
        echo "❌ Supabase test FAILED!"
        echo "Check logs with: docker-compose logs api"
        SUPABASE_SUCCESS=false
    fi
    
    echo ""
    echo "Stopping Supabase services..."
    ./scripts/stop-local.sh
else
    echo "⏭️  Supabase test SKIPPED (not configured in .env)"
    echo "   To test Supabase, set SUPABASE_DATABASE_URL in .env"
    SUPABASE_SUCCESS="skipped"
fi

# Restore original .env
mv .env.test_backup .env

echo ""
echo "🎉 Test Results Summary"
echo "======================"
if [ "$POSTGRES_SUCCESS" = true ]; then
    echo "✅ PostgreSQL: PASSED"
else
    echo "❌ PostgreSQL: FAILED"
fi

if [ "$SUPABASE_SUCCESS" = true ]; then
    echo "✅ Supabase: PASSED"
elif [ "$SUPABASE_SUCCESS" = "skipped" ]; then
    echo "⏭️  Supabase: SKIPPED"
else
    echo "❌ Supabase: FAILED"
fi

echo ""
if [ "$POSTGRES_SUCCESS" = true ]; then
    echo "🎯 Your local deployment setup is working!"
    echo ""
    echo "To start developing:"
    echo "• PostgreSQL: ./scripts/start-local-postgres.sh"
    echo "• Supabase: ./scripts/start-local-supabase.sh"
    echo "• UI: cd ui && npm run dev"
    echo "• Visit: http://localhost:3000"
    exit 0
else
    echo "❌ Local deployment has issues. Check the logs above."
    exit 1
fi
