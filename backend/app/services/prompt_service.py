import os
from typing import Dict, Optional
from pathlib import Path


class PromptService:
    def __init__(self):
        self.prompts_dir = Path(__file__).parent.parent / "config" / "prompts"

    def load_template(self, template_name: str) -> str:
        template_path = self.prompts_dir / f"{template_name}.md"
        if template_path.exists():
            return template_path.read_text(encoding="utf-8")
        raise FileNotFoundError(f"Template not found: {template_name}")

    def render_template(
        self,
        template_name: str,
        variables: Dict[str, any],
    ) -> str:
        template = self.load_template(template_name)

        for key, value in variables.items():
            placeholder = "{" + key + "}"
            template = template.replace(placeholder, str(value) if value else "")

        return template

    def format_chat_history(self, messages: list) -> str:
        history_lines = []
        for msg in messages:
            role_name = {
                "ai": "AI面试官",
                "interviewer": "面试官",
                "candidate": "面试者",
            }.get(msg.role, msg.role)
            history_lines.append(f"{role_name}: {msg.content}")
        return "\n\n".join(history_lines)


prompt_service = PromptService()
