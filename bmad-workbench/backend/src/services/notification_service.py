from uuid import UUID
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from src.models.notification import Notification
from src.core.exceptions import ApiError


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: str,
        type: str,
        title: str,
        message: str,
        thread_id: Optional[str] = None,
        action_url: Optional[str] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            thread_id=thread_id,
            action_url=action_url,
        )
        self.db.add(notification)
        await self.db.flush()
        await self.db.refresh(notification)
        return notification

    async def list_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .limit(limit)
        )
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_notification(self, notification_id: UUID) -> Optional[Notification]:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        return result.scalar_one_or_none()

    async def mark_as_read(self, notification_id: UUID) -> Notification:
        notification = await self.get_notification(notification_id)
        if not notification:
            raise ApiError(status_code=404, message="Notification not found")
        notification.is_read = True
        await self.db.flush()
        await self.db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: str) -> int:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )
        result = await self.db.execute(stmt)
        notifications = result.scalars().all()
        for n in notifications:
            n.is_read = True
        await self.db.flush()
        return len(notifications)

    async def get_unread_count(self, user_id: str) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )
        return result.scalar() or 0
