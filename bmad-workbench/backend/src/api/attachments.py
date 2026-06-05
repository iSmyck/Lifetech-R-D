from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, Header
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.auth import get_current_user, MockUser
from src.core.exceptions import ApiError
from src.schemas.attachment import AttachmentOut, AttachmentPreviewOut
from src.services.attachment_service import AttachmentService
from src.tasks.attachments import process_attachment_task

router = APIRouter(prefix="/attachments", tags=["attachments"])


@router.post("", status_code=201, response_model=AttachmentOut)
async def upload_attachment(
    thread_id: str = Form(...),
    project_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    if not file.filename:
        raise ApiError(status_code=400, message="Filename is required")

    content = await file.read()
    svc = AttachmentService(db)
    attachment = await svc.create_attachment(
        thread_id=thread_id,
        project_id=project_id,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        file_data=content,
        uploaded_by=current_user.id,
    )
    await db.commit()

    # Dispatch Celery task
    process_attachment_task.delay(str(attachment.id))

    return attachment


@router.get("/{attachment_id}", response_model=AttachmentOut)
async def get_attachment(
    attachment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = AttachmentService(db)
    attachment = await svc.get_attachment(attachment_id)
    if not attachment:
        raise ApiError(status_code=404, message="Attachment not found")
    return attachment


@router.get("/{attachment_id}/preview", response_model=AttachmentPreviewOut)
async def preview_attachment(
    attachment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = AttachmentService(db)
    attachment = await svc.get_attachment(attachment_id)
    if not attachment:
        raise ApiError(status_code=404, message="Attachment not found")
    return AttachmentPreviewOut(
        id=attachment.id,
        filename=attachment.filename,
        parsed_text=attachment.parsed_text,
        status=attachment.status,
    )


@router.get("/by-thread/{thread_id}", response_model=list[AttachmentOut])
async def list_attachments_by_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
):
    svc = AttachmentService(db)
    attachments = await svc.list_attachments_by_thread(thread_id)
    return attachments
