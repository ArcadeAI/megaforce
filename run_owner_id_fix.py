#!/usr/bin/env python3
"""
Database fix script to make owner_id NOT NULL in documents table.
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

def run_fix():
    """Run the database fix script."""
    
    # Read the fix SQL file
    fix_file = os.path.join(os.path.dirname(__file__), 'fix_owner_id_constraint.sql')
    
    if not os.path.exists(fix_file):
        print(f"Error: Fix file not found: {fix_file}")
        sys.exit(1)
    
    with open(fix_file, 'r') as f:
        fix_sql = f.read()
    
    # Get database URL
    try:
        database_url = get_database_url()
        print(f"Connecting to database...")
        
        # Create engine
        engine = create_engine(database_url)
        
        # Execute fix
        print("Running owner_id constraint fix...")
        with engine.connect() as connection:
            try:
                connection.execute(text(fix_sql))
                connection.commit()
                print("✅ Database fix executed successfully!")
                
            except SQLAlchemyError as e:
                connection.rollback()
                print(f"❌ Database fix failed: {e}")
                sys.exit(1)
                
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_fix()
