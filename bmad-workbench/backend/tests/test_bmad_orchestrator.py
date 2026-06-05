import pytest
import asyncio

from src.bmad.orchestrator import WorkflowState, SkillOrchestrator, StreamEvent, PRD_PHASES
from src.bmad.registry import BmadRegistry
from src.services.stream_service import stream_manager
from src.services.bmad_stream import BmadStreamService


@pytest.mark.asyncio
async def test_workflow_state_phases():
    state = WorkflowState(skill_id="bmad-prd")
    assert state.current_phase == "init"
    assert not state.is_complete

    state.advance_to_phase("discovery")
    assert state.current_phase == "discovery"
    assert "discovery" not in state.phases_completed

    state.mark_phase_complete("discovery")
    assert "discovery" in state.phases_completed

    state.advance_to_phase("planning")
    assert state.current_phase == "planning"

    state.current_phase = "complete"
    assert state.is_complete


@pytest.mark.asyncio
async def test_orchestrator_init():
    registry = BmadRegistry()
    registry.load()
    orch = SkillOrchestrator(
        registry=registry,
        skill_id="bmad-prd",
        agent_id="bmad-agent-pm",
        thread_id="test-thread",
        user_intent="Draft a PRD",
    )
    assert orch.skill is not None
    assert orch.agent is not None
    assert orch.agent.name == "John"


@pytest.mark.asyncio
async def test_orchestrator_run_discovery_phase():
    registry = BmadRegistry()
    registry.load()
    orch = SkillOrchestrator(
        registry=registry,
        skill_id="bmad-prd",
        agent_id="bmad-agent-pm",
        thread_id="test-thread",
        user_intent="Draft a PRD for auth",
        state=WorkflowState(skill_id="bmad-prd", current_phase="discovery"),
    )

    events = []
    async for event in orch._execute_phase("discovery"):
        events.append(event)

    event_types = [e.event_type for e in events]
    assert StreamEvent.EVENT_PHASE_START in event_types
    assert StreamEvent.EVENT_THINKING in event_types
    assert StreamEvent.EVENT_CHECKPOINT in event_types
    assert StreamEvent.EVENT_PHASE_END in event_types

    # Check checkpoint has question
    checkpoint_event = next(e for e in events if e.event_type == StreamEvent.EVENT_CHECKPOINT)
    assert "question" in checkpoint_event.data
    assert "options" in checkpoint_event.data


@pytest.mark.asyncio
async def test_orchestrator_handle_checkpoint_response():
    registry = BmadRegistry()
    registry.load()
    state = WorkflowState(skill_id="bmad-prd", current_phase="discovery")
    orch = SkillOrchestrator(
        registry=registry,
        skill_id="bmad-prd",
        agent_id="bmad-agent-pm",
        thread_id="test-thread",
        user_intent="Draft a PRD",
        state=state,
    )

    await orch.handle_checkpoint_response("Test response")
    assert state.checkpoint_state["response"] == "Test response"
    assert state.checkpoint_state["resolved"] is True
    assert state.current_phase == "planning"


@pytest.mark.asyncio
async def test_orchestrator_build_artifact():
    registry = BmadRegistry()
    registry.load()
    state = WorkflowState(
        skill_id="bmad-prd",
        current_phase="complete",
        phases_completed=["discovery", "planning", "drafting", "review"],
    )
    orch = SkillOrchestrator(
        registry=registry,
        skill_id="bmad-prd",
        agent_id="bmad-agent-pm",
        thread_id="test-thread",
        user_intent="Draft a PRD for auth",
        state=state,
    )
    artifact = orch.build_artifact()
    assert "# bmad-prd: Draft a PRD for auth" in artifact
    assert "Discovery" in artifact
    assert "Planning" in artifact


@pytest.mark.asyncio
async def test_bmad_stream_service_execute():
    registry = BmadRegistry()
    registry.load()
    service = BmadStreamService(registry)

    # Clear any previous events
    stream_manager._history.clear()
    stream_manager._subscribers.clear()
    stream_manager._checkpoint_events.clear()
    stream_manager._checkpoint_data.clear()

    thread_id = "stream-test-thread"
    state = WorkflowState(skill_id="bmad-prd", current_phase="discovery")

    # Subscribe to catch events
    queue = stream_manager.subscribe(thread_id)

    # Auto-resolve checkpoints as they appear
    resolved_checkpoints = set()
    async def auto_resolve():
        while True:
            await asyncio.sleep(0.1)
            for cid, data in list(stream_manager._checkpoint_data.items()):
                if data.get("thread_id") == thread_id and cid not in resolved_checkpoints:
                    stream_manager.resolve_checkpoint(cid, "Continue")
                    resolved_checkpoints.add(cid)

    auto_resolve_task = asyncio.create_task(auto_resolve())

    # Run stream
    task = asyncio.create_task(
        service.execute(
            thread_id=thread_id,
            user_intent="Draft a PRD",
            agent_id="bmad-agent-pm",
            skill_id="bmad-prd",
            bmad_state=state.model_dump(),
        )
    )

    # Wait for completion
    await asyncio.wait_for(task, timeout=15.0)
    auto_resolve_task.cancel()
    try:
        await auto_resolve_task
    except asyncio.CancelledError:
        pass

    # Check events were published
    history = stream_manager._history.get(thread_id, [])
    event_types = [e.event_type for e in history]
    assert "reasoning_token" in event_types
    assert "checkpoint_pause" in event_types
    assert "human_input" in event_types
    assert len(resolved_checkpoints) >= 1

    stream_manager.unsubscribe(thread_id, queue)


@pytest.mark.asyncio
async def test_prd_phases_order():
    assert PRD_PHASES == ["discovery", "planning", "drafting", "review"]
