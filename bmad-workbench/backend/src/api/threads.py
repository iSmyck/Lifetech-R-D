import time
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.auth import get_current_user, MockUser
from src.core.exceptions import ApiError
from src.schemas.thread import ThreadOut, ThreadCreate, ThreadUpdate, ThreadSelectAgent
from src.schemas.document import DocumentOut
from src.services.thread_service import ThreadService
from src.services.document_service import DocumentService
from src.services.stream_service import stream_manager, mock_ai_stream
from src.services.bmad_stream import BmadStreamService
from src.services.llm_client import LLMClient
from src.services.llm_config_service import LLMConfigService
from src.bmad.registry import get_registry
from src.bmad.classifier import IntentClassifier

router = APIRouter(prefix="/threads", tags=["threads"])


# --- Thread CRUD endpoints ---

@router.get("/by-project/{project_id}", response_model=list[ThreadOut])
async def list_threads_by_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    # Verify project exists
    project = await svc.get_project(project_id)
    if not project:
        raise ApiError(status_code=404, message="Project not found")
    threads = await svc.list_threads_by_project(project_id)
    return threads


@router.post("", status_code=201, response_model=ThreadOut)
async def create_thread(
    payload: ThreadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: MockUser = Depends(get_current_user),
):
    svc = ThreadService(db)

    # Build LLM client from active config (if any)
    llm_config_svc = LLMConfigService(db)
    active_llm_config = await llm_config_svc.get_active_config()
    llm_client = None
    if active_llm_config and active_llm_config.base_url:
        import base64
        api_key = None
        if active_llm_config.api_key_encrypted:
            api_key = base64.b64decode(active_llm_config.api_key_encrypted.encode()).decode()
        llm_client = LLMClient(
            base_url=active_llm_config.base_url,
            model_name=active_llm_config.model_name,
            api_key=api_key,
            provider=active_llm_config.provider,
        )

    # BMAD intent classification
    agent_id = None
    workflow_id = None
    bmad_state = None

    if payload.initial_intent:
        registry = get_registry()
        classifier = IntentClassifier(registry)
        result = await classifier.classify(payload.initial_intent, llm_client=llm_client)
        agent_id = result.agent_id
        workflow_id = result.skill_id
        bmad_state = {
            "skill_id": result.skill_id,
            "current_phase": "init",
            "phases_completed": [],
            "checkpoint_state": {},
            "artifact_accumulator": "",
            "classification": result.to_dict(),
        }

    thread = await svc.create_thread(
        project_id=payload.project_id,
        title=payload.title,
        created_by=current_user.id,
        initial_intent=payload.initial_intent,
        agent_id=agent_id,
        workflow_id=workflow_id,
        bmad_state=bmad_state,
    )
    await db.commit()
    return thread


