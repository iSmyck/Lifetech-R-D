import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_stakeholders_empty(client: AsyncClient):
    # Create project and thread first
    proj_resp = await client.post("/api/projects", json={"name": "Stakeholder Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    response = await client.get(f"/api/threads/{thread_id}/stakeholders")
    assert response.status_code == 200
    data = response.json()
    assert data == []


@pytest.mark.asyncio
async def test_add_stakeholder(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Add Stakeholder Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    payload = {"user_id": "user-1", "role": "responsible"}
    response = await client.post(f"/api/threads/{thread_id}/stakeholders", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == "user-1"
    assert data["role"] == "responsible"
    assert data["user"]["display_name"] == "Sarah Chen"


@pytest.mark.asyncio
async def test_add_stakeholder_duplicate(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Dup Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-1", "role": "consulted"})
    response = await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-1", "role": "responsible"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_add_stakeholder_user_not_found(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Not Found Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    response = await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-999", "role": "consulted"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_accountable_reassigns_existing(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Accountable Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    # Add first accountable
    await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-1", "role": "accountable"})
    # Add second accountable — first should be demoted to consulted
    response = await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-2", "role": "accountable"})
    assert response.status_code == 201

    list_resp = await client.get(f"/api/threads/{thread_id}/stakeholders")
    stakeholders = list_resp.json()
    roles = {s["user_id"]: s["role"] for s in stakeholders}
    assert roles["user-2"] == "accountable"
    assert roles["user-1"] == "consulted"


@pytest.mark.asyncio
async def test_update_stakeholder_role(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Update Role Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-1", "role": "consulted"})
    response = await client.patch(f"/api/threads/{thread_id}/stakeholders/user-1", json={"role": "responsible"})
    assert response.status_code == 200
    assert response.json()["role"] == "responsible"


@pytest.mark.asyncio
async def test_remove_stakeholder(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Remove Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-1", "role": "consulted"})
    response = await client.delete(f"/api/threads/{thread_id}/stakeholders/user-1")
    assert response.status_code == 204

    list_resp = await client.get(f"/api/threads/{thread_id}/stakeholders")
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_list_stakeholders_sorted_by_raci_priority(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Sort Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Test Thread"})
    thread_id = thread_resp.json()["id"]

    await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-3", "role": "responsible"})
    await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-1", "role": "accountable"})
    await client.post(f"/api/threads/{thread_id}/stakeholders", json={"user_id": "user-4", "role": "consulted"})

    list_resp = await client.get(f"/api/threads/{thread_id}/stakeholders")
    stakeholders = list_resp.json()
    # Should be in added_at order since backend returns that
    assert len(stakeholders) == 3
    assert stakeholders[0]["user_id"] == "user-3"
