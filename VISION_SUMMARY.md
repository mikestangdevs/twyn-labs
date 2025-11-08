# Twyn Vision & Multimodality - Implementation Summary

## 🎯 What Was Done

I've scaffolded the complete infrastructure for adding **multimodal agent vision** to Twyn, enabling agents to see, read, and reason over images, PDFs, audio, and video.

---

## 📁 Files Created

### Backend (`twyn-backend/`)

#### Core Asset Services
- ✅ `src/assets/__init__.py` - Package initialization
- ✅ `src/assets/models.py` - Pydantic models (Asset, Perception, Embedding, etc.)
- ✅ `src/assets/storage.py` - Storage provider interface (Supabase/S3)
- ✅ `src/assets/perception_worker.py` - Background perception processing
- ✅ `src/core/shared/tools/vision_tools.py` - Agent-callable vision tools

#### Database
- ✅ `migrations/001_add_vision_tables.sql` - Complete schema for assets, perceptions, embeddings

#### Documentation
- ✅ `VISION_IMPLEMENTATION.md` - Comprehensive implementation plan (~1000 lines)
- ✅ `VISION_QUICK_START.md` - Step-by-step implementation guide

### Frontend (`twyn-frontend/`)

- ✅ `src/types/assetTypes.ts` - TypeScript type definitions
- ✅ `src/services/assetsService.ts` - Complete API client for assets

---

## 🏗️ Architecture Overview

```
User uploads asset (image/PDF/audio/video)
  ↓
Storage Service (Supabase/S3)
  ↓
Perception Worker (background)
  ├─ VLM: Caption, OCR, Entity extraction
  ├─ Table extraction
  └─ STT: Audio transcription
  ↓
Generate embeddings (vector + text)
  ↓
Store in database (assets, perceptions, embeddings)
  ↓
Agent Tools (list, search, perceive, quote)
  ↓
Architect/Simulator/Analyst use perceptions
  ↓
Results in reports with citations
```

---

## 🔑 Key Features Scaffolded

### 1. Asset Management
- Upload to cloud storage (Supabase Storage or S3)
- Automatic thumbnail generation
- Metadata tracking
- Download URLs with expiration

### 2. Perception Processing
- **Images:** Caption, OCR, entity extraction
- **PDFs:** Page-by-page OCR, table extraction (markdown/CSV)
- **Audio:** Speech-to-text with timestamps
- **Video:** Frame extraction, STT, keyframe analysis (Phase 3)
- **CSV:** Schema extraction, data preview

### 3. Agent Integration
- **Architect:** Can inspect assets, extract tables from PDFs, use data as constraints
- **Simulator:** Perception context injected into agent prompts
- **Analyst:** Can insert figures/tables from assets with citations

### 4. Search & Retrieval
- Hybrid search (vector embeddings + BM25)
- Search by content across all perceptions
- Locator-based retrieval (page numbers, timestamps)

### 5. Real-Time Updates
- SSE events for perception progress
- Status tracking per asset
- Progress indicators (X of Y tasks complete)

---

## 📊 Database Schema

### Tables Created
1. **`assets`** - Uploaded files
2. **`asset_perceptions`** - Perception results (captions, OCR, etc.)
3. **`asset_embeddings`** - Vector embeddings for search
4. **`simulations`** extended with asset tracking fields

### Indexes Added
- B-tree on simulation_id, user_id, type
- GIN on JSONB perception data
- IVFFlat on vector embeddings (pgvector)

### Row-Level Security
- Users can only access their own assets
- Cascade on simulation deletion

---

## 🛠️ Implementation Phases

### Phase 0: Setup ✅ SCAFFOLDED
- [x] Database schema
- [x] Storage interface
- [x] Base models
- [x] Environment config template
- [ ] Run migration (user action)
- [ ] Configure .env (user action)

### Phase 1: Core Perception 🔄 READY TO IMPLEMENT
- [ ] Implement SupabaseStorage methods
- [ ] Add VLM/OCR to Provider
- [ ] Implement perceive_image/pdf workers
- [ ] Create API routes
- [ ] Implement vision tools
- [ ] Generate embeddings

