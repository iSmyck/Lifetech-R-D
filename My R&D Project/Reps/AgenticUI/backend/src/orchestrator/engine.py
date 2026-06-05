"""Workflow execution engine with parallel agent support."""

import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Callable

from backend.src.agents import ContentAgent, GovernanceAgent, LocalizationAgent, PerformanceAgent, ValidationAgent
from backend.src.core.exceptions import OrchestratorError
from backend.src.models.schemas import AgentCompleteEvent, AgentStepEvent, FinalResponseEvent, ValidationEvent


class OrchestratorEngine:
    """Engine that wires multiple agents together and executes workflows."""

    def __init__(self) -> None:
        """Initialize the orchestrator with agent registry."""
        self.agents: dict[str, Any] = {
            "localization": LocalizationAgent(),
            "governance": GovernanceAgent(),
            "performance": PerformanceAgent(),
            "content_generation": ContentAgent(),
            "validation": ValidationAgent(),
        }

    async def run_pipeline(
        self,
        query_input: dict[str, Any],
        stream: bool = False,
    ) -> dict[str, Any] | AsyncGenerator[str, None]:
        """Execute the full multi-agent pipeline.

        Args:
            query_input: The user's query input dict.
            stream: If True, yield SSE events instead of returning a dict.

        Returns:
            Final response dict, or async generator of SSE events.
        """
        if stream:
            return self._run_pipeline_streamed(query_input)
        return await self._run_pipeline_sync(query_input)

    async def _run_pipeline_sync(self, query_input: dict[str, Any]) -> dict[str, Any]:
        """Synchronous (blocking) pipeline execution."""
        start_time = time.time()
        query_id = query_input.get("query_id") or str(uuid.uuid4())
        user_query = query_input["user_query"]

        # Step 1: Intent classification (simple keyword-based for pilot)
        intent = self._classify_intent(user_query)

        # Step 2: Determine which agents to run
        agents_to_run = self._route_agents(intent, user_query)

        # Step 3: Execute agents (parallel where possible)
        agent_outputs: dict[str, Any] = {}
        executed_agents: list[dict[str, str]] = []

        # Phase 1: Run independent agents in parallel
        independent = [a for a in agents_to_run if a in ("localization", "governance", "performance")]
        if independent:
            tasks = []
            for agent_name in independent:
                agent = self.agents[agent_name]
                agent_input = {
                    "query_id": query_id,
                    "user_query": user_query,
                    **query_input.get("additional_parameters", {}),
                }
                tasks.append(self._run_agent_with_error_handling(agent, agent_name, agent_input))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for agent_name, result in zip(independent, results):
                if isinstance(result, Exception):
                    executed_agents.append({
                        "agent_name": agent_name,
                        "status": "failed",
                        "output_summary": str(result),
                    })
                else:
                    agent_outputs[agent_name] = result
                    executed_agents.append({
                        "agent_name": agent_name,
                        "status": "completed",
                        "output_summary": self._summarize_output(agent_name, result),
                    })

        # Phase 2: Run content generation (depends on localization insights)
        if "content_generation" in agents_to_run:
            content_input = {
                "query_id": query_id,
                "user_query": user_query,
                "localized_insights": agent_outputs.get("localization", {}),
                "content_brief": self._extract_content_brief(query_input),
            }
            try:
                content_result = await self.agents["content_generation"].run(content_input)
                agent_outputs["content"] = content_result
                executed_agents.append({
                    "agent_name": "content_generation",
                    "status": "completed",
                    "output_summary": self._summarize_output("content", content_result),
                })
            except Exception as e:
                executed_agents.append({
                    "agent_name": "content_generation",
                    "status": "failed",
                    "output_summary": str(e),
                })

        # Step 4: Validation
        validation_input = {
            "query_id": query_id,
            "agent_outputs": agent_outputs,
        }
        validation_result = await self.agents["validation"].run(validation_input)

        # Step 5: Synthesize final response
        final_response = self._synthesize_response(user_query, agent_outputs, validation_result)

        processing_time = int((time.time() - start_time) * 1000)

        return {
            "query_id": query_id,
            "status": "pending_review" if validation_result.get("flag_for_hitl") else "completed",
            "final_response": final_response,
            "response_summary": self._summarize_final(final_response),
            "executed_agents": executed_agents,
            "review_status": validation_result.get("validation_status", "N/A"),
            "processing_time_ms": processing_time,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent_outputs": agent_outputs,
            "validation_result": validation_result,
        }

    async def _run_pipeline_streamed(
        self,
        query_input: dict[str, Any],
    ) -> AsyncGenerator[str, None]:
        """Streamed pipeline execution yielding SSE events."""
        import json

        start_time = time.time()
        query_id = query_input.get("query_id") or str(uuid.uuid4())
        user_query = query_input["user_query"]

        yield f"event: start\ndata: {json.dumps({'query_id': query_id})}\n\n"

        intent = self._classify_intent(user_query)
        agents_to_run = self._route_agents(intent, user_query)

        agent_outputs: dict[str, Any] = {}
        executed_agents: list[dict[str, str]] = []

        # Phase 1: Independent agents
        independent = [a for a in agents_to_run if a in ("localization", "governance", "performance")]
        for agent_name in independent:
            yield self._sse_event(AgentStepEvent(
                agent_name=agent_name,
                step_label="Starting analysis",
                status="running",
                timestamp=datetime.now(timezone.utc).isoformat(),
            ))

            agent = self.agents[agent_name]
            agent_input = {
                "query_id": query_id,
                "user_query": user_query,
                **query_input.get("additional_parameters", {}),
            }
            try:
                result = await agent.run(agent_input)
                agent_outputs[agent_name] = result
                executed_agents.append({
                    "agent_name": agent_name,
                    "status": "completed",
                    "output_summary": self._summarize_output(agent_name, result),
                })
                yield self._sse_event(AgentCompleteEvent(
                    agent_name=agent_name,
                    output_summary=self._summarize_output(agent_name, result),
                    timestamp=datetime.now(timezone.utc).isoformat(),
                ))
            except Exception as e:
                executed_agents.append({
                    "agent_name": agent_name,
                    "status": "failed",
                    "output_summary": str(e),
                })

        # Phase 2: Content generation
        if "content_generation" in agents_to_run:
            yield self._sse_event(AgentStepEvent(
                agent_name="content_generation",
                step_label="Generating content with cultural insights",
                status="running",
                timestamp=datetime.now(timezone.utc).isoformat(),
            ))
            content_input = {
                "query_id": query_id,
                "user_query": user_query,
                "localized_insights": agent_outputs.get("localization", {}),
                "content_brief": self._extract_content_brief(query_input),
            }
            try:
                result = await self.agents["content_generation"].run(content_input)
                agent_outputs["content"] = result
                executed_agents.append({
                    "agent_name": "content_generation",
                    "status": "completed",
                    "output_summary": self._summarize_output("content", result),
                })
                yield self._sse_event(AgentCompleteEvent(
                    agent_name="content_generation",
                    output_summary=self._summarize_output("content", result),
                    timestamp=datetime.now(timezone.utc).isoformat(),
                ))
            except Exception as e:
                executed_agents.append({
                    "agent_name": "content_generation",
                    "status": "failed",
                    "output_summary": str(e),
                })

        # Validation
        yield self._sse_event(AgentStepEvent(
            agent_name="validation",
            step_label="Running cross-agent validation",
            status="running",
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))
        validation_result = await self.agents["validation"].run({
            "query_id": query_id,
            "agent_outputs": agent_outputs,
        })
        yield self._sse_event(ValidationEvent(
            validation_status=validation_result.get("validation_status", "unknown"),
            flag_for_hitl=validation_result.get("flag_for_hitl", False),
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))

        # Final response
        final_response = self._synthesize_response(user_query, agent_outputs, validation_result)
        processing_time = int((time.time() - start_time) * 1000)

        yield self._sse_event(FinalResponseEvent(
            query_id=query_id,
            final_response=final_response,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))

        # Final complete event with full payload
        complete_payload = {
            "query_id": query_id,
            "status": "pending_review" if validation_result.get("flag_for_hitl") else "completed",
            "executed_agents": executed_agents,
            "review_status": validation_result.get("validation_status", "N/A"),
            "processing_time_ms": processing_time,
        }
        yield f"event: complete\ndata: {json.dumps(complete_payload)}\n\n"

    async def _run_agent_with_error_handling(
        self,
        agent: Any,
        agent_name: str,
        agent_input: dict[str, Any],
    ) -> dict[str, Any]:
        """Run an agent with error handling."""
        try:
            return await agent.run(agent_input)
        except Exception as e:
            raise OrchestratorError(f"Agent {agent_name} failed: {e}") from e

    @staticmethod
    def _classify_intent(user_query: str) -> str:
        """Simple keyword-based intent classification."""
        query_lower = user_query.lower()
        if any(w in query_lower for w in ["compliance", "legal", "regulation", "approve", "check"]):
            return "compliance"
        if any(w in query_lower for w in ["localize", "cultural", "market", "nigeria", "kenya", "ghana", "south africa"]):
            return "localization"
        if any(w in query_lower for w in ["media", "budget", "cpm", "platform", "tiktok", "instagram", "facebook", "ads"]):
            return "performance"
        if any(w in query_lower for w in ["content", "copy", "caption", "hook", "write", "create", "generate"]):
            return "content_generation"
        return "multi_intent"

    @staticmethod
    def _route_agents(intent: str, user_query: str) -> list[str]:
        """Determine which agents to run based on intent."""
        routing = {
            "localization": ["localization", "content_generation", "validation"],
            "compliance": ["governance", "validation"],
            "performance": ["performance", "validation"],
            "content_generation": ["localization", "content_generation", "governance", "validation"],
            "multi_intent": ["localization", "governance", "performance", "content_generation", "validation"],
        }
        return routing.get(intent, routing["multi_intent"])

    @staticmethod
    def _extract_content_brief(query_input: dict[str, Any]) -> dict[str, Any]:
        """Extract content brief from query input."""
        params = query_input.get("additional_parameters", {})
        return {
            "marketing_objective": params.get("marketing_objective", "brand awareness"),
            "product_service": params.get("product_service", ""),
            "key_messages": params.get("key_messages", []),
            "target_audience_description": params.get("target_audience_description", ""),
            "tone_of_voice": params.get("tone_of_voice", "professional"),
            "call_to_action_desired": params.get("call_to_action_desired", "Learn More"),
            "output_type": params.get("output_type", "ad_copy"),
            "character_limit": params.get("character_limit", 300),
            "platform": params.get("platform", "Instagram"),
        }

    @staticmethod
    def _summarize_output(agent_name: str, output: dict[str, Any]) -> str:
        """Create a brief summary of agent output."""
        if agent_name == "localization":
            return f"Cultural analysis: {output.get('localization_report', {}).get('cultural_codes_applied', [])}"
        if agent_name == "governance":
            status = output.get("compliance_report", {}).get("overall_status", "unknown")
            return f"Compliance status: {status}"
        if agent_name == "performance":
            channels = output.get("media_strategy", {}).get("recommended_channels", [])
            return f"Recommended channels: {len(channels)}"
        if agent_name == "content":
            variants = output.get("generated_content", {}).get("variants", [])
            return f"Generated {len(variants)} content variants"
        return "Analysis completed"

    @staticmethod
    def _synthesize_response(
        user_query: str,
        agent_outputs: dict[str, Any],
        validation_result: dict[str, Any],
    ) -> str:
        """Synthesize a human-readable final response from agent outputs."""
        parts = []
        parts.append(f"## Response to: {user_query[:100]}\n")

        if "content" in agent_outputs:
            content = agent_outputs["content"].get("generated_content", {})
            primary = content.get("primary_language_content", {})
            if primary.get("headline"):
                parts.append(f"### Generated Content\n")
                parts.append(f"**Headline:** {primary['headline']}\n")
                parts.append(f"**Body:** {primary.get('body', '')[:300]}...\n")
                parts.append(f"**CTA:** {primary.get('call_to_action', '')}\n")

        if "localization" in agent_outputs:
            report = agent_outputs["localization"].get("localization_report", {})
            if report.get("cultural_codes_applied"):
                parts.append(f"\n### Cultural Analysis\n")
                parts.append(f"Codes applied: {', '.join(report['cultural_codes_applied'])}\n")
                parts.append(f"Generational lens: {report.get('generational_lens', 'N/A')}\n")

        if "performance" in agent_outputs:
            strategy = agent_outputs["performance"].get("media_strategy", {})
            channels = strategy.get("recommended_channels", [])
            if channels:
                parts.append(f"\n### Media Strategy\n")
                for ch in channels[:3]:
                    parts.append(f"- **{ch.get('platform', '')}**: {ch.get('rationale', '')}\n")

        if "governance" in agent_outputs:
            report = agent_outputs["governance"].get("compliance_report", {})
            if report.get("overall_status"):
                parts.append(f"\n### Compliance\n")
                parts.append(f"Status: **{report['overall_status']}**\n")

        parts.append(f"\n### Validation\n")
        parts.append(f"Status: **{validation_result.get('validation_status', 'unknown')}**\n")
        if validation_result.get("flag_for_hitl"):
            parts.append(f"⚠️ Flagged for human review: {validation_result.get('hitl_reason', '')}\n")

        return "\n".join(parts)

    @staticmethod
    def _summarize_final(final_response: str) -> str:
        """Create a brief summary of the final response."""
        return final_response[:200] + "..." if len(final_response) > 200 else final_response

    @staticmethod
    def _sse_event(event_model: Any) -> str:
        """Convert a Pydantic model to SSE format."""
        import json
        return f"event: {event_model.event}\ndata: {event_model.model_dump_json()}\n\n"
