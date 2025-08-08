-- Fix OutputType enum values migration script
-- Updates all enum values from uppercase to lowercase format
-- Run this script to fix the enum validation errors

BEGIN;

-- Show current enum values before migration
SELECT 'BEFORE MIGRATION - Current enum values:' as status;
SELECT content_type, COUNT(*) as count 
FROM output_schemas 
GROUP BY content_type 
ORDER BY content_type;

-- Update all existing records to use the new lowercase format
UPDATE output_schemas SET content_type = 'tweet_single' WHERE content_type = 'TWEET_SINGLE';
UPDATE output_schemas SET content_type = 'tweet_thread' WHERE content_type = 'TWITTER_THREAD';
UPDATE output_schemas SET content_type = 'social_comment' WHERE content_type = 'SOCIAL_COMMENT';
UPDATE output_schemas SET content_type = 'twitter_reply' WHERE content_type = 'TWITTER_REPLY';
UPDATE output_schemas SET content_type = 'linkedin_post' WHERE content_type = 'LINKEDIN_POST';
UPDATE output_schemas SET content_type = 'linkedin_comment' WHERE content_type = 'LINKEDIN_COMMENT';
UPDATE output_schemas SET content_type = 'blog_post' WHERE content_type = 'BLOG_POST';
UPDATE output_schemas SET content_type = 'reddit_comment' WHERE content_type = 'REDDIT_COMMENT';
UPDATE output_schemas SET content_type = 'facebook_comment' WHERE content_type = 'FACEBOOK_COMMENT';
UPDATE output_schemas SET content_type = 'instagram_comment' WHERE content_type = 'INSTAGRAM_COMMENT';
UPDATE output_schemas SET content_type = 'youtube_comment' WHERE content_type = 'YOUTUBE_COMMENT';

-- Show updated enum values after migration
SELECT 'AFTER MIGRATION - Updated enum values:' as status;
SELECT content_type, COUNT(*) as count 
FROM output_schemas 
GROUP BY content_type 
ORDER BY content_type;

-- Verify no old uppercase values remain
SELECT 'VERIFICATION - Any remaining uppercase values:' as status;
SELECT content_type, COUNT(*) as count 
FROM output_schemas 
WHERE content_type IN (
    'TWEET_SINGLE', 'TWITTER_THREAD', 'SOCIAL_COMMENT', 'TWITTER_REPLY',
    'LINKEDIN_POST', 'LINKEDIN_COMMENT', 'BLOG_POST', 'REDDIT_COMMENT',
    'FACEBOOK_COMMENT', 'INSTAGRAM_COMMENT', 'YOUTUBE_COMMENT'
)
GROUP BY content_type;

COMMIT;

-- Success message
SELECT '✅ OutputType enum values successfully updated to lowercase format!' as result;
