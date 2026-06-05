from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: str
    thread_id: Optional[str]
    type: str
    title: str
    message: str
    is_read: bool
    action_url: Optional[str]
    created_at: datetime


class NotificationCreate(BaseModel):
    user_id: str
    thread_id: Optional[str] = None
    type: str
    title: str
    message: str
    action_url: Optional[str] = None
