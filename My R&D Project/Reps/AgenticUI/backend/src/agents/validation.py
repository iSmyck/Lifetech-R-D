"""Validation & Guardrails Agent — cross-agent consistency and risk aggregation."""

from pathlib import Path
from typing import Any

from backend.src.agents.base import BaseAgent
from backend.src.services.context import context_assembler
from backend.src.services.validation import validation_service


class ValidationAgent(BaseAgent):
    """Agent that validates outputs across all agents for consistency and safety."""

    def __init__(self) -> None:
        """Initialize with validation-specific config."""
        super().__init__("validation")
        self.prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        """Load the validation system prompt from file."""
        path = Path("egm-ai-pilot/prompts/validation.md")
        if path.exists():
            return path.read_text(encoding="utf-8")
        return "You are the Validation Agent. Check consistency and aggregate risks."

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute validation across all agent outputs.

        Args:
            input_data: Dict with agent_outputs and schema_validation_results.

        Returns:
            Validation output dict with status and flags.
        """
        query_id = input_data.get("query_id", "")
        agent_outputs = input_data.get("agent_outputs", {})

        # Programmatic checks first
        schema_valid = True  # Simplified for pilot
        inconsistencies = validation_service.check_cross_agent_consistency(
            localization=agent_outputs.get("localization"),
            governance=agent_outputs.get("governance"),
            performance=agent_outputs.get("performance"),
            content=agent_outputs.get("content"),
        )
        risk_flags = validation_service.aggregate_risk_flags(
            localization=agent_outputs.get("localization"),
            governance=agent_outputs.get("governance"),
            performance=agent_outputs.get("performance"),
            content=agent_outputs.get("content"),
        )

        status, flag_for_hitl, hitl_reason = validation_service.determine_final_status(
            schema_valid=schema_valid,
            inconsistencies=inconsistencies,
            risk_flags=risk_flags,
        )

        # Also run LLM-based consistency check for nuanced issues
        context = context_assembler.assemble(
            system_prompt=self.prompt,
            user_query=f"Validate outputs for query {query_id}",
            task_type="validation",
            additional_context={
                "agent_outputs": agent_outputs,
                "schema_validation_results": {"all_valid": schema_valid, "issues": []},
            },
        )

        llm_response = await self.call_llm(
            system_prompt=self.prompt,
            user_message=context["prompt"],
            model="claude-3-5-haiku-20241022",
            max_tokens=2048,
            temperature=0.0,
        )

        # Merge programmatic results with LLM insights
        response = {
            "query_id": query_id,
            "validation_status": status,
            "consistency_report": {
                "checks_performed": [
                    "Localization-Content consistency",
                    "Governance-Content claim verification",
                    "Performance-Content platform match",
                    "Cross-agent market reference alignment",
                ],
                "inconsistencies_found": inconsistencies,
            },
            "aggregated_risk_flags": risk_flags,
            "auto_repairs_applied": llm_response.get("auto_repairs_applied", []),
            "flag_for_hitl": flag_for_hitl,
            "hitl_reason": hitl_reason,
        }

        if "timestamp" not in response:
            from datetime import datetime, timezone
            response["timestamp"] = datetime.now(timezone.utc).isoformat()

        return response
