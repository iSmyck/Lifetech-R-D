from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Integer, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    thread_id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    status = Column(String(20), nullable=False, default="draft")
    current_revision_id = Column(Uuid(as_uuid=True), ForeignKey("revisions.id", use_alter=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # BMAD integration fields
    document_type = Column(String(50), nullable=True, index=True)
    source_skill = Column(String(100), nullable=True, index=True)
    phase_generated = Column(String(50), nullable=True)

    revisions = relationship("Revision", back_populates="document", foreign_keys="Revision.document_id", order_by="Revision.created_at.desc()")
    current_revision = relationship("Revision", foreign_keys=[current_revision_id], post_update=True)
    approvals = relationship("Approval", back_populates="document", order_by="Approval.approved_at.desc()")
    reviews = relationship("Review", back_populates="document", cascade="all, delete-orphan", order_by="Review.created_at.desc()")


class Revision(Base):
    __tablename__ = "revisions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(Uuid(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False, default="")
    author_type = Column(String(20), nullable=False)
    author_id = Column(String(100), nullable=False)
    mode_at_creation = Column(String(50), nullable=True)
    parent_revision_id = Column(Uuid(as_uuid=True), ForeignKey("revisions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    document = relationship("Document", back_populates="revisions", foreign_keys=[document_id])
    parent_revision = relationship("Revision", remote_side="Revision.id")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    revision_id = Column(Uuid(as_uuid=True), ForeignKey("revisions.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Uuid(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    approved_by = Column(String(100), nullable=False)
    approved_at = Column(DateTime(timezone=True), default=utc_now)
    signature_placeholder = Column(Text, nullable=True)

    document = relationship("Document", back_populates="approvals")
    revision = relationship("Revision")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    thread_id = Column(String, nullable=True, index=True)
    user_id = Column(String(100), nullable=True)
    action = Column(String(50), nullable=False, index=True)
    details = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)
