from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.auth import get_current_user, MockUser
from src.core.exceptions import ApiError
from src.schemas.thread import ProjectOut, ProjectCreate, ProjectDetailOut, ProjectMemberOut
from src.services.thread_service import ThreadService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    """List projects for the current user. Falls back to all projects if user has no memberships."""
    svc = ThreadService(db)
    projects = await svc.list_projects_for_user(current_user.id)
    if not projects:
        # Fallback for dev: show all projects so the UI is never empty
        projects = await svc.list_all_projects()
    return projects


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ProjectOut)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = ThreadService(db)
    project = await svc.create_project(payload.name, payload.description, current_user.id)
    await db.commit()
    return project


@router.get("/{project_id}", response_model=ProjectDetailOut)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    project = await svc.get_project(project_id)
    if not project:
        raise ApiError(status_code=404, message="Project not found")
    return project


@router.get("/{project_id}/members", response_model=list[ProjectMemberOut])
async def list_project_members(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    project = await svc.get_project(project_id)
    if not project:
        raise ApiError(status_code=404, message="Project not found")
    return project.members


@router.post("/{project_id}/members", response_model=ProjectMemberOut)
async def add_project_member(
    project_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    member = await svc.add_project_member(
        project_id=project_id,
        user_id=payload.get("user_id", ""),
        role=payload.get("role", "analyst"),
    )
    await db.commit()
    return member


@router.delete("/{project_id}/members/{user_id}")
async def remove_project_member(
    project_id: UUID,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    removed = await svc.remove_project_member(project_id, user_id)
    if not removed:
        raise ApiError(status_code=404, message="Member not found")
    await db.commit()
    return {"status": "removed"}
