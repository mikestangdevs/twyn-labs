"""
Pydantic models for assets and perceptions.
"""
from typing import Any, Dict, List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class Asset(BaseModel):
    """Represents an uploaded asset (image, PDF, video, audio, CSV)."""
    
    id: UUID
    simulation_id: UUID
    user_id: UUID
    name: str
    type: Literal['image', 'pdf', 'video', 'audio', 'csv']
    mime: str
    size_bytes: int
    storage_uri: str
    thumbnail_uri: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class Perception(BaseModel):
    """Represents a perception result from processing an asset."""
    
    id: UUID
    asset_id: UUID
    kind: Literal['caption', 'ocr', 'entities', 'transcript', 'table', 'diagram']
    data: Dict[str, Any]
    quality_score: Optional[float] = None
    locator: Optional[str] = None  # page number, timestamp, etc.
    created_at: datetime


class Embedding(BaseModel):
    """Vector embedding for asset or perception content."""
    
    id: UUID
    parent_type: Literal['asset', 'perception']
    parent_id: UUID
    embedding: List[float]
    text_content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class PerceptionRequest(BaseModel):
    """Request to run perception tasks on an asset."""
    
    asset_id: UUID
    tasks: List[Literal['caption', 'ocr', 'entities', 'transcript', 'table', 'diagram']]
    hints: Optional[Dict[str, Any]] = None


class PerceptionJob(BaseModel):
    """Background job for perception processing."""
    
    id: UUID
    asset_id: UUID
    simulation_id: UUID
    tasks: List[str]
    hints: Optional[Dict[str, Any]] = None
    status: Literal['pending', 'processing', 'completed', 'failed'] = 'pending'
    progress: float = 0.0
    error: Optional[str] = None
    created_at: datetime


class AssetSummary(BaseModel):
    """Summary of asset for agent tool responses."""
    
    id: UUID
    name: str
    type: str
    size_bytes: int
    perception_count: int
    has_caption: bool = False
    has_ocr: bool = False
    has_transcript: bool = False


class SearchResult(BaseModel):
    """Search result from asset/perception search."""
    
    asset_id: UUID
    asset_name: str
    asset_type: str
    perception_id: Optional[UUID] = None
    perception_kind: Optional[str] = None
    content_snippet: str
    locator: Optional[str] = None
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


# TODO: Add more models as needed for specific perception types
class CaptionPerception(BaseModel):
    """Image caption perception data."""
    caption: str
    confidence: float
    tags: List[str] = Field(default_factory=list)


class OCRPerception(BaseModel):
    """OCR perception data."""
    text: str
    blocks: List[Dict[str, Any]] = Field(default_factory=list)
    language: str = 'en'
    confidence: float = 0.0


class TablePerception(BaseModel):
    """Table extraction perception data."""
    markdown: str
    csv: str
    rows: int
    columns: int
    headers: List[str]


class TranscriptPerception(BaseModel):
    """Audio/video transcript perception data."""
    text: str
    segments: List[Dict[str, Any]]  # [{text, start, end}, ...]
    language: str
    duration_seconds: float