### Phase 2: Agent Integration ⏳ NEXT
- [ ] Add tools to Architect
- [ ] Modify Simulator for perception context
- [ ] Update mini_agent_prompt
- [ ] Add Analyst figure insertion
- [ ] Implement hybrid search

### Phase 3: Frontend 🎨 AFTER BACKEND
- [ ] Asset uploader component
- [ ] Perception preview
- [ ] Processing status UI
- [ ] Search interface
- [ ] Citation links

### Phase 4: Testing ✅ CONTINUOUS
- [ ] Unit tests (storage, perception, tools)
- [ ] Integration tests (upload → perceive → search)
- [ ] E2E tests (full workflow)

---

## 🎓 How Agents Will Use Vision

### Architect Example
```python
# User: "Model pricing from uploaded data.pdf"

# Architect agent:
assets = await list_assets(simulation_id, type_filter='pdf')
pdf = assets[0]

perceptions = await perceive(pdf.id, ['table'])
pricing_table = perceptions[0].data['tables'][0]

# Use table data to create price variable constraints
add_variable(
    agent_group="customers",
    name="budget",
    distribution=UniformVariable(
        min=pricing_table.rows[0]['min_price'],
        max=pricing_table.rows[0]['max_price']
    )
)
```

### Simulator Example
```python
# Agent prompt includes:
"""
## Perception Context

From uploaded diagram.png (page 1):
- Caption: "Supply chain network with 3 warehouses and 5 retail locations"
- Entities detected: warehouse_a (x:100, y:200), warehouse_b (x:300, y:200)
- OCR: "Capacity: 10,000 units"

Use this information when making your decision.
"""
```

### Analyst Example
```python
# Analyst agent:
await insert_figure_from_asset(
    asset_id=pdf_id,
    locator="page 3",
    caption="Historical pricing trends"
)

# Generates:
# ![Historical pricing trends](asset://uuid/page_3)
# *Source: data.pdf, page 3*
```

---

## 🔧 Tools Available to Agents

All agents have access to:

1. **`list_assets(simulation_id, type_filter?)`**
   - List all uploaded assets
   - Filter by type (image, pdf, audio, etc.)

2. **`perceive(asset_id, tasks, hints?)`**
   - Run perception tasks on asset
   - Tasks: caption, ocr, entities, table, transcript
   - Returns perception results

3. **`search_assets(query, simulation_id?, top_k)`**
   - Semantic search across all assets
   - Uses embeddings + BM25
   - Returns relevant snippets with locators

4. **`quote_from_asset(asset_id, locator)`**
   - Extract specific quote/section
   - Locator: page number, timestamp, row range

5. **`get_asset(asset_id)`**
   - Get full asset metadata

6. **`get_perception(perception_id)`**
   - Get specific perception result

---

## 📝 Configuration

### Environment Variables (Add to `.env`)

