from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, DateTime, Index
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Stakeholder(Base):
    __tablename__ = "stakeholders"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    thread_id = Column(Uuid(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="consulted")  # accountable, responsible, consulted, informed
    added_by = Column(String(100), nullable=False)
    added_at = Column(DateTime(timezone=True), default=utc_now)

    thread = relationship("Thread", back_populates="stakeholders")

    __table_args__ = (
        Index("ix_stakeholders_thread_user", "thread_id", "user_id", unique=True),
    )
