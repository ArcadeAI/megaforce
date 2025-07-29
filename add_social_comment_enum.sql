-- Add SOCIAL_COMMENT to the OutputType enum
-- This allows for unified social media comment generation across platforms

ALTER TYPE outputtype ADD VALUE IF NOT EXISTS 'social_comment';

-- Verify the enum values
SELECT unnest(enum_range(NULL::outputtype)) AS output_types;
