"""Content Generation Agent — marketing copy and creative content."""

from pathlib import Path
from typing import Any

from backend.src.agents.base import BaseAgent
from backend.src.services.context import context_assembler


class ContentAgent(BaseAgent):
    """Agent that generates marketing content with cultural integration."""

    def __init__(self) -> None:
        """Initialize with content-specific config."""
        super().__init__("content_generation")
        self.prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        """Load the content generation system prompt from file."""
        path = Path("egm-ai-pilot/prompts/content-generation.md")
        if path.exists():
            return path.read_text(encoding="utf-8")
        return "You are the Content Generation Agent. Generate marketing content."

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute content generation.

        Args:
            input_data: Dict with content_brief, localized_insights, few_shot_examples, etc.

        Returns:
            Content output dict with generated content.
        """
        query_id = input_data.get("query_id", "")
        user_query = input_data.get("user_query", "")

        context = context_assembler.assemble(
            system_prompt=self.prompt,
            user_query=user_query,
            task_type="content_generation",
            additional_context={
                "content_brief": input_data.get("content_brief", {}),
                "localized_insights": input_data.get("localized_insights", {}),
                "few_shot_examples": input_data.get("few_shot_examples", []),
            },
        )

        response = await self.call_llm(
            system_prompt=self.prompt,
            user_message=context["prompt"],
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            temperature=0.7,
        )

        if "query_id" not in response:
            response["query_id"] = query_id
        if "timestamp" not in response:
            from datetime import datetime, timezone
            response["timestamp"] = datetime.now(timezone.utc).isoformat()

        return response
