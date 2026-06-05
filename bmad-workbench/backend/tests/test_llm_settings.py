import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_llm_config_default(client: AsyncClient):
    response = await client.get("/api/settings/llm")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "vllm"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_save_llm_config(client: AsyncClient):
    payload = {
        "provider": "openai",
        "model_name": "gpt-4",
        "api_key": "sk-test-key",
    }
    response = await client.post("/api/settings/llm", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "openai"
    assert data["model_name"] == "gpt-4"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_get_llm_config_after_save(client: AsyncClient):
    await client.post("/api/settings/llm", json={
        "provider": "ollama",
        "model_name": "llama3.1",
        "base_url": "http://localhost:11434",
    })
    response = await client.get("/api/settings/llm")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "ollama"
    assert data["model_name"] == "llama3.1"


@pytest.mark.asyncio
async def test_test_llm_connection_success(client: AsyncClient):
    payload = {
        "provider": "vllm",
        "model_name": "llama-3.1-8b",
        "base_url": "http://localhost:8000/v1",
    }
    response = await client.post("/api/settings/llm/test", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "latency_ms" in data


@pytest.mark.asyncio
async def test_test_llm_connection_missing_api_key(client: AsyncClient):
    payload = {
        "provider": "openai",
        "model_name": "gpt-4",
    }
    response = await client.post("/api/settings/llm/test", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "API key" in data["message"]


@pytest.mark.asyncio
async def test_list_providers(client: AsyncClient):
    response = await client.get("/api/settings/llm/providers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    provider_ids = [p["id"] for p in data]
    assert "vllm" in provider_ids
    assert "openai" in provider_ids
    assert "ollama" in provider_ids
    assert "kimi" in provider_ids
