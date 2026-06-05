from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, ConfigDict


# --- Revision schemas ---

class RevisionCreate(BaseModel):
    content: str = Field(..., max_length=100_000)
    author_type: str
    author_id: str
    mode_at_creation: Optional[str] = None


class RevisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    content: str
    author_type: str
    author_id: str
    mode_at_creation: Optional[str]
    parent_revision_id: Optional[UUID]
    created_at: datetime


# --- Document schemas ---

class DocumentCreate(BaseModel):
    title: str = Field(..., max_length=500)
    thread_id: str
    project_id: str


class DocumentPatch(BaseModel):
    title: Optional[str] = Field(None, max_length=500)


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    thread_id: str
    project_id: str
    title: str
    status: str
    current_revision_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    document_type: Optional[str] = None
    source_skill: Optional[str] = None
    phase_generated: Optional[str] = None


class DocumentDetailOut(DocumentOut):
    current_revision: Optional[RevisionOut] = None


# --- Approval schemas ---

class ApprovalCreate(BaseModel):
    approved_by: str


class ApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    revision_id: UUID
    document_id: UUID
    approved_by: str
    approved_at: datetime


# --- Audit log schemas ---

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    thread_id: Optional[str]
    user_id: Optional[str]
    action: str
    details: Dict[str, Any]
    created_at: datetime
