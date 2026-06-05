"""Classification prompt templates for BMAD intent routing."""

from typing import List

from src.bmad.models import AgentDefinition, SkillTemplate


CLASSIFICATION_SYSTEM_PROMPT = """You are an intent classifier for the BMAD AI-driven development methodology.
Your job is to analyze the user's intent and select the most appropriate BMAD agent and skill workflow.

Respond ONLY with a JSON object in this exact format:
{
  "agent_id": "string",
  "skill_id": "string",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}
"""


def build_classification_prompt(
    user_intent: str,
    agents: List[AgentDefinition],
    skills: List[SkillTemplate],
) -> str:
    """Build a classification prompt from registry inventory."""
    agent_lines = []
    for a in agents:
        agent_lines.append(
            f'- {a.id}: {a.name} ({a.title}) — {a.description[:120]}...'
        )

    skill_lines = []
    for s in skills:
        triggers = f" Triggers: {', '.join(s.intent_triggers)}" if s.intent_triggers else ""
        skill_lines.append(
            f'- {s.skill_id}: {s.name} — {s.description[:120]}...{triggers}'
        )

    return f"""Available agents:
{chr(10).join(agent_lines)}

Available skills:
{chr(10).join(skill_lines)}

User intent: """ + user_intent + """

Select the best agent and skill. Return ONLY JSON."""
