# Twyn Vision & Multimodality Implementation Plan

## Status: 🚧 IN PROGRESS

This document tracks the implementation of multimodal agent capabilities (vision, OCR, audio transcription, document parsing) for Twyn.

---

## Overview

Enable agents to consume and reason over:
- **Images** (PNG, JPG) - captioning, OCR, entity extraction
- **PDFs** - page-by-page OCR, table extraction, diagram parsing
- **Video** (MP4) - frame extraction, STT, keyframe analysis
- **Audio** (MP3, WAV) - speech-to-text with timestamps
- **CSVs** - schema extraction, data preview

---

## Implementation Phases

### ✅ Phase 0: Setup & Infrastructure
- [ ] Database schema migrations
- [ ] Storage service (Supabase Storage / S3)
- [ ] Environment configuration
- [ ] Base models and types

### 🔄 Phase 1: Core Perception Services (Images + PDFs)
- [ ] Asset upload and storage
- [ ] Image captioning (VLM)
- [ ] OCR extraction
- [ ] Table detection and parsing
- [ ] Entity extraction
- [ ] Perception worker (background jobs)
- [ ] Embedding generation

### 🔄 Phase 2: Agent Integration
- [ ] Vision tools for agents
- [ ] Architect integration (asset inspection)
- [ ] Simulator integration (perception context injection)
- [ ] Analyst integration (figure/table insertion)
- [ ] Hybrid search (dense + sparse)

### ⏳ Phase 3: Audio/Video Support
- [ ] Speech-to-text with timestamps
- [ ] Video frame extraction
- [ ] Keyframe analysis
- [ ] Transcript embedding and search

### ⏳ Phase 4: Frontend UI
- [ ] Asset upload dropzone
- [ ] Perception preview panel
- [ ] Processing status indicators
- [ ] Asset search interface
- [ ] Citation linking in reports

### ⏳ Phase 5: Polish & Optimization
- [ ] Token/cost controls
- [ ] Caching strategies
- [ ] Performance optimization
- [ ] Security scanning
- [ ] Comprehensive testing

---

## File Structure

### Backend (`twyn-backend/`)

```
src/
├── assets/                          # NEW - Asset & Perception services
│   ├── __init__.py
│   ├── models.py                   # Asset, Perception, Embedding models
│   ├── storage.py                  # S3/Supabase Storage interface
│   ├── perception_queue.py         # Job queue management
│   ├── perception_worker.py        # Background processing
│   ├── embeddings.py               # Vector generation
│   └── search.py                   # Hybrid search (dense + sparse)
│
├── core/
│   ├── shared/
│   │   ├── provider.py             # EXTEND - Add VLM/STT adapters
│   │   └── tools/
│   │       └── vision_tools.py     # NEW - Agent vision tools
│   │
│   ├── architect/
│   │   └── tools.py                # EXTEND - Add asset inspection
│   │
│   ├── simulator/
│   │   ├── simulator.py            # EXTEND - Inject perception context
│   │   └── mini_agent_prompt.py    # EXTEND - Add perception section
│   │
│   └── analyst/
│       └── tools.py                # EXTEND - Add figure/table insertion
│
└── api/
    ├── routes/
    │   ├── assets.py               # NEW - Asset API endpoints
    │   └── simulations.py          # EXTEND - Add processing_assets state
    │
    └── models.py                   # EXTEND - Add asset-related models
```

### Frontend (`twyn-frontend/`)

```
src/
├── services/
│   └── assetsService.ts            # NEW - Asset API client
│
├── components/
│   ├── new-sim.tsx                 # EXTEND - Add dropzone
│   ├── agents-tab.tsx              # EXTEND - Add perception panel
│   │
│   └── perception/                 # NEW - Perception UI components
│       ├── AssetUploader.tsx
│       ├── AssetCard.tsx
│       ├── PerceptionPreview.tsx
│       ├── PerceptionProgress.tsx
│       └── AssetSearch.tsx
│
├── types/
│   └── assetTypes.ts              # NEW - Asset type definitions
│
└── hooks/
    └── useAssets.ts               # NEW - Asset state management
```

---

## Database Schema

### New Tables

#### `assets`
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'image', 'pdf', 'video', 'audio', 'csv'
  mime TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_uri TEXT NOT NULL,
  thumbnail_uri TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_simulation ON assets(simulation_id);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(type);
```

#### `asset_perceptions`
```sql
CREATE TABLE asset_perceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,  -- 'caption', 'ocr', 'entities', 'transcript', 'table'
  data JSONB NOT NULL,
  quality_score FLOAT,
  locator TEXT,  -- page number, timestamp, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_perceptions_asset ON asset_perceptions(asset_id);
