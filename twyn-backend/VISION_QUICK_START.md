# Vision & Multimodality Quick Start Guide

## Overview

This guide walks you through adding multimodal capabilities (vision, OCR, audio transcription) to Twyn in the correct order.

---

## Phase 0: Setup & Infrastructure ✅

### Step 1: Database Migration

Run the SQL migration to create required tables:

```bash
# Connect to your database and run:
psql $DATABASE_URL -f migrations/001_add_vision_tables.sql

# Or if using Supabase:
# Copy contents of migrations/001_add_vision_tables.sql
# Paste into Supabase SQL Editor and run
```

**What this creates:**
- `assets` table
- `asset_perceptions` table  
- `asset_embeddings` table
- Adds `has_assets`, `asset_count`, `asset_processing_status` to `simulations`
- Indexes for performance
- RLS policies (if using Supabase)

### Step 2: Configure Environment

Add to your `.env` file:

```bash
# Vision Models
ENABLE_VISION=true
VISION_MODEL=anthropic/claude-3.5-sonnet
VISION_MODEL_MAX_TOKENS=4096

# Audio
ENABLE_AUDIO=true
STT_MODEL=openai/whisper-1

# Embeddings
EMBEDDING_MODEL=openai/text-embedding-ada-002

# Storage
ASSET_STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_BUCKET=twyn-assets
ASSET_MAX_SIZE_MB=100
ASSET_MAX_COUNT_PER_SIM=50

# Processing Limits (Free tier)
MAX_OCR_PAGES=25
MAX_STT_MINUTES=10
MAX_IMAGE_CAPTIONS=10
```

### Step 3: Install Additional Dependencies

Add to `requirements.txt`:

```
# Vision & Multimodality
Pillow>=10.0.0           # Image processing
PyPDF2>=3.0.0            # PDF parsing
pdf2image>=1.16.0        # PDF to images
pytesseract>=0.3.10      # OCR (requires tesseract-ocr system package)
opencv-python>=4.8.0     # Video processing (Phase 3)
ffmpeg-python>=0.2.0     # Audio/video (Phase 3)
pgvector>=0.2.3          # Vector embeddings
```

Install:
```bash
pip install -r requirements.txt
```

### Step 4: Setup Storage

**Option A: Supabase Storage**

1. Go to Supabase Dashboard → Storage
2. Create bucket: `twyn-assets`
3. Set bucket to **private**
4. Add RLS policies (already in migration)

**Option B: AWS S3**

1. Create S3 bucket
2. Configure CORS
3. Add credentials to `.env`:
```bash
ASSET_STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=twyn-assets
```

---

## Phase 1: Core Perception (Images + PDFs)

### Step 5: Implement Storage Service

Edit `src/assets/storage.py`:

**For Supabase:**
```python
from supabase import create_client

class SupabaseStorage:
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
    
    async def upload(self, file_bytes, path, content_type=None):
        result = self.client.storage.from_(self.bucket_name).upload(
            path, file_bytes, {"content-type": content_type}
        )
        return f"supabase://{self.bucket_name}/{path}"
    
    # Implement download, delete, get_signed_url...
```

**Test it:**
```python
from src.assets.storage import get_storage_provider

storage = get_storage_provider()
uri = await storage.upload(b"test", "test.txt", "text/plain")
print(f"Uploaded to: {uri}")
```

### Step 6: Extend Provider with VLM Methods

Edit `src/core/shared/provider.py`:

```python
async def vlm_caption(self, image_bytes: bytes, prompt_hint: str = None) -> str:
    """Generate image caption using vision model."""
    # Encode image to base64
    import base64
    image_b64 = base64.b64encode(image_bytes).decode()
    
    # Call vision model (Claude, GPT-4V, etc.)
    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "base64", "data": image_b64}},
            {"type": "text", "text": prompt_hint or "Describe this image in detail."}
        ]
    }]
    
    response = await self.client.chat.completions.create(
        model=os.getenv("VISION_MODEL"),
        messages=messages,
        max_tokens=int(os.getenv("VISION_MODEL_MAX_TOKENS", "4096"))
    )
    
    return response.choices[0].message.content

async def vlm_ocr(self, image_bytes: bytes) -> str:
    """Extract text from image."""
    # Similar to caption but with OCR-focused prompt
    return await self.vlm_caption(
        image_bytes,
        "Extract all text from this image. Preserve formatting and structure."
    )
```

