"""Database ORM models matching the EGM AI schema."""

import uuid
from datetime import datetime

from sqlalchemy import JSON, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.src.db.base import Base


class Session(Base):
    """User session tracking."""

    __tablename__ = "sessions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())
    status: Mapped[str] = mapped_column(String(50), default="active")
    context_summary: Mapped[str | None] = mapped_column(Text)
    total_queries: Mapped[int] = mapped_column(Integer, default=0)

    queries: Mapped[list["Query"]] = relationship("Query", back_populates="session")


class Query(Base):
    """Individual marketing intelligence query."""

    __tablename__ = "queries"

    query_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sessions.session_id"), nullable=True
    )
    user_query: Mapped[str] = mapped_column(Text, nullable=False)
    classified_intent: Mapped[str | None] = mapped_column(String(255))
    execution_plan: Mapped[dict | None] = mapped_column(JSON)
    agent_outputs: Mapped[dict | None] = mapped_column(JSON)
    final_response: Mapped[dict | None] = mapped_column(JSON)
    validation_status: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column()
    processing_time_ms: Mapped[int | None] = mapped_column(Integer)

    session: Mapped["Session"] = relationship("Session", back_populates="queries")
    hitl_entries: Mapped[list["HITLQueue"]] = relationship("HITLQueue", back_populates="query")
    agent_logs: Mapped[list["AgentLog"]] = relationship("AgentLog", back_populates="query")
    case_memories: Mapped[list["CaseMemory"]] = relationship("CaseMemory", back_populates="query")

    __table_args__ = (
        Index("idx_queries_session", "session_id"),
        Index("idx_queries_created", "created_at"),
    )


class HITLQueue(Base):
    """Human-in-the-loop review queue."""

    __tablename__ = "hitl_queue"

    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    query_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("queries.query_id"))
    flagged_by: Mapped[str | None] = mapped_column(String(100))
    flag_reason: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str | None] = mapped_column(String(20))
    review_package: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    reviewer_id: Mapped[str | None] = mapped_column(String(255))
    reviewer_decision: Mapped[str | None] = mapped_column(String(50))
    reviewer_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column()

    query: Mapped["Query"] = relationship("Query", back_populates="hitl_entries")

    __table_args__ = (
        Index("idx_hitl_status", "status"),
        Index("idx_hitl_created", "created_at"),
    )


class CaseMemory(Base):
    """Approved outputs for few-shot learning reuse."""

    __tablename__ = "case_memory"

    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    query_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("queries.query_id"))
    market: Mapped[str | None] = mapped_column(String(100))
    product_category: Mapped[str | None] = mapped_column(String(100))
    intent_type: Mapped[str | None] = mapped_column(String(100))
    input_summary: Mapped[str | None] = mapped_column(Text)
    approved_output: Mapped[dict | None] = mapped_column(JSON)
    quality_score: Mapped[float | None] = mapped_column(Numeric(3, 2))
    reuse_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    approved_by: Mapped[str | None] = mapped_column(String(255))

    query: Mapped["Query"] = relationship("Query", back_populates="case_memories")

    __table_args__ = (
        Index("idx_case_memory_market", "market", "product_category"),
        Index("idx_case_memory_intent", "intent_type"),
    )


class AgentLog(Base):
    """Lightweight agent execution log for the pilot."""

    __tablename__ = "agent_log"

    log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    query_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("queries.query_id"))
    agent_name: Mapped[str | None] = mapped_column(String(100))
    model_used: Mapped[str | None] = mapped_column(String(100))
    input_tokens: Mapped[int | None] = mapped_column(Integer)
    output_tokens: Mapped[int | None] = mapped_column(Integer)
    execution_time_ms: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str | None] = mapped_column(String(50))
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    query: Mapped["Query"] = relationship("Query", back_populates="agent_logs")

    __table_args__ = (
        Index("idx_agent_log_query", "query_id"),
        Index("idx_agent_log_agent", "agent_name"),
    )
