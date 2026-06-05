"""Add documents revisions approvals audit_log

Revision ID: f71bed165965
Revises: 
Create Date: 2026-06-04 16:38:23.896116

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f71bed165965'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'documents',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('thread_id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('current_revision_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_documents_thread_id', 'documents', ['thread_id'])
    op.create_index('idx_documents_project_id', 'documents', ['project_id'])

    op.create_table(
        'revisions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('document_id', sa.Uuid(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author_type', sa.String(length=20), nullable=False),
        sa.Column('author_id', sa.String(length=100), nullable=False),
        sa.Column('mode_at_creation', sa.String(length=50), nullable=True),
        sa.Column('parent_revision_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_revision_id'], ['revisions.id']),
    )
    op.create_index('idx_revisions_document_id', 'revisions', ['document_id'])

    op.create_table(
        'approvals',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('revision_id', sa.Uuid(), nullable=False),
        sa.Column('document_id', sa.Uuid(), nullable=False),
        sa.Column('approved_by', sa.String(length=100), nullable=False),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('signature_placeholder', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['revision_id'], ['revisions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_approvals_document_id', 'approvals', ['document_id'])

    op.create_table(
        'audit_log',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('thread_id', sa.String(), nullable=True),
        sa.Column('user_id', sa.String(length=100), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_thread_id', 'audit_log', ['thread_id'])
    op.create_index('idx_audit_action', 'audit_log', ['action'])

    # Add current_revision_id FK after revisions table exists
    op.create_foreign_key(
        'fk_documents_current_revision',
        'documents', 'revisions',
        ['current_revision_id'], ['id'],
        use_alter=True
    )


def downgrade() -> None:
    op.drop_constraint('fk_documents_current_revision', 'documents', type_='foreignkey')
    op.drop_table('audit_log')
    op.drop_table('approvals')
    op.drop_table('revisions')
    op.drop_table('documents')