**Test it:**
```python
from src.core.simulator.provider import Provider
import requests

provider = Provider(base_url="...", api_key="...")
image = requests.get("https://example.com/test.jpg").content
caption = await provider.vlm_caption(image)
print(caption)
```

### Step 7: Implement Perception Worker

Edit `src/assets/perception_worker.py`:

Start simple - just caption and OCR for images:

```python
async def perceive_image(self, asset: Asset, tasks: List[str], hints=None):
    perceptions = []
    
    # Download image
    image_bytes = await self.storage.download(asset.storage_uri)
    
    # Run requested tasks
    if 'caption' in tasks:
        caption = await self.provider.vlm_caption(image_bytes)
        perceptions.append(Perception(
            id=uuid4(),
            asset_id=asset.id,
            kind='caption',
            data={'caption': caption, 'tags': []},
            created_at=datetime.now()
        ))
    
    if 'ocr' in tasks:
        text = await self.provider.vlm_ocr(image_bytes)
        perceptions.append(Perception(
            id=uuid4(),
            asset_id=asset.id,
            kind='ocr',
            data={'text': text, 'blocks': []},
            created_at=datetime.now()
        ))
    
    # Store perceptions in database
    for p in perceptions:
        await self.db.insert("asset_perceptions", p.dict())
    
    return perceptions
```

### Step 8: Create API Routes

Create `src/api/routes/assets.py`:

```python
from fastapi import APIRouter, UploadFile, File, Depends
from src.assets.models import Asset, Perception
from src.assets.storage import get_storage_provider
from src.assets.perception_worker import get_worker

router = APIRouter(prefix="/assets", tags=["assets"])

@router.post("/upload/init")
async def init_upload(
    simulation_id: str,
    file_name: str,
    file_size: int,
    mime_type: str
):
    # Generate upload URL
    storage = get_storage_provider()
    path = f"{simulation_id}/{uuid4()}/{file_name}"
    upload_url = await storage.get_signed_url(path, expires_in=3600)
    
    # Create asset record
    asset = Asset(
        id=uuid4(),
        simulation_id=simulation_id,
        name=file_name,
        type=detect_type(mime_type),
        mime=mime_type,
        size_bytes=file_size,
        storage_uri=path,
        created_at=datetime.now()
    )
    
    return {"asset_id": asset.id, "upload_url": upload_url}

@router.post("/upload/complete")
async def complete_upload(asset_id: str, perception_tasks: List[str]):
    # Enqueue perception job
    worker = get_worker()
    await worker.enqueue(PerceptionJob(
        id=uuid4(),
        asset_id=asset_id,
        tasks=perception_tasks
    ))
    
    return {"status": "processing"}

@router.get("/")
async def list_assets(simulation_id: str):
    # Query assets from database
    pass

@router.get("/{asset_id}/perceptions")
async def list_perceptions(asset_id: str):
    # Query perceptions from database
    pass
```

Register routes in `src/api/main.py`:

```python
from src.api.routes import assets

app.include_router(assets.router)
```

### Step 9: Test End-to-End

**Backend test:**
```bash
# Start server
python run.py

# In another terminal:
curl -X POST http://localhost:8000/assets/upload/init \
  -H "Content-Type: application/json" \
  -d '{
    "simulation_id": "test-sim",
    "file_name": "test.jpg",
    "file_size": 50000,
    "mime_type": "image/jpeg"
  }'

# Should return upload_url and asset_id
```

---

## Phase 2: Agent Integration

### Step 10: Add Vision Tools

Implement `src/core/shared/tools/vision_tools.py` functions:

```python
@tool
async def list_assets(ctx, simulation_id):
    # Query database
    assets = await db.query("SELECT * FROM assets WHERE simulation_id = $1", simulation_id)
    return [AssetSummary.from_row(a) for a in assets]

@tool
async def search_assets(ctx, query, simulation_id, top_k=5):
    # Generate query embedding
    embedding = await provider.generate_embedding(query)
    
    # Vector similarity search
    results = await db.query("""
        SELECT a.*, e.text_content, 
               1 - (e.embedding <=> $1) as similarity
        FROM asset_embeddings e
        JOIN assets a ON e.parent_id = a.id
        WHERE a.simulation_id = $2
        ORDER BY similarity DESC
        LIMIT $3
    """, embedding, simulation_id, top_k)
    
    return [SearchResult.from_row(r) for r in results]
```

