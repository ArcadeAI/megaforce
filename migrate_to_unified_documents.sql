-- Migration script to convert to unified document system
-- This script adds new columns to documents table and migrates style_references data

BEGIN;

-- Step 1: Add new columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_type VARCHAR DEFAULT 'source_material',
ADD COLUMN IF NOT EXISTS reference_type VARCHAR,
ADD COLUMN IF NOT EXISTS owner_id VARCHAR,
ADD COLUMN IF NOT EXISTS is_style_reference BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS persona_ids JSONB DEFAULT '[]'::jsonb;

-- Step 2: Make run_id nullable (for manually added style references)
ALTER TABLE documents ALTER COLUMN run_id DROP NOT NULL;

-- Step 3: Add foreign key constraint for owner_id
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_owner_id 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Migrate existing style_references data to documents table
-- Only run this if style_references table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'style_references') THEN
        -- Insert style references as documents
        INSERT INTO documents (
            id, 
            title, 
            content, 
            url,
            reference_type, 
            owner_id, 
            is_style_reference, 
            persona_ids, 
            document_type, 
            created_at
        )
        SELECT 
            sr.id,
            COALESCE(sr.content_url, 'Style Reference') as title,
            sr.content_text as content,
            sr.content_url as url,
            sr.reference_type,
            p.owner_id,
            true as is_style_reference,
            jsonb_build_array(sr.persona_id) as persona_ids,
            'style_reference' as document_type,
            sr.created_at
        FROM style_references sr
        JOIN personas p ON sr.persona_id = p.id
        WHERE NOT EXISTS (
            SELECT 1 FROM documents d WHERE d.id = sr.id
        );
        
        RAISE NOTICE 'Migrated % style references to documents table', 
            (SELECT COUNT(*) FROM style_references);
    END IF;
END $$;

-- Step 5: Update existing documents to have owner_id
-- Set owner_id for documents that don't have it (from their run's input_source)
UPDATE documents 
SET owner_id = subquery.owner_id
FROM (
    SELECT d.id, ins.owner_id
    FROM documents d
    JOIN runs r ON d.run_id = r.id
    JOIN input_sources ins ON r.input_source_id = ins.id
    WHERE d.owner_id IS NULL
) AS subquery
WHERE documents.id = subquery.id;

-- Step 6: Make owner_id NOT NULL after migration
ALTER TABLE documents ALTER COLUMN owner_id SET NOT NULL;

-- Step 7: Drop style_references table if it exists
DROP TABLE IF EXISTS style_references CASCADE;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_is_style_reference ON documents(is_style_reference);
CREATE INDEX IF NOT EXISTS idx_documents_persona_ids ON documents USING GIN(persona_ids);

COMMIT;

-- Verify migration
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE document_type = 'source_material') as source_materials,
    COUNT(*) FILTER (WHERE document_type = 'style_reference') as style_references,
    COUNT(*) FILTER (WHERE is_style_reference = true) as style_reference_flag_count
FROM documents;
