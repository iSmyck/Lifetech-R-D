from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Integer, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    thread_id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    storage_path = Column(String(1000), nullable=False)
    status = Column(String(20), nullable=False, default="uploading")
    parsed_text = Column(Text, nullable=True)
    embedding = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
