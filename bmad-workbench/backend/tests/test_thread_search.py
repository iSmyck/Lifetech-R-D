import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_threads_with_query_params(client: AsyncClient):
    # Create a project and thread first
    proj_resp = await client.post("/api/projects", json={"name": "Search Test"})
    project_id = proj_resp.json()["id"]

    await client.post("/api/threads", json={"project_id": project_id, "title": "Active Thread"})
    await client.post("/api/threads", json={"project_id": project_id, "title": "Paused Thread"})

    # List all threads
    response = await client.get("/api/threads")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Filter by status
    response = await client.get("/api/threads?status=active")
    assert response.status_code == 200
    data = response.json()
    assert all(t["status"] == "active" for t in data)


@pytest.mark.asyncio
async def test_patch_thread_is_pinned(client: AsyncClient):
    proj_resp = await client.post("/api/projects", json={"name": "Pin Test"})
    project_id = proj_resp.json()["id"]

    thread_resp = await client.post("/api/threads", json={"project_id": project_id, "title": "Pin Me"})
    thread_id = thread_resp.json()["id"]

    patch_resp = await client.patch(f"/api/threads/{thread_id}", json={"is_pinned": "1"})
    assert patch_resp.status_code == 200
    data = patch_resp.json()
    assert data["is_pinned"] == "1"
