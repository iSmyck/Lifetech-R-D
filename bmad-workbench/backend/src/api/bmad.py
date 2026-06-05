"""BMAD Registry API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends

from src.bmad.registry import get_registry, BmadRegistry, reset_registry
from src.bmad.models import AgentDefinition, SkillTemplate, RegistryOut

router = APIRouter(prefix="/bmad", tags=["bmad"])


def _registry_dep() -> BmadRegistry:
    return get_registry()


@router.get("/agents", response_model=List[AgentDefinition])
async def list_agents(registry: BmadRegistry = Depends(_registry_dep)):
    """List all loaded BMAD agents."""
    return registry.list_agents()


@router.get("/skills", response_model=List[SkillTemplate])
async def list_skills(registry: BmadRegistry = Depends(_registry_dep)):
    """List all loaded BMAD skills (without full markdown body)."""
    skills = registry.list_skills()
    # Strip markdown_body for list view to keep payload small
    return [
        SkillTemplate(
            skill_id=s.skill_id,
            name=s.name,
            description=s.description,
            phases=s.phases,
            intent_triggers=s.intent_triggers,
            module=s.module,
            markdown_body="",
        )
        for s in skills
    ]


@router.get("/skills/{skill_id}", response_model=Optional[SkillTemplate])
async def get_skill(skill_id: str, registry: BmadRegistry = Depends(_registry_dep)):
    """Get full skill template including markdown body."""
    return registry.get_skill(skill_id)


@router.post("/reload", response_model=RegistryOut)
async def reload_registry():
    """Dev endpoint to re-parse BMAD config without restart."""
    reset_registry()
    registry = get_registry()
    return RegistryOut(
        agents=registry.list_agents(),
        skills=registry.list_skills(),
        modules=registry.list_modules(),
        loaded_at=registry.loaded_at.isoformat() if registry.loaded_at else None,
    )


@router.get("/registry", response_model=RegistryOut)
async def get_full_registry(registry: BmadRegistry = Depends(_registry_dep)):
    """Get full registry metadata."""
    return RegistryOut(
        agents=registry.list_agents(),
        skills=registry.list_skills(),
        modules=registry.list_modules(),
        loaded_at=registry.loaded_at.isoformat() if registry.loaded_at else None,
    )
