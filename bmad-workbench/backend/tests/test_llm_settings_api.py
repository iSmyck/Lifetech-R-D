"""API tests for LLM settings endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_llm_config_default(client: AsyncClient):
    """When no config is saved, should return LM Studio defaults."""
    resp = await client.get("/api/settings/llm")
    assert resp.status_code == 200
    data = resp.json()
    assert data["provider"] == "lm_studio"
    assert data["model_name"] == "google/gemma-4-e4b"
    assert data["base_url"] == "http://127.0.0.1:1234"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_llm_providers(client: AsyncClient):
    resp = await client.get("/api/settings/llm/providers")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    provider_ids = {p["id"] for p in data}
    assert "lm_studio" in provider_ids
    assert "vllm" in provider_ids
    assert "ollama" in provider_ids
    assert "openai" in provider_ids


@pytest.mark.asyncio
async def test_save_llm_config(client: AsyncClient):
    payload = {
        "provider": "lm_studio",
        "model_name": "google/gemma-4-e4b",
        "base_url": "http://127.0.0.1:1234",
        "api_key": None,
    }
    resp = await client.post("/api/settings/llm", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["provider"] == "lm_studio"
    assert data["model_name"] == "google/gemma-4-e4b"
    assert data["is_active"] is True

    # Verify saved config is returned on GET
    resp2 = await client.get("/api/settings/llm")
    assert resp2.status_code == 200
    saved = resp2.json()
    assert saved["provider"] == "lm_studio"
    assert saved["model_name"] == "google/gemma-4-e4b"


@pytest.mark.asyncio
async def test_test_llm_connection_bad_url(client: AsyncClient):
    """Test connection to non-existent server should fail gracefully."""
    payload = {
        "provider": "lm_studio",
        "model_name": "test-model",
        "base_url": "http://localhost:99999",
        "api_key": None,
    }
    resp = await client.post("/api/settings/llm/test", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is False
    assert "Cannot connect" in data["message"]
