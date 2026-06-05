"""Validation service for agent outputs."""

import json
from typing import Any

from jsonschema import ValidationError, validate

from backend.src.core.exceptions import AgentError


class ValidationService:
    """Validates agent outputs against JSON schemas and performs cross-agent consistency checks."""

    @staticmethod
    def validate_json_schema(data: dict[str, Any], schema: dict[str, Any]) -> list[str]:
        """Validate a dict against a JSON schema.

        Args:
            data: The data to validate.
            schema: JSON schema dict.

        Returns:
            List of validation error messages (empty if valid).
        """
        try:
            validate(instance=data, schema=schema)
            return []
        except ValidationError as e:
            return [f"{e.json_path}: {e.message}"]

    @staticmethod
    def check_cross_agent_consistency(
        localization: dict[str, Any] | None,
        governance: dict[str, Any] | None,
        performance: dict[str, Any] | None,
        content: dict[str, Any] | None,
    ) -> list[dict[str, Any]]:
        """Perform cross-agent consistency checks.

        Returns:
            List of inconsistency records.
        """
        inconsistencies = []

        # Check 1: If Localization flags cultural sensitivity, verify Content addressed it
        if localization and content:
            risks = (
                localization.get("localization_report", {})
                .get("potential_risks_flagged", [])
            )
            if risks:
                cultural_elements = content.get("creative_summary", {}).get(
                    "cultural_elements_incorporated", ""
                )
                if not cultural_elements or cultural_elements == "":
                    inconsistencies.append({
                        "between_agents": ["localization", "content_generation"],
                        "description": "Localization flagged risks but content shows no cultural adaptation",
                        "severity": "medium",
                    })

        # Check 2: If Governance flags unsubstantiated claim, verify Content doesn't present as fact
        if governance and content:
            unsubstantiated = [
                c for c in governance.get("compliance_report", {})
                .get("claims_substantiation_status", [])
                if c.get("status") == "unsubstantiated"
            ]
            if unsubstantiated:
                content_body = content.get("generated_content", {}).get("primary_language_content", {}).get("body", "")
                for claim in unsubstantiated:
                    claim_text = claim.get("claim", "").lower()
                    if claim_text and claim_text in content_body.lower():
                        inconsistencies.append({
                            "between_agents": ["governance", "content_generation"],
                            "description": f"Unsubstantiated claim '{claim_text}' appears in generated content",
                            "severity": "high",
                        })

        # Check 3: If Performance recommends platform, verify content format matches
        if performance and content:
            channels = performance.get("media_strategy", {}).get("recommended_channels", [])
            if channels:
                platform = channels[0].get("platform", "").lower()
                content_platform = content.get("generated_content", {}).get("primary_language_content", {}).get("platform", "").lower()
                if content_platform and platform not in content_platform and content_platform not in platform:
                    inconsistencies.append({
                        "between_agents": ["performance", "content_generation"],
                        "description": f"Content format may not match recommended platform {platform}",
                        "severity": "low",
                    })

        return inconsistencies

    @staticmethod
    def aggregate_risk_flags(
        localization: dict[str, Any] | None,
        governance: dict[str, Any] | None,
        performance: dict[str, Any] | None,
        content: dict[str, Any] | None,
    ) -> list[dict[str, Any]]:
        """Aggregate risk flags from all agents.

        Returns:
            List of risk flag records with severity.
        """
        flags = []

        if governance:
            redlines = governance.get("compliance_report", {}).get("egm_ai_policy_redlines_violations", [])
            for r in redlines:
                flags.append({
                    "source_agent": "governance",
                    "flag_type": r.get("redline_category", "redline"),
                    "description": r.get("description", ""),
                    "severity": "critical",
                })

        if localization:
            risks = localization.get("localization_report", {}).get("potential_risks_flagged", [])
            for risk in risks:
                flags.append({
                    "source_agent": "localization",
                    "flag_type": "cultural_risk",
                    "description": risk,
                    "severity": "medium",
                })

        return flags

    @staticmethod
    def determine_final_status(
        schema_valid: bool,
        inconsistencies: list[dict[str, Any]],
        risk_flags: list[dict[str, Any]],
    ) -> tuple[str, bool, str]:
        """Determine final validation status.

        Returns:
            Tuple of (validation_status, flag_for_hitl, hitl_reason).
        """
        has_critical = any(f.get("severity") == "critical" for f in risk_flags)
        has_high = any(f.get("severity") == "high" for f in risk_flags)
        has_medium_inconsistency = any(i.get("severity") in ("medium", "high") for i in inconsistencies)

        if not schema_valid or has_critical:
            return "critical_error", True, "Critical issues or schema validation failures detected"

        if has_high or has_medium_inconsistency:
            return "needs_review", True, "High severity issues or inconsistencies detected"

        return "valid_and_safe", False, ""


# Singleton instance
validation_service = ValidationService()