```bash
# Vision
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

### System Prompts

**Architect addition:**
```
You can inspect user-uploaded assets using vision tools. 
If the prompt references data in files, extract tables/figures 
via OCR and use them as constraints. Record assets in config.sources.assets.
```

**Simulator addition:**
```
Before decisions, call search_assets() for relevant context.
Inject minimal perception snippets (<=300 tokens) that affect the decision.
Cite asset_id and locator.
```

**Analyst addition:**
```
When supporting claims, insert figures/tables from assets using vision tools.
Cite the locator (page/timestamp).
```

---

## 🚀 Getting Started

### Immediate Next Steps

1. **Run Database Migration**
   ```bash
   psql $DATABASE_URL -f migrations/001_add_vision_tables.sql
   ```

2. **Configure Environment**
   - Add vision variables to `.env`
   - Set up Supabase Storage bucket

3. **Start Implementation**
   - Follow `VISION_QUICK_START.md`
   - Check off TODOs in Cursor
   - Start with Phase 0, then Phase 1

4. **Test Incrementally**
   - Test storage upload/download
   - Test single image caption
   - Test end-to-end before expanding

---

## 💰 Cost Considerations

### Free Tier Limits (Recommended)
- OCR: 25 pages per simulation
- STT: 10 minutes per simulation
- Image captions: 10 per simulation
- Table extractions: 15 per simulation

### Estimated Costs (per asset)
- Image caption: ~$0.001
- PDF OCR (per page): ~$0.002
- Audio STT (per minute): ~$0.006
- Embedding generation: ~$0.0001

**Total for typical simulation:** $0.10 - $0.50

---

## 🎯 Success Criteria (MVP)

When complete, users should be able to:

✅ Upload image + PDF when creating simulation
✅ See perception results (caption/OCR) within 10 seconds
✅ Preview extracted tables in UI
✅ Architect references PDF table in generated config
✅ Simulator agents cite asset snippets in decisions
✅ Analyst report includes figure from PDF with link
✅ Search finds relevant perceptions by content

---

## 📚 Documentation Created

1. **VISION_IMPLEMENTATION.md** (~1000 lines)
   - Complete architecture
   - File structure
   - API specs
   - Frontend components
   - Testing strategy

2. **VISION_QUICK_START.md** 
   - Step-by-step guide
   - Code examples
   - Testing commands
   - Troubleshooting

3. **22 TODO Items**
   - Tracked in Cursor
   - Organized by phase
   - Clear acceptance criteria

---

## 🔒 Security Features

- Virus scanning for uploads
- EXIF metadata stripping
- Size and count limits
- PII redaction in OCR/transcripts
- Row-level security policies
- Signed URLs with expiration

---

## 🎨 Frontend Components (To Create)

1. **AssetUploader** - Drag-drop with progress
2. **AssetCard** - Preview with perception toggles
3. **PerceptionPreview** - Display captions, OCR, tables
4. **AssetSearch** - Search interface
5. **PerceptionProgress** - Real-time status
6. Extended **new-sim** - Integrated upload
7. Extended **agents-tab** - Perception panel

---

## 🧪 Testing Coverage

### Unit Tests
- Storage provider (upload/download/delete)
- Perception worker (each asset type)
- Vision tools (list, search, perceive)
- Embedding generation

### Integration Tests
- Upload → perception → database
- Search with hybrid approach
- Agent tool calling

### E2E Tests
- Create sim with PDF
- Architect extracts table
- Simulator uses perception
- Analyst cites figure
- Search returns results

---

## 📈 Performance Optimizations

1. **Caching**
   - Perception results by content hash
   - Agent perception context per step

2. **Batch Processing**
   - Multiple images in single VLM call
   - Parallel PDF page processing

3. **Lazy Loading**
   - On-demand perception (not all tasks by default)
   - Pagination for large asset lists

4. **Token Management**
   - Summarize perceptions to agent-digest chunks
   - De-duplicate across agents with shared selectors

---

## 🔄 Next Context Window

If implementation continues, focus on:

1. Implementing SupabaseStorage class
2. Adding VLM methods to Provider
3. Creating basic perceive_image function
4. Setting up API routes
5. Testing first image upload → caption flow

---

## 💡 Key Design Decisions

1. **Hybrid Search:** Combines dense (embeddings) + sparse (BM25) for better recall
2. **Background Processing:** Never block HTTP requests on perception
3. **Incremental Perception:** Run only requested tasks, add more later
4. **Agent Tools:** Structured tool calling, not raw API access
5. **Locators:** Consistent format (page X, timestamp HH:MM:SS, row N-M)
6. **Caching:** Aggressive caching with content-based keys
7. **Storage Abstraction:** Provider pattern supports multiple backends

---

## 📞 Ready to Implement!

**Start Here:** `VISION_QUICK_START.md` Step 1

**Track Progress:** 22 TODO items in Cursor

**Get Help:** 
- Check implementation plan for details
- Refer to code comments (# TODO: ...)
- Test incrementally as you go

**Estimated Time:**
- Phase 0: 1 hour (setup)
- Phase 1: 1-2 days (core perception)
- Phase 2: 2-3 days (agent integration)
- Phase 3: 2-3 days (frontend)
- Testing: 1-2 days

**Total:** ~1-2 weeks for MVP

---

🚀 **Ready to make agents see!**

