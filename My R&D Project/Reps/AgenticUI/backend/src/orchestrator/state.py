"""Shared state schema and manager for orchestration."""

from pydantic import BaseModel


class SharedState(BaseModel):
    """Schema for state shared between agents during workflow execution."""

    # TODO: Define common fields (e.g., messages, context, metadata)
    pass


class StateManager:
    """Manages persistence and transitions of shared state."""

    def __init__(self, initial_state: SharedState | None = None) -> None:
        """Initialize the state manager.

        Args:
            initial_state: Optional starting state.
        """
        self._state = initial_state or SharedState()

    def get_state(self) -> SharedState:
        """Return the current shared state."""
        return self._state

    def update_state(self, update: SharedState) -> None:
        """Merge updates into the current shared state."""
        # TODO: Implement safe merge logic
        pass
