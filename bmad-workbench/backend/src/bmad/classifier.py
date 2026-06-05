"""Intent classification for BMAD agent/skill routing."""

import json
import logging
import re
from typing import Optional, Dict, Any

from src.bmad.models import AgentDefinition, SkillTemplate
from src.bmad.registry import BmadRegistry
from src.bmad.prompts import (
    CLASSIFICATION_SYSTEM_PROMPT,
    build_classification_prompt,
)
from src.services.llm_client import LLMClient

logger = logging.getLogger(__name__)

# Default fallback agent/skill for MVP
DEFAULT_AGENT_ID = "bmad-agent-pm"
DEFAULT_SKILL_ID = "bmad-prd"

# Simple keyword mappings for fast-path deterministic classification
# Maps regex patterns -> (agent_id, skill_id, confidence_boost)
KEYWORD_MAPPINGS = [
    (r"\b(prd|product.requirement|requirement.doc|spec|product.spec)\b", "bmad-agent-pm", "bmad-prd", 0.15),
    (r"\b(architect|architecture|solution.design|tech.design)\b", "bmad-agent-architect", "bmad-create-architecture", 0.15),
    (r"\b(ux|user.experience|design.system|wireframe|mockup)\b", "bmad-agent-ux-designer", "bmad-ux", 0.15),
    (r"\b(test|testing|qa|automation|playwright|cypress)\b", "bmad-tea", "bmad-testarch-framework", 0.15),
    (r"\b(story|epic|user.story|sprint)\b", "bmad-agent-pm", "bmad-create-epics-and-stories", 0.15),
    (r"\b(code|implement|build|develop|refactor|bug.fix)\b", "bmad-agent-dev", "bmad-quick-dev", 0.15),
]


class ClassificationResult:
    """Result of intent classification."""

    def __init__(
        self,
        agent_id: str,
        skill_id: str,
        confidence: float,
        reasoning: str,
    ):
        self.agent_id = agent_id
        self.skill_id = skill_id
        self.confidence = confidence
        self.reasoning = reasoning

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "skill_id": self.skill_id,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
        }


class IntentClassifier:
    """Classify user intent to select BMAD agent and skill.

    Uses LLM when available, falls back to keyword heuristics.
    """

    def __init__(self, registry: BmadRegistry):
        self.registry = registry

    async def classify(
        self,
        user_intent: str,
        llm_client: Optional[LLMClient] = None,
    ) -> ClassificationResult:
        """Classify user intent and return agent/skill recommendation."""
        if not user_intent or not user_intent.strip():
            logger.info("Empty intent, using default fallback")
            return self._fallback("No intent provided")

        # Try LLM classification if client is available
        if llm_client is not None:
            try:
                result = await self._classify_with_llm(user_intent, llm_client)
                if result is not None:
                    # Validate against registry
                    agent = self.registry.get_agent(result.agent_id)
                    skill = self.registry.get_skill(result.skill_id)
                    if agent and skill:
                        return result
                    logger.warning(
                        "LLM classified unknown agent=%s skill=%s, falling back",
                        result.agent_id, result.skill_id,
                    )
            except Exception as exc:
                logger.warning("LLM classification failed: %s. Using keyword fallback.", exc)

        # Fallback to keyword classification
        return self._keyword_classify(user_intent)

    async def _classify_with_llm(
        self,
        user_intent: str,
        llm_client: LLMClient,
    ) -> Optional[ClassificationResult]:
        """Use LLM to classify intent into agent + skill."""
        prompt = build_classification_prompt(
            user_intent=user_intent,
            agents=self.registry.list_agents(),
            skills=self.registry.list_skills(),
        )

        messages = [
            {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        response_text = await llm_client.chat_completion(
            messages=messages,
            temperature=0.2,
            max_tokens=256,
        )

        # Extract JSON from response
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if not json_match:
            logger.warning("LLM response did not contain JSON: %s", response_text)
            return None

        try:
            data = json.loads(json_match.group())
            return ClassificationResult(
                agent_id=data.get("agent_id", DEFAULT_AGENT_ID),
                skill_id=data.get("skill_id", DEFAULT_SKILL_ID),
                confidence=float(data.get("confidence", 0.5)),
                reasoning=data.get("reasoning", "LLM classification"),
            )
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            logger.warning("Failed to parse LLM classification JSON: %s", exc)
            return None

    def _keyword_classify(self, user_intent: str) -> ClassificationResult:
        """Keyword-based classification with confidence scoring."""
        intent_lower = user_intent.lower()
        best_agent = DEFAULT_AGENT_ID
        best_skill = DEFAULT_SKILL_ID
        best_score = 0.5  # base confidence
        reasoning = "Default routing based on general product intent"

        for pattern, agent_id, skill_id, boost in KEYWORD_MAPPINGS:
            if re.search(pattern, intent_lower):
                best_agent = agent_id
                best_skill = skill_id
                best_score = min(0.85 + boost, 0.98)
                reasoning = f"Matched keyword pattern '{pattern}' in intent"
                break

        # If no keyword match, check for PRD-related terms more broadly
        if best_score < 0.6:
            prd_terms = ["draft", "create", "write", "document", "plan", "design doc"]
            if any(term in intent_lower for term in prd_terms):
                best_score = 0.72
                reasoning = "General document creation intent, defaulting to PRD skill"

        return ClassificationResult(
            agent_id=best_agent,
            skill_id=best_skill,
            confidence=round(best_score, 2),
            reasoning=reasoning,
        )

    def _fallback(self, reasoning: str) -> ClassificationResult:
        return ClassificationResult(
            agent_id=DEFAULT_AGENT_ID,
            skill_id=DEFAULT_SKILL_ID,
            confidence=0.5,
            reasoning=reasoning,
        )
