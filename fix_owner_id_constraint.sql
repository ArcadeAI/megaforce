-- Fix owner_id constraint in documents table
-- This script makes owner_id NOT NULL and sets default values for existing records

BEGIN;

-- Step 1: Update any existing documents with NULL owner_id to use a default user
-- First, let's find a valid user ID to use as default
DO $$
DECLARE
    default_user_id VARCHAR;
BEGIN
    -- Get the first available user ID
    SELECT id INTO default_user_id FROM users LIMIT 1;
    
    IF default_user_id IS NOT NULL THEN
        -- Update any documents with NULL owner_id
        UPDATE documents 
        SET owner_id = default_user_id 
        WHERE owner_id IS NULL;
        
        RAISE NOTICE 'Updated documents with NULL owner_id to use default user: %', default_user_id;
    ELSE
        RAISE EXCEPTION 'No users found in database. Cannot set default owner_id.';
    END IF;
END $$;

-- Step 2: Make owner_id NOT NULL
ALTER TABLE documents ALTER COLUMN owner_id SET NOT NULL;

-- Step 3: Verify the constraint is in place
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'owner_id' 
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE 'SUCCESS: owner_id column is now NOT NULL';
    ELSE
        RAISE EXCEPTION 'FAILED: owner_id column is still nullable';
    END IF;
END $$;

COMMIT;
