"""Artifact rendering for BMAD skill outputs."""

import re
from typing import Optional


class ArtifactRenderer:
    """Extract and render structured artifacts from LLM output."""

    @staticmethod
    def extract_markdown(text: str) -> str:
        """Clean and extract markdown content from LLM output."""
        if not text:
            return ""
        # Remove any thinking tags if present
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        text = re.sub(r"```\n?(.*?)```", r"\1", text, flags=re.DOTALL)
        return text.strip()

    @staticmethod
    def extract_yaml_frontmatter(text: str) -> tuple:
        """Extract YAML frontmatter from markdown text.

        Returns (frontmatter_dict, body) or (None, text).
        """
        if not text.startswith("---"):
            return None, text

        parts = text.split("---", 2)
        if len(parts) < 3:
            return None, text

        try:
            import yaml
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2].strip()
            return frontmatter, body
        except Exception:
            return None, text

    @staticmethod
    def render_prd(title: str, content: str, metadata: Optional[dict] = None) -> str:
        """Render a PRD document with standard BMAD frontmatter."""
        meta_lines = []
        if metadata:
            for key, value in metadata.items():
                meta_lines.append(f"{key}: {value}")

        frontmatter = "---\n" + "\n".join(meta_lines) + "\n---\n\n" if meta_lines else ""

        return f"""{frontmatter}# {title}

{content}
"""
