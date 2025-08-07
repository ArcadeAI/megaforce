#!/usr/bin/env python3
"""
Database migration script to convert to unified document system.
This script runs the SQL migration against the Supabase database.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_url():
    """Get the database URL from environment variables."""
    database_url = os.getenv("SUPABASE_DATABASE_URL")
    
    if not database_url:
        # Fallback to individual components for local development
        host = os.getenv("SUPABASE_HOST", "localhost")
        port = os.getenv("SUPABASE_PORT", "5432")
        db = os.getenv("SUPABASE_DB", "postgres")
        user = os.getenv("SUPABASE_USER", "postgres")
        password = os.getenv("SUPABASE_PASSWORD", "")
        
        database_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
    
    return database_url

def run_migration():
    """Run the database migration script."""
    
    # Read the migration SQL file
    migration_file = os.path.join(os.path.dirname(__file__), 'migrate_to_unified_documents.sql')
    
    if not os.path.exists(migration_file):
        print(f"Error: Migration file not found: {migration_file}")
        sys.exit(1)
    
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    # Get database URL
    try:
        database_url = get_database_url()
        print(f"Connecting to database...")
        
        # Create engine
        engine = create_engine(database_url)
        
        # Execute migration
        print("Running migration...")
        with engine.connect() as connection:
            # Execute the entire migration as one transaction
            try:
                connection.execute(text(migration_sql))
                connection.commit()
                print("✅ Migration executed successfully!")
                
                # Now run a verification query
                print("\nRunning verification query...")
                result = connection.execute(text("""
                    SELECT 
                        'Migration completed successfully!' as status,
                        COUNT(*) as total_documents,
                        COUNT(*) FILTER (WHERE document_type = 'source_material') as source_materials,
                        COUNT(*) FILTER (WHERE document_type = 'style_reference') as style_references,
                        COUNT(*) FILTER (WHERE is_style_reference = true) as style_reference_flag_count
                    FROM documents;
                """))
                
                rows = result.fetchall()
                if rows:
                    print("Verification results:")
                    for row in rows:
                        print(f"  {dict(row)}")
                        
            except Exception as e:
                connection.rollback()
                raise e
            
        print("\n✅ Migration completed successfully!")
        print("The database schema has been updated to support the unified document system.")
        
    except SQLAlchemyError as e:
        print(f"❌ Database error during migration: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🔄 Starting database migration to unified document system...")
    run_migration()