CREATE INDEX idx_perceptions_kind ON asset_perceptions(kind);
CREATE INDEX idx_perceptions_data ON asset_perceptions USING GIN(data);
```

#### `asset_embeddings`
```sql
CREATE TABLE asset_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL,  -- 'asset', 'perception'
  parent_id UUID NOT NULL,
  embedding VECTOR(1536),  -- OpenAI ada-002 dimension
  text_content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_parent ON asset_embeddings(parent_type, parent_id);
-- For pgvector similarity search
CREATE INDEX idx_embeddings_vector ON asset_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Extend Existing Tables

```sql
-- Add to simulations table
ALTER TABLE simulations 
  ADD COLUMN has_assets BOOLEAN DEFAULT FALSE,
  ADD COLUMN asset_count INTEGER DEFAULT 0,
  ADD COLUMN asset_processing_status TEXT DEFAULT 'none';
  -- 'none', 'processing', 'completed', 'failed'
```

---

## API Endpoints

### Assets Routes (`/api/routes/assets.py`)

```
POST   /assets/upload/init          - Initialize upload, get signed URL
POST   /assets/upload/complete      - Finalize upload, trigger perception
GET    /assets/                     - List assets (filtered by sim_id)
GET    /assets/{asset_id}           - Get asset details
DELETE /assets/{asset_id}           - Delete asset
GET    /assets/{asset_id}/download  - Get download URL

POST   /assets/{asset_id}/perceive  - Trigger/re-run perception tasks
GET    /assets/{asset_id}/perceptions - List all perceptions
GET    /perceptions/{perception_id} - Get specific perception

POST   /assets/search               - Hybrid search across assets
```

### Updated Simulation States

Add new status: `PROCESSING_ASSETS` (before `PROCESSING_CONFIG`)

SSE events for asset processing:
```typescript
{
  event: "asset_update",
  data: {
    asset_id: "...",
    status: "processing" | "completed" | "failed",
    perceptions: [...],
    progress: { current: 2, total: 5 }
  }
}
```

---

## Environment Variables

Add to `.env`:

```bash
# Vision & Multimodality
VISION_MODEL=anthropic/claude-3.5-sonnet  # VLM for captioning/OCR
VISION_MODEL_MAX_TOKENS=4096
STT_MODEL=openai/whisper-1              # Speech-to-text
EMBEDDING_MODEL=openai/text-embedding-ada-002

# Asset Storage
ASSET_STORAGE_PROVIDER=supabase  # 'supabase' or 's3'
SUPABASE_STORAGE_BUCKET=twyn-assets
ASSET_MAX_SIZE_MB=100
ASSET_MAX_COUNT_PER_SIM=50

# Processing Limits (Free tier)
MAX_OCR_PAGES=25
MAX_STT_MINUTES=10
MAX_IMAGE_CAPTIONS=10

# Feature Flags
ENABLE_VISION=true
ENABLE_AUDIO=true
ENABLE_VIDEO=false  # Phase 3
```

---

## Core Services Implementation

### 1. Storage Service (`src/assets/storage.py`)

```python
# TODO: Implement storage abstraction
class StorageProvider(Protocol):
    async def upload(file, path) -> str
    async def download(uri) -> bytes
    async def delete(uri) -> None
    async def get_signed_url(uri, expires) -> str

class SupabaseStorage(StorageProvider):
    # Implementation using Supabase Storage SDK

class S3Storage(StorageProvider):
    # Implementation using boto3
```

### 2. Perception Models (`src/assets/models.py`)

```python
# TODO: Define Pydantic models
class Asset(BaseModel):
    id: UUID
    simulation_id: UUID
    user_id: UUID
    name: str
    type: Literal['image', 'pdf', 'video', 'audio', 'csv']
    mime: str
    size_bytes: int
    storage_uri: str
    thumbnail_uri: Optional[str]
    meta: Dict[str, Any]

class Perception(BaseModel):
    id: UUID
    asset_id: UUID
    kind: Literal['caption', 'ocr', 'entities', 'transcript', 'table']
    data: Dict[str, Any]
    quality_score: Optional[float]
    locator: Optional[str]

class PerceptionRequest(BaseModel):
    tasks: List[str]  # ['caption', 'ocr', 'entities', 'tables']
    hints: Optional[Dict[str, Any]]
```

### 3. Provider Extensions (`src/core/shared/provider.py`)

```python
# TODO: Add VLM and STT methods to Provider class

async def vlm_caption(
    image: bytes | str,
    prompt_hint: Optional[str] = None
) -> str:
    """Generate image caption using VLM"""

async def vlm_ocr(
    image: bytes | str,
    extract_tables: bool = False
) -> str:
    """Extract text from image/PDF page"""

async def vlm_entities(
    image: bytes | str,
    schema_hint: Optional[Dict] = None
) -> List[Dict]:
    """Extract entities from image"""

async def stt_transcribe(
    audio: bytes | str,
    timestamps: bool = True
) -> Dict[str, Any]:
    """Transcribe audio to text with timestamps"""
```

