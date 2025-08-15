# Local Deployment Guide

This guide shows you how to run Megaforce locally with either **PostgreSQL** or **Supabase** as your database.

## Quick Start

### Option 1: Local PostgreSQL (Recommended for Development)

```bash
# 1. Copy environment template
cp .env.template .env

# 2. Edit .env and set:
DATABASE_TYPE=postgresql

# 3. Start with PostgreSQL
./scripts/start-local-postgres.sh

# 4. Run database migrations
cd api && uv run alembic upgrade head

# 5. Start the UI (in another terminal)
cd ui && npm run dev
```

### Option 2: Supabase (Production-like)

```bash
# 1. Copy environment template
cp .env.template .env

# 2. Edit .env and set:
DATABASE_TYPE=supabase
SUPABASE_DATABASE_URL=your_supabase_connection_string

# 3. Start with Supabase
./scripts/start-local-supabase.sh

# 4. Start the UI (in another terminal)
cd ui && npm run dev
```

## Environment Configuration

### Database Selection

Set `DATABASE_TYPE` in your `.env` file:

- `DATABASE_TYPE=postgresql` - Use local PostgreSQL
- `DATABASE_TYPE=supabase` - Use Supabase

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

### Database Migrations
```bash
cd api
uv run alembic upgrade head
```

### Reset PostgreSQL Data
```bash
./scripts/stop-local.sh
docker volume rm api_postgres_data
./scripts/start-local-postgres.sh
```

## Switching Between Databases

You can easily switch between PostgreSQL and Supabase:

1. **Stop current services**: `./scripts/stop-local.sh`
2. **Update .env**: Change `DATABASE_TYPE=postgresql` or `DATABASE_TYPE=supabase`
3. **Start with new database**: Run the appropriate start script
4. **Run migrations** (if switching to PostgreSQL): `cd api && uv run alembic upgrade head`

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

## Development Workflow

1. **Start backend**: `./scripts/start-local-postgres.sh`
2. **Run migrations**: `cd api && uv run alembic upgrade head`
3. **Start frontend**: `cd ui && npm run dev`
4. **Access application**: http://localhost:3000

The API will automatically reload when you make changes to the code, and the UI supports hot reloading for development.
