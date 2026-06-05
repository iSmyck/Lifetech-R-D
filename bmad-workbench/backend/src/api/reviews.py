from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.auth import get_current_user, MockUser
from src.core.exceptions import ApiError
from src.schemas.review import ReviewCreate, ReviewRespond, InlineCommentCreate, InlineCommentOut
from src.services.stakeholder_service import StakeholderService, MOCK_USERS
from src.services.document_service import DocumentService

router = APIRouter(tags=["reviews"])


def _enrich_review(review) -> dict:
    data = {
        "id": str(review.id),
        "thread_id": str(review.thread_id),
        "document_id": str(review.document_id),
        "reviewer_id": review.reviewer_id,
        "status": review.status,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else None,
        "updated_at": review.updated_at.isoformat() if review.updated_at else None,
        "reviewer": MOCK_USERS.get(review.reviewer_id),
        "inline_comments": [],
    }
    return data


@router.post("/documents/{document_id}/reviews", status_code=201)
async def request_reviews(
    document_id: UUID,
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    doc_svc = DocumentService(db)

    document = await doc_svc.get_document(document_id)
    if not document:
        raise ApiError(status_code=404, message="Document not found")

    thread_id = UUID(document.thread_id)
    reviews = []
    for reviewer_id in payload.reviewer_ids:
        review = await svc.create_review(
            thread_id=thread_id,
            document_id=document_id,
            reviewer_id=reviewer_id,
            comment=payload.message,
        )
        reviews.append(review)

    await db.commit()
    return [_enrich_review(r) for r in reviews]


@router.get("/documents/{document_id}/reviews")
async def list_reviews(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    reviews = await svc.list_reviews_for_document(document_id)
    return [_enrich_review(r) for r in reviews]


@router.post("/reviews/{review_id}/respond")
async def respond_to_review(
    review_id: UUID,
    payload: ReviewRespond,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    review = await svc.respond_to_review(
        review_id=review_id,
        status=payload.status,
        comment=payload.comment,
    )
    await db.commit()
    return _enrich_review(review)


# Inline comments

@router.post("/documents/{document_id}/inline-comments", status_code=201)
async def create_inline_comment(
    document_id: UUID,
    payload: InlineCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = StakeholderService(db)
    comment = await svc.add_inline_comment(
        review_id=payload.review_id,
        document_id=document_id,
        author_id=current_user.id,
        text=payload.text,
    )
    await db.commit()
    return {
        "id": str(comment.id),
        "review_id": str(comment.review_id),
        "document_id": str(comment.document_id),
        "author_id": comment.author_id,
        "text": comment.text,
        "resolved": comment.resolved,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
    }


@router.get("/documents/{document_id}/inline-comments")
async def list_inline_comments(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    comments = await svc.list_inline_comments(document_id)
    return [
        {
            "id": str(c.id),
            "review_id": str(c.review_id),
            "document_id": str(c.document_id),
            "author_id": c.author_id,
            "text": c.text,
            "resolved": c.resolved,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in comments
    ]


@router.patch("/inline-comments/{comment_id}/resolve")
async def resolve_inline_comment(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = StakeholderService(db)
    comment = await svc.resolve_inline_comment(comment_id)
    if not comment:
        raise ApiError(status_code=404, message="Comment not found")
    await db.commit()
    return {
        "id": str(comment.id),
        "review_id": str(comment.review_id),
        "document_id": str(comment.document_id),
        "author_id": comment.author_id,
        "text": comment.text,
        "resolved": comment.resolved,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
    }
