from uuid import UUID
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from src.models.resource import Resource
from src.models.thread import Thread
from src.core.exceptions import ApiError


class ResourceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_thread(self, thread_id: UUID) -> Optional[Thread]:
        result = await self.db.execute(select(Thread).where(Thread.id == thread_id))
        return result.scalar_one_or_none()

    async def list_resources(self, thread_id: UUID) -> List[Resource]:
        result = await self.db.execute(
            select(Resource).where(Resource.thread_id == thread_id).order_by(desc(Resource.created_at))
        )
        return result.scalars().all()

    async def add_resource(
        self,
        thread_id: UUID,
        type: str,
        external_id: str,
        title: str,
        status: Optional[str] = None,
        url: Optional[str] = None,
        metadata_json: Optional[str] = None,
        include_in_ai_context: bool = True,
    ) -> Resource:
        thread = await self.get_thread(thread_id)
        if not thread:
            raise ApiError(status_code=404, message="Thread not found")

        resource = Resource(
            thread_id=thread_id,
            type=type,
            external_id=external_id,
            title=title,
            status=status,
            url=url,
            metadata_json=metadata_json,
            include_in_ai_context="1" if include_in_ai_context else "0",
        )
        self.db.add(resource)
        await self.db.flush()
        await self.db.refresh(resource)
        return resource

    async def remove_resource(self, thread_id: UUID, resource_id: UUID) -> bool:
        thread = await self.get_thread(thread_id)
        if not thread:
            raise ApiError(status_code=404, message="Thread not found")

        result = await self.db.execute(
            select(Resource).where(
                Resource.id == resource_id,
                Resource.thread_id == thread_id,
            )
        )
        resource = result.scalar_one_or_none()
        if not resource:
            return False

        await self.db.delete(resource)
        await self.db.flush()
        return True
