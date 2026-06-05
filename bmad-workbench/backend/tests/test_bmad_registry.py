from pathlib import Path

import pytest
from httpx import AsyncClient

from src.bmad.registry import BmadRegistry, reset_registry, get_registry


@pytest.mark.asyncio
async def test_list_agents_endpoint(client: AsyncClient):
    response = await client.get("/api/bmad/agents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Check that John (bmad-agent-pm) is present
    agent_ids = {a["id"] for a in data}
    assert "bmad-agent-pm" in agent_ids
    # Check schema fields
    john = next(a for a in data if a["id"] == "bmad-agent-pm")
    assert john["name"] == "John"
    assert john["title"] == "Product Manager"
    assert john["icon"] == "📋"
    assert "description" in john
    assert john["module"] == "bmm"


@pytest.mark.asyncio
async def test_list_skills_endpoint(client: AsyncClient):
    response = await client.get("/api/bmad/skills")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # bmad-prd should be present
    skill_ids = {s["skill_id"] for s in data}
    assert "bmad-prd" in skill_ids
    # List view should not include markdown_body
    prd = next(s for s in data if s["skill_id"] == "bmad-prd")
    assert prd["markdown_body"] == ""
    assert "description" in prd


@pytest.mark.asyncio
async def test_get_skill_detail_endpoint(client: AsyncClient):
    response = await client.get("/api/bmad/skills/bmad-prd")
    assert response.status_code == 200
    data = response.json()
    assert data["skill_id"] == "bmad-prd"
    assert "name" in data
    assert "description" in data
    # Full view should include markdown_body
    assert len(data["markdown_body"]) > 0


@pytest.mark.asyncio
async def test_get_skill_not_found(client: AsyncClient):
    response = await client.get("/api/bmad/skills/nonexistent-skill")
    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.asyncio
async def test_reload_endpoint(client: AsyncClient):
    response = await client.post("/api/bmad/reload")
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert "skills" in data
    assert "modules" in data
    assert "loaded_at" in data
    assert len(data["agents"]) > 0
    assert len(data["skills"]) > 0


@pytest.mark.asyncio
async def test_registry_singleton():
    reset_registry()
    r1 = get_registry()
    r2 = get_registry()
    assert r1 is r2


@pytest.mark.asyncio
async def test_registry_loads_from_real_files():
    registry = BmadRegistry()
    registry.load()
    assert len(registry.list_agents()) > 0
    assert len(registry.list_skills()) > 0
    assert "bmad-agent-pm" in registry.agents
    assert "bmad-prd" in registry.skills


@pytest.mark.asyncio
async def test_registry_missing_files_graceful():
    registry = BmadRegistry(project_root=Path("/nonexistent/path"))
    registry.load()
    assert len(registry.list_agents()) == 0
    assert len(registry.list_skills()) == 0
    assert len(registry._load_errors) > 0