@router.get("/{thread_id}", response_model=ThreadOut)
async def get_thread(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    thread = await svc.get_thread(thread_id)
    if not thread:
        raise ApiError(status_code=404, message="Thread not found")
    return thread


@router.get("", response_model=list[ThreadOut])
async def list_threads(
    project_id: Optional[UUID] = None,
    status: Optional[str] = None,
    pinned: Optional[str] = None,
    sort: str = "updated_at",
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    threads = await svc.search_threads(
        project_id=project_id,
        status=status,
        pinned=pinned,
        sort=sort,
        limit=limit,
    )
    return threads


@router.patch("/{thread_id}", response_model=ThreadOut)
async def update_thread(
    thread_id: UUID,
    payload: ThreadUpdate,
    db: AsyncSession = Depends(get_db),
):
    svc = ThreadService(db)
    thread = await svc.update_thread(
        thread_id=thread_id,
        status=payload.status,
        title=payload.title,
        is_pinned=payload.is_pinned,
    )
    # Allow agent/workflow updates via PATCH as well
    if payload.agent_id is not None:
        thread.agent_id = payload.agent_id
    if payload.workflow_id is not None:
        thread.workflow_id = payload.workflow_id
    await db.commit()
    await db.refresh(thread)
    return thread


@router.post("/{thread_id}/select-agent", response_model=ThreadOut)
async def select_agent(
    thread_id: UUID,
    payload: ThreadSelectAgent,
    db: AsyncSession = Depends(get_db),
):
    """Explicitly select/override the agent and skill for a thread."""
    svc = ThreadService(db)
    thread = await svc.get_thread(thread_id)
    if not thread:
        raise ApiError(status_code=404, message="Thread not found")

    registry = get_registry()
    agent = registry.get_agent(payload.agent_id)
    skill = registry.get_skill(payload.workflow_id)

    if not agent:
        raise ApiError(status_code=400, message=f"Agent {payload.agent_id} not found in registry")
    if not skill:
        raise ApiError(status_code=400, message=f"Skill {payload.workflow_id} not found in registry")

    thread.agent_id = payload.agent_id
    thread.workflow_id = payload.workflow_id
    thread.bmad_state = {
        "skill_id": payload.workflow_id,
        "current_phase": "init",
        "phases_completed": [],
        "checkpoint_state": {},
        "artifact_accumulator": "",
        "agent_switch": {
            "previous_agent": thread.agent_id,
            "new_agent": payload.agent_id,
            "reason": "user_override",
        },
    }
    await db.commit()
    await db.refresh(thread)
    return thread


@router.get("/{thread_id}/documents", response_model=list[DocumentOut])
async def list_thread_documents(
    thread_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List documents associated with a thread."""
    svc = ThreadService(db)
    thread = await svc.get_thread(thread_id)
    if not thread:
        raise ApiError(status_code=404, message="Thread not found")

    doc_svc = DocumentService(db)
    from sqlalchemy import select
    from src.models.document import Document
    result = await db.execute(
        select(Document).where(Document.thread_id == str(thread_id)).order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()
    return documents


# --- SSE streaming endpoints (existing) ---

async def sse_event_generator(
    thread_id: str,
    last_event_id: Optional[str] = None,
    idle_timeout: float = 30.0,
    max_keepalives: int = 2,
):
    import asyncio
    # Replay missed events
    missed = stream_manager.get_history_since(thread_id, last_event_id)
    for event in missed:
        yield event.to_sse()

    # Subscribe to new events
    queue = stream_manager.subscribe(thread_id)
    keepalive_count = 0
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=idle_timeout)
                keepalive_count = 0
                yield event.to_sse()
            except asyncio.TimeoutError:
                yield ":keepalive\n\n"
                keepalive_count += 1
                if keepalive_count >= max_keepalives:
                    break
    finally:
        stream_manager.unsubscribe(thread_id, queue)


@router.get("/{thread_id}/stream")
async def thread_stream(
    thread_id: str,
    request: Request,
    last_event_id: Optional[str] = Header(None, alias="Last-Event-ID"),
    idle_timeout: float = Query(30.0, ge=0.5, le=300.0),
):
    return StreamingResponse(
        sse_event_generator(thread_id, last_event_id, idle_timeout=idle_timeout),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


class IntentPayload(dict):
    pass


@router.post("/{thread_id}/intent")
async def post_intent(
    thread_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Receive a user intent and kick off the BMAD skill stream."""
    user_intent = payload.get("text", "")
    attachment_ids = payload.get("attachment_ids", [])

    # Load thread to get agent/skill context
    svc = ThreadService(db)
    try:
        thread_uuid = UUID(thread_id)
        thread = await svc.get_thread(thread_uuid)
    except ValueError:
        thread = None

    if not thread:
        raise ApiError(status_code=404, message="Thread not found")

    # Update thread status to active (if it was paused)
    if thread.status == "paused":
        thread.status = "active"
        await db.flush()

    agent_id = thread.agent_id or "bmad-agent-pm"
    skill_id = thread.workflow_id or "bmad-prd"
    bmad_state = thread.bmad_state or {}

    # Build LLM client from active config
    llm_config_svc = LLMConfigService(db)
    active_llm_config = await llm_config_svc.get_active_config()
    llm_client = None
    if active_llm_config and active_llm_config.base_url:
        import base64
        api_key = None
        if active_llm_config.api_key_encrypted:
            api_key = base64.b64decode(active_llm_config.api_key_encrypted.encode()).decode()
        llm_client = LLMClient(
            base_url=active_llm_config.base_url,
            model_name=active_llm_config.model_name,
            api_key=api_key,
            provider=active_llm_config.provider,
        )

    # Kick off BMAD stream in background
    import asyncio
    asyncio.create_task(
        BmadStreamService(llm_client=llm_client).execute(
            thread_id=thread_id,
            user_intent=user_intent,
            agent_id=agent_id,
            skill_id=skill_id,
            bmad_state=bmad_state,
            attachment_ids=attachment_ids,
        )
    )
    return {"status": "accepted", "thread_id": thread_id}


@router.post("/{thread_id}/respond")
async def respond_to_checkpoint(
    thread_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Respond to a clarification checkpoint and resume BMAD stream."""
    checkpoint_id = payload.get("checkpoint_id", "")
    response = payload.get("response", "")

    if not checkpoint_id:
        raise ApiError(status_code=400, message="checkpoint_id is required")

    from src.services.stream_service import stream_manager

    checkpoint = stream_manager.get_checkpoint(checkpoint_id)
    if not checkpoint:
        raise ApiError(status_code=404, message="Checkpoint not found")

    if checkpoint.get("thread_id") != thread_id:
        raise ApiError(status_code=400, message="Checkpoint does not belong to this thread")

    # Store response in checkpoint data for history/audit
    checkpoint["responses"] = checkpoint.get("responses", [])
    checkpoint["responses"].append({
        "response": response,
        "responded_at": time.time(),
    })

    # Update thread status and bmad_state
    svc = ThreadService(db)
    from uuid import UUID as UUIDType
    try:
        thread_uuid = UUIDType(thread_id)
    except ValueError:
        raise ApiError(status_code=400, message="Invalid thread ID")

    thread = await svc.get_thread(thread_uuid)
    if not thread:
        raise ApiError(status_code=404, message="Thread not found")

    # Update bmad_state with checkpoint response
    bmad_state = thread.bmad_state or {}
    bmad_state["checkpoint_state"] = {
        "checkpoint_id": checkpoint_id,
        "response": response,
        "resolved": True,
    }
    thread.bmad_state = bmad_state

    # Resolve the checkpoint and resume stream
    stream_manager.resolve_checkpoint(checkpoint_id, response)

    # Publish human_input event to SSE so frontend shows the response card
    await stream_manager.publish(
        thread_id,
        "human_input",
        {
            "checkpoint_id": checkpoint_id,
            "response": response,
            "message": "User responded",
            "question": checkpoint.get("question", ""),
        },
    )

    # Transition thread to active
    thread.status = "active"
    await db.flush()

    # Resume BMAD stream with updated state
    import asyncio
    agent_id = thread.agent_id or "bmad-agent-pm"
    skill_id = thread.workflow_id or "bmad-prd"

    # Build LLM client from active config
    llm_config_svc = LLMConfigService(db)
    active_llm_config = await llm_config_svc.get_active_config()
    llm_client = None
    if active_llm_config and active_llm_config.base_url:
        import base64
        api_key = None
        if active_llm_config.api_key_encrypted:
            api_key = base64.b64decode(active_llm_config.api_key_encrypted.encode()).decode()
        llm_client = LLMClient(
            base_url=active_llm_config.base_url,
            model_name=active_llm_config.model_name,
            api_key=api_key,
            provider=active_llm_config.provider,
        )

    # Get user intent from thread's initial document/revision if available
    user_intent = ""
    from sqlalchemy import select
    from src.models.document import Document, Revision
    result = await db.execute(
        select(Document).where(Document.thread_id == thread_id).order_by(Document.created_at.desc())
    )
    doc = result.scalars().first()
    if doc and doc.current_revision_id:
        rev_result = await db.execute(
            select(Revision).where(Revision.id == doc.current_revision_id)
        )
        rev = rev_result.scalar_one_or_none()
        if rev:
            user_intent = rev.content

    asyncio.create_task(
        BmadStreamService(llm_client=llm_client).resume_from_checkpoint(
            thread_id=thread_id,
            user_intent=user_intent or "Continue workflow",
            agent_id=agent_id,
            skill_id=skill_id,
            bmad_state=bmad_state,
        )
    )

    await db.commit()
    return {"status": "resumed", "thread_id": thread_id}


@router.post("/{thread_id}/demo")
async def run_demo_stream(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Run a mock AI stream for demo purposes."""
    svc = ThreadService(db)
    try:
        thread_uuid = UUID(thread_id)
        thread = await svc.get_thread(thread_uuid)
    except ValueError:
        thread = None

    if not thread:
        raise ApiError(status_code=404, message="Thread not found")

    import asyncio
    asyncio.create_task(
        mock_ai_stream(
            thread_id=thread_id,
            user_intent="Draft a PRD for our new API Gateway that handles authentication, rate limiting, and routing for all microservices.",
        )
    )
    return {"status": "demo_started", "thread_id": thread_id}
