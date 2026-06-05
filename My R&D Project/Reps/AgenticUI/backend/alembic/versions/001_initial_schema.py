"""Initial schema for EGM AI pilot.

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # sessions table
    op.create_table(
        "sessions",
        sa.Column("session_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("status", sa.String(50), server_default="active"),
        sa.Column("context_summary", sa.Text()),
        sa.Column("total_queries", sa.Integer(), server_default="0"),
    )

    # queries table
    op.create_table(
        "queries",
        sa.Column("query_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.session_id")),
        sa.Column("user_query", sa.Text(), nullable=False),
        sa.Column("classified_intent", sa.String(255)),
        sa.Column("execution_plan", postgresql.JSONB()),
        sa.Column("agent_outputs", postgresql.JSONB()),
        sa.Column("final_response", postgresql.JSONB()),
        sa.Column("validation_status", sa.String(50)),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime()),
        sa.Column("processing_time_ms", sa.Integer()),
    )

    # hitl_queue table
    op.create_table(
        "hitl_queue",
        sa.Column("review_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("query_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("queries.query_id")),
        sa.Column("flagged_by", sa.String(100)),
        sa.Column("flag_reason", sa.Text()),
        sa.Column("severity", sa.String(20)),
        sa.Column("review_package", postgresql.JSONB()),
        sa.Column("status", sa.String(50), server_default="pending"),
        sa.Column("reviewer_id", sa.String(255)),
        sa.Column("reviewer_decision", sa.String(50)),
        sa.Column("reviewer_notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("reviewed_at", sa.DateTime()),
    )

    # case_memory table
    op.create_table(
        "case_memory",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("query_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("queries.query_id")),
        sa.Column("market", sa.String(100)),
        sa.Column("product_category", sa.String(100)),
        sa.Column("intent_type", sa.String(100)),
        sa.Column("input_summary", sa.Text()),
        sa.Column("approved_output", postgresql.JSONB()),
        sa.Column("quality_score", sa.Numeric(3, 2)),
        sa.Column("reuse_count", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("approved_by", sa.String(255)),
    )

    # agent_log table
    op.create_table(
        "agent_log",
        sa.Column("log_id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("query_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("queries.query_id")),
        sa.Column("agent_name", sa.String(100)),
        sa.Column("model_used", sa.String(100)),
        sa.Column("input_tokens", sa.Integer()),
        sa.Column("output_tokens", sa.Integer()),
        sa.Column("execution_time_ms", sa.Integer()),
        sa.Column("status", sa.String(50)),
        sa.Column("error_message", sa.Text()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Indexes
    op.create_index("idx_queries_session", "queries", ["session_id"])
    op.create_index("idx_queries_created", "queries", ["created_at"])
    op.create_index("idx_hitl_status", "hitl_queue", ["status"])
    op.create_index("idx_hitl_created", "hitl_queue", ["created_at"])
    op.create_index("idx_case_memory_market", "case_memory", ["market", "product_category"])
    op.create_index("idx_case_memory_intent", "case_memory", ["intent_type"])
    op.create_index("idx_agent_log_query", "agent_log", ["query_id"])
    op.create_index("idx_agent_log_agent", "agent_log", ["agent_name"])
    op.create_index("idx_sessions_user", "sessions", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_sessions_user", "sessions")
    op.drop_index("idx_agent_log_agent", "agent_log")
    op.drop_index("idx_agent_log_query", "agent_log")
    op.drop_index("idx_case_memory_intent", "case_memory")
    op.drop_index("idx_case_memory_market", "case_memory")
    op.drop_index("idx_hitl_created", "hitl_queue")
    op.drop_index("idx_hitl_status", "hitl_queue")
    op.drop_index("idx_queries_created", "queries")
    op.drop_index("idx_queries_session", "queries")
    op.drop_table("agent_log")
    op.drop_table("case_memory")
    op.drop_table("hitl_queue")
    op.drop_table("queries")
    op.drop_table("sessions")
