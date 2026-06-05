from uuid import UUID
from typing import Optional, List
from io import BytesIO

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from src.models.attachment import Attachment
from src.core.exceptions import ApiError
from src.core.minio_client import get_minio_client, upload_file


ALLOWED_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "image/png",
    "image/jpeg",
}

ALLOWED_EXTENSIONS = {".docx", ".pdf", ".txt", ".md", ".png", ".jpg", ".jpeg"}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


class AttachmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_attachment(
        self,
        thread_id: str,
        project_id: str,
        filename: str,
        mime_type: str,
        size_bytes: int,
        file_data: bytes,
        uploaded_by: Optional[str] = None,
    ) -> Attachment:
        # Validation
        if size_bytes > MAX_FILE_SIZE:
            raise ApiError(status_code=413, message="File exceeds 100MB limit")

        ext = filename.lower()[filename.rfind(".") :] if "." in filename else ""
        if mime_type not in ALLOWED_MIME_TYPES and ext not in ALLOWED_EXTENSIONS:
            raise ApiError(status_code=415, message="Unsupported file type")

        # Upload to MinIO
        client = get_minio_client()
        bucket_name = f"bmad-attachments-{project_id}"
        object_name = f"{thread_id}/{filename}"
        storage_path = upload_file(
            client,
            bucket_name,
            object_name,
            BytesIO(file_data),
            len(file_data),
            mime_type,
        )

        # Create DB record
        attachment = Attachment(
            thread_id=thread_id,
            project_id=project_id,
            filename=filename,
            original_filename=filename,
            mime_type=mime_type,
            size_bytes=size_bytes,
            storage_path=storage_path,
            status="processing",
        )
        self.db.add(attachment)
        await self.db.flush()
        await self.db.refresh(attachment)
        return attachment

    async def get_attachment(self, attachment_id: UUID) -> Optional[Attachment]:
        result = await self.db.execute(
            select(Attachment).where(Attachment.id == attachment_id)
        )
        return result.scalar_one_or_none()

    async def list_attachments_by_thread(self, thread_id: str) -> List[Attachment]:
        result = await self.db.execute(
            select(Attachment)
            .where(Attachment.thread_id == thread_id)
            .order_by(desc(Attachment.created_at))
        )
        return result.scalars().all()

    async def update_status(
        self,
        attachment_id: UUID,
        status: str,
        parsed_text: Optional[str] = None,
        embedding: Optional[list] = None,
        error_message: Optional[str] = None,
    ) -> Attachment:
        attachment = await self.get_attachment(attachment_id)
        if not attachment:
            raise ApiError(status_code=404, message="Attachment not found")

        attachment.status = status
        if parsed_text is not None:
            attachment.parsed_text = parsed_text
        if embedding is not None:
            attachment.embedding = embedding
        if error_message is not None:
            attachment.error_message = error_message

        await self.db.flush()
        await self.db.refresh(attachment)
        return attachment
