from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Uuid

from src.core.database import Base


class UUIDMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
