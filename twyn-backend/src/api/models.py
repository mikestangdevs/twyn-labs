from pydantic import BaseModel
from enum import Enum
from typing import List, Dict, Any


class SimulationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING_CONFIG = "processing_config"
    COMPLETED_CONFIG = "completed_config"
    PROCESSING_SIMULATION = "processing_simulation"
    COMPLETED_SIMULATION = "completed_simulation"
    PROCESSING_ANALYSIS = "processing_analysis"
    COMPLETED_ANALYSIS = "completed_analysis"
    FAILED = "failed"


class SimulationState(BaseModel):
    simulation_id: str
    prompt: str | None
    status: SimulationStatus | None
    title: str | None
    config: dict | None
    sources: list | None
    data: list | None
    current_step: int | None
    analysis: str | None
    error_log: str | None


class SimulationTitle(BaseModel):
    """Model for structured title generation"""
    title: str
