"""HITL review API endpoints."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.models import HITLQueue
from backend.src.db.session import get_db
from backend.src.models.schemas import PendingReview, ReviewDecision, ReviewResponse

router = APIRouter(prefix="/review", tags=["hitl"])


@router.get("/pending")
async def list_pending_reviews(
    db: AsyncSession = Depends(get_db),
) -> list[PendingReview]:
    """List all pending HITL reviews."""
    result = await db.execute(
        select(HITLQueue).where(HITLQueue.status == "pending").order_by(HITLQueue.created_at)
    )
    reviews = result.scalars().all()
    return [
        PendingReview(
            review_id=str(r.review_id),
            query_id=str(r.query_id) if r.query_id else None,
            flag_reason=r.flag_reason or "",
            severity=r.severity or "medium",
            status=r.status,
            created_at=r.created_at,
        )
        for r in reviews
    ]


@router.post("/{review_id}", response_model=ReviewResponse)
async def submit_review_decision(
    review_id: str,
    decision: ReviewDecision,
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    """Submit a reviewer decision (approve / reject / edit).

    Args:
        review_id: The UUID of the review entry.
        decision: The reviewer's decision and optional edited output.
    """
    result = await db.execute(
        select(HITLQueue).where(HITLQueue.review_id == review_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.status != "pending":
        raise HTTPException(status_code=400, detail="Review already processed")

    # Update review status
    review.status = decision.reviewer_decision
    review.reviewer_decision = decision.reviewer_decision
    review.reviewer_notes = decision.reviewer_notes
    review.reviewed_at = datetime.now(timezone.utc)

    await db.commit()

    return ReviewResponse(
        review_id=review_id,
        status=decision.reviewer_decision,
        decision=decision.reviewer_decision,
        message=f"Review {decision.reviewer_decision} successfully",
    )