### Step 11: Update Architect

Edit `src/core/architect/tools.py`:

```python
from src.core.shared.tools.vision_tools import (
    list_assets, perceive, search_assets
)

# Add to Architect's tool list
```

Edit `src/core/architect/prompts.py`:

Add to system prompt:
```
You can inspect user-uploaded assets (images, PDFs) using vision tools.
If the prompt references data in files, extract tables/figures via OCR 
and use them as constraints or priors. Record assets used in config.sources.assets.

Available: list_assets(), perceive(), search_assets()
```

### Step 12: Update Simulator

Edit `src/core/simulator/mini_agent_prompt.py`:

```python
def generate_prompt(agent, agent_group, step_unit, perception_context=None):
    prompt = f"""You are {agent._agent_group} #{agent._id}...
    
    [existing prompt]
    """
    
    if perception_context:
        prompt += f"""
        
        ## Perception Context
        
        The following was extracted from uploaded assets:
        {format_perception_context(perception_context)}
        
        Cite asset_id and locator when using this information.
        """
    
    return prompt
```

Edit `src/core/simulator/simulator.py`:

```python
async def step(self, provider, model, max_retries=5):
    # ... existing code ...
    
    # Check if visual channel enabled
    if self.config.get("channels", {}).get("visual", {}).get("enabled"):
        for agent in active_agents:
            # Search for relevant perceptions
            query = f"{agent._agent_group} decision at step {self.current_step}"
            search_results = await search_assets(query, self.config["simulation_id"])
            
            perception_ctx = format_search_results(search_results)
            prompt = generate_prompt(agent, agent_group, step_unit, perception_ctx)
```

### Step 13: Update Analyst

Add tool to `src/core/analyst/tools.py`:

```python
@tool
async def insert_figure_from_asset(ctx, asset_id, locator, caption):
    """Insert figure/table from asset into report."""
    asset = await get_asset(asset_id)
    return f"""
![{caption}](asset://{asset_id}/{locator})

*Source: {asset.name}, {locator}*
"""
```

---

## Testing Your Implementation

### Test 1: Upload & Perception

```python
# Upload an image
asset = await AssetsService.uploadAsset(
    simulation_id="test",
    file=open("test.jpg", "rb"),
    perception_tasks=["caption", "ocr"]
)

# Check perceptions
perceptions = await AssetsService.listPerceptions(asset.id)
assert len(perceptions) == 2
assert any(p.kind == "caption" for p in perceptions)
```

### Test 2: Architect Uses Asset

```python
# Create sim with PDF containing a table
config, done = await create_configuration(
    user_query="Model pricing from uploaded data.pdf",
    assets=[pdf_asset]
)

# Check that config references the asset
assert "data.pdf" in str(config.sources.assets)
```

### Test 3: Search Works

```python
results = await AssetsService.searchAssets(
    query="pricing table",
    simulation_id="test"
)

assert len(results) > 0
assert "price" in results[0].content_snippet.lower()
```

---

## Next Steps

1. **Phase 3: Audio/Video**
   - Implement `perceive_audio()` with Whisper
   - Add video frame extraction
   - Timeline UI in frontend

2. **Frontend Integration**
   - Build upload UI components
   - Add perception preview panel
   - Implement SSE updates for processing status

3. **Optimization**
   - Add caching for perception results
   - Implement token budgets
   - Batch processing for multiple assets

---

## Troubleshooting

**Problem:** Vision model returning errors
**Solution:** Check API key and model name in `.env`

**Problem:** Storage upload fails
**Solution:** Verify bucket exists and permissions are correct

**Problem:** Embeddings not working
**Solution:** Ensure pgvector extension is installed: `CREATE EXTENSION vector;`

**Problem:** OCR quality poor
**Solution:** Increase image resolution or try different VLM model

---

## Resources

- Implementation plan: `VISION_IMPLEMENTATION.md`
- Database schema: `migrations/001_add_vision_tables.sql`
- TODO tracker: See Cursor todos panel
- Example code: `tests/integration/test_vision_flow.py` (create this)

---

**Ready to start?** Begin with Step 1 (database migration) and work through sequentially!
