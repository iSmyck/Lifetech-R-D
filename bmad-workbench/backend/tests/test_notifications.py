import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_notifications_empty(client: AsyncClient):
    response = await client.get("/api/notifications")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_unread_count(client: AsyncClient):
    response = await client.get("/api/notifications/unread-count")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert isinstance(data["count"], int)


@pytest.mark.asyncio
async def test_mark_all_as_read(client: AsyncClient):
    response = await client.post("/api/notifications/read-all")
    assert response.status_code == 200
    data = response.json()
    assert "marked_as_read" in data
