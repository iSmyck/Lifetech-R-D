from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Boolean, Index
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(String(100), nullable=False, index=True)
    thread_id = Column(String(100), nullable=True, index=True)
    type = Column(String(50), nullable=False)  # checkpoint, draft, review, error, ai_resumed
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    action_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("ix_notifications_user_unread", "user_id", "is_read"),
    )
