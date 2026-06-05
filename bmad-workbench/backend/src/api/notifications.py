from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.auth import get_current_user, MockUser
from src.schemas.notification import NotificationOut
from src.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = NotificationService(db)
    notifications = await svc.list_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
    )
    return notifications


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = NotificationService(db)
    count = await svc.get_unread_count(current_user.id)
    return {"count": count}


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = NotificationService(db)
    notification = await svc.mark_as_read(notification_id)
    await db.commit()
    return notification


@router.post("/read-all", response_model=dict)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = NotificationService(db)
    count = await svc.mark_all_as_read(current_user.id)
    await db.commit()
    return {"marked_as_read": count}
