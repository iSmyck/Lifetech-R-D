"""Query API endpoints — submit queries and check status."""

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.session import get_db
from backend.src.models.schemas import QueryInput, QueryResponse
from backend.src.orchestrator.engine import OrchestratorEngine

router = APIRouter(prefix="/query", tags=["queries"])

# In-memory store for query status during processing
# In production, use Redis or database
_query_store: dict[str, dict] = {}


@router.post("", response_model=QueryResponse)
async def submit_query(
    input_data: QueryInput,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> QueryResponse:
    """Submit a new marketing intelligence query.

    Returns immediately with a query_id. Processing happens asynchronously.
    """
    query_id = input_data.query_id or str(uuid.uuid4())

    # Store initial status
    _query_store[query_id] = {
        "query_id": query_id,
        "status": "processing",
        "final_response": "",
        "response_summary": "",
        "executed_agents": [],
        "review_status": "N/A",
        "processing_time_ms": 0,
        "timestamp": "",
    }

    # Start processing in background
    engine = OrchestratorEngine()
    background_tasks.add_task(_process_query, engine, input_data.model_dump(), query_id)

    return QueryResponse(
        query_id=query_id,
        status="processing",
        final_response="Your request is being processed by our multi-agent system.",
        response_summary="Processing started",
        executed_agents=[],
        review_status="N/A",
        processing_time_ms=0,
        timestamp="",
    )


@router.post("/sync", response_model=QueryResponse)
async def submit_query_sync(
    input_data: QueryInput,
    db: AsyncSession = Depends(get_db),
) -> QueryResponse:
    """Submit a query and wait for full processing (synchronous).

    Returns the complete response after all agents have executed.
    """
    engine = OrchestratorEngine()
    result = await engine.run_pipeline(input_data.model_dump(), stream=False)
    return QueryResponse(**result)


@router.get("/{query_id}/status", response_model=QueryResponse)
async def get_query_status(
    query_id: str,
    db: AsyncSession = Depends(get_db),
) -> QueryResponse:
    """Check the processing status of a query."""
    if query_id not in _query_store:
        raise HTTPException(status_code=404, detail="Query not found")

    data = _query_store[query_id]
    return QueryResponse(**data)


@router.get("/stream/{query_id}")
async def stream_query(
    query_id: str,
    db: AsyncSession = Depends(get_db),
) -> EventSourceResponse:
    """Stream agent execution events via SSE.

    The query must be submitted first via POST /query. This endpoint
    returns a live stream of agent steps and final response.
    """
    if query_id not in _query_store:
        raise HTTPException(status_code=404, detail="Query not found")

    # For the pilot, we'll re-run the pipeline in stream mode
    # In production, this would connect to a running job
    engine = OrchestratorEngine()

    # Reconstruct input from store (simplified for pilot)
    input_data = {"user_query": _query_store[query_id].get("final_response", ""), "query_id": query_id}

    async def event_generator():
        async for event in engine.run_pipeline(input_data, stream=True):
            yield {"data": event}

    return EventSourceResponse(event_generator())


async def _process_query(
    engine: OrchestratorEngine,
    input_data: dict,
    query_id: str,
) -> None:
    """Background task to process a query."""
    try:
        result = await engine.run_pipeline(input_data, stream=False)
        _query_store[query_id].update(result)
    except Exception as e:
        _query_store[query_id]["status"] = "error"
        _query_store[query_id]["final_response"] = f"Processing failed: {str(e)}"
    finally:
        # Clean up agents
        for agent in engine.agents.values():
            await agent.close()
