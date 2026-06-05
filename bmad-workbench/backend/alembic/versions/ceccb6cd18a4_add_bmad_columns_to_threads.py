"""Add BMAD columns to threads

Revision ID: ceccb6cd18a4
Revises: dba28ef55b42
Create Date: 2026-06-04 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ceccb6cd18a4'
down_revision: Union[str, None] = 'dba28ef55b42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('threads', sa.Column('is_pinned', sa.String(length=1), nullable=False, server_default='0'))
    op.add_column('threads', sa.Column('agent_id', sa.String(length=100), nullable=True, index=True))
    op.add_column('threads', sa.Column('workflow_id', sa.String(length=100), nullable=True, index=True))
    op.add_column('threads', sa.Column('bmad_state', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('threads', 'bmad_state')
    op.drop_column('threads', 'workflow_id')
    op.drop_column('threads', 'agent_id')
    op.drop_column('threads', 'is_pinned')
