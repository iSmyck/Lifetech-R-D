"""Abstract base class for all agents."""

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel

from backend.src.core.llm_client import LLMClient


class BaseAgent(ABC):
    """Abstract base class that all agents must inherit from."""

    def __init__(self, name: str, config: dict[str, Any] | None = None) -> None:
        """Initialize the agent.

        Args:
            name: Unique identifier for this agent instance.
            config: Optional configuration dictionary.
        """
        self.name = name
        self.config = config or {}
        self.llm = LLMClient()

    @abstractmethod
    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute the agent's main logic.

        Args:
            input_data: Validated input dict specific to this agent.

        Returns:
            A validated dict representing the agent output.
        """
        ...

    async def call_llm(
        self,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """Convenience method to call the LLM with structured input.

        Args:
            system_prompt: System prompt for the LLM.
            user_message: User message content.
            model: Override model name.
            max_tokens: Max tokens for response.
            temperature: Sampling temperature.

        Returns:
            Parsed JSON dict from LLM response content.
        """
        import json

        response = await self.llm.chat(
            messages=[{"role": "user", "content": user_message}],
            system=system_prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        content = response["choices"][0]["message"]["content"]
        # Try to parse JSON from the content
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Return raw content wrapped if not valid JSON
            return {"raw_response": content, "parsed": False}

    async def close(self) -> None:
        """Clean up resources."""
        await self.llm.close()
