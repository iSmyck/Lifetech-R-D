from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    thread_id = Column(Uuid(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Uuid(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(100), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="pending")  # pending, approved, changes_requested
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    document = relationship("Document", back_populates="reviews")
    thread = relationship("Thread", back_populates="reviews")


class InlineComment(Base):
    __tablename__ = "inline_comments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    review_id = Column(Uuid(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Uuid(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(100), nullable=False)
    text = Column(Text, nullable=False)
    resolved = Column(String(1), nullable=False, default="0")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    review = relationship("Review")
    document = relationship("Document")
