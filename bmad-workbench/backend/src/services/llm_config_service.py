from uuid import UUID
from typing import Optional, List
import time

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from src.models.llm_config import LLMConfig
from src.core.exceptions import ApiError
from src.services.llm_client import LLMClient


# Provider registry — all OpenAI-compatible
PROVIDERS = {
    "lm_studio": {
        "id": "lm_studio",
        "name": "LM Studio (Local)",
        "fields": ["base_url", "model_name"],
        "default_base_url": "http://localhost:1234/v1",
        "default_models": ["local-model"],
    },
    "vllm": {
        "id": "vllm",
        "name": "Local vLLM",
        "fields": ["base_url", "model_name"],
        "default_base_url": "http://localhost:8000/v1",
        "default_models": ["meta-llama/Meta-Llama-3.1-8B-Instruct", "meta-llama/Meta-Llama-3.1-70B-Instruct"],
    },
    "ollama": {
        "id": "ollama",
        "name": "Ollama",
        "fields": ["base_url", "model_name"],
        "default_base_url": "http://localhost:11434",
        "default_models": ["llama3.1", "mistral", "codellama"],
    },
    "kimi": {
        "id": "kimi",
        "name": "Kimi Code",
        "fields": ["base_url", "api_key", "model_name"],
        "default_base_url": "https://api.moonshot.cn/v1",
        "default_models": ["moonshot-v1-8k", "moonshot-v1-32k"],
    },
    "openai": {
        "id": "openai",
        "name": "OpenAI",
        "fields": ["api_key", "model_name"],
        "default_base_url": "https://api.openai.com/v1",
        "default_models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    },
    "azure_openai": {
        "id": "azure_openai",
        "name": "Azure OpenAI",
        "fields": ["base_url", "api_key", "model_name"],
        "default_base_url": "",
        "default_models": ["gpt-4", "gpt-35-turbo"],
    },
}


class LLMConfigService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_config(self) -> Optional[LLMConfig]:
        result = await self.db.execute(
            select(LLMConfig).where(LLMConfig.is_active == "1").order_by(desc(LLMConfig.updated_at))
        )
        return result.scalars().first()

    async def save_config(
        self,
        provider: str,
        model_name: str,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        created_by: str = "system",
    ) -> LLMConfig:
        # Deactivate existing configs
        result = await self.db.execute(select(LLMConfig).where(LLMConfig.is_active == "1"))
        for conf in result.scalars().all():
            conf.is_active = "0"

        # Encrypt API key (mock: just base64 for demo; use Fernet in production)
        api_key_encrypted = None
        if api_key:
            import base64
            api_key_encrypted = base64.b64encode(api_key.encode()).decode()

        config = LLMConfig(
            provider=provider,
            base_url=base_url,
            api_key_encrypted=api_key_encrypted,
            model_name=model_name,
            is_active="1",
            created_by=created_by,
        )
        self.db.add(config)
        await self.db.flush()
        await self.db.refresh(config)
        return config

    async def test_connection(self, provider: str, base_url: Optional[str], api_key: Optional[str], model_name: str) -> dict:
        if provider not in PROVIDERS:
            return {"success": False, "message": f"Unknown provider: {provider}", "latency_ms": 0}

        if provider in ("lm_studio", "vllm", "ollama") and not base_url:
            return {"success": False, "message": "Base URL is required", "latency_ms": 0}

        if provider in ("openai", "kimi", "azure_openai") and not api_key:
            return {"success": False, "message": "API key is required", "latency_ms": 0}

        # Real HTTP test via LLMClient
        client = LLMClient(
            base_url=base_url or PROVIDERS[provider]["default_base_url"],
            model_name=model_name,
            api_key=api_key,
            provider=provider,
        )
        return await client.test_connection()

    def list_providers(self) -> List[dict]:
        return list(PROVIDERS.values())
