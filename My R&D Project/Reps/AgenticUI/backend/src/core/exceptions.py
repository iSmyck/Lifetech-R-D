"""Custom exceptions for the agentic platform."""


class AgenticPlatformError(Exception):
    """Base exception for all platform errors."""
    pass


class AgentError(AgenticPlatformError):
    """Raised when an agent fails to execute."""
    pass


class OrchestratorError(AgenticPlatformError):
    """Raised when the workflow engine encounters an error."""
    pass


class LLMClientError(AgenticPlatformError):
    """Raised when the LLM client request fails."""
    pass
