"""BmadStreamService — replaces mock_ai_stream with real BMAD phase-gated execution."""

import asyncio
import logging
from typing import Optional, List

from src.services.stream_service import stream_manager
from src.bmad.registry import BmadRegistry, get_registry
from src.bmad.orchestrator import SkillOrchestrator, WorkflowState, StreamEvent
from src.bmad.artifacts import ArtifactRenderer
from src.services.llm_client import LLMClient

logger = logging.getLogger(__name__)


class BmadStreamService:
    """Service that executes BMAD skills and publishes stream events."""

    def __init__(
        self,
        registry: Optional[BmadRegistry] = None,
        llm_client: Optional[LLMClient] = None,
    ):
        self.registry = registry or get_registry()
        self.llm_client = llm_client

    async def execute(
        self,
        thread_id: str,
        user_intent: str,
        agent_id: str,
        skill_id: str,
        bmad_state: Optional[dict] = None,
        attachment_ids: Optional[List[str]] = None,
    ) -> None:
        """Execute a BMAD skill workflow and publish events to the stream."""
        try:
            state = WorkflowState(**bmad_state) if bmad_state else WorkflowState(skill_id=skill_id)
            orchestrator = SkillOrchestrator(
                registry=self.registry,
                skill_id=skill_id,
                agent_id=agent_id,
                thread_id=thread_id,
                user_intent=user_intent,
                state=state,
                llm_client=self.llm_client,
            )

            async for event in orchestrator.run_from_state():
                await self._publish_event(thread_id, event)

                # If checkpoint, wait for resolution
                if event.event_type == StreamEvent.EVENT_CHECKPOINT:
                    checkpoint_id = await self._create_and_wait_checkpoint(
                        thread_id, event.data
                    )
                    # Store checkpoint id in state for response handling
                    orchestrator.state.checkpoint_state["checkpoint_id"] = checkpoint_id

                    # Wait for checkpoint to be resolved
                    await stream_manager.wait_for_checkpoint(checkpoint_id, timeout=None)

                    # Get the response
                    checkpoint_data = stream_manager.get_checkpoint(checkpoint_id)
                    response = checkpoint_data.get("response", "") if checkpoint_data else ""

                    # Inject response into orchestrator
                    await orchestrator.handle_checkpoint_response(response)

                    # Publish human input event
                    await stream_manager.publish(
                        thread_id,
                        "human_input",
                        {
                            "checkpoint_id": checkpoint_id,
                            "response": response,
                            "question": event.data.get("question", ""),
                        },
                    )

                    # Cleanup checkpoint
                    stream_manager.cleanup_checkpoint(checkpoint_id)

            # Build artifact if complete
            if orchestrator.state.is_complete:
                artifact = orchestrator.build_artifact()
                await stream_manager.publish(
                    thread_id,
                    "draft_complete",
                    {
                        "text": artifact,
                        "source_skill": skill_id,
                        "phase_generated": "draft",
                    },
                )

        except Exception as exc:
            logger.exception("BMAD stream execution failed for thread %s", thread_id)
            await stream_manager.publish(
                thread_id,
                "error",
                {"message": f"Workflow execution failed: {exc}"},
            )

    async def resume_from_checkpoint(
        self,
        thread_id: str,
        user_intent: str,
        agent_id: str,
        skill_id: str,
        bmad_state: dict,
    ) -> None:
        """Resume workflow from current state after checkpoint response."""
        await self.execute(
            thread_id=thread_id,
            user_intent=user_intent,
            agent_id=agent_id,
            skill_id=skill_id,
            bmad_state=bmad_state,
        )

    async def _publish_event(self, thread_id: str, event: StreamEvent) -> None:
        await stream_manager.publish(
            thread_id,
            event.event_type,
            event.data,
        )

    async def _create_and_wait_checkpoint(self, thread_id: str, data: dict) -> str:
        checkpoint_id = stream_manager.create_checkpoint(thread_id, data)
        return checkpoint_id


# Convenience function matching old mock_ai_stream signature for compatibility
async def bmad_stream(
    thread_id: str,
    user_intent: str,
    agent_id: str,
    skill_id: str,
    bmad_state: Optional[dict] = None,
    attachment_ids: Optional[List[str]] = None,
) -> None:
    """Drop-in replacement for mock_ai_stream."""
    service = BmadStreamService()
    await service.execute(
        thread_id=thread_id,
        user_intent=user_intent,
        agent_id=agent_id,
        skill_id=skill_id,
        bmad_state=bmad_state,
        attachment_ids=attachment_ids,
    )
