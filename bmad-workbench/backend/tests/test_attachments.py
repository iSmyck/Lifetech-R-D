import pytest
from httpx import AsyncClient

from src.services.attachment_service import AttachmentService


@pytest.mark.asyncio
async def test_upload_attachment_txt(client: AsyncClient):
    """Upload a plain text file."""
    files = {"file": ("test.txt", b"Hello, this is a test file.", "text/plain")}
    data = {"thread_id": "thread-1", "project_id": "project-1"}
    response = await client.post("/api/attachments", data=data, files=files)
    assert response.status_code == 201
    resp = response.json()
    assert resp["filename"] == "test.txt"
    assert resp["mime_type"] == "text/plain"
    assert resp["status"] == "processing"
    assert resp["thread_id"] == "thread-1"
    assert resp["project_id"] == "project-1"
    assert "id" in resp


@pytest.mark.asyncio
async def test_upload_attachment_too_large(client: AsyncClient):
    """Files over 100MB should be rejected."""
    large_content = b"x" * (100 * 1024 * 1024 + 1)
    files = {"file": ("large.txt", large_content, "text/plain")}
    data = {"thread_id": "thread-1", "project_id": "project-1"}
    response = await client.post("/api/attachments", data=data, files=files)
    assert response.status_code == 413


@pytest.mark.asyncio
async def test_upload_unsupported_type(client: AsyncClient):
    """Unsupported MIME types should be rejected."""
    files = {"file": ("malware.exe", b"bad data", "application/x-msdownload")}
    data = {"thread_id": "thread-1", "project_id": "project-1"}
    response = await client.post("/api/attachments", data=data, files=files)
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_get_attachment(client: AsyncClient):
    files = {"file": ("doc.md", b"# Markdown doc", "text/markdown")}
    data = {"thread_id": "thread-1", "project_id": "project-1"}
    create_resp = await client.post("/api/attachments", data=data, files=files)
    attachment_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/attachments/{attachment_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["filename"] == "doc.md"


@pytest.mark.asyncio
async def test_get_attachment_not_found(client: AsyncClient):
    response = await client.get("/api/attachments/123e4567-e89b-12d3-a456-426614174000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_attachments_by_thread(client: AsyncClient):
    # Upload two attachments for the same thread
    for name in ("a.txt", "b.txt"):
        files = {"file": (name, b"content", "text/plain")}
        data = {"thread_id": "thread-list", "project_id": "project-1"}
        await client.post("/api/attachments", data=data, files=files)

    list_resp = await client.get("/api/attachments/by-thread/thread-list")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 2
    names = {i["filename"] for i in items}
    assert "a.txt" in names
    assert "b.txt" in names


@pytest.mark.asyncio
async def test_attachment_preview(client: AsyncClient):
    files = {"file": ("preview.txt", b"Preview text content", "text/plain")}
    data = {"thread_id": "thread-1", "project_id": "project-1"}
    create_resp = await client.post("/api/attachments", data=data, files=files)
    attachment_id = create_resp.json()["id"]

    preview_resp = await client.get(f"/api/attachments/{attachment_id}/preview")
    assert preview_resp.status_code == 200
    assert preview_resp.json()["filename"] == "preview.txt"
