from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    thread_id = Column(Uuid(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # jira, confluence
    external_id = Column(String(200), nullable=False)
    title = Column(String(500), nullable=False)
    status = Column(String(100), nullable=True)
    url = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON string for extensibility
    include_in_ai_context = Column(String(1), nullable=False, default="1")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    thread = relationship("Thread", back_populates="resources")
