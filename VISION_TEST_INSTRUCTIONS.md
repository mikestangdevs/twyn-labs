# 🧪 Vision Feature Testing Instructions

## ✅ Backend is Ready!

I've fixed the decorator issues (`@tool` → `@function_tool`). The vision routes are properly registered.

## 🚀 Manual Testing Steps

### 1. Restart Backend
```bash
# Kill any old processes
pkill -f "python3 run.py"

# Start fresh
cd /Users/michaelstang/Desktop/twyn/twyn-backend
source .venv/bin/activate
python3 run.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Verify Routes (New Terminal)
```bash
curl http://localhost:8000/docs
# Opens Swagger UI - you should see /assets/* endpoints
```

### 3. Test Upload Init API
```bash
curl -X POST http://localhost:8000/assets/upload/init \
  -H "Content-Type: application/json" \
  -d '{
    "simulation_id": "test-123",
    "file_name": "test.png",
    "file_size": 1024,
    "mime_type": "image/png"
  }'
```

Expected response:
```json
{
  "asset_id": "abc-123-def-456",
  "upload_url": "https://...",
  "expires_at": "2025-11-08T..."
}
```

### 4. Test Frontend Upload

1. **Start Frontend:**
```bash
cd /Users/michaelstang/Desktop/twyn/twyn-frontend
npm run dev
```

2. **Create Simulation with Image:**
   - Go to http://localhost:3000
   - Type a prompt
   - Click `+` button → select an image
   - Image preview should appear
   - Click send

3. **Check Console:**
   - Should see: "Uploaded 1 file(s) - Processing with vision capabilities"
   - Check backend logs for upload activity

### 5. Test Vision Tools

**Option A: Via Frontend**
1. Create simulation with uploaded image
2. Go to Agents tab
3. Run Architect
4. Check backend logs for:
   ```
   list_assets tool call
   inspect_asset tool call  
   search_asset_content tool call
   ```

**Option B: Via Python**
```python
cd /Users/michaelstang/Desktop/twyn/twyn-backend
source .venv/bin/activate
python3

from src.api.deps import asset_manager
from src.assets.models import Asset
from uuid import uuid4
from datetime import datetime
import asyncio

# Add test asset
asset = Asset(
    id=uuid4(),
    simulation_id=uuid4(),
    user_id=uuid4(),
    name="test.png",
    type="image",
    mime="image/png",
    size_bytes=1024,
    storage_uri="test://bucket/test.png",
    created_at=datetime.now(),
    updated_at=datetime.now()
)

asyncio.run(asset_manager.add_asset(asset))

# List assets
assets = asyncio.run(asset_manager.list_assets())
print(f"Assets in memory: {len(assets)}")
# Should print: Assets in memory: 1
```

---

## 🎯 What to Test

### Backend API ✅
- [x] Routes registered (10 asset endpoints)
- [ ] Upload init returns signed URL
- [ ] Asset list returns empty array
- [ ] Search accepts queries

### Frontend UI ✅
- [x] Image preview shows in rounded box
- [x] Delete button appears on hover
- [ ] Upload actually sends files
- [ ] Toast confirmation appears

### Agent Integration
- [ ] Architect calls `list_assets()`
- [ ] Architect calls `inspect_asset()`
- [ ] Analyst calls `insert_figure_from_asset()`
- [ ] Search returns results

---

## 🐛 Known Issues Fixed

1. ✅ `@tool` decorator → Changed to `@function_tool`
2. ✅ Image previews added to upload UI
3. ✅ Routes properly registered (verified with test script)

---

## 📊 Expected Behavior

### When Everything Works:

1. **Upload an image** → Shows thumbnail preview
2. **Create simulation** → Toast: "Uploaded 1 file(s)"
3. **Go to Agents tab** → See "Uploaded Assets (1)"
4. **Click asset** → Perception preview shows (empty for now, needs worker)
5. **Run Architect** → Logs show tool calls to `list_assets`
6. **Run Analyst** → Can reference figures

---

## 🎉 Success Criteria

✅ Backend starts without errors  
✅ `/docs` shows 10 asset endpoints  
✅ Upload init API works  
✅ Frontend shows image previews  
⏳ Files upload successfully  
⏳ Agents call vision tools  

---

**Current Status:** Backend ready, frontend ready, needs manual restart + testing!

