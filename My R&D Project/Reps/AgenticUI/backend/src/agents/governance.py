"""Governance / Compliance Agent — regulatory screening and policy enforcement."""

from pathlib import Path
from typing import Any

from backend.src.agents.base import BaseAgent
from backend.src.services.context import context_assembler


class GovernanceAgent(BaseAgent):
    """Agent that screens content for regulatory compliance and policy violations."""

    def __init__(self) -> None:
        """Initialize with governance-specific config."""
        super().__init__("governance")
        self.prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        """Load the governance system prompt from file."""
        path = Path("egm-ai-pilot/prompts/governance.md")
        if path.exists():
            return path.read_text(encoding="utf-8")
        return "You are the Governance Agent. Screen for compliance and policy violations."

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute compliance screening.

        Args:
            input_data: Dict with content_to_review, target_market, etc.

        Returns:
            Governance output dict with compliance report.
        """
        query_id = input_data.get("query_id", "")
        user_query = input_data.get("user_query", "")

        context = context_assembler.assemble(
            system_prompt=self.prompt,
            user_query=user_query,
            task_type="compliance",
            additional_context={
                "content_to_review": input_data.get("content_to_review", {}),
                "target_market": input_data.get("target_market", {}),
            },
        )

        response = await self.call_llm(
            system_prompt=self.prompt,
            user_message=context["prompt"],
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            temperature=0.1,
        )

        if "query_id" not in response:
            response["query_id"] = query_id
        if "timestamp" not in response:
            from datetime import datetime, timezone
            response["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Ensure flag_for_hitl is set based on redlines
        redlines = response.get("compliance_report", {}).get("egm_ai_policy_redlines_violations", [])
        response["flag_for_hitl"] = len(redlines) > 0

        return response
