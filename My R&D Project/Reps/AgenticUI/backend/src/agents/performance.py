"""Performance / Media Agent — media strategy and platform optimization."""

from pathlib import Path
from typing import Any

from backend.src.agents.base import BaseAgent
from backend.src.services.context import context_assembler


class PerformanceAgent(BaseAgent):
    """Agent that provides media strategy recommendations and platform analysis."""

    def __init__(self) -> None:
        """Initialize with performance-specific config."""
        super().__init__("performance")
        self.prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        """Load the performance system prompt from file."""
        path = Path("egm-ai-pilot/prompts/performance.md")
        if path.exists():
            return path.read_text(encoding="utf-8")
        return "You are the Performance Agent. Recommend media strategies and platform optimizations."

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute media strategy analysis.

        Args:
            input_data: Dict with marketing_objective, target_audience, budget, etc.

        Returns:
            Performance output dict with media strategy.
        """
        query_id = input_data.get("query_id", "")
        user_query = input_data.get("user_query", "")

        context = context_assembler.assemble(
            system_prompt=self.prompt,
            user_query=user_query,
            task_type="performance",
            additional_context={
                "marketing_objective": input_data.get("marketing_objective", ""),
                "target_audience": input_data.get("target_audience", {}),
                "product_service_category": input_data.get("product_service_category", ""),
                "current_budget_constraints": input_data.get("current_budget_constraints", {}),
                "platforms_of_interest": input_data.get("platforms_of_interest", []),
                "campaign_duration": input_data.get("campaign_duration", ""),
            },
        )

        response = await self.call_llm(
            system_prompt=self.prompt,
            user_message=context["prompt"],
            model="claude-3-5-haiku-20241022",
            max_tokens=3072,
            temperature=0.2,
        )

        if "query_id" not in response:
            response["query_id"] = query_id
        if "timestamp" not in response:
            from datetime import datetime, timezone
            response["timestamp"] = datetime.now(timezone.utc).isoformat()

        return response
