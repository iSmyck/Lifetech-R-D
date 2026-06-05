import asyncio
import json
import time
from typing import Dict, List, Optional
from uuid import uuid4


class StreamEvent:
    def __init__(self, event_type: str, data: dict):
        self.id = str(uuid4())
        self.event_type = event_type
        self.data = data
        self.timestamp = time.time()

    def to_sse(self) -> str:
        lines = [
            f"id: {self.id}",
            f"event: {self.event_type}",
            f"data: {json.dumps(self.data)}",
            "",
        ]
        return "\n".join(lines)


class ThreadStreamManager:
    """In-memory pub/sub for thread SSE streams.

    Uses asyncio.Queue per subscriber. In production this should be
    replaced with Redis pub/sub for multi-worker broadcasting.
    """

    def __init__(self):
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        self._history: Dict[str, List[StreamEvent]] = {}
        self._max_history = 1000
        self._checkpoint_events: Dict[str, asyncio.Event] = {}
        self._checkpoint_data: Dict[str, dict] = {}

    def subscribe(self, thread_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.setdefault(thread_id, []).append(queue)
        return queue

    def unsubscribe(self, thread_id: str, queue: asyncio.Queue) -> None:
        queues = self._subscribers.get(thread_id, [])
        if queue in queues:
            queues.remove(queue)
        if not queues:
            self._subscribers.pop(thread_id, None)

    async def publish(self, thread_id: str, event_type: str, data: dict) -> None:
        event = StreamEvent(event_type, data)
        history = self._history.setdefault(thread_id, [])
        history.append(event)
        if len(history) > self._max_history:
            history.pop(0)

        queues = self._subscribers.get(thread_id, [])
        for queue in queues:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                pass

    def get_history_since(self, thread_id: str, last_event_id: Optional[str]) -> List[StreamEvent]:
        history = self._history.get(thread_id, [])
        if not last_event_id:
            # For fresh connections, return the last 50 events so the client
            # has immediate context.
            return history[-50:]
        for i, event in enumerate(history):
            if event.id == last_event_id:
                return history[i + 1 :]
        return []

    # --- Checkpoint management ---

    def create_checkpoint(self, thread_id: str, checkpoint_data: dict) -> str:
        checkpoint_id = str(uuid4())
        event = asyncio.Event()
        self._checkpoint_events[checkpoint_id] = event
        self._checkpoint_data[checkpoint_id] = {
            **checkpoint_data,
            "checkpoint_id": checkpoint_id,
            "thread_id": thread_id,
        }
        return checkpoint_id

    async def wait_for_checkpoint(self, checkpoint_id: str, timeout: Optional[float] = None) -> bool:
        event = self._checkpoint_events.get(checkpoint_id)
        if not event:
            return False
        try:
            await asyncio.wait_for(event.wait(), timeout=timeout)
            return True
        except asyncio.TimeoutError:
            return False

    def resolve_checkpoint(self, checkpoint_id: str, response: str) -> Optional[dict]:
        event = self._checkpoint_events.get(checkpoint_id)
        if not event:
            return None
        data = self._checkpoint_data.get(checkpoint_id, {})
        data["response"] = response
        event.set()
        return data

    def get_checkpoint(self, checkpoint_id: str) -> Optional[dict]:
        return self._checkpoint_data.get(checkpoint_id)

    def cleanup_checkpoint(self, checkpoint_id: str) -> None:
        self._checkpoint_events.pop(checkpoint_id, None)
        self._checkpoint_data.pop(checkpoint_id, None)


# Global singleton — inject via dependency in larger apps
stream_manager = ThreadStreamManager()


async def mock_ai_stream(thread_id: str, user_intent: str, attachment_ids: Optional[List[str]] = None) -> None:
    """Simulate an AI agent producing stream events with a clarification checkpoint."""
    # Phase 1: Initial reasoning
    await stream_manager.publish(
        thread_id,
        "reasoning_token",
        {"text": "Analyzing intent and cross-referencing requirements…"},
    )
    await asyncio.sleep(0.3)

    await stream_manager.publish(
        thread_id,
        "reasoning_token",
        {"text": "Checking project context and existing documents…"},
    )
    await asyncio.sleep(0.3)

    if attachment_ids:
        await stream_manager.publish(
            thread_id,
            "reasoning_token",
            {"text": f"Referencing {len(attachment_ids)} attachment(s)…"},
        )
        await asyncio.sleep(0.3)

    # Phase 2: Clarification checkpoint
    checkpoint_id = stream_manager.create_checkpoint(
        thread_id,
        {
            "type": "clarification",
            "message": "Awaiting human input",
            "question": "Should I include API specification section in the draft?",
            "options": ["Yes, include it", "No, skip it", "Let me clarify…"],
        },
    )

    await stream_manager.publish(
        thread_id,
        "checkpoint_pause",
        {
            "checkpoint_id": checkpoint_id,
            "type": "clarification",
            "message": "Awaiting human input",
            "question": "Should I include API specification section in the draft?",
            "options": ["Yes, include it", "No, skip it", "Let me clarify…"],
        },
    )

    # Wait for human response
    await stream_manager.wait_for_checkpoint(checkpoint_id, timeout=None)

    # Phase 3: Resume reasoning after response
    await stream_manager.publish(
        thread_id,
        "reasoning_token",
        {"text": "Resuming analysis with your input…"},
    )
    await asyncio.sleep(0.3)

    await stream_manager.publish(
        thread_id,
        "reasoning_token",
        {"text": "Synthesizing final draft…"},
    )
    await asyncio.sleep(0.3)

    # Phase 4: Draft complete
    await stream_manager.publish(
        thread_id,
        "draft_complete",
        {"text": f"# Draft based on: {user_intent}\n\nThis is a generated draft document."},
    )

    stream_manager.cleanup_checkpoint(checkpoint_id)
