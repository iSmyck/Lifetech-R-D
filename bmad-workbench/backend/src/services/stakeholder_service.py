from uuid import UUID
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from src.models.stakeholder import Stakeholder
from src.models.review import Review, InlineComment
from src.models.thread import Thread
from src.models.document import Document
from src.core.exceptions import ApiError


# Mock user directory lookup
MOCK_USERS = {
    "user-1": {"id": "user-1", "display_name": "Sarah Chen", "email": "sarah.chen@example.com", "department": "Product"},
    "user-2": {"id": "user-2", "display_name": "Alice Chen", "email": "alice.chen@example.com", "department": "Engineering"},
    "user-3": {"id": "user-3", "display_name": "Bob Martinez", "email": "bob.martinez@example.com", "department": "Engineering"},
    "user-4": {"id": "user-4", "display_name": "Carol White", "email": "carol.white@example.com", "department": "Design"},
    "user-5": {"id": "user-5", "display_name": "Dave Kim", "email": "dave.kim@example.com", "department": "QA"},
    "user-6": {"id": "user-6", "display_name": "Elena Rossi", "email": "elena.rossi@example.com", "department": "Product"},
    "user-7": {"id": "user-7", "display_name": "Frank Liu", "email": "frank.liu@example.com", "department": "Engineering"},
}


class StakeholderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_thread(self, thread_id: UUID) -> Optional[Thread]:
        result = await self.db.execute(select(Thread).where(Thread.id == thread_id))
        return result.scalar_one_or_none()

    async def list_stakeholders(self, thread_id: UUID) -> List[Stakeholder]:
        result = await self.db.execute(
            select(Stakeholder).where(Stakeholder.thread_id == thread_id).order_by(Stakeholder.added_at)
        )
        return result.scalars().all()

    async def add_stakeholder(
        self,
        thread_id: UUID,
        user_id: str,
        role: str,
        added_by: str,
    ) -> Stakeholder:
        thread = await self.get_thread(thread_id)
        if not thread:
            raise ApiError(status_code=404, message="Thread not found")

        # Validate user exists
        if user_id not in MOCK_USERS:
            raise ApiError(status_code=404, message="User not found")

        # Check if already a stakeholder
        result = await self.db.execute(
            select(Stakeholder).where(
                Stakeholder.thread_id == thread_id,
                Stakeholder.user_id == user_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise ApiError(status_code=409, message="User is already a stakeholder in this thread")

        # If assigning accountable, ensure only one exists
        if role == "accountable":
            result = await self.db.execute(
                select(Stakeholder).where(
                    Stakeholder.thread_id == thread_id,
                    Stakeholder.role == "accountable",
                )
            )
            current_accountable = result.scalar_one_or_none()
            if current_accountable:
                current_accountable.role = "consulted"
                await self.db.flush()

        stakeholder = Stakeholder(
            thread_id=thread_id,
            user_id=user_id,
            role=role,
            added_by=added_by,
        )
        self.db.add(stakeholder)
        await self.db.flush()
        await self.db.refresh(stakeholder)
        return stakeholder

    async def update_stakeholder_role(
        self,
        thread_id: UUID,
        user_id: str,
        role: str,
    ) -> Stakeholder:
        thread = await self.get_thread(thread_id)
        if not thread:
            raise ApiError(status_code=404, message="Thread not found")

        result = await self.db.execute(
            select(Stakeholder).where(
                Stakeholder.thread_id == thread_id,
                Stakeholder.user_id == user_id,
            )
        )
        stakeholder = result.scalar_one_or_none()
        if not stakeholder:
            raise ApiError(status_code=404, message="Stakeholder not found")

        # If assigning accountable, reassign current accountable
        if role == "accountable":
            result = await self.db.execute(
                select(Stakeholder).where(
                    Stakeholder.thread_id == thread_id,
                    Stakeholder.role == "accountable",
                    Stakeholder.user_id != user_id,
                )
            )
            current_accountable = result.scalar_one_or_none()
            if current_accountable:
                current_accountable.role = "consulted"
                await self.db.flush()

        stakeholder.role = role
        await self.db.flush()
        await self.db.refresh(stakeholder)
        return stakeholder

    async def remove_stakeholder(self, thread_id: UUID, user_id: str) -> bool:
        thread = await self.get_thread(thread_id)
        if not thread:
            raise ApiError(status_code=404, message="Thread not found")

        result = await self.db.execute(
            select(Stakeholder).where(
                Stakeholder.thread_id == thread_id,
                Stakeholder.user_id == user_id,
            )
        )
        stakeholder = result.scalar_one_or_none()
        if not stakeholder:
            return False

        await self.db.delete(stakeholder)
        await self.db.flush()
        return True

    # --- Review operations ---

    async def create_review(
        self,
        thread_id: UUID,
        document_id: UUID,
        reviewer_id: str,
        comment: Optional[str] = None,
    ) -> Review:
        review = Review(
            thread_id=thread_id,
            document_id=document_id,
            reviewer_id=reviewer_id,
            status="pending",
            comment=comment,
        )
        self.db.add(review)
        await self.db.flush()
        await self.db.refresh(review)
        return review

    async def get_review(self, review_id: UUID) -> Optional[Review]:
        result = await self.db.execute(select(Review).where(Review.id == review_id))
        return result.scalar_one_or_none()

    async def list_reviews_for_document(self, document_id: UUID) -> List[Review]:
        result = await self.db.execute(
            select(Review).where(Review.document_id == document_id).order_by(desc(Review.created_at))
        )
        return result.scalars().all()

    async def respond_to_review(
        self,
        review_id: UUID,
        status: str,
        comment: Optional[str] = None,
    ) -> Review:
        review = await self.get_review(review_id)
        if not review:
            raise ApiError(status_code=404, message="Review not found")

        review.status = status
        if comment is not None:
            review.comment = comment
        await self.db.flush()
        await self.db.refresh(review)
        return review

    async def add_inline_comment(
        self,
        review_id: UUID,
        document_id: UUID,
        author_id: str,
        text: str,
    ) -> InlineComment:
        comment = InlineComment(
            review_id=review_id,
            document_id=document_id,
            author_id=author_id,
            text=text,
        )
        self.db.add(comment)
        await self.db.flush()
        await self.db.refresh(comment)
        return comment

    async def list_inline_comments(self, document_id: UUID) -> List[InlineComment]:
        result = await self.db.execute(
            select(InlineComment).where(InlineComment.document_id == document_id).order_by(desc(InlineComment.created_at))
        )
        return result.scalars().all()

    async def resolve_inline_comment(self, comment_id: UUID) -> Optional[InlineComment]:
        result = await self.db.execute(select(InlineComment).where(InlineComment.id == comment_id))
        comment = result.scalar_one_or_none()
        if not comment:
            return None
        comment.resolved = "1"
        await self.db.flush()
        await self.db.refresh(comment)
        return comment
