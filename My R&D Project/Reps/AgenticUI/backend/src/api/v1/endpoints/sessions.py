"""Session API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.models import Query as QueryModel, Session as SessionModel
from backend.src.db.session import get_db
from backend.src.models.schemas import QueryResponse, SessionResponse

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Get session history including all queries and their responses.

    Args:
        session_id: The UUID of the session.
    """
    result = await db.execute(
        select(SessionModel).where(SessionModel.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load associated queries
    queries_result = await db.execute(
        select(QueryModel).where(QueryModel.session_id == session_id).order_by(QueryModel.created_at)
    )
    queries = queries_result.scalars().all()

    return SessionResponse(
        session_id=str(session.session_id),
        user_id=session.user_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        status=session.status,
        total_queries=session.total_queries,
        queries=[
            QueryResponse(
                query_id=str(q.query_id),
                status=q.validation_status or "unknown",
                final_response=q.final_response.get("text", "") if q.final_response else "",
                response_summary="",
                executed_agents=[],
                review_status=q.validation_status or "N/A",
                processing_time_ms=q.processing_time_ms or 0,
                timestamp=q.created_at.isoformat() if q.created_at else "",
            )
            for q in queries
        ],
    )
