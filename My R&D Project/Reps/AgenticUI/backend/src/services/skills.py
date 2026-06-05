"""Skill loading and injection service."""

from pathlib import Path


class SkillLoader:
    """Loads markdown skill files and injects them into agent contexts."""

    def __init__(self, skills_dir: Path | None = None) -> None:
        """Initialize the skill loader.

        Args:
            skills_dir: Directory containing skill markdown files.
        """
        self.skills_dir = skills_dir or Path("egm-ai-pilot/skills")
        self._cache: dict[str, str] = {}

    def load(self, skill_name: str) -> str | None:
        """Load a skill by name (without .md extension).

        Args:
            skill_name: Name of the skill file (e.g., 'cultural-analysis').

        Returns:
            Skill markdown content, or None if not found.
        """
        if skill_name in self._cache:
            return self._cache[skill_name]

        # Try multiple path resolutions
        paths_to_try = [
            self.skills_dir / f"{skill_name}.md",
            Path("egm-ai-pilot/skills") / f"{skill_name}.md",
            Path(__file__).parent.parent.parent.parent.parent / "egm-ai-pilot" / "skills" / f"{skill_name}.md",
        ]

        for path in paths_to_try:
            if path.exists():
                content = path.read_text(encoding="utf-8")
                self._cache[skill_name] = content
                return content

        return None

    def load_multiple(self, skill_names: list[str]) -> dict[str, str]:
        """Load multiple skills at once.

        Args:
            skill_names: List of skill names.

        Returns:
            Dict mapping skill name to content.
        """
        return {name: self.load(name) or "" for name in skill_names}

    def list_available(self) -> list[str]:
        """List all available skill names."""
        if not self.skills_dir.exists():
            return []
        return [f.stem for f in self.skills_dir.glob("*.md")]


# Singleton instance
skill_loader = SkillLoader()
