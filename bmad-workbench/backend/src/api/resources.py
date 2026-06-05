from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.exceptions import ApiError
from src.schemas.resource import ResourceCreate, ResourceOut, ResourceSearchResult
from src.services.resource_service import ResourceService
from src.services.jira_client import JiraClient
from src.services.confluence_client import ConfluenceClient

router = APIRouter(tags=["resources"])


@router.get("/threads/{thread_id}/resources")
async def list_resources(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = ResourceService(db)
    resources = await svc.list_resources(thread_id)
    return [
        {
            "id": str(r.id),
            "thread_id": str(r.thread_id),
            "type": r.type,
            "external_id": r.external_id,
            "title": r.title,
            "status": r.status,
            "url": r.url,
            "metadata_json": r.metadata_json,
            "include_in_ai_context": r.include_in_ai_context,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in resources
    ]


@router.post("/threads/{thread_id}/resources", status_code=201)
async def add_resource(
    thread_id: UUID,
    payload: ResourceCreate,
    db: AsyncSession = Depends(get_db),
):
    svc = ResourceService(db)
    resource = await svc.add_resource(
        thread_id=thread_id,
        type=payload.type,
        external_id=payload.external_id,
        title=payload.title,
        status=payload.status,
        url=payload.url,
        metadata_json=payload.metadata_json,
        include_in_ai_context=payload.include_in_ai_context,
    )
    await db.commit()
    return {
        "id": str(resource.id),
        "thread_id": str(resource.thread_id),
        "type": resource.type,
        "external_id": resource.external_id,
        "title": resource.title,
        "status": resource.status,
        "url": resource.url,
        "metadata_json": resource.metadata_json,
        "include_in_ai_context": resource.include_in_ai_context,
        "created_at": resource.created_at.isoformat() if resource.created_at else None,
    }


@router.delete("/threads/{thread_id}/resources/{resource_id}", status_code=204)
async def remove_resource(
    thread_id: UUID,
    resource_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = ResourceService(db)
    removed = await svc.remove_resource(thread_id, resource_id)
    if not removed:
        raise ApiError(status_code=404, message="Resource not found")
    await db.commit()
    return None


@router.get("/integrations/jira/search", response_model=list[ResourceSearchResult])
async def search_jira(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
):
    client = JiraClient()
    return await client.search(q, limit=limit)


@router.get("/integrations/confluence/search", response_model=list[ResourceSearchResult])
async def search_confluence(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
):
    client = ConfluenceClient()
    return await client.search(q, limit=limit)
