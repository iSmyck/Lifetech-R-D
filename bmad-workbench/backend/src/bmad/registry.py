"""BMAD Registry — parses config.toml and skill markdown files at startup."""

import glob
import logging
import os
import tomllib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from src.bmad.models import AgentDefinition, ModuleConfig, SkillTemplate

logger = logging.getLogger(__name__)

# Project root is the parent directory of the workbench backend
# bmad-workbench/backend/src/bmad/registry.py -> bmad-workbench -> project-root
# Inside Docker the build context is ./backend so /app == backend; fall back to /app.
_file_path = Path(__file__).resolve()
# Try to go up 4 parents (src/bmad/registry.py -> src -> backend -> bmad-workbench -> project-root)
try:
    DEFAULT_PROJECT_ROOT = _file_path.parents[4]
except IndexError:
    DEFAULT_PROJECT_ROOT = _file_path.parents[2] if len(_file_path.parents) >= 2 else Path("/app")


class BmadRegistry:
    """Read-only registry of BMAD agents, modules, and skills.

    Loaded once at startup and optionally reloaded via POST /api/bmad/reload.
    """

    def __init__(self, project_root: Optional[Path] = None):
        self.project_root = project_root or DEFAULT_PROJECT_ROOT
        self.agents: Dict[str, AgentDefinition] = {}
        self.skills: Dict[str, SkillTemplate] = {}
        self.modules: Dict[str, ModuleConfig] = {}
        self.loaded_at: Optional[datetime] = None
        self._load_errors: List[str] = []

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self) -> None:
        """Parse config and skills best-effort (partial load OK)."""
        self.agents.clear()
        self.skills.clear()
        self.modules.clear()
        self._load_errors.clear()
        self.loaded_at = datetime.now(timezone.utc)

        self._load_config_toml()
        self._load_skills()
        self._validate_cross_references()

        if self._load_errors:
            logger.warning("BMAD registry loaded with %s errors", len(self._load_errors))

    def list_agents(self) -> List[AgentDefinition]:
        return list(self.agents.values())

    def list_skills(self) -> List[SkillTemplate]:
        return list(self.skills.values())

    def get_skill(self, skill_id: str) -> Optional[SkillTemplate]:
        return self.skills.get(skill_id)

    def get_agent(self, agent_id: str) -> Optional[AgentDefinition]:
        return self.agents.get(agent_id)

    def list_modules(self) -> List[ModuleConfig]:
        return list(self.modules.values())

    # ------------------------------------------------------------------
    # Internal loaders
    # ------------------------------------------------------------------

    def _load_config_toml(self) -> None:
        config_path = self.project_root / "_bmad" / "config.toml"
        if not config_path.exists():
            logger.warning("BMAD config not found: %s", config_path)
            self._load_errors.append(f"Config not found: {config_path}")
            return

        try:
            with open(config_path, "rb") as f:
                data = tomllib.load(f)
        except Exception as exc:
            logger.warning("Failed to parse BMAD config: %s", exc)
            self._load_errors.append(f"Config parse error: {exc}")
            return

        # Core
        if "core" in data:
            self.modules["core"] = ModuleConfig(name="core", config=data["core"])

        # Modules — TOML nested tables: [modules.bmm] -> data["modules"]["bmm"]
        modules_data = data.get("modules", {})
        for module_name, section in modules_data.items():
            self.modules[module_name] = ModuleConfig(name=module_name, config=section)

        # Agents — TOML nested tables: [agents.bmad-agent-pm] -> data["agents"]["bmad-agent-pm"]
        agents_data = data.get("agents", {})
        for agent_id, section in agents_data.items():
            agent = AgentDefinition(
                id=agent_id,
                name=section.get("name", agent_id),
                title=section.get("title", ""),
                icon=section.get("icon", ""),
                description=section.get("description", ""),
                module=section.get("module", ""),
                team=section.get("team", ""),
            )
            self.agents[agent_id] = agent

    def _load_skills(self) -> None:
        skills_dir = self.project_root / ".agents" / "skills"
        if not skills_dir.exists():
            logger.warning("Skills directory not found: %s", skills_dir)
            self._load_errors.append(f"Skills dir not found: {skills_dir}")
            return

        pattern = str(skills_dir / "*" / "SKILL.md")
        for skill_path in glob.glob(pattern):
            self._parse_skill_file(Path(skill_path))

    def _parse_skill_file(self, path: Path) -> None:
        try:
            text = path.read_text(encoding="utf-8")
        except Exception as exc:
            logger.warning("Cannot read skill file %s: %s", path, exc)
            self._load_errors.append(f"Read error {path}: {exc}")
            return

        frontmatter, body = self._extract_frontmatter(text)
        if frontmatter is None:
            logger.warning("Invalid frontmatter in %s", path)
            self._load_errors.append(f"Invalid frontmatter: {path}")
            return

        skill_id = path.parent.name  # e.g. bmad-prd
        skill = SkillTemplate(
            skill_id=skill_id,
            name=frontmatter.get("name", skill_id),
            description=frontmatter.get("description", ""),
            phases=frontmatter.get("phases", []),
            intent_triggers=frontmatter.get("intent_triggers", []),
            module=frontmatter.get("module"),
            markdown_body=body,
        )
        self.skills[skill_id] = skill

    @staticmethod
    def _extract_frontmatter(text: str) -> tuple:
        """Extract YAML frontmatter from markdown text.

        Returns (frontmatter_dict, body) or (None, text) if no valid frontmatter.
        """
        if not text.startswith("---"):
            return None, text

        parts = text.split("---", 2)
        if len(parts) < 3:
            return None, text

        try:
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2].strip()
            return frontmatter, body
        except Exception:
            return None, text

    def _validate_cross_references(self) -> None:
        """Log warnings for agents whose default_skill doesn't resolve."""
        # Currently no default_skill field in config, but keep for future
        for agent_id, agent in self.agents.items():
            if agent.default_skill and agent.default_skill not in self.skills:
                logger.warning(
                    "Agent %s default_skill %s not found in registry",
                    agent_id,
                    agent.default_skill,
                )
                self._load_errors.append(
                    f"Agent {agent_id} default_skill {agent.default_skill} not found"
                )


# FastAPI dependency singleton
_registry_instance: Optional[BmadRegistry] = None


def get_registry() -> BmadRegistry:
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = BmadRegistry()
        _registry_instance.load()
    return _registry_instance


def reset_registry() -> None:
    global _registry_instance
    _registry_instance = None
