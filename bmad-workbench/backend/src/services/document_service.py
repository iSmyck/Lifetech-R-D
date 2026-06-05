from uuid import UUID
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from src.models.document import Document, Revision, Approval, AuditLog
from src.core.exceptions import ApiError


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_document(self, title: str, thread_id: str, project_id: str) -> Document:
        document = Document(title=title, thread_id=thread_id, project_id=project_id, status="draft")
        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)

        # Create initial empty revision
        revision = Revision(
            document_id=document.id,
            content="",
            author_type="system",
            author_id="system",
        )
        self.db.add(revision)
        await self.db.flush()
        await self.db.refresh(revision)

        document.current_revision_id = revision.id
        await self.db.flush()
        await self.db.refresh(document)

        # Audit log
        await self._audit(thread_id, None, "document_created", {"document_id": str(document.id), "title": title})
        return document

    async def get_document(self, document_id: UUID) -> Optional[Document]:
        result = await self.db.execute(
            select(Document)
            .where(Document.id == document_id)
            .options(selectinload(Document.current_revision))
        )
        return result.scalar_one_or_none()

    async def patch_document(self, document_id: UUID, title: Optional[str]) -> Document:
        document = await self.get_document(document_id)
        if not document:
            raise ApiError(status_code=404, message="Document not found")
        if title is not None:
            document.title = title
        await self.db.flush()
        await self.db.refresh(document)
        return document

    async def create_revision(
        self,
        document_id: UUID,
        content: str,
        author_type: str,
        author_id: str,
        mode_at_creation: Optional[str] = None,
    ) -> Revision:
        document = await self.get_document(document_id)
        if not document:
            raise ApiError(status_code=404, message="Document not found")

        parent_id = document.current_revision_id
        revision = Revision(
            document_id=document_id,
            content=content,
            author_type=author_type,
            author_id=author_id,
            mode_at_creation=mode_at_creation,
            parent_revision_id=parent_id,
        )
        self.db.add(revision)
        await self.db.flush()
        await self.db.refresh(revision)

        document.current_revision_id = revision.id
        await self.db.flush()

        await self._audit(
            document.thread_id,
            author_id,
            "revision_created",
            {"document_id": str(document_id), "revision_id": str(revision.id)},
        )
        return revision

    async def list_revisions(self, document_id: UUID) -> List[Revision]:
        result = await self.db.execute(
            select(Revision)
            .where(Revision.document_id == document_id)
            .order_by(desc(Revision.created_at))
        )
        return result.scalars().all()

    async def get_revision(self, document_id: UUID, revision_id: UUID) -> Optional[Revision]:
        result = await self.db.execute(
            select(Revision).where(Revision.id == revision_id, Revision.document_id == document_id)
        )
        return result.scalar_one_or_none()

    async def approve_document(self, document_id: UUID, approved_by: str) -> Document:
        document = await self.get_document(document_id)
        if not document:
            raise ApiError(status_code=404, message="Document not found")

        if document.status != "draft":
            raise ApiError(status_code=409, message=f"Cannot approve document in status '{document.status}'")

        if document.current_revision_id is None:
            raise ApiError(status_code=409, message="Document has no revisions to approve")

        approval = Approval(
            revision_id=document.current_revision_id,
            document_id=document_id,
            approved_by=approved_by,
        )
        self.db.add(approval)
        document.status = "approved"
        await self.db.flush()
        await self.db.refresh(document)

        await self._audit(
            document.thread_id,
            approved_by,
            "draft_approved",
            {"document_id": str(document_id), "revision_id": str(document.current_revision_id)},
        )
        return document

    async def publish_document(self, document_id: UUID) -> Document:
        document = await self.get_document(document_id)
        if not document:
            raise ApiError(status_code=404, message="Document not found")
        if document.status != "approved":
            raise ApiError(status_code=409, message="Document must be approved before publishing")
        document.status = "published"
        await self.db.flush()
        await self.db.refresh(document)

        await self._audit(
            document.thread_id,
            None,
            "document_published",
            {"document_id": str(document_id)},
        )
        return document

    async def get_audit_log(self, thread_id: Optional[str] = None) -> List[AuditLog]:
        stmt = select(AuditLog).order_by(desc(AuditLog.created_at))
        if thread_id:
            stmt = stmt.where(AuditLog.thread_id == thread_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def _audit(self, thread_id: Optional[str], user_id: Optional[str], action: str, details: dict):
        entry = AuditLog(thread_id=thread_id, user_id=user_id, action=action, details=details)
        self.db.add(entry)
        await self.db.flush()
