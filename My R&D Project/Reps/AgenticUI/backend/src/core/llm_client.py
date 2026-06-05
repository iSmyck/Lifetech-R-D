"""Unified async LLM client with simulation mode support."""

import json
import time
from typing import Any

import httpx

from backend.src.core.config import settings
from backend.src.core.exceptions import LLMClientError


class LLMClient:
    """Async HTTP client for LLM API calls with fallback simulation."""

    def __init__(self, base_url: str | None = None, api_key: str | None = None) -> None:
        """Initialize the LLM client.

        Args:
            base_url: Root URL of the LLM API. Defaults to settings.llm_base_url.
            api_key: Optional API key for authentication. Defaults to settings.llm_api_key.
        """
        self.base_url = (base_url or settings.llm_base_url).rstrip("/")
        self.api_key = api_key or settings.llm_api_key
        self.simulation_mode = settings.simulation_mode
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Lazy-init and return the async HTTP client."""
        if self._client is None:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=httpx.Timeout(60.0),
            )
        return self._client

    async def chat(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
        system: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Send a chat completion request.

        In simulation mode, returns a realistic mock response based on the system prompt.
        In real mode, calls the LLM API endpoint.
        """
        if self.simulation_mode:
            return await self._simulate_response(messages, system, model)

        client = await self._get_client()
        payload: dict[str, Any] = {
            "model": model or settings.llm_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            **kwargs,
        }
        if system:
            payload["system"] = system

        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise LLMClientError(f"LLM API error: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            raise LLMClientError(f"LLM request failed: {e}")

    async def _simulate_response(
        self,
        messages: list[dict[str, str]],
        system: str | None,
        model: str | None,
    ) -> dict[str, Any]:
        """Generate a realistic mock LLM response based on the agent type in system prompt."""
        system_lower = (system or "").lower()
        user_content = messages[-1].get("content", "") if messages else ""

        # Determine agent type from system prompt
        if "coordinator" in system_lower:
            content = self._mock_coordinator(user_content)
        elif "router" in system_lower:
            content = self._mock_router(user_content)
        elif "localization" in system_lower:
            content = self._mock_localization(user_content)
        elif "governance" in system_lower or "compliance" in system_lower:
            content = self._mock_governance(user_content)
        elif "performance" in system_lower or "media" in system_lower:
            content = self._mock_performance(user_content)
        elif "content generation" in system_lower:
            content = self._mock_content(user_content)
        elif "validation" in system_lower:
            content = self._mock_validation(user_content)
        else:
            content = json.dumps({"query_id": "simulated", "status": "completed"})

        # Simulate network delay for realism
        await self._delay(0.3 + hash(content) % 100 / 1000)

        return {
            "id": f"simulated-{int(time.time() * 1000)}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model or settings.llm_model,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": content},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 500, "completion_tokens": 800, "total_tokens": 1300},
        }

    @staticmethod
    async def _delay(seconds: float) -> None:
        """Non-blocking delay."""
        import asyncio

        await asyncio.sleep(seconds)

    @staticmethod
    def _mock_coordinator(user_content: str) -> str:
        return json.dumps({
            "query_id": "simulated",
            "final_response": f"Based on your request about '{user_content[:50]}...', I have coordinated the analysis across multiple agents. The content has been localized, compliance-checked, and optimized for your target market.",
            "response_summary": "Multi-agent analysis completed successfully.",
            "executed_agents": [
                {"agent_name": "localization", "status": "completed", "output_summary": "Cultural analysis completed"},
                {"agent_name": "governance", "status": "completed", "output_summary": "Compliance verified"},
                {"agent_name": "content_generation", "status": "completed", "output_summary": "Content generated"},
            ],
            "review_status": "N/A",
            "timestamp": "2024-01-01T00:00:00Z",
        })

    @staticmethod
    def _mock_router(user_content: str) -> str:
        return json.dumps({
            "query_id": "simulated",
            "execution_plan": [
                {
                    "step_id": 1,
                    "agent": "localization_agent",
                    "can_parallel": True,
                    "depends_on": [],
                    "agent_input": {},
                    "priority": "high",
                },
                {
                    "step_id": 2,
                    "agent": "governance_agent",
                    "can_parallel": True,
                    "depends_on": [],
                    "agent_input": {},
                    "priority": "high",
                },
                {
                    "step_id": 3,
                    "agent": "performance_agent",
                    "can_parallel": True,
                    "depends_on": [],
                    "agent_input": {},
                    "priority": "medium",
                },
                {
                    "step_id": 4,
                    "agent": "content_agent",
                    "can_parallel": False,
                    "depends_on": [1, 2],
                    "agent_input": {},
                    "priority": "high",
                },
            ],
            "estimated_agents_count": 4,
            "complexity_assessment": "moderate",
        })

    @staticmethod
    def _mock_localization(user_content: str) -> str:
        return json.dumps({
            "query_id": "simulated",
            "localized_content": {
                "text": "Your localized content goes here, adapted for the target market with cultural nuance.",
                "image_suggestions": "Use vibrant colors, local landmarks, diverse faces representing the community",
                "call_to_action": "Shop Now / Get Started",
                "bilingual_version": {
                    "primary": "Localized text in primary language",
                    "secondary": "Equivalent text in secondary language",
                },
            },
            "localization_report": {
                "cultural_codes_applied": ["Power Distance", "Collectivism", "Indulgence"],
                "generational_lens": "Gen Z (18-25): Digital-native, authenticity-focused",
                "market_insights_applied": "Mobile-first behavior, meme culture, social justice alignment",
                "cultural_sensitivities_addressed": ["Avoided religious symbols", "Respected generational hierarchy"],
                "local_benchmarking_references": ["Reference Campaign A", "Local Brand B"],
                "potential_risks_flagged": [],
            },
            "confidence_score": 0.92,
            "timestamp": "2024-01-01T00:00:00Z",
        })

    @staticmethod
    def _mock_governance(user_content: str) -> str:
        return json.dumps({
            "query_id": "simulated",
            "compliance_report": {
                "overall_status": "compliant",
                "regulatory_findings": [],
                "platform_policy_findings": [],
                "egm_ai_policy_redlines_violations": [],
                "claims_substantiation_status": [
                    {"claim": "Product is the best", "status": "unsubstantiated", "reason": "Superlative claim without evidence"},
                ],
            },
            "flag_for_hitl": False,
            "confidence_score": 0.95,
            "timestamp": "2024-01-01T00:00:00Z",
        })

    @staticmethod
    def _mock_performance(user_content: str) -> str:
        return json.dumps({
            "query_id": "simulated",
            "media_strategy": {
                "recommended_channels": [
                    {
                        "platform": "Meta (Facebook/Instagram)",
                        "placement": "Feed + Stories",
                        "rationale": "Highest reach for target demographic",
                        "audience_fit_score": 0.88,
                        "estimated_cpm_range": "$3-6",
                        "estimated_spend": 5000,
                        "bid_strategy_suggestion": "Lowest cost with bid cap",
                    },
                    {
                        "platform": "TikTok",
                        "placement": "In-Feed",
                        "rationale": "Strong Gen Z engagement",
                        "audience_fit_score": 0.92,
                        "estimated_cpm_range": "$2-4",
                        "estimated_spend": 3000,
                        "bid_strategy_suggestion": "Cost cap",
                    },
                ],
                "budget_allocation": {"total": 8000, "by_platform": {"Meta": 5000, "TikTok": 3000}},
                "creative_fatigue_prediction": {
                    "risk_level": "medium",
                    "refresh_frequency_suggestion": "Every 3 weeks",
                    "reasoning": "High-frequency targeting with young demographic",
                },
                "testing_matrix": {
                    "variables": ["creative", "audience", "placement"],
                    "priority_tests": ["Hook variation A/B", "Audience segment test"],
                },
            },
            "performance_forecast": {
                "estimated_reach": "250K-400K",
                "estimated_impressions": "750K-1.2M",
                "estimated_clicks": "15K-24K",
                "estimated_conversions": "750-1,200",
                "confidence_level": "medium",
            },
            "platform_comparison": "Meta offers broader reach and mature targeting. TikTok delivers higher engagement rates with younger audiences. Recommend 60/40 split for balanced performance.",
            "timestamp": "2024-01-01T00:00:00Z",
        })

    @staticmethod
    def _mock_content(user_content: str) -> str:
        return json.dumps({
            "query_id": "simulated",
            "generated_content": {
                "primary_language_content": {
                    "headline": "Transform Your Routine with Our Game-Changing Product",
                    "body": "Tired of the same old results? Our innovative solution is designed for people who demand more. Join thousands who have already made the switch and see the difference for yourself.",
                    "call_to_action": "Shop Now — Limited Time Offer",
                    "hashtags": ["#Innovation", "#MustHave", "#NewLaunch"],
                    "hook_type_used": "Pattern Break",
                },
                "secondary_language_content": {
                    "headline": "Transformez Votre Routine",
                    "body": "Marre des memes resultats? Notre solution innovante est concue pour ceux qui exigent plus.",
                    "call_to_action": "Achetez Maintenant",
                    "hashtags": ["#Innovation", "#Incontournable"],
                },
                "variants": [
                    {"variant_id": "v1", "text": "Variant A with curiosity gap hook", "hook_type": "Curiosity Gap"},
                    {"variant_id": "v2", "text": "Variant B with social proof hook", "hook_type": "Social Proof"},
                    {"variant_id": "v3", "text": "Variant C with story hook", "hook_type": "Story Hook"},
                ],
            },
            "creative_summary": {
                "cultural_elements_incorporated": "Local idioms and generational references integrated",
                "few_shot_inspiration": "Style matched to provided examples",
                "adherence_to_brief": "All requirements met including character limits",
                "potential_improvements": "Test longer-form storytelling for engagement",
            },
            "timestamp": "2024-01-01T00:00:00Z",
        })

    @staticmethod
    def _mock_validation(user_content: str) -> str:
        return json.dumps({
            "query_id": "simulated",
            "validation_status": "valid_and_safe",
            "consistency_report": {
                "checks_performed": [
                    "Localization-Content consistency",
                    "Governance-Content claim verification",
                    "Performance-Content platform match",
                    "Cross-agent market reference alignment",
                ],
                "inconsistencies_found": [],
            },
            "aggregated_risk_flags": [],
            "auto_repairs_applied": [],
            "flag_for_hitl": False,
            "hitl_reason": "",
            "timestamp": "2024-01-01T00:00:00Z",
        })

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
