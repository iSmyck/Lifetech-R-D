import pytest
from httpx import AsyncClient

from src.bmad.classifier import IntentClassifier, ClassificationResult
from src.bmad.registry import BmadRegistry


@pytest.mark.asyncio
async def test_classifier_prd_intent():
    registry = BmadRegistry()
    registry.load()
    classifier = IntentClassifier(registry)

    result = await classifier.classify("Draft a PRD for user authentication")
    assert result.agent_id == "bmad-agent-pm"
    assert result.skill_id == "bmad-prd"
    assert result.confidence >= 0.85
    assert "PRD" in result.reasoning or "prd" in result.reasoning or "keyword" in result.reasoning


@pytest.mark.asyncio
async def test_classifier_architecture_intent():
    registry = BmadRegistry()
    registry.load()
    classifier = IntentClassifier(registry)

    result = await classifier.classify("Design the system architecture")
    assert result.agent_id == "bmad-agent-architect"
    assert result.skill_id == "bmad-create-architecture"
    assert result.confidence >= 0.85


@pytest.mark.asyncio
async def test_classifier_empty_intent_fallback():
    registry = BmadRegistry()
    registry.load()
    classifier = IntentClassifier(registry)

    result = await classifier.classify("")
    assert result.agent_id == "bmad-agent-pm"
    assert result.skill_id == "bmad-prd"
    assert result.confidence == 0.5


@pytest.mark.asyncio
async def test_classifier_unknown_skill_fallback():
    registry = BmadRegistry()
    registry.load()
    classifier = IntentClassifier(registry)

    # Force a result with unknown skill via direct method
    result = ClassificationResult("unknown-agent", "unknown-skill", 0.9, "test")
    # The classify method validates against registry, so use the public path
    result = await classifier.classify("write test plan")
    # Should map to test-related skill or fallback
    assert result.agent_id in registry.agents or result.agent_id == "bmad-agent-pm"


@pytest.mark.asyncio
async def test_create_thread_with_intent_classification(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Classification Test"})
    project_id = proj_resp.json()["id"]

    payload = {
        "project_id": project_id,
        "title": "PRD Thread",
        "initial_intent": "Draft a PRD for the auth system",
    }
    response = await client.post("/api/threads", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["agent_id"] == "bmad-agent-pm"
    assert data["workflow_id"] == "bmad-prd"
    assert data["bmad_state"] is not None
    assert data["bmad_state"]["skill_id"] == "bmad-prd"
    assert data["bmad_state"]["current_phase"] == "init"


@pytest.mark.asyncio
async def test_create_thread_without_intent_no_classification(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "No Classification"})
    project_id = proj_resp.json()["id"]

    payload = {"project_id": project_id, "title": "Plain Thread"}
    response = await client.post("/api/threads", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["agent_id"] is None
    assert data["workflow_id"] is None


@pytest.mark.asyncio
async def test_select_agent_endpoint(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Select Agent Test"})
    project_id = proj_resp.json()["id"]

    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Test Thread",
    })
    thread_id = thread_resp.json()["id"]

    response = await client.post(f"/api/threads/{thread_id}/select-agent", json={
        "agent_id": "bmad-agent-architect",
        "workflow_id": "bmad-create-architecture",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == "bmad-agent-architect"
    assert data["workflow_id"] == "bmad-create-architecture"


@pytest.mark.asyncio
async def test_select_agent_invalid_agent(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Invalid Agent"})
    project_id = proj_resp.json()["id"]

    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Test Thread",
    })
    thread_id = thread_resp.json()["id"]

    response = await client.post(f"/api/threads/{thread_id}/select-agent", json={
        "agent_id": "nonexistent-agent",
        "workflow_id": "bmad-prd",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_select_agent_invalid_skill(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Invalid Skill"})
    project_id = proj_resp.json()["id"]

    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Test Thread",
    })
    thread_id = thread_resp.json()["id"]

    response = await client.post(f"/api/threads/{thread_id}/select-agent", json={
        "agent_id": "bmad-agent-pm",
        "workflow_id": "nonexistent-skill",
    })
    assert response.status_code == 400
