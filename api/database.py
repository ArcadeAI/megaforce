import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database configuration based on DATABASE_TYPE environment variable
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "supabase").lower()

def get_database_url():
    """Get database URL based on DATABASE_TYPE environment variable."""
    print(f"DEBUG: DATABASE_TYPE={DATABASE_TYPE}, DOCKER_ENV={os.getenv('DOCKER_ENV')}")
    
    if DATABASE_TYPE == "postgresql":
        # Local PostgreSQL configuration
        # Use 'postgres' as hostname when running in Docker, 'localhost' otherwise
        default_host = "postgres" if os.getenv("DOCKER_ENV") == "true" else "localhost"
        host = os.getenv("POSTGRES_HOST", default_host)
        port = os.getenv("POSTGRES_PORT", "5432")
        db = os.getenv("POSTGRES_DB", "megaforce")
        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "postgres")
        
        database_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
        print(f"Using local PostgreSQL: {host}:{port}/{db}")
        return database_url
    
    else:  # Default to Supabase
        # Supabase connection string - always use SUPABASE_DATABASE_URL regardless of DOCKER_ENV
        supabase_url = os.getenv("SUPABASE_DATABASE_URL")
        
        if not supabase_url:
            # Fallback to individual components for Supabase
            host = os.getenv("SUPABASE_HOST", "localhost")
            port = os.getenv("SUPABASE_PORT", "5432")
            db = os.getenv("SUPABASE_DB", "postgres")
            user = os.getenv("SUPABASE_USER", "postgres")
            password = os.getenv("SUPABASE_PASSWORD", "")
            
            supabase_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
        
        print(f"Using Supabase: {supabase_url.split('@')[1] if '@' in supabase_url else 'configured'}")
        return supabase_url

DATABASE_URL = get_database_url()

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=os.getenv("SQL_DEBUG", "false").lower() == "true"
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
