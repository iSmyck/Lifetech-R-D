from uuid import UUID
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class ReviewCreate(BaseModel):
    reviewer_ids: List[str] = Field(..., min_length=1)
    message: Optional[str] = Field(None, max_length=5000)


class ReviewRespond(BaseModel):
    status: str = Field(..., pattern="^(approved|changes_requested)$")
    comment: Optional[str] = Field(None, max_length=5000)


class InlineCommentCreate(BaseModel):
    review_id: UUID
    text: str = Field(..., min_length=1, max_length=5000)


class InlineCommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    review_id: UUID
    document_id: UUID
    author_id: str
    text: str
    resolved: str
    created_at: datetime
    updated_at: datetime


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    thread_id: UUID
    document_id: UUID
    reviewer_id: str
    status: str
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime


class ReviewWithUserOut(ReviewOut):
    reviewer: Optional[dict] = None
    inline_comments: List[InlineCommentOut] = []
