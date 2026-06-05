from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, ConfigDict


# --- Project schemas ---

class ProjectMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: str
    role: str
    created_at: datetime


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None


class ProjectDetailOut(ProjectOut):
    members: List[ProjectMemberOut] = []


# --- Thread schemas ---

class ThreadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    title: str
    status: str
    is_pinned: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    agent_id: Optional[str] = None
    workflow_id: Optional[str] = None
    bmad_state: Optional[Dict[str, Any]] = None


class ThreadCreate(BaseModel):
    project_id: UUID
    title: str = Field(..., max_length=500)
    initial_intent: Optional[str] = Field(None, max_length=5000)


class ThreadUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(active|paused|completed|aborted)$")
    title: Optional[str] = Field(None, max_length=500)
    is_pinned: Optional[str] = Field(None, pattern="^(0|1)$")
    agent_id: Optional[str] = Field(None, max_length=100)
    workflow_id: Optional[str] = Field(None, max_length=100)


class ThreadSelectAgent(BaseModel):
    agent_id: str = Field(..., max_length=100)
    workflow_id: str = Field(..., max_length=100)


class ThreadDetailOut(ThreadOut):
    pass
