from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class LLMConfigCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    provider: str = Field(..., min_length=1, max_length=50)
    base_url: Optional[str] = Field(None, max_length=2000)
    api_key: Optional[str] = Field(None, max_length=500)
    model_name: str = Field(..., min_length=1, max_length=200)


class LLMConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: UUID
    provider: str
    base_url: Optional[str]
    model_name: str
    is_active: str
    created_by: str
    created_at: datetime
    updated_at: datetime


class LLMTestResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    success: bool
    message: str
    latency_ms: Optional[int] = None
    model_info: Optional[str] = None


class ProviderInfo(BaseModel):
    id: str
    name: str
    fields: list[str]
    default_base_url: Optional[str] = None
    default_models: list[str] = []
