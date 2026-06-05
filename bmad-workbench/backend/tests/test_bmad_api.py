"""API tests for BMAD registry endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_agents(client: AsyncClient):
    resp = await client.get("/api/bmad/agents")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Check expected agents exist
    agent_ids = {a["id"] for a in data}
    assert "bmad-agent-pm" in agent_ids
    assert "bmad-agent-architect" in agent_ids


@pytest.mark.asyncio
async def test_list_skills(client: AsyncClient):
    resp = await client.get("/api/bmad/skills")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Skills list should NOT include full markdown body
    for skill in data:
        assert "skill_id" in skill
        assert "name" in skill
        assert skill.get("markdown_body", "") == ""


@pytest.mark.asyncio
async def test_get_skill(client: AsyncClient):
    resp = await client.get("/api/bmad/skills/bmad-prd")
    assert resp.status_code == 200
    data = resp.json()
    assert data is not None
    assert data["skill_id"] == "bmad-prd"
    assert "markdown_body" in data
    assert len(data["markdown_body"]) > 0


@pytest.mark.asyncio
async def test_get_skill_not_found(client: AsyncClient):
    resp = await client.get("/api/bmad/skills/nonexistent-skill")
    assert resp.status_code == 200
    assert resp.json() is None


@pytest.mark.asyncio
async def test_reload_registry(client: AsyncClient):
    resp = await client.post("/api/bmad/reload")
    assert resp.status_code == 200
    data = resp.json()
    assert "agents" in data
    assert "skills" in data
    assert "modules" in data
    assert "loaded_at" in data


@pytest.mark.asyncio
async def test_get_full_registry(client: AsyncClient):
    resp = await client.get("/api/bmad/registry")
    assert resp.status_code == 200
    data = resp.json()
    assert "agents" in data
    assert "skills" in data
    assert "modules" in data
