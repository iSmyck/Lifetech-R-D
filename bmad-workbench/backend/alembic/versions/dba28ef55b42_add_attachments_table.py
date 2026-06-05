"""add attachments table

Revision ID: dba28ef55b42
Revises: 872c44da293a
Create Date: 2026-06-04 19:48:49.611153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dba28ef55b42'
down_revision: Union[str, None] = '872c44da293a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'attachments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('thread_id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('filename', sa.String(length=500), nullable=False),
        sa.Column('original_filename', sa.String(length=500), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('storage_path', sa.String(length=1000), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='uploading'),
        sa.Column('parsed_text', sa.Text(), nullable=True),
        sa.Column('embedding', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_attachments_thread_id', 'attachments', ['thread_id'])
    op.create_index('idx_attachments_project_id', 'attachments', ['project_id'])
    op.create_index('idx_attachments_status', 'attachments', ['status'])


def downgrade() -> None:
    op.drop_index('idx_attachments_status', table_name='attachments')
    op.drop_index('idx_attachments_project_id', table_name='attachments')
    op.drop_index('idx_attachments_thread_id', table_name='attachments')
    op.drop_table('attachments')
