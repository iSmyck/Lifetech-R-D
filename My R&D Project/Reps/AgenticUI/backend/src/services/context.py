"""Context assembly service with token budgeting and skill loading."""

from pathlib import Path
from typing import Any

from backend.src.core.config import settings


class ContextAssembler:
    """Assembles context for agents based on budget and priority rules."""

    # Default budget from config/context-management.json
    DEFAULT_BUDGET = {
        "system_prompt": 2000,
        "skills": 1500,
        "user_input": 1000,
        "rag_context": 0,
        "conversation_history": 500,
        "output_reservation": 2000,
    }

    CONTEXT_PRIORITY = [
        "system_prompt",
        "user_input",
        "skills",
        "conversation_history",
        "rag_context",
    ]

    SKILL_MAPPING = {
        "localization": ["cultural-analysis"],
        "compliance": ["compliance-screening"],
        "performance": ["media-optimization"],
        "content_generation": ["content-creation"],
        "validation": ["quality-validation"],
        "multi_intent": ["cultural-analysis", "compliance-screening", "content-creation"],
    }

    def __init__(self, skills_dir: Path | None = None) -> None:
        """Initialize the context assembler.

        Args:
            skills_dir: Directory containing skill markdown files.
        """
        self.skills_dir = skills_dir or Path("egm-ai-pilot/skills")
        self._skill_cache: dict[str, str] = {}

    def assemble(
        self,
        system_prompt: str,
        user_query: str,
        task_type: str,
        session_history: list[dict[str, Any]] | None = None,
        additional_context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Assemble context respecting token budget.

        Args:
            system_prompt: The agent's system prompt.
            user_query: The user's raw query.
            task_type: Classified intent / task type.
            session_history: Previous conversation turns.
            additional_context: Any extra context fields.

        Returns:
            Assembled context dict with budget metadata.
        """
        budget = self.DEFAULT_BUDGET.copy()
        total_budget = sum(budget.values())

        # 1. Always include system prompt (non-negotiable)
        assembled = {
            "system_prompt": system_prompt,
            "user_input": user_query,
            "skills": [],
            "session_history": [],
            "rag_context": "",
        }

        # 2. Attach relevant skills based on task type
        skill_names = self.SKILL_MAPPING.get(task_type, [])
        for skill_name in skill_names:
            skill_content = self._load_skill(skill_name)
            if skill_content:
                assembled["skills"].append({"name": skill_name, "content": skill_content})

        # 3. Include session history (compressed if needed)
        if session_history:
            if len(session_history) > 3:
                assembled["session_history"] = self._summarize_history(session_history)
            else:
                assembled["session_history"] = session_history

        # 4. Merge additional context
        if additional_context:
            assembled.update(additional_context)

        # 5. Estimate tokens (rough heuristic: 1 token ~= 4 chars for English)
        prompt_text = self._format_prompt(assembled)
        token_estimate = len(prompt_text) // 4

        return {
            "prompt": prompt_text,
            "structured_context": assembled,
            "token_estimate": token_estimate,
            "total_budget": total_budget,
            "budget_breakdown": budget,
        }

    def _load_skill(self, skill_name: str) -> str | None:
        """Load a skill markdown file from disk."""
        if skill_name in self._skill_cache:
            return self._skill_cache[skill_name]

        skill_path = self.skills_dir / f"{skill_name}.md"
        if not skill_path.exists():
            # Fallback: check in egm-ai-pilot relative to project root
            alt_path = Path("egm-ai-pilot/skills") / f"{skill_name}.md"
            if alt_path.exists():
                skill_path = alt_path
            else:
                return None

        content = skill_path.read_text(encoding="utf-8")
        self._skill_cache[skill_name] = content
        return content

    @staticmethod
    def _summarize_history(history: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Compress conversation history into summary form."""
        # Pilot: simple truncation to last 3 turns
        return history[-3:]

    @staticmethod
    def _format_context(context: dict[str, Any]) -> str:
        """Format structured context into a plain text prompt."""
        parts = []

        if context.get("system_prompt"):
            parts.append(f"SYSTEM PROMPT:\n{context['system_prompt']}\n")

        if context.get("skills"):
            parts.append("SKILLS:\n")
            for skill in context["skills"]:
                parts.append(f"--- {skill['name']} ---\n{skill['content'][:2000]}\n")

        if context.get("user_input"):
            parts.append(f"USER QUERY:\n{context['user_input']}\n")

        if context.get("session_history"):
            parts.append("SESSION HISTORY:\n")
            for turn in context["session_history"]:
                parts.append(f"- {turn}\n")

        if context.get("rag_context"):
            parts.append(f"RAG CONTEXT:\n{context['rag_context']}\n")

        return "\n".join(parts)

    def _format_prompt(self, assembled: dict[str, Any]) -> str:
        """Format assembled context into final prompt string."""
        return self._format_context(assembled)


# Singleton instance
context_assembler = ContextAssembler()
