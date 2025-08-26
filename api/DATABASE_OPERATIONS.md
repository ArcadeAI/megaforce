# Database Operations Guide

This guide covers database operations for the Megaforce API using Alembic migrations within Docker containers.

## Current Setup

- **Database**: Supabase PostgreSQL (managed externally)
- **Migration Tool**: Alembic
- **Environment**: Docker containers
- **Current Migration**: `5182be5c1f9f` (Initial database schema with all models)

## Essential Commands

All commands should be run from the `/api` directory.

### Starting Services
```bash
docker-compose up -d
```

### Database Migration Commands

#### Check current migration status
```bash
docker-compose exec api uv run alembic current
```

#### Create a new migration
```bash
docker-compose exec api uv run alembic revision --autogenerate -m "Description of changes"
```

#### Apply migrations
```bash
docker-compose exec api uv run alembic upgrade head
```

#### Rollback to previous migration
```bash
docker-compose exec api uv run alembic downgrade -1
```

#### View migration history
```bash
docker-compose exec api uv run alembic history
```

### Database Inspection

#### List all tables
```bash
docker-compose exec api uv run python -c "from api.database import engine; from sqlalchemy import inspect; insp = inspect(engine); print('Tables:', insp.get_table_names())"
```

#### Check API health (includes database connectivity)
```bash
curl http://localhost:8000/health
```

## Current Database Schema

The database includes the following tables:

1. **users** - User accounts and authentication
2. **personas** - Author personas for content generation
3. **input_sources** - Content input sources and triggers
4. **runs** - Execution runs for input sources
5. **documents** - Unified documents (source materials and style references)
6. **output_schemas** - Generated content with approval workflow
7. **approval_history** - Track approval workflow history
8. **alembic_version** - Migration tracking (managed by Alembic)

## Important Notes

- The FastAPI app no longer creates tables automatically - this is now managed by Alembic
- All database operations should be performed through Alembic migrations
- Always create migrations when changing models
- Test migrations in development before applying to production
- Database connection is configured via environment variables (see `.env` file)

## Troubleshooting

### Migration fails due to existing tables
If you need to completely reset the database:

1. Drop all tables manually (if needed)
2. Create a fresh migration: `docker-compose exec api uv run alembic revision --autogenerate -m "Fresh start"`
3. Apply the migration: `docker-compose exec api uv run alembic upgrade head`

### API can't connect to database
1. Check that SUPABASE_DATABASE_URL is correctly set in your `.env` file
2. Verify the Supabase database is accessible
3. Check the health endpoint: `curl http://localhost:8000/health`



