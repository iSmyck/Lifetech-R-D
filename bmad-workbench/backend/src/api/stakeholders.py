from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.auth import get_current_user, MockUser
from src.core.exceptions import ApiError
from src.schemas.stakeholder import StakeholderCreate, StakeholderUpdate, StakeholderOut
from src.services.stakeholder_service import StakeholderService, MOCK_USERS

router = APIRouter(prefix="/threads", tags=["stakeholders"])


def _enrich_stakeholder(stakeholder) -> dict:
    """Add user details to stakeholder output."""
    data = {
        "id": str(stakeholder.id),
        "thread_id": str(stakeholder.thread_id),
        "user_id": stakeholder.user_id,
        "role": stakeholder.role,
        "added_by": stakeholder.added_by,
        "added_at": stakeholder.added_at.isoformat() if stakeholder.added_at else None,
        "user": MOCK_USERS.get(stakeholder.user_id),
    }
    return data


@router.get("/{thread_id}/stakeholders")
async def list_stakeholders(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    stakeholders = await svc.list_stakeholders(thread_id)
    return [_enrich_stakeholder(s) for s in stakeholders]


@router.post("/{thread_id}/stakeholders", status_code=201)
async def add_stakeholder(
    thread_id: UUID,
    payload: StakeholderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = StakeholderService(db)
    stakeholder = await svc.add_stakeholder(
        thread_id=thread_id,
        user_id=payload.user_id,
        role=payload.role,
        added_by=current_user.id,
    )
    await db.commit()
    return _enrich_stakeholder(stakeholder)


@router.patch("/{thread_id}/stakeholders/{user_id}")
async def update_stakeholder_role(
    thread_id: UUID,
    user_id: str,
    payload: StakeholderUpdate,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    stakeholder = await svc.update_stakeholder_role(
        thread_id=thread_id,
        user_id=user_id,
        role=payload.role,
    )
    await db.commit()
    return _enrich_stakeholder(stakeholder)


@router.delete("/{thread_id}/stakeholders/{user_id}", status_code=204)
async def remove_stakeholder(
    thread_id: UUID,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    removed = await svc.remove_stakeholder(thread_id, user_id)
    if not removed:
        raise ApiError(status_code=404, message="Stakeholder not found")
    await db.commit()
    return None
