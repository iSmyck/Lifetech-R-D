"""BMAD Skill Orchestrator — phase-gated execution with state persistence."""

import asyncio
import logging
from typing import Dict, List, Optional, Any, AsyncGenerator

from pydantic import BaseModel, Field

from src.bmad.models import SkillTemplate, AgentDefinition
from src.bmad.registry import BmadRegistry
from src.services.llm_client import LLMClient

logger = logging.getLogger(__name__)

# Simplified PRD phases for MVP
PRD_PHASES = [
    "discovery",
    "planning",
    "drafting",
    "review",
]

# Phase display metadata
PHASE_META = {
    "discovery": {"label": "Discovery", "description": "Gathering requirements and context"},
    "planning": {"label": "Planning", "description": "Structuring the PRD outline"},
    "drafting": {"label": "Drafting", "description": "Writing the PRD content"},
    "review": {"label": "Review", "description": "Reviewing and finalizing"},
}

# System prompt guardrails for BMAD methodology
BMAD_SYSTEM_PROMPT = """You are a BMAD (Business-Model-Driven AI Development) agent.
Your role is to guide the user through structured skill execution phase by phase.
Rules:
- Ask clarifying questions at checkpoints
- Provide reasoning before asking
- Be concise but thorough
- Never commit artifacts without user approval
"""


class WorkflowState(BaseModel):
    """Persisted JSONB state for a thread's BMAD workflow."""

    skill_id: str
    current_phase: str = "init"
    phases_completed: List[str] = Field(default_factory=list)
    checkpoint_state: Dict[str, Any] = Field(default_factory=dict)
    artifact_accumulator: str = ""
    classification: Optional[Dict[str, Any]] = None
    agent_switch: Optional[Dict[str, Any]] = None

    def mark_phase_complete(self, phase: str) -> None:
        if phase not in self.phases_completed:
            self.phases_completed.append(phase)

    def advance_to_phase(self, phase: str) -> None:
        if self.current_phase != "init" and self.current_phase not in self.phases_completed:
            self.mark_phase_complete(self.current_phase)
        self.current_phase = phase

    @property
    def is_complete(self) -> bool:
        return self.current_phase == "complete"


class StreamEvent:
    """Typed event yielded by the orchestrator stream."""

    EVENT_THINKING = "reasoning_token"
    EVENT_CHECKPOINT = "checkpoint_pause"
    EVENT_ARTIFACT = "draft_complete"
    EVENT_PHASE_START = "phase_start"
    EVENT_PHASE_END = "phase_end"

    def __init__(self, event_type: str, data: dict):
        self.event_type = event_type
        self.data = data


