import pytest
import asyncio
from httpx import AsyncClient

from src.services.stream_service import stream_manager


@pytest.mark.asyncio
async def test_sse_stream_returns_events(client: AsyncClient):
    thread_id = "thread-sse-events"
    # Publish events directly
    await stream_manager.publish(thread_id, "reasoning_token", {"text": "Thinking…"})
    await stream_manager.publish(thread_id, "draft_complete", {"text": "Done"})

    response = await client.get(
        f"/api/threads/{thread_id}/stream?idle_timeout=0.5",
        headers={"Accept": "text/event-stream"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    body = ""
    async for chunk in response.aiter_text():
        body += chunk

    assert "event: reasoning_token" in body
    assert "event: draft_complete" in body
    assert "id:" in body


@pytest.mark.asyncio
async def test_sse_reconnect_with_last_event_id(client: AsyncClient):
    thread_id = "thread-sse-recon"
    await stream_manager.publish(thread_id, "reasoning_token", {"text": "First"})
    await stream_manager.publish(thread_id, "reasoning_token", {"text": "Second"})

    # First connection — capture an event id
    response1 = await client.get(f"/api/threads/{thread_id}/stream?idle_timeout=0.5")
    event_id = None
    body1 = ""
    async for chunk in response1.aiter_text():
        body1 += chunk

    # Extract the first event id
    for line in body1.splitlines():
        if line.startswith("id: "):
            event_id = line.split("id: ")[1]
            break

    assert event_id is not None

    # Publish one more event
    await stream_manager.publish(thread_id, "draft_complete", {"text": "Third"})

    # Reconnect with Last-Event-ID
    response2 = await client.get(
        f"/api/threads/{thread_id}/stream?idle_timeout=0.5",
        headers={"Last-Event-ID": event_id},
    )
    assert response2.status_code == 200
    body2 = ""
    async for chunk in response2.aiter_text():
        body2 += chunk
    assert "draft_complete" in body2


@pytest.mark.asyncio
async def test_sse_intent_endpoint_accepted(client: AsyncClient):
    # Create a real project and thread
    proj_resp = await client.post("/api/projects", json={"name": "Intent Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    resp = await client.post(f"/api/threads/{thread_id}/intent", json={"text": "Hello"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "accepted"
    assert data["thread_id"] == thread_id
