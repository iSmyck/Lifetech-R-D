from uuid import UUID
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from src.models.thread import Project, Thread, ProjectMember
from src.models.document import Document, Revision, AuditLog
from src.core.exceptions import ApiError


class ThreadService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Project operations ---

    async def create_project(self, name: str, description: Optional[str], created_by: str) -> Project:
        project = Project(name=name, description=description)
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)

        # Add creator as lead member
        member = ProjectMember(project_id=project.id, user_id=created_by, role="lead")
        self.db.add(member)
        await self.db.flush()

        await self._audit(None, created_by, "project_created", {"project_id": str(project.id), "name": name})
        return project

    async def get_project(self, project_id: UUID) -> Optional[Project]:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id).options(selectinload(Project.members))
        )
        return result.scalar_one_or_none()

    async def list_projects_for_user(self, user_id: str) -> List[Project]:
        """Return projects where user is a member."""
        stmt = (
            select(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(ProjectMember.user_id == user_id)
            .order_by(Project.updated_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_all_projects(self) -> List[Project]:
        """Return all projects (admin use case; for Phase 1 used as fallback)."""
        result = await self.db.execute(select(Project).order_by(Project.updated_at.desc()))
        return result.scalars().all()

    # --- Thread operations ---

    async def create_thread(
        self,
        project_id: UUID,
        title: str,
        created_by: str,
        initial_intent: Optional[str] = None,
        agent_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        bmad_state: Optional[dict] = None,
    ) -> Thread:
        # Verify project exists
        project = await self.get_project(project_id)
        if not project:
            raise ApiError(status_code=404, message="Project not found")

        thread = Thread(
            project_id=project_id,
            title=title,
            status="active",
            created_by=created_by,
            agent_id=agent_id,
            workflow_id=workflow_id,
            bmad_state=bmad_state or {},
        )
        self.db.add(thread)
        await self.db.flush()
        await self.db.refresh(thread)

        # If initial intent provided, create a document with that as first revision
        if initial_intent:
            document = Document(
                title=title,
                thread_id=str(thread.id),
                project_id=str(project_id),
                status="draft",
            )
            self.db.add(document)
            await self.db.flush()
            await self.db.refresh(document)

            revision = Revision(
                document_id=document.id,
                content=initial_intent,
                author_type="human",
                author_id=created_by,
            )
            self.db.add(revision)
            await self.db.flush()
            await self.db.refresh(revision)

            document.current_revision_id = revision.id
            await self.db.flush()

        await self._audit(
            str(thread.id),
            created_by,
            "thread_created",
            {"project_id": str(project_id), "title": title, "agent_id": agent_id, "workflow_id": workflow_id},
        )
        return thread

    async def get_thread(self, thread_id: UUID) -> Optional[Thread]:
        result = await self.db.execute(select(Thread).where(Thread.id == thread_id))
        return result.scalar_one_or_none()

    async def list_threads_by_project(self, project_id: UUID) -> List[Thread]:
        result = await self.db.execute(
            select(Thread)
            .where(Thread.project_id == project_id)
            .order_by(desc(Thread.is_pinned), desc(Thread.updated_at))
        )
        return result.scalars().all()

    async def search_threads(
        self,
        user_id: Optional[str] = None,
        project_id: Optional[UUID] = None,
        status: Optional[str] = None,
        pinned: Optional[str] = None,
        sort: str = "updated_at",
        limit: int = 100,
    ) -> List[Thread]:
        stmt = select(Thread)
        if project_id:
            stmt = stmt.where(Thread.project_id == project_id)
        if status:
            stmt = stmt.where(Thread.status == status)
        if pinned is not None:
            stmt = stmt.where(Thread.is_pinned == pinned)
        
        if sort == "updated_at":
            stmt = stmt.order_by(desc(Thread.is_pinned), desc(Thread.updated_at))
        elif sort == "created_at":
            stmt = stmt.order_by(desc(Thread.is_pinned), desc(Thread.created_at))
        elif sort == "title":
            stmt = stmt.order_by(desc(Thread.is_pinned), Thread.title)
        elif sort == "status":
            stmt = stmt.order_by(desc(Thread.is_pinned), Thread.status, desc(Thread.updated_at))
        else:
            stmt = stmt.order_by(desc(Thread.is_pinned), desc(Thread.updated_at))
        
        stmt = stmt.limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_thread(
        self,
        thread_id: UUID,
        status: Optional[str] = None,
        title: Optional[str] = None,
        is_pinned: Optional[str] = None,
        agent_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        bmad_state: Optional[dict] = None,
    ) -> Thread:
        thread = await self.get_thread(thread_id)
        if not thread:
            raise ApiError(status_code=404, message="Thread not found")

        if status is not None:
            thread.status = status
        if title is not None:
            thread.title = title
        if is_pinned is not None:
            thread.is_pinned = is_pinned
        if agent_id is not None:
            thread.agent_id = agent_id
        if workflow_id is not None:
            thread.workflow_id = workflow_id
        if bmad_state is not None:
            thread.bmad_state = bmad_state

        await self.db.flush()
        await self.db.refresh(thread)

        await self._audit(
            str(thread.id),
            None,
            "thread_updated",
            {"status": status, "title": title, "is_pinned": is_pinned, "agent_id": agent_id, "workflow_id": workflow_id},
        )
        return thread

    async def respond_to_checkpoint(
        self,
        thread_id: UUID,
        checkpoint_id: str,
        response: str,
    ) -> Thread:
        thread = await self.get_thread(thread_id)
        if not thread:
            raise ApiError(status_code=404, message="Thread not found")

        if thread.status != "paused":
            # If thread is active, we allow responding to a checkpoint anyway
            # for a smoother UX, but log it.
            pass

        # Transition thread back to active
        thread.status = "active"
        await self.db.flush()
        await self.db.refresh(thread)

        await self._audit(
            str(thread.id),
            None,
            "checkpoint_responded",
            {"checkpoint_id": checkpoint_id, "response": response},
        )
        return thread

    async def add_project_member(self, project_id: UUID, user_id: str, role: str = "analyst") -> ProjectMember:
        project = await self.get_project(project_id)
        if not project:
            raise ApiError(status_code=404, message="Project not found")

        # Check if member already exists
        stmt = select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            existing.role = role
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        member = ProjectMember(project_id=project_id, user_id=user_id, role=role)
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)

        await self._audit(
            None,
            user_id,
            "member_added",
            {"project_id": str(project_id), "role": role},
        )
        return member

    async def remove_project_member(self, project_id: UUID, user_id: str) -> bool:
        stmt = select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        member = result.scalar_one_or_none()
        if not member:
            return False

        await self.db.delete(member)
        await self.db.flush()

        await self._audit(
            None,
            user_id,
            "member_removed",
            {"project_id": str(project_id)},
        )
        return True

    async def _audit(self, thread_id: Optional[str], user_id: Optional[str], action: str, details: dict):
        entry = AuditLog(thread_id=thread_id, user_id=user_id, action=action, details=details)
        self.db.add(entry)
        await self.db.flush()
