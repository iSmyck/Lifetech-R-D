from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.auth import get_current_user, MockUser
from src.schemas.llm_config import LLMConfigCreate, LLMTestResponse, ProviderInfo
from src.services.llm_config_service import LLMConfigService

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/llm")
async def get_llm_config(
    db: AsyncSession = Depends(get_db),
):
    svc = LLMConfigService(db)
    config = await svc.get_active_config()
    if not config:
        return {
            "provider": "lm_studio",
            "model_name": "google/gemma-4-e4b",
            "base_url": "http://127.0.0.1:1234/v1",
            "is_active": True,
        }
    return {
        "id": str(config.id),
        "provider": config.provider,
        "model_name": config.model_name,
        "base_url": config.base_url,
        "is_active": config.is_active == "1",
        "created_by": config.created_by,
        "created_at": config.created_at.isoformat() if config.created_at else None,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }


@router.post("/llm")
async def save_llm_config(
    payload: LLMConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = LLMConfigService(db)
    config = await svc.save_config(
        provider=payload.provider,
        model_name=payload.model_name,
        base_url=payload.base_url,
        api_key=payload.api_key,
        created_by=current_user.id,
    )
    await db.commit()
    return {
        "id": str(config.id),
        "provider": config.provider,
        "model_name": config.model_name,
        "base_url": config.base_url,
        "is_active": config.is_active == "1",
    }


@router.post("/llm/test")
async def test_llm_connection(
    payload: LLMConfigCreate,
):
    svc = LLMConfigService(None)  # No DB needed for test
    result = await svc.test_connection(
        provider=payload.provider,
        base_url=payload.base_url,
        api_key=payload.api_key,
        model_name=payload.model_name,
    )
    return result


@router.get("/llm/providers")
async def list_llm_providers():
    svc = LLMConfigService(None)
    return svc.list_providers()
