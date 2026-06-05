"""API tests for thread intent classification and BMAD integration."""

import pytest
from httpx import AsyncClient
from uuid import uuid4


@pytest.mark.asyncio
async def test_create_thread_with_intent_classification(client: AsyncClient):
    """Creating a thread with initial_intent should classify and assign agent/skill."""
    # First create a project
    project_resp = await client.post("/api/projects", json={"name": "Test Project"})
    assert project_resp.status_code == 201
    project_id = project_resp.json()["id"]

    # Create thread with PRD intent
    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Draft PRD",
        "initial_intent": "Draft a PRD for a mobile app",
    })
    assert thread_resp.status_code == 201
    thread = thread_resp.json()
    assert thread["agent_id"] == "bmad-agent-pm"
    assert thread["workflow_id"] == "bmad-prd"
    assert thread["bmad_state"] is not None
    assert thread["bmad_state"]["skill_id"] == "bmad-prd"
    assert thread["bmad_state"]["current_phase"] == "init"


@pytest.mark.asyncio
async def test_create_thread_without_intent(client: AsyncClient):
    """Creating a thread without intent should not assign agent/skill."""
    project_resp = await client.post("/api/projects", json={"name": "Test Project 2"})
    assert project_resp.status_code == 201
    project_id = project_resp.json()["id"]

    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Empty Thread",
    })
    assert thread_resp.status_code == 201
    thread = thread_resp.json()
    assert thread["agent_id"] is None
    assert thread["workflow_id"] is None


@pytest.mark.asyncio
async def test_select_agent_endpoint(client: AsyncClient):
    """Explicit agent selection should validate against registry."""
    project_resp = await client.post("/api/projects", json={"name": "Test Project 3"})
    assert project_resp.status_code == 201
    project_id = project_resp.json()["id"]

    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Thread",
    })
    thread_id = thread_resp.json()["id"]

    # Select valid agent
    resp = await client.post(f"/api/threads/{thread_id}/select-agent", json={
        "agent_id": "bmad-agent-architect",
        "workflow_id": "bmad-create-architecture",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["agent_id"] == "bmad-agent-architect"
    assert data["workflow_id"] == "bmad-create-architecture"

    # Select invalid agent should fail
    resp2 = await client.post(f"/api/threads/{thread_id}/select-agent", json={
        "agent_id": "nonexistent-agent",
        "workflow_id": "bmad-prd",
    })
    assert resp2.status_code == 400


@pytest.mark.asyncio
async def test_thread_stream_endpoint_exists(client: AsyncClient):
    """SSE stream endpoint should return correct headers."""
    project_resp = await client.post("/api/projects", json={"name": "Test Project 4"})
    project_id = project_resp.json()["id"]

    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Stream Test",
    })
    thread_id = thread_resp.json()["id"]

    # The SSE endpoint returns a streaming response
    # We just verify it doesn't 404 and has correct content type
    resp = await client.get(f"/api/threads/{thread_id}/stream")
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")
