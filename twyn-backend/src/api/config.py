import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field


load_dotenv()


class OpenAIClientConfig(BaseModel):
    """Configuration for the OpenAI client"""
    base_url: str = os.getenv("OPENROUTER_BASE_URL")
    api_key: str = os.getenv("OPENROUTER_API_KEY")

class TitleGeneratorConfig(BaseModel):
    """Configuration for the title generator"""
    model: str = "openai/gpt-4.1-nano"
    prompt: str = "Generate a very concise title (max 5 words) that captures the essence of the simulation request."

class ArchitectConfig(BaseModel):
    """Configuration for the architect"""
    model: str = "anthropic/claude-sonnet-4"
    max_turns: int = Field(default=120, ge=1)
    max_validation_retries: int = Field(default=6, ge=1)

class SimulatorConfig(BaseModel):
    """Configuration for the simulator"""
    model: str = "openai/gpt-4.1-mini"
    max_retries: int = Field(default=5, ge=1)

class AnalystConfig(BaseModel):
    """Configuration for the analyst"""
    model: str = "anthropic/claude-sonnet-4"
    max_turns: int = Field(default=120, ge=1)
    max_validation_retries: int = Field(default=6, ge=1)

class Settings(BaseModel):
    """Global application settings"""
    openai: OpenAIClientConfig = OpenAIClientConfig()
    title_generator: TitleGeneratorConfig = TitleGeneratorConfig()
    architect: ArchitectConfig = ArchitectConfig()
    simulator: SimulatorConfig = SimulatorConfig()
    analyst: AnalystConfig = AnalystConfig()

# Global settings instance
settings = Settings() 