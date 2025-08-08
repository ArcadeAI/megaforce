"""Add unified document model with persona style links

Revision ID: 001_unified_documents
Revises: 
Create Date: 2025-01-28 03:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_unified_documents'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Add new columns to documents table and create persona_style_links table."""
    
    # Add new columns to documents table
    op.add_column('documents', sa.Column('document_type', sa.String(), nullable=True, server_default='source_material'))
    op.add_column('documents', sa.Column('reference_type', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('owner_id', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('is_style_reference', sa.Boolean(), nullable=True, server_default='false'))
    
    # Make run_id nullable (for manually added style references)
    op.alter_column('documents', 'run_id', nullable=True)
    
    # Add foreign key constraint for owner_id
    op.create_foreign_key('fk_documents_owner_id', 'documents', 'users', ['owner_id'], ['id'])
    
    # Create persona_style_links table
    op.create_table('persona_style_links',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('persona_id', sa.String(), nullable=False),
        sa.Column('document_id', sa.String(), nullable=False),
        sa.Column('added_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.ForeignKeyConstraint(['persona_id'], ['personas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better performance
    op.create_index('ix_documents_owner_id', 'documents', ['owner_id'])
    op.create_index('ix_documents_is_style_reference', 'documents', ['is_style_reference'])
    op.create_index('ix_documents_document_type', 'documents', ['document_type'])
    op.create_index('ix_persona_style_links_persona_id', 'persona_style_links', ['persona_id'])
    op.create_index('ix_persona_style_links_document_id', 'persona_style_links', ['document_id'])


def downgrade():
    """Remove unified document model changes."""
    
    # Drop indexes
    op.drop_index('ix_persona_style_links_document_id')
    op.drop_index('ix_persona_style_links_persona_id')
    op.drop_index('ix_documents_document_type')
    op.drop_index('ix_documents_is_style_reference')
    op.drop_index('ix_documents_owner_id')
    
    # Drop persona_style_links table
    op.drop_table('persona_style_links')
    
    # Remove foreign key constraint
    op.drop_constraint('fk_documents_owner_id', 'documents', type_='foreignkey')
    
    # Remove new columns from documents table
    op.drop_column('documents', 'is_style_reference')
    op.drop_column('documents', 'owner_id')
    op.drop_column('documents', 'reference_type')
    op.drop_column('documents', 'document_type')
    
    # Make run_id not nullable again
    op.alter_column('documents', 'run_id', nullable=False)
