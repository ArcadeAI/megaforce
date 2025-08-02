#!/usr/bin/env python3
"""
Database migration script to add missing enum values.
This script adds missing OutputType and OutputStatus enum values to the database.
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_enums():
    """Add missing enum values to the database."""
    
    # Get database URL
    database_url = os.getenv("SUPABASE_DATABASE_URL")
    if not database_url:
        print("Error: SUPABASE_DATABASE_URL not found in environment variables")
        return False
    
    # Create engine
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                print("🔧 Adding missing OutputType enum values...")
                
                # Add missing OutputType values
                missing_output_types = [
                    'social_comment',
                    'linkedin_post', 
                    'linkedin_comment',
                    'blog_post',
                    'reddit_comment',
                    'facebook_comment'
                ]
                
                for enum_value in missing_output_types:
                    try:
                        conn.execute(text(f"ALTER TYPE outputtype ADD VALUE IF NOT EXISTS '{enum_value}'"))
                        print(f"  ✅ Added OutputType: {enum_value}")
                    except Exception as e:
                        if "already exists" in str(e) or "duplicate key value" in str(e):
                            print(f"  ⚠️  OutputType {enum_value} already exists")
                        else:
                            print(f"  ❌ Error adding OutputType {enum_value}: {e}")
                
                print("🔧 Checking OutputStatus enum values...")
                
                # Check if OutputStatus values exist (they should already be there)
                required_status_values = [
                    'draft',
                    'pending_review', 
                    'approved',
                    'rejected',
                    'published'
                ]
                
                for enum_value in required_status_values:
                    try:
                        conn.execute(text(f"ALTER TYPE outputstatus ADD VALUE IF NOT EXISTS '{enum_value}'"))
                        print(f"  ✅ Ensured OutputStatus: {enum_value}")
                    except Exception as e:
                        if "already exists" in str(e) or "duplicate key value" in str(e):
                            print(f"  ⚠️  OutputStatus {enum_value} already exists")
                        else:
                            print(f"  ❌ Error adding OutputStatus {enum_value}: {e}")
                
                # Commit transaction
                trans.commit()
                print("🎉 Enum migration completed successfully!")
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Error during migration: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return False

def verify_enums():
    """Verify that all enum values exist in the database."""
    
    database_url = os.getenv("SUPABASE_DATABASE_URL")
    if not database_url:
        print("Error: SUPABASE_DATABASE_URL not found")
        return False
    
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Check OutputType enum values
            result = conn.execute(text("SELECT unnest(enum_range(NULL::outputtype)) as enum_value"))
            output_types = [row[0] for row in result]
            print(f"📋 OutputType enum values: {output_types}")
            
            # Check OutputStatus enum values  
            result = conn.execute(text("SELECT unnest(enum_range(NULL::outputstatus)) as enum_value"))
            output_statuses = [row[0] for row in result]
            print(f"📋 OutputStatus enum values: {output_statuses}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error verifying enums: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting enum migration...")
    
    # First verify current state
    print("\n📋 Current enum state:")
    verify_enums()
    
    # Run migration
    print("\n🔧 Running migration:")
    success = migrate_enums()
    
    # Verify final state
    print("\n📋 Final enum state:")
    verify_enums()
    
    if success:
        print("\n✅ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
