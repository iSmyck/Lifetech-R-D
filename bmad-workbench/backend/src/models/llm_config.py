from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy import Uuid

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class LLMConfig(Base):
    __tablename__ = "llm_configs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    provider = Column(String(50), nullable=False)
    base_url = Column(Text, nullable=True)
    api_key_encrypted = Column(Text, nullable=True)
    model_name = Column(String(200), nullable=False)
    is_active = Column(String(1), nullable=False, default="1")
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
