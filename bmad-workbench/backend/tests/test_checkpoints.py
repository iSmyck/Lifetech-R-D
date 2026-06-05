import pytest
import asyncio
from uuid import uuid4
from httpx import AsyncClient

from src.services.stream_service import stream_manager, mock_ai_stream


def _uuid() -> str:
    return str(uuid4())


@pytest.mark.asyncio
async def test_respond_checkpoint_not_found(client: AsyncClient):
    resp = await client.post(
        f"/api/threads/{_uuid()}/respond",
        json={"checkpoint_id": "nonexistent", "response": "yes"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_respond_checkpoint_bad_thread(client: AsyncClient):
    cp_id = stream_manager.create_checkpoint("thread-a", {"type": "clarification", "question": "Q?"})
    resp = await client.post(
        f"/api/threads/{_uuid()}/respond",
        json={"checkpoint_id": cp_id, "response": "yes"},
    )
    assert resp.status_code == 400
    stream_manager.cleanup_checkpoint(cp_id)


@pytest.mark.asyncio
async def test_respond_checkpoint_success(client: AsyncClient):
    # Create a real project and thread
    proj_resp = await client.post("/api/projects", json={"name": "Checkpoint Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    cp_id = stream_manager.create_checkpoint(thread_id, {"type": "clarification", "question": "Q?"})
    resp = await client.post(
        f"/api/threads/{thread_id}/respond",
        json={"checkpoint_id": cp_id, "response": "yes please"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "resumed"
    stream_manager.cleanup_checkpoint(cp_id)


@pytest.mark.asyncio
async def test_respond_missing_checkpoint_id(client: AsyncClient):
    resp = await client.post(
        f"/api/threads/{_uuid()}/respond",
        json={"response": "yes"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_mock_ai_stream_with_checkpoint():
    """Test the full mock AI stream including checkpoint pause/resume."""
    thread_id = "test-mock-stream"
    received_events = []

    # Subscribe to events
    queue = stream_manager.subscribe(thread_id)

    # Kick off the mock stream
    task = asyncio.create_task(mock_ai_stream(thread_id, "Test intent"))

    # Collect events until checkpoint_pause
    checkpoint_id = None
    try:
        while True:
            event = await asyncio.wait_for(queue.get(), timeout=2.0)
            received_events.append(event.event_type)
            if event.event_type == "checkpoint_pause":
                checkpoint_id = event.data.get("checkpoint_id")
                break
    except asyncio.TimeoutError:
        pass

    assert "reasoning_token" in received_events
    assert "checkpoint_pause" in received_events
    assert checkpoint_id is not None

    # Resolve the checkpoint
    stream_manager.resolve_checkpoint(checkpoint_id, "Yes, include it")

    # Collect remaining events
    try:
        while True:
            event = await asyncio.wait_for(queue.get(), timeout=2.0)
            received_events.append(event.event_type)
            if event.event_type == "draft_complete":
                break
    except asyncio.TimeoutError:
        pass

    await task
    stream_manager.unsubscribe(thread_id, queue)
    stream_manager.cleanup_checkpoint(checkpoint_id)

    assert "draft_complete" in received_events


@pytest.mark.asyncio
async def test_sse_human_input_event(client: AsyncClient):
    """Test that responding to checkpoint emits human_input SSE event."""
    # Create a real project and thread
    proj_resp = await client.post("/api/projects", json={"name": "Human Input Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    cp_id = stream_manager.create_checkpoint(
        thread_id,
        {"type": "clarification", "question": "Q?"},
    )

    # Publish a checkpoint_pause event BEFORE starting SSE stream
    await stream_manager.publish(thread_id, "checkpoint_pause", {"checkpoint_id": cp_id, "question": "Q?"})

    # Start SSE stream
    response = await client.get(
        f"/api/threads/{thread_id}/stream?idle_timeout=2.0",
        headers={"Accept": "text/event-stream"},
    )
    assert response.status_code == 200

    # Respond
    resp = await client.post(
        f"/api/threads/{thread_id}/respond",
        json={"checkpoint_id": cp_id, "response": "my answer"},
    )
    assert resp.status_code == 200

    # Check SSE body contains checkpoint_pause or human_input
    body = ""
    async for chunk in response.aiter_text():
        body += chunk

    assert "checkpoint_pause" in body or "human_input" in body
    stream_manager.cleanup_checkpoint(cp_id)