class SkillOrchestrator:
    """Executes a BMAD skill phase-by-phase with checkpoint management.

    MVP: Uses LLM when available, falls back to simulated content.
    """

    def __init__(
        self,
        registry: BmadRegistry,
        skill_id: str,
        agent_id: str,
        thread_id: str,
        user_intent: str,
        state: Optional[WorkflowState] = None,
        llm_client: Optional[LLMClient] = None,
    ):
        self.registry = registry
        self.skill_id = skill_id
        self.agent_id = agent_id
        self.thread_id = thread_id
        self.user_intent = user_intent
        self.state = state or WorkflowState(skill_id=skill_id)
        self.llm_client = llm_client

        self.skill = registry.get_skill(skill_id)
        self.agent = registry.get_agent(agent_id)

    @property
    def current_phase_index(self) -> int:
        try:
            return PRD_PHASES.index(self.state.current_phase)
        except ValueError:
            return -1

    @property
    def phases(self) -> List[str]:
        """Return phase list for the current skill."""
        if self.skill and self.skill.phases:
            return self.skill.phases
        return PRD_PHASES

    async def run_from_state(self) -> AsyncGenerator[StreamEvent, None]:
        """Resume or start workflow based on current state."""
        if self.state.is_complete:
            yield StreamEvent(StreamEvent.EVENT_ARTIFACT, {
                "text": self.state.artifact_accumulator or "Workflow already complete.",
                "phase": "complete",
            })
            return

        # If init, start first phase
        if self.state.current_phase == "init":
            self.state.advance_to_phase(self.phases[0])

        # Execute from current phase
        phase_idx = self.current_phase_index
        if phase_idx < 0:
            phase_idx = 0
            self.state.advance_to_phase(self.phases[0])

        while phase_idx < len(self.phases):
            phase = self.phases[phase_idx]
            async for event in self._execute_phase(phase):
                yield event

            # Check if we should advance
            if self.state.current_phase == phase:
                self.state.mark_phase_complete(phase)
                phase_idx += 1
                if phase_idx < len(self.phases):
                    self.state.advance_to_phase(self.phases[phase_idx])
                else:
                    self.state.current_phase = "complete"
            else:
                # State was changed externally (e.g., checkpoint response)
                phase_idx = self.current_phase_index
                if phase_idx < 0:
                    break

        # Final artifact
        if self.state.is_complete and self.state.artifact_accumulator:
            yield StreamEvent(StreamEvent.EVENT_ARTIFACT, {
                "text": self.state.artifact_accumulator,
                "phase": "complete",
            })

    async def handle_checkpoint_response(self, response: str) -> None:
        """Inject user response and advance state."""
        checkpoint_id = self.state.checkpoint_state.get("checkpoint_id")
        self.state.checkpoint_state = {
            "checkpoint_id": checkpoint_id,
            "response": response,
            "resolved": True,
        }
        # Advance to next phase (or repeat if needed)
        phase_idx = self.current_phase_index
        if phase_idx >= 0 and phase_idx < len(self.phases):
            self.state.mark_phase_complete(self.phases[phase_idx])
            next_idx = phase_idx + 1
            if next_idx < len(self.phases):
                self.state.advance_to_phase(self.phases[next_idx])
            else:
                self.state.current_phase = "complete"

    async def _execute_phase(self, phase: str) -> AsyncGenerator[StreamEvent, None]:
        """Execute a single phase, yielding stream events."""
        meta = PHASE_META.get(phase, {"label": phase.capitalize(), "description": "Executing phase"})
        agent_name = self.agent.name if self.agent else "AI"

        yield StreamEvent(StreamEvent.EVENT_PHASE_START, {
            "phase": phase,
            "label": meta["label"],
            "description": meta["description"],
            "agent_name": agent_name,
        })

        # Phase reasoning — try LLM, fall back to simulation
        if self.llm_client is not None:
            async for event in self._execute_phase_with_llm(phase, agent_name):
                yield event
        else:
            reasoning_steps = self._get_phase_reasoning(phase, agent_name)
            for step in reasoning_steps:
                yield StreamEvent(StreamEvent.EVENT_THINKING, {
                    "text": step,
                    "phase": phase,
                    "agent_name": agent_name,
                })
                await asyncio.sleep(0.2)

        # Checkpoint for this phase
        checkpoint_data = self._get_phase_checkpoint(phase, agent_name)
        yield StreamEvent(StreamEvent.EVENT_CHECKPOINT, checkpoint_data)

        # Wait for checkpoint resolution (stream consumer handles this)
        yield StreamEvent(StreamEvent.EVENT_PHASE_END, {
            "phase": phase,
            "awaiting_checkpoint": True,
        })

    async def _execute_phase_with_llm(
        self,
        phase: str,
        agent_name: str,
    ) -> AsyncGenerator[StreamEvent, None]:
        """Execute phase reasoning via LLM, streaming tokens."""
        if self.llm_client is None:
            return

        messages = self._build_phase_messages(phase, agent_name)
        reasoning_text = ""

        try:
            async for chunk in self.llm_client.chat_completion_stream(
                messages=messages,
                temperature=0.7,
                max_tokens=512,
            ):
                reasoning_text += chunk
                # Yield every ~30 chars or on sentence boundaries to simulate steps
                if len(reasoning_text) >= 40 and (chunk.endswith(".") or chunk.endswith("…")):
                    yield StreamEvent(StreamEvent.EVENT_THINKING, {
                        "text": reasoning_text.strip(),
                        "phase": phase,
                        "agent_name": agent_name,
                    })
                    reasoning_text = ""
                    await asyncio.sleep(0.05)

            # Yield any remaining text
            if reasoning_text.strip():
                yield StreamEvent(StreamEvent.EVENT_THINKING, {
                    "text": reasoning_text.strip(),
                    "phase": phase,
                    "agent_name": agent_name,
                })
        except Exception as exc:
            logger.warning("LLM phase execution failed: %s. Using fallback.", exc)
            # Fallback to simulated reasoning
            for step in self._get_phase_reasoning(phase, agent_name):
                yield StreamEvent(StreamEvent.EVENT_THINKING, {
                    "text": step,
                    "phase": phase,
                    "agent_name": agent_name,
                })
                await asyncio.sleep(0.2)

    def _build_phase_messages(self, phase: str, agent_name: str) -> List[Dict[str, str]]:
        """Build prompt messages for the current phase."""
        intent = self.user_intent[:200]
        completed = ", ".join(self.state.phases_completed) or "none"
        checkpoint_history = ""
        if self.state.checkpoint_state.get("response"):
            checkpoint_history = (
                f"Previous checkpoint response: {self.state.checkpoint_state['response']}\n"
            )

        phase_prompts = {
            "discovery": (
                f"You are {agent_name}. The user wants: '{intent}'.\n"
                f"This is the DISCOVERY phase. Analyze the intent, identify stakeholders, "
                f"and summarize what you understand in 2-3 sentences. Be concise."
            ),
            "planning": (
                f"You are {agent_name}. The user wants: '{intent}'.\n"
                f"Discovery complete. This is the PLANNING phase. "
                f"Describe how you will structure the PRD outline. 2-3 sentences."
            ),
            "drafting": (
                f"You are {agent_name}. The user wants: '{intent}'.\n"
                f"Phases completed so far: {completed}.\n"
                f"{checkpoint_history}"
                f"This is the DRAFTING phase. Describe what sections you will write. 2-3 sentences."
            ),
            "review": (
                f"You are {agent_name}. The user wants: '{intent}'.\n"
                f"Phases completed: {completed}.\n"
                f"{checkpoint_history}"
                f"This is the REVIEW phase. Summarize what has been produced and what remains. 2-3 sentences."
            ),
        }

        user_content = phase_prompts.get(
            phase,
            f"You are {agent_name}. The user wants: '{intent}'. Processing phase: {phase}.",
        )

        return [
            {"role": "system", "content": BMAD_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

    def _get_phase_reasoning(self, phase: str, agent_name: str) -> List[str]:
        """Generate BMAD-style reasoning steps for the phase (fallback)."""
        intent_snippet = self.user_intent[:60] + "…" if len(self.user_intent) > 60 else self.user_intent

        steps_map = {
            "discovery": [
                f"{agent_name} is analyzing the intent: '{intent_snippet}'",
                f"{agent_name} is identifying stakeholders and constraints…",
                f"{agent_name} is calibrating stakes and scope…",
            ],
            "planning": [
                f"{agent_name} is structuring the PRD outline…",
                f"{agent_name} is selecting template sections based on concerns…",
                f"{agent_name} is defining feature groups and stable IDs…",
            ],
            "drafting": [
                f"{agent_name} is writing the PRD content…",
                f"{agent_name} is refining user journeys and requirements…",
                f"{agent_name} is adding cross-cutting NFRs…",
            ],
            "review": [
                f"{agent_name} is running the reviewer gate…",
                f"{agent_name} is triaging open items and assumptions…",
                f"{agent_name} is polishing and finalizing…",
            ],
        }
        return steps_map.get(phase, [f"{agent_name} is processing…"])

    def _get_phase_checkpoint(self, phase: str, agent_name: str) -> dict:
        """Generate a checkpoint question for the phase."""
        checkpoints = {
            "discovery": {
                "type": "clarification",
                "message": f"{agent_name} needs your input",
                "question": "What is the primary user problem this PRD should solve? Who are the key stakeholders?",
                "options": ["I'll describe the problem", "I have existing docs to share", "Let me think…"],
            },
            "planning": {
                "type": "clarification",
                "message": f"{agent_name} needs your input",
                "question": "Which working mode fits best? Fast path (batch questions then draft) or Coaching path (walk sections together)?",
                "options": ["Fast path", "Coaching path", "Not sure — recommend"],
            },
            "drafting": {
                "type": "clarification",
                "message": f"{agent_name} needs your input",
                "question": "Should I include API specification and technical constraints in the PRD, or keep it product-focused?",
                "options": ["Include API specs", "Product-focused only", "Add to addendum"],
            },
            "review": {
                "type": "validation",
                "message": f"{agent_name} has completed the draft",
                "question": "The PRD draft is ready. Would you like to review it now, run additional reviewer passes, or finalize?",
                "options": ["Review now", "Run reviewer pass", "Finalize"],
            },
        }
        return checkpoints.get(phase, {
            "type": "clarification",
            "message": f"{agent_name} needs your input",
            "question": "Please confirm to continue.",
            "options": ["Continue"],
        })

    def build_artifact(self) -> str:
        """Build the final PRD artifact from accumulated context."""
        agent_name = self.agent.name if self.agent else "AI"
        skill_name = self.skill.name if self.skill else "PRD"

        artifact = f"""# {skill_name}: {self.user_intent[:80]}

## Overview

This {skill_name} was generated through the BMAD methodology with {agent_name} guiding the process.

## User Intent

{self.user_intent}

## Phases Completed

{chr(10).join(f"- {PHASE_META.get(p, {}).get('label', p)}" for p in self.state.phases_completed)}

## Next Steps

- Review the draft and provide feedback
- Run additional reviewer passes if needed
- Approve to publish
"""
        self.state.artifact_accumulator = artifact
        return artifact
