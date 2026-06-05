from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship

from src.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    threads = relationship("Thread", back_populates="project", order_by="Thread.created_at.desc()")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")


class Thread(Base):
    __tablename__ = "threads"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    status = Column(String(20), nullable=False, default="active")
    is_pinned = Column(String(1), nullable=False, default="0")
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # BMAD integration fields
    agent_id = Column(String(100), nullable=True, index=True)
    workflow_id = Column(String(100), nullable=True, index=True)
    bmad_state = Column(JSON, nullable=True, default=dict)

    project = relationship("Project", back_populates="threads")
    stakeholders = relationship("Stakeholder", back_populates="thread", cascade="all, delete-orphan", order_by="Stakeholder.added_at")
    reviews = relationship("Review", back_populates="thread", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="thread", cascade="all, delete-orphan", order_by="Resource.created_at")


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="analyst")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="members")
