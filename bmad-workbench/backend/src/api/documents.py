from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.exceptions import ApiError
from src.schemas.document import (
    DocumentCreate,
    DocumentOut,
    DocumentDetailOut,
    DocumentPatch,
    RevisionCreate,
    RevisionOut,
    ApprovalCreate,
    ApprovalOut,
)
from src.services.document_service import DocumentService

import difflib

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=DocumentOut)
async def create_document(payload: DocumentCreate, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    doc = await svc.create_document(payload.title, payload.thread_id, payload.project_id)
    await db.commit()
    return doc


@router.get("/{document_id}", response_model=DocumentDetailOut)
async def get_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    doc = await svc.get_document(document_id)
    if not doc:
        raise ApiError(status_code=404, message="Document not found")
    return doc


@router.patch("/{document_id}", response_model=DocumentOut)
async def patch_document(document_id: UUID, payload: DocumentPatch, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    doc = await svc.patch_document(document_id, payload.title)
    await db.commit()
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
async def delete_document(document_id: UUID):
    raise ApiError(status_code=405, message="Documents are append-only and cannot be deleted")


@router.post("/{document_id}/revisions", status_code=status.HTTP_201_CREATED, response_model=RevisionOut)
async def create_revision(document_id: UUID, payload: RevisionCreate, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    rev = await svc.create_revision(
        document_id,
        payload.content,
        payload.author_type,
        payload.author_id,
        payload.mode_at_creation,
    )
    await db.commit()
    return rev


@router.get("/{document_id}/revisions", response_model=list[RevisionOut])
async def list_revisions(document_id: UUID, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    revs = await svc.list_revisions(document_id)
    return revs


@router.get("/{document_id}/revisions/{revision_id}", response_model=RevisionOut)
async def get_revision(document_id: UUID, revision_id: UUID, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    rev = await svc.get_revision(document_id, revision_id)
    if not rev:
        raise ApiError(status_code=404, message="Revision not found")
    return rev


@router.get("/{document_id}/diff")
async def diff_document(
    document_id: UUID,
    from_revision: UUID,
    to_revision: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    from_rev = await svc.get_revision(document_id, from_revision)
    if not from_rev:
        raise ApiError(status_code=404, message="From revision not found")

    if to_revision is None:
        doc = await svc.get_document(document_id)
        if doc and doc.current_revision_id:
            to_revision = doc.current_revision_id
        else:
            raise ApiError(status_code=404, message="No current revision to diff against")

    to_rev = await svc.get_revision(document_id, to_revision)
    if not to_rev:
        raise ApiError(status_code=404, message="To revision not found")

    diff = difflib.unified_diff(
        from_rev.content.splitlines(keepends=True),
        to_rev.content.splitlines(keepends=True),
        fromfile=f"revision-{from_revision}",
        tofile=f"revision-{to_revision}",
    )
    diff_text = "".join(diff)
    return PlainTextResponse(content=diff_text, media_type="text/plain")


@router.post("/{document_id}/approve", response_model=DocumentOut)
async def approve_document(document_id: UUID, payload: ApprovalCreate, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    doc = await svc.approve_document(document_id, payload.approved_by)
    await db.commit()
    return doc


@router.post("/{document_id}/publish", response_model=DocumentOut)
async def publish_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    doc = await svc.publish_document(document_id)
    await db.commit()
    return doc
