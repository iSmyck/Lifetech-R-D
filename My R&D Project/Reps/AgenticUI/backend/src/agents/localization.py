"""Localization Agent — cultural analysis and market adaptation."""

import json
from pathlib import Path
from typing import Any

from backend.src.agents.base import BaseAgent
from backend.src.services.context import context_assembler


class LocalizationAgent(BaseAgent):
    """Agent that performs cultural analysis and localization for African markets."""

    def __init__(self) -> None:
        """Initialize with localization-specific config."""
        super().__init__("localization")
        self.prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        """Load the localization system prompt from file."""
        path = Path("egm-ai-pilot/prompts/localization.md")
        if path.exists():
            return path.read_text(encoding="utf-8")
        # Fallback
        return "You are the Localization Agent. Analyze cultural codes and localize content."

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute cultural analysis and localization.

        Args:
            input_data: Dict with content_to_localize, target_market, etc.

        Returns:
            Localization output dict.
        """
        query_id = input_data.get("query_id", "")
        user_query = input_data.get("user_query", "")

        # Assemble context with cultural-analysis skill
        context = context_assembler.assemble(
            system_prompt=self.prompt,
            user_query=user_query,
            task_type="localization",
            additional_context={
                "content_to_localize": input_data.get("content_to_localize", {}),
                "target_market": input_data.get("target_market", {}),
                "localization_instructions": input_data.get("localization_instructions", {}),
            },
        )

        response = await self.call_llm(
            system_prompt=self.prompt,
            user_message=context["prompt"],
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            temperature=0.5,
        )

        # Merge query_id if missing
        if "query_id" not in response:
            response["query_id"] = query_id
        if "timestamp" not in response:
            from datetime import datetime, timezone
            response["timestamp"] = datetime.now(timezone.utc).isoformat()

        return response
