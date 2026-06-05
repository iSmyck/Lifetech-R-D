from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class StakeholderCreate(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern="^(accountable|responsible|consulted|informed)$")


class StakeholderUpdate(BaseModel):
    role: str = Field(..., pattern="^(accountable|responsible|consulted|informed)$")


class StakeholderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    thread_id: UUID
    user_id: str
    role: str
    added_by: str
    added_at: datetime


class StakeholderWithUserOut(StakeholderOut):
    user: Optional[dict] = None