### 4. Vision Tools (`src/core/shared/tools/vision_tools.py`)

```python
# TODO: Implement agent-callable vision tools

@tool
async def list_assets(
    ctx: RunContextWrapper,
    simulation_id: str,
    type_filter: Optional[str] = None
) -> List[Dict]:
    """List assets available in simulation"""

@tool
async def perceive(
    ctx: RunContextWrapper,
    asset_id: str,
    tasks: List[str],
    hints: Optional[Dict] = None
) -> List[Dict]:
    """Run perception tasks on asset"""

@tool
async def search_assets(
    ctx: RunContextWrapper,
    query: str,
    top_k: int = 5
) -> List[Dict]:
    """Search assets by content"""

@tool
async def quote_from_asset(
    ctx: RunContextWrapper,
    asset_id: str,
    locator: str
) -> Dict:
    """Extract specific quote/section from asset"""
```

### 5. Perception Worker (`src/assets/perception_worker.py`)

```python
# TODO: Background worker for perception processing

async def process_perception_job(job: PerceptionJob):
    """
    Main worker function:
    1. Fetch asset from storage
    2. Run requested perception tasks
    3. Generate embeddings
    4. Store results in DB
    5. Emit SSE update
    """

async def perceive_image(asset: Asset, tasks: List[str]) -> List[Perception]:
    """Process image: caption, OCR, entities"""

async def perceive_pdf(asset: Asset, tasks: List[str]) -> List[Perception]:
    """Process PDF: OCR per page, table extraction"""

async def perceive_audio(asset: Asset) -> Perception:
    """Process audio: STT with timestamps"""
```

---

## Agent Integration Points

### Architect Phase

**System Prompt Addition:**
```
You can inspect user-uploaded assets (images, PDFs, audio/video) using vision tools.
If the prompt references data in files, extract tables/figures via OCR and use them
as constraints or priors in your configuration. Record any asset you used in 
config.sources.assets with the asset_id and what you extracted.

Available tools: list_assets, perceive, search_assets
```

**Example Usage:**
```python
# Architect discovers a pricing table in uploaded PDF
assets = await list_assets(simulation_id)
pdf_asset = next(a for a in assets if a.type == 'pdf')
perceptions = await perceive(pdf_asset.id, ['tables'])
pricing_table = perceptions[0].data['tables'][0]
# Use pricing_table to set variable constraints
```

### Simulator Phase

**Perception Context Injection:**
```python
# In mini_agent_prompt.py
def generate_prompt(agent, agent_group, step_unit, perception_context=None):
    prompt = f"""
    You are {agent._agent_group} #{agent._id}.
    
    [... existing prompt ...]
    """
    
    if perception_context:
        prompt += f"""
        
        ## Perception Context
        
        The following information was extracted from uploaded assets:
        
        {format_perception_snippets(perception_context)}
        
        Use this context to inform your decisions, and cite asset_id + locator
        when relevant.
        """
    
    return prompt
```

**In simulator.py:**
```python
async def step(self, provider, model, max_retries=5):
    # ... existing code ...
    
    # Inject perception context if visual channel enabled
    if self.config.get("channels", {}).get("visual", {}).get("enabled"):
        for agent in active_agents:
            # Search for relevant perceptions based on agent's current state
            perception_ctx = await self._get_perception_context(agent)
            prompt = generate_prompt(agent, agent_group, step_unit, perception_ctx)
```

### Analyst Phase

**New Tools:**
```python
@tool
async def insert_figure_from_asset(
    ctx: RunContextWrapper,
    asset_id: str,
    locator: str,
    caption: str
) -> str:
    """Insert figure/table from asset into report with citation"""
    
    # Returns markdown like:
    # ![caption](asset://asset_id/locator)
    # *Source: filename.pdf, page 3*
```

---

## Frontend Components

### Asset Uploader (`src/components/perception/AssetUploader.tsx`)

```typescript
// TODO: Implement drag-drop uploader
interface AssetUploaderProps {
  simulationId: string;
  onUploadComplete: (assets: Asset[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

// Features:
// - Drag and drop
// - File type validation
// - Size limits
// - Upload progress
// - Perception task selection (OCR, caption, etc.)
```

### Perception Preview (`src/components/perception/PerceptionPreview.tsx`)

```typescript
// TODO: Display perception results
interface PerceptionPreviewProps {
  asset: Asset;
  perceptions: Perception[];
  onSearch?: (query: string) => void;
}

// Shows:
// - Asset thumbnail
// - Captions
// - OCR text (collapsible)
// - Extracted tables
// - Entities/tags
// - Transcripts with seekable timeline
```

