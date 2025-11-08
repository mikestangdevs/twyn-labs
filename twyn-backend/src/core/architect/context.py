from dataclasses import dataclass
from openai import AsyncOpenAI
from typing import Any

@dataclass
class ArchitectContext:
    config: dict[str, Any]
    sources: list[str]
    client: AsyncOpenAI