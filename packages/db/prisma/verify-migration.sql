-- MEG-7: Database Migration Verification Script
-- This script verifies that all tables, indexes, and constraints are properly created

-- ============================================================================
-- 1. Verify all tables exist
-- ============================================================================

SELECT
    'Tables Check' as check_type,
    COUNT(*) as table_count,
    string_agg(tablename, ', ') as tables
FROM pg_tables
WHERE schemaname = 'public';

-- Expected tables:
-- Auth tables: user, session, account, verification
-- Megaforce tables: workspace, source, persona, social_channel, project,
--   output_config, content_candidate, published_content, persona_source,
--   project_source, project_persona, job_queue, websocket_connection

-- ============================================================================
-- 2. Verify Foreign Key Constraints
-- ============================================================================

SELECT
    'Foreign Key Constraints' as check_type,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 3. Verify Indexes
-- ============================================================================

SELECT
    'Indexes' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. Verify existing auth tables have no data loss
-- ============================================================================

SELECT
    'Row Counts' as check_type,
    'user' as table_name,
    COUNT(*) as row_count
FROM "user"
UNION ALL
SELECT
    'Row Counts',
    'session',
    COUNT(*)
FROM "session"
UNION ALL
SELECT
    'Row Counts',
    'account',
    COUNT(*)
FROM "account"
UNION ALL
SELECT
    'Row Counts',
    'verification',
    COUNT(*)
FROM "verification";

-- ============================================================================
-- 5. Verify User table structure includes Megaforce relations
-- ============================================================================

SELECT
    'User Table Columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'user'
ORDER BY ordinal_position;

-- Note: Prisma relations (workspaces, wsConnections) won't show as columns
-- They are virtual relations managed by Prisma client
