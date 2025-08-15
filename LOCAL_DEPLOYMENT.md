# Local Deployment Guide

This guide shows you how to run Megaforce locally with either **PostgreSQL** or **Supabase** as your database.

## Quick Start

### Option 1: Local PostgreSQL (Recommended for Development)

```bash
# 1. Ensure you have a working .env file (should already exist)
# 2. Start with PostgreSQL (automatically sets DATABASE_TYPE=postgresql)
./scripts/start-local-postgres.sh

# 3. Start the UI (in another terminal)
cd ui && npm run dev

# 4. Visit http://localhost:3000
```

### Option 2: Supabase (Production-like)

```bash
# 1. Ensure your .env file has valid Supabase credentials:
#    SUPABASE_DATABASE_URL=postgresql://postgres.[YOUR-PROJECT]:[PASSWORD]@...
# 2. Start with Supabase (automatically sets DATABASE_TYPE=supabase)
./scripts/start-local-supabase.sh

# 3. Start the UI (in another terminal)
cd ui && npm run dev

# 4. Visit http://localhost:3000
```

## Environment Configuration

### Simplified Database Switching

The system uses **environment variable overrides** to switch between databases:

- **PostgreSQL**: `./scripts/start-local-postgres.sh` (sets `DATABASE_TYPE=postgresql`)
- **Supabase**: `./scripts/start-local-supabase.sh` (sets `DATABASE_TYPE=supabase`)

Your main `.env` file defaults to Supabase, but the startup scripts override this as needed.

### PostgreSQL Settings (when DATABASE_TYPE=postgresql)

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=megaforce
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### Supabase Settings (when DATABASE_TYPE=supabase)

```env
SUPABASE_DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

## Services

### API Server
- **URL**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

### UI Server
- **URL**: http://localhost:3000

### PostgreSQL (when enabled)
- **Host**: localhost:5432
- **Database**: megaforce
- **User**: postgres
- **Password**: postgres

## Management Commands

### Start Services
```bash
# With PostgreSQL
./scripts/start-local-postgres.sh

# With Supabase
./scripts/start-local-supabase.sh
```

### Stop Services
```bash
./scripts/stop-local.sh
```

### Reset PostgreSQL Data
```bash
./scripts/stop-local.sh
docker volume rm api_postgres_data
./scripts/start-local-postgres.sh
```

## Switching Between Databases

Switching between PostgreSQL and Supabase is now **automatic** - just use the appropriate start script:

1. **Stop current services**: `./scripts/stop-local.sh`
2. **Start with desired database**:
   - PostgreSQL: `./scripts/start-local-postgres.sh`
   - Supabase: `./scripts/start-local-supabase.sh`

**No manual `.env` editing required!** The scripts automatically set the correct `DATABASE_TYPE` environment variable.

### Database Schema Management

- **PostgreSQL**: Tables are created automatically by SQLAlchemy (`Base.metadata.create_all()`)
- **Supabase**: Uses existing Supabase database schema
- **No Alembic migrations required** for local development

## Troubleshooting

### PostgreSQL Connection Issues
- Ensure Docker is running
- Check if port 5432 is available
- Verify PostgreSQL container is running: `docker ps`

### Supabase Connection Issues
- Verify `SUPABASE_DATABASE_URL` is correct
- Check Supabase project is active
- Ensure you're using the transaction pooler URL format

### API Issues
- Check logs: `docker-compose logs api`
- Verify all required environment variables are set
- Test health endpoint: `curl http://localhost:8000/health`

### UI Issues
- Ensure API is running first
- Check UI logs: `cd ui && npm run dev`
- Verify `API_BASE_URL` points to correct API server

## Testing

### Comprehensive Test Suite

Run the full test suite to verify both PostgreSQL and Supabase configurations:

```bash
./scripts/test-local.sh
```

This will:
- Test PostgreSQL setup with end-to-end API workflow
- Test Supabase setup with end-to-end API workflow  
- Verify user registration, login, persona creation, document creation, and Twitter search
- Automatically handle environment switching using variable overrides

### Manual Testing

```bash
# Test PostgreSQL only
./scripts/start-local-postgres.sh
# Then run your manual tests

# Test Supabase only  
./scripts/start-local-supabase.sh
# Then run your manual tests
```

## Development Workflow

1. **Start backend**: `./scripts/start-local-postgres.sh` (or `start-local-supabase.sh`)
2. **Start frontend**: `cd ui && npm run dev`
3. **Access application**: http://localhost:3000

The API will automatically reload when you make changes to the code, and the UI supports hot reloading for development.

**Note**: Database tables are created automatically - no manual migrations required!
