from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ResourceCreate(BaseModel):
    type: str = Field(..., pattern="^(jira|confluence)$")
    external_id: str = Field(..., min_length=1, max_length=200)
    title: str = Field(..., min_length=1, max_length=500)
    status: Optional[str] = Field(None, max_length=100)
    url: Optional[str] = Field(None, max_length=2000)
    metadata_json: Optional[str] = Field(None, max_length=5000)
    include_in_ai_context: bool = True


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    thread_id: UUID
    type: str
    external_id: str
    title: str
    status: Optional[str]
    url: Optional[str]
    metadata_json: Optional[str]
    include_in_ai_context: str
    created_at: datetime


class ResourceSearchResult(BaseModel):
    external_id: str
    title: str
    status: Optional[str] = None
    assignee: Optional[str] = None
    last_updated: Optional[str] = None
    url: Optional[str] = None
    space_name: Optional[str] = None