### Updated New Sim (`src/components/new-sim.tsx`)

```typescript
// TODO: Integrate AssetUploader
// Add below the textarea:
// - AssetUploader component
// - List of uploaded assets with preview cards
// - Per-asset perception task toggles
// - "Processing X assets..." status
```

---

## Testing Strategy

### Unit Tests

```python
# tests/assets/test_storage.py
# tests/assets/test_perception.py
# tests/assets/test_embeddings.py
# tests/vision_tools_test.py
```

### Integration Tests

```python
# tests/integration/test_asset_upload_flow.py
async def test_upload_and_perception():
    # 1. Upload image
    # 2. Trigger perception
    # 3. Verify results in DB
    # 4. Check SSE events

# tests/integration/test_agent_vision.py
async def test_architect_uses_pdf_table():
    # 1. Create sim with PDF containing pricing table
    # 2. Run architect
    # 3. Verify config references table data
```

### E2E Tests

```typescript
// tests/e2e/vision.spec.ts
test('complete vision workflow', async () => {
  // 1. Login
  // 2. Create sim with assets
  // 3. Wait for perception
  // 4. Verify Architect used assets
  // 5. Check Analyst cites figures
});
```

---

## Performance & Cost Optimization

### Token Controls

```python
class PerceptionBudget:
    """Enforce per-sim perception limits"""
    
    free_tier = {
        'ocr_pages': 25,
        'stt_minutes': 10,
        'image_captions': 10,
        'table_extractions': 15
    }
    
    pro_tier = {
        'ocr_pages': 100,
        'stt_minutes': 60,
        'image_captions': 50,
        'table_extractions': 50
    }
```

### Caching Strategy

```python
# Cache perception results by content hash
perception_cache_key = f"{asset_id}:{task}:{hash(hints)}"

# Cache agent perception context per step
step_perception_cache = {}  # cleared each step
```

### Batch Processing

```python
# Process multiple images in single VLM call when possible
async def batch_caption(images: List[bytes]) -> List[str]:
    # Send all images in one request
```

---

## Security Considerations

### Upload Security

```python
# Virus scanning
async def scan_upload(file: bytes) -> bool:
    # Integrate ClamAV or similar

# EXIF stripping
async def strip_metadata(image: bytes) -> bytes:
    # Remove location, camera info, etc.

# Size limits
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
```

### Content Policy

```python
# PII detection and redaction in OCR/transcripts
async def redact_pii(text: str) -> str:
    # Redact emails, phone numbers, SSNs, etc.
    # Unless enterprise tenant disables redaction
```

---

## Rollout Checklist

### Phase 1: Images + PDFs (MVP)
- [ ] Database migrations deployed
- [ ] Storage service configured
- [ ] Image captioning working
- [ ] OCR extraction working
- [ ] Table parsing working
- [ ] Architect can inspect assets
- [ ] Simulator injects perception context
- [ ] Frontend upload UI complete
- [ ] E2E test passing
- [ ] Documentation updated

### Phase 2: Audio/Video
- [ ] STT integration
- [ ] Video frame extraction
- [ ] Transcript search
- [ ] Timeline UI

### Phase 3: Advanced Features
- [ ] CLIP embeddings for visual similarity
- [ ] Diagram/flowchart parsing
- [ ] Multi-page PDF summarization
- [ ] Real-time video analysis

---

## Success Metrics

### MVP Acceptance Criteria

✅ **User Story 1: Upload & Perception**
- Upload PNG and PDF to new sim
- See perception results (caption/OCR) within 10 seconds
- Preview extracted tables

✅ **User Story 2: Architect Integration**
- Architect references PDF table in generated config
- Config includes `sources.assets` with asset_id

✅ **User Story 3: Simulator Integration**
- Simulator step shows "Perception Context injected" in logs
- Agent decisions cite asset snippets

✅ **User Story 4: Analyst Integration**
- Analyst report includes figure from PDF page 3
- Figure has caption and clickable citation link

✅ **User Story 5: Search**
- Search for term from PDF returns relevant perception
- Agent tool `search_assets()` works in playground

---

## Next Steps

1. **Start with Phase 0:** Database schema + storage service
2. **Then Phase 1.1:** Image captioning + OCR only
3. **Validate:** Get one image end-to-end before expanding
4. **Iterate:** Add PDF → Audio → Video incrementally

---

## Resources & References

- [OpenRouter Vision Models](https://openrouter.ai/docs/vision)
- [Anthropic Vision API](https://docs.anthropic.com/claude/docs/vision)
- [OpenAI GPT-4V](https://platform.openai.com/docs/guides/vision)
- [Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**Last Updated:** November 2025  
**Status:** Implementation in progress  
**Current Phase:** Phase 0 - Setup & Infrastructure

