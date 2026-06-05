import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_document(client: AsyncClient):
    payload = {
        "title": "Test Document",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    }
    response = await client.post("/api/documents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Document"
    assert data["status"] == "draft"
    assert "id" in data
    assert "current_revision_id" in data


@pytest.mark.asyncio
async def test_get_document(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "My Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/documents/{doc_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["title"] == "My Doc"
    assert data["current_revision"]["content"] == ""


@pytest.mark.asyncio
async def test_get_document_not_found(client: AsyncClient):
    response = await client.get("/api/documents/123e4567-e89b-12d3-a456-426614174000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_revision(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    rev_resp = await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "# Hello World",
        "author_type": "ai",
        "author_id": "agent-1",
    })
    assert rev_resp.status_code == 201
    rev_data = rev_resp.json()
    assert rev_data["content"] == "# Hello World"
    assert rev_data["author_type"] == "ai"

    get_resp = await client.get(f"/api/documents/{doc_id}")
    assert get_resp.json()["current_revision_id"] == rev_data["id"]


@pytest.mark.asyncio
async def test_list_revisions(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "First",
        "author_type": "ai",
        "author_id": "agent-1",
    })
    await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "Second",
        "author_type": "human",
        "author_id": "user-1",
    })

    list_resp = await client.get(f"/api/documents/{doc_id}/revisions")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert len(data) == 3
    assert data[0]["content"] == "Second"


@pytest.mark.asyncio
async def test_diff_endpoint(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    rev1_resp = await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "line one\nline two",
        "author_type": "ai",
        "author_id": "agent-1",
    })
    rev1_id = rev1_resp.json()["id"]

    rev2_resp = await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "line one\nmodified line",
        "author_type": "ai",
        "author_id": "agent-1",
    })
    rev2_id = rev2_resp.json()["id"]

    diff_resp = await client.get(f"/api/documents/{doc_id}/diff?from_revision={rev1_id}&to_revision={rev2_id}")
    assert diff_resp.status_code == 200
    assert diff_resp.headers["content-type"] == "text/plain; charset=utf-8"
    body = diff_resp.text
    assert "---" in body
    assert "+++" in body
    assert "-line two" in body
    assert "+modified line" in body


@pytest.mark.asyncio
async def test_diff_omitted_to_uses_current(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    rev1_resp = await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "old content",
        "author_type": "ai",
        "author_id": "agent-1",
    })
    rev1_id = rev1_resp.json()["id"]

    await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "new content",
        "author_type": "ai",
        "author_id": "agent-1",
    })

    diff_resp = await client.get(f"/api/documents/{doc_id}/diff?from_revision={rev1_id}")
    assert diff_resp.status_code == 200
    assert "-old content" in diff_resp.text
    assert "+new content" in diff_resp.text


@pytest.mark.asyncio
async def test_approve_document(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "Final draft",
        "author_type": "ai",
        "author_id": "agent-1",
    })

    approve_resp = await client.post(f"/api/documents/{doc_id}/approve", json={
        "approved_by": "user-1",
    })
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_invalid_status_transition(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    # First approval succeeds
    await client.post(f"/api/documents/{doc_id}/approve", json={
        "approved_by": "user-1",
    })

    # Second approval fails - already approved
    approve_resp = await client.post(f"/api/documents/{doc_id}/approve", json={
        "approved_by": "user-2",
    })
    assert approve_resp.status_code == 409


@pytest.mark.asyncio
async def test_audit_log_created(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "Audit me",
        "author_type": "ai",
        "author_id": "agent-1",
    })

    audit_resp = await client.get("/api/audit?thread_id=thread-1")
    assert audit_resp.status_code == 200
    entries = audit_resp.json()
    assert len(entries) >= 2
    actions = {e["action"] for e in entries}
    assert "document_created" in actions
    assert "revision_created" in actions


@pytest.mark.asyncio
async def test_patch_document_title_only(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Old Title",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    patch_resp = await client.patch(f"/api/documents/{doc_id}", json={"title": "New Title"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "New Title"


@pytest.mark.asyncio
async def test_publish_document(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    # Create a revision first
    await client.post(f"/api/documents/{doc_id}/revisions", json={
        "content": "Final draft",
        "author_type": "ai",
        "author_id": "agent-1",
    })

    # Approve first
    await client.post(f"/api/documents/{doc_id}/approve", json={
        "approved_by": "user-1",
    })

    # Publish
    publish_resp = await client.post(f"/api/documents/{doc_id}/publish")
    assert publish_resp.status_code == 200
    assert publish_resp.json()["status"] == "published"


@pytest.mark.asyncio
async def test_publish_requires_approval(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    # Try to publish without approval
    publish_resp = await client.post(f"/api/documents/{doc_id}/publish")
    assert publish_resp.status_code == 409


@pytest.mark.asyncio
async def test_no_delete_endpoint(client: AsyncClient):
    create_resp = await client.post("/api/documents", json={
        "title": "Doc",
        "thread_id": "thread-1",
        "project_id": "proj-1",
    })
    doc_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/documents/{doc_id}")
    assert delete_resp.status_code == 405
