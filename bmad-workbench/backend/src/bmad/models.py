"""Pydantic models for BMAD Registry."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AgentDefinition(BaseModel):
    """A BMAD agent definition from config.toml."""

    id: str
    name: str
    title: str
    icon: str
    description: str
    module: str
    team: str
    default_skill: Optional[str] = None


class ModuleConfig(BaseModel):
    """A BMAD module configuration section."""

    name: str
    config: Dict[str, Any] = Field(default_factory=dict)


class SkillTemplate(BaseModel):
    """A BMAD skill template parsed from markdown with YAML frontmatter."""

    skill_id: str
    name: str
    description: str
    phases: List[str] = Field(default_factory=list)
    intent_triggers: List[str] = Field(default_factory=list)
    module: Optional[str] = None
    markdown_body: str = ""


class RegistryOut(BaseModel):
    """Registry metadata response."""

    agents: List[AgentDefinition]
    skills: List[SkillTemplate]
    modules: List[ModuleConfig]
    loaded_at: Optional[str] = None
