from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    thread_id: str
    project_id: str
    filename: str
    original_filename: str
    mime_type: str
    size_bytes: int
    status: str
    parsed_text: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AttachmentCreate(BaseModel):
    thread_id: str
    project_id: str


class AttachmentPreviewOut(BaseModel):
    id: UUID
    filename: str
    parsed_text: Optional[str] = None
    status: str
