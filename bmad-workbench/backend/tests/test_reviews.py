import pytest
from httpx import AsyncClient


async def _create_document(client: AsyncClient):
    """Helper to create a project, thread with initial intent, and return document_id."""
    proj_resp = await client.post("/api/projects", json={"name": "Review Test"})
    project_id = proj_resp.json()["id"]
    thread_resp = await client.post("/api/threads", json={
        "project_id": project_id,
        "title": "Test Thread",
        "initial_intent": "Draft content for review",
    })
    thread_id = thread_resp.json()["id"]
    docs_resp = await client.get(f"/api/threads/{thread_id}/documents")
    documents = docs_resp.json()
    assert len(documents) > 0, "No documents created for thread"
    return documents[0]["id"]


@pytest.mark.asyncio
async def test_create_review(client: AsyncClient):
    document_id = await _create_document(client)

    payload = {"reviewer_ids": ["user-1", "user-2"], "message": "Please review this draft"}
    response = await client.post(f"/api/documents/{document_id}/reviews", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert len(data) == 2
    assert data[0]["status"] == "pending"
    assert data[0]["reviewer"]["display_name"] == "Sarah Chen"


@pytest.mark.asyncio
async def test_list_reviews(client: AsyncClient):
    document_id = await _create_document(client)

    await client.post(f"/api/documents/{document_id}/reviews", json={"reviewer_ids": ["user-1"]})
    response = await client.get(f"/api/documents/{document_id}/reviews")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


@pytest.mark.asyncio
async def test_respond_to_review(client: AsyncClient):
    document_id = await _create_document(client)

    create_resp = await client.post(f"/api/documents/{document_id}/reviews", json={"reviewer_ids": ["user-1"]})
    review_id = create_resp.json()[0]["id"]

    response = await client.post(f"/api/reviews/{review_id}/respond", json={"status": "approved", "comment": "Looks good"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["comment"] == "Looks good"


@pytest.mark.asyncio
async def test_inline_comment_create_and_list(client: AsyncClient):
    document_id = await _create_document(client)

    create_resp = await client.post(f"/api/documents/{document_id}/reviews", json={"reviewer_ids": ["user-1"]})
    review_id = create_resp.json()[0]["id"]

    payload = {"review_id": review_id, "text": "This section needs more detail"}
    response = await client.post(f"/api/documents/{document_id}/inline-comments", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["text"] == "This section needs more detail"
    assert data["resolved"] == "0"

    list_resp = await client.get(f"/api/documents/{document_id}/inline-comments")
    assert list_resp.status_code == 200
    comments = list_resp.json()
    assert len(comments) == 1


@pytest.mark.asyncio
async def test_resolve_inline_comment(client: AsyncClient):
    document_id = await _create_document(client)

    create_resp = await client.post(f"/api/documents/{document_id}/reviews", json={"reviewer_ids": ["user-1"]})
    review_id = create_resp.json()[0]["id"]

    comment_resp = await client.post(
        f"/api/documents/{document_id}/inline-comments",
        json={"review_id": review_id, "text": "Fix this typo"}
    )
    comment_id = comment_resp.json()["id"]

    response = await client.patch(f"/api/inline-comments/{comment_id}/resolve")
    assert response.status_code == 200
    assert response.json()["resolved"] == "1"
