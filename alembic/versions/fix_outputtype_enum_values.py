"""Fix OutputType enum values to lowercase format

Revision ID: fix_outputtype_enum_values
Revises: 
Create Date: 2025-08-08 01:07:39.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_outputtype_enum_values'
down_revision = None  # Update this if you have a previous revision
branch_labels = None
depends_on = None


def upgrade():
    """Update OutputType enum values from uppercase to lowercase format."""
    
    # Update all existing records to use the new lowercase format
    op.execute("""
        UPDATE output_schemas SET content_type = 'tweet_single' WHERE content_type = 'TWEET_SINGLE';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'tweet_thread' WHERE content_type = 'TWITTER_THREAD';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'social_comment' WHERE content_type = 'SOCIAL_COMMENT';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'twitter_reply' WHERE content_type = 'TWITTER_REPLY';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'linkedin_post' WHERE content_type = 'LINKEDIN_POST';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'linkedin_comment' WHERE content_type = 'LINKEDIN_COMMENT';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'blog_post' WHERE content_type = 'BLOG_POST';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'reddit_comment' WHERE content_type = 'REDDIT_COMMENT';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'facebook_comment' WHERE content_type = 'FACEBOOK_COMMENT';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'instagram_comment' WHERE content_type = 'INSTAGRAM_COMMENT';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'youtube_comment' WHERE content_type = 'YOUTUBE_COMMENT';
    """)
    
    print("✅ Successfully updated OutputType enum values to lowercase format")


def downgrade():
    """Revert OutputType enum values back to uppercase format."""
    
    # Revert all records back to uppercase format
    op.execute("""
        UPDATE output_schemas SET content_type = 'TWEET_SINGLE' WHERE content_type = 'tweet_single';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'TWITTER_THREAD' WHERE content_type = 'tweet_thread';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'SOCIAL_COMMENT' WHERE content_type = 'social_comment';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'TWITTER_REPLY' WHERE content_type = 'twitter_reply';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'LINKEDIN_POST' WHERE content_type = 'linkedin_post';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'LINKEDIN_COMMENT' WHERE content_type = 'linkedin_comment';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'BLOG_POST' WHERE content_type = 'blog_post';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'REDDIT_COMMENT' WHERE content_type = 'reddit_comment';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'FACEBOOK_COMMENT' WHERE content_type = 'facebook_comment';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'INSTAGRAM_COMMENT' WHERE content_type = 'instagram_comment';
    """)
    
    op.execute("""
        UPDATE output_schemas SET content_type = 'YOUTUBE_COMMENT' WHERE content_type = 'youtube_comment';
    """)
    
    print("✅ Successfully reverted OutputType enum values to uppercase format")
