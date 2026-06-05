import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_resources_empty(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Resource Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    response = await client.get(f"/api/threads/{thread_id}/resources")
    assert response.status_code == 200
    data = response.json()
    assert data == []


@pytest.mark.asyncio
async def test_add_resource(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Add Resource Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    payload = {
        "type": "jira",
        "external_id": "PROD-442",
        "title": "OAuth integration for mobile app",
        "status": "In Progress",
        "url": "https://jira.example.com/browse/PROD-442",
        "include_in_ai_context": True,
    }
    response = await client.post(f"/api/threads/{thread_id}/resources", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "jira"
    assert data["external_id"] == "PROD-442"
    assert data["title"] == "OAuth integration for mobile app"
    assert data["include_in_ai_context"] == "1"


@pytest.mark.asyncio
async def test_list_resources_after_add(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "List Resource Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    await client.post(f"/api/threads/{thread_id}/resources", json={
        "type": "jira",
        "external_id": "PROD-442",
        "title": "OAuth integration",
    })

    response = await client.get(f"/api/threads/{thread_id}/resources")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["external_id"] == "PROD-442"


@pytest.mark.asyncio
async def test_remove_resource(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Remove Resource Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    create_resp = await client.post(f"/api/threads/{thread_id}/resources", json={
        "type": "confluence",
        "external_id": "CONF-101",
        "title": "API Design Guidelines",
    })
    resource_id = create_resp.json()["id"]

    response = await client.delete(f"/api/threads/{thread_id}/resources/{resource_id}")
    assert response.status_code == 204

    list_resp = await client.get(f"/api/threads/{thread_id}/resources")
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_search_jira(client: AsyncClient):
    response = await client.get("/api/integrations/jira/search?q=PROD")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert any(r["external_id"] == "PROD-442" for r in data)


@pytest.mark.asyncio
async def test_search_confluence(client: AsyncClient):
    response = await client.get("/api/integrations/confluence/search?q=API")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(r["external_id"] == "CONF-101" for r in data)


@pytest.mark.asyncio
async def test_search_jira_no_results(client: AsyncClient):
    response = await client.get("/api/integrations/jira/search?q=XYZ-NOT-FOUND")
    assert response.status_code == 200
    data = response.json()
    assert data == []
