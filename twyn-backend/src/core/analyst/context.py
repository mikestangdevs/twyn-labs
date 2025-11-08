from dataclasses import dataclass
from openai import AsyncOpenAI

@dataclass
class AnalystContext:
    """Context for the analyst agent that stores the analysis."""
    analysis: str
    client: AsyncOpenAI
    data: list
    config: dict
    sources: list