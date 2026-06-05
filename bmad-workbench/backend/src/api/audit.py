from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.schemas.document import AuditLogOut
from src.services.document_service import DocumentService

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
async def get_audit_log(thread_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    svc = DocumentService(db)
    entries = await svc.get_audit_log(thread_id)
    return entries
