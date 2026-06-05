"""Async LLM client supporting OpenAI-compatible and LM Studio native APIs."""

import json
import logging
from typing import AsyncGenerator, Optional, List, Dict, Any

import httpx

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 120.0


class LLMClient:
    """Generic LLM client supporting OpenAI-compatible and LM Studio native APIs.

    Auto-detects LM Studio native format vs OpenAI-compatible format.
    """

    def __init__(
        self,
        base_url: str,
        model_name: str,
        api_key: Optional[str] = None,
        timeout: float = DEFAULT_TIMEOUT,
        provider: Optional[str] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.api_key = api_key or "not-needed"
        self.timeout = timeout
        self.provider = provider or "openai"

        # Auto-detect LM Studio from URL patterns
        if "lmstudio" in self.base_url.lower() or (
            ":1234" in self.base_url and "/v1" not in self.base_url
        ):
            self.provider = "lm_studio"

        self._headers = {
            "Content-Type": "application/json",
        }
        if self.api_key and self.api_key != "not-needed":
            self._headers["Authorization"] = f"Bearer {self.api_key}"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> str:
        """Send a non-streaming chat completion request."""
        if self.provider == "lm_studio":
            return await self._lm_studio_chat(messages, temperature, max_tokens)

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return self._extract_content(data)

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """Send a streaming chat completion request, yielding content chunks."""
        if self.provider == "lm_studio":
            # LM Studio native streaming — yield the full response as one chunk
            text = await self._lm_studio_chat(messages, temperature, max_tokens)
            # Simulate streaming by yielding word-by-word
            words = text.split(" ")
            for word in words[:30]:  # cap at ~30 chunks for smooth UX
                yield word + " "
            if len(words) > 30:
                yield " ".join(words[30:])
            return

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=self._headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or line == "data: [DONE]":
                        continue
                    if line.startswith("data: "):
                        line = line[6:]
                    try:
                        chunk = json.loads(line)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, IndexError, KeyError):
                        continue

    async def test_connection(self) -> Dict[str, Any]:
        """Test connectivity by sending a minimal completion request."""
        import time
        start = time.time()
        try:
            if self.provider == "lm_studio":
                payload = {
                    "model": self.model_name,
                    "system_prompt": "",
                    "input": "Say OK",
                    "stream": False,
                }
                endpoint = f"{self.base_url}/api/v1/chat"
            else:
                payload = {
                    "model": self.model_name,
                    "messages": [{"role": "user", "content": "Say 'OK'"}],
                    "max_tokens": 5,
                    "stream": False,
                }
                endpoint = f"{self.base_url}/chat/completions"

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    endpoint,
                    headers=self._headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                content = self._extract_content(data)
                latency = int((time.time() - start) * 1000)
                return {
                    "success": True,
                    "message": f"Connected! Model responded: '{content.strip()}'",
                    "latency_ms": latency,
                    "model_info": self.model_name,
                }
        except httpx.ConnectError as exc:
            return {
                "success": False,
                "message": f"Cannot connect to {self.base_url}. Is the server running? ({exc})",
                "latency_ms": int((time.time() - start) * 1000),
            }
        except httpx.HTTPStatusError as exc:
            return {
                "success": False,
                "message": f"HTTP {exc.response.status_code}: {exc.response.text[:200]}",
                "latency_ms": int((time.time() - start) * 1000),
            }
        except Exception as exc:
            return {
                "success": False,
                "message": f"Error: {exc}",
                "latency_ms": int((time.time() - start) * 1000),
            }

    # ------------------------------------------------------------------
    # LM Studio native API
    # ------------------------------------------------------------------

    async def _lm_studio_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Send a chat request using LM Studio's native /api/v1/chat endpoint."""
        # Convert OpenAI message format to LM Studio native format
        system_prompt = ""
        input_text = ""

        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "system":
                system_prompt = content
            elif role == "user":
                input_text = content
            elif role == "assistant":
                # For multi-turn, append assistant response as context
                if input_text:
                    input_text += f"\n\nAssistant: {content}\n\nUser: "

        payload: Dict[str, Any] = {
            "model": self.model_name,
            "input": input_text,
            "stream": False,
        }
        if system_prompt:
            payload["system_prompt"] = system_prompt
        if temperature != 0.7:
            payload["temperature"] = temperature
        if max_tokens != 2048:
            payload["max_tokens"] = max_tokens

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/chat",
                headers=self._headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return self._extract_content(data)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_content(data: Dict[str, Any]) -> str:
        """Extract message content from response (OpenAI or LM Studio native)."""
        # LM Studio native format
        if "content" in data and isinstance(data["content"], str):
            return data["content"]
        if "output" in data and isinstance(data["output"], str):
            return data["output"]
        if "text" in data and isinstance(data["text"], str):
            return data["text"]
        if "response" in data and isinstance(data["response"], str):
            return data["response"]

        # OpenAI-compatible format
        choices = data.get("choices", [])
        if not choices:
            return ""
        message = choices[0].get("message", {})
        if "content" in message:
            return message["content"]
        # Some formats put content directly in choice
        return choices[0].get("text", "")


# ------------------------------------------------------------------
# Factory from config dict
# ------------------------------------------------------------------

def create_llm_client(
    base_url: str,
    model_name: str,
    api_key: Optional[str] = None,
    provider: Optional[str] = None,
) -> LLMClient:
    """Create an LLMClient from configuration values."""
    return LLMClient(
        base_url=base_url,
        model_name=model_name,
        api_key=api_key,
        provider=provider,
    )
