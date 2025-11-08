"""
API routes for asset management and perception.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from src.assets.models import Asset, AssetSummary, Perception, SearchResult
from src.assets.storage import get_storage_provider
from src.assets.perception_worker import get_worker
from src.assets.asset_manager import AssetManager
from src.api.deps import get_asset_manager


router = APIRouter(
    prefix="/assets",
    tags=["assets"]
)


# Request/Response Models

class InitUploadRequest(BaseModel):
    simulation_id: str
    file_name: str
    file_size: int
    mime_type: str


class InitUploadResponse(BaseModel):
    asset_id: str
    upload_url: str
    expires_at: str


class CompleteUploadRequest(BaseModel):
    asset_id: str
    perception_tasks: Optional[List[str]] = ['caption', 'ocr']


class PerceiveRequest(BaseModel):
    tasks: List[str]
    hints: Optional[dict] = None


class SearchRequest(BaseModel):
    query: str
    simulation_id: Optional[str] = None
    top_k: int = 5


# Routes

@router.post("/upload/init", response_model=InitUploadResponse)
async def init_upload(
    request: InitUploadRequest,
    asset_manager: AssetManager = Depends(get_asset_manager)
):
    """
    Initialize asset upload and get signed URL.
    
    Returns presigned URL for direct upload to storage.
    NOTE: Currently using in-memory storage, not persisting files.
    """
    try:
        # Generate unique asset ID
        asset_id = uuid4()
        path = f"{request.simulation_id}/{asset_id}/{request.file_name}"
        
        # Determine asset type from MIME
        if request.mime_type.startswith('image/'):
            asset_type = 'image'
        elif request.mime_type == 'application/pdf':
            asset_type = 'pdf'
        elif request.mime_type.startswith('audio/'):
            asset_type = 'audio'
        elif request.mime_type.startswith('video/'):
            asset_type = 'video'
        elif request.mime_type == 'text/csv':
            asset_type = 'csv'
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported MIME type: {request.mime_type}")
        
        # Create asset record and save to AssetManager (in-memory)
        asset = Asset(
            id=asset_id,
            simulation_id=request.simulation_id if isinstance(request.simulation_id, UUID) else UUID(request.simulation_id),
            user_id=uuid4(),  # TODO: get from auth
            name=request.file_name,
            type=asset_type,
            mime=request.mime_type,
            size_bytes=request.file_size,
            storage_uri=f"memory://{path}",  # In-memory storage
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Save to in-memory storage
        await asset_manager.add_asset(asset)
        
        # Return a mock upload URL (in-memory mode - no actual file upload)
        # The frontend can skip the actual upload step
        mock_upload_url = f"http://localhost:8000/assets/{asset_id}/upload"
        
        return InitUploadResponse(
            asset_id=str(asset.id),
            upload_url=mock_upload_url,
            expires_at=(datetime.now()).isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/complete")
async def complete_upload(
    request: CompleteUploadRequest,
    background_tasks: BackgroundTasks
):
    """
    Complete upload and trigger perception processing.
    
    This endpoint is called after the file has been uploaded to storage.
    It enqueues perception tasks to run in the background.
    """
    try:
        # TODO: Fetch asset from database
        # For now, we'll create a dummy asset
        asset_id = UUID(request.asset_id)
        
        # Enqueue perception tasks (TODO: implement actual background queue)
        # For now, just return success
        
        return {
            "status": "processing",
            "asset_id": request.asset_id,
            "tasks": request.perception_tasks
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[AssetSummary])
async def list_assets(
    simulation_id: Optional[str] = None,
    type_filter: Optional[str] = None,
    asset_manager: AssetManager = Depends(get_asset_manager)
):
    """
    List assets, optionally filtered by simulation and type.
    """
    try:
        assets = await asset_manager.list_assets(
            simulation_id=simulation_id,
            type_filter=type_filter
        )
        
        # Convert to AssetSummary
        summaries = [
            AssetSummary(
                id=asset.id,
                name=asset.name,
                type=asset.type,
                mime=asset.mime,
                size_bytes=asset.size_bytes,
                created_at=asset.created_at
            )
            for asset in assets
        ]
        
        return summaries
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{asset_id}")
async def get_asset(
    asset_id: str,
    asset_manager: AssetManager = Depends(get_asset_manager)
):
    """
    Get details of a specific asset.
    """
    try:
        asset = await asset_manager.get_asset(asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return asset
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str):
    """
    Delete an asset and all its perceptions.
    """
    try:
        # TODO: Delete from database and storage
        storage = get_storage_provider()
        
        # Would need to fetch asset first to get storage_uri
        # await storage.delete(asset.storage_uri)
        
        return {"status": "deleted", "asset_id": asset_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{asset_id}/download")
async def get_download_url(asset_id: str):
    """
    Get signed download URL for an asset.
    """
    try:
        # TODO: Fetch asset from database
        # storage = get_storage_provider()
        # download_url = await storage.get_signed_url(asset.storage_uri)
        # return {"download_url": download_url}
        
        raise HTTPException(status_code=404, detail="Asset not found")
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{asset_id}/perceptions", response_model=List[Perception])
async def list_perceptions(
    asset_id: str,
    asset_manager: AssetManager = Depends(get_asset_manager)
):
    """
    List all perceptions for an asset.
    """
    try:
        perceptions = await asset_manager.get_perceptions(asset_id)
        return perceptions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{asset_id}/perceive", response_model=List[Perception])
async def perceive_asset(
    asset_id: str,
    request: PerceiveRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger or re-run perception tasks on an asset.
    
    Returns immediately and processes in background.
    Client should poll /assets/{asset_id}/perceptions or use SSE.
    """
    try:
        # TODO: Fetch asset, enqueue perception job
        # For now, return empty list
        return []
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/perceptions/{perception_id}")
async def get_perception(perception_id: str):
    """
    Get a specific perception by ID.
    """
    try:
        # TODO: Query from database
        raise HTTPException(status_code=404, detail="Perception not found")
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=List[SearchResult])
async def search_assets(
    request: SearchRequest,
    asset_manager: AssetManager = Depends(get_asset_manager)
):
    """
    Search assets and perceptions by semantic content.
    
    Uses hybrid search (embeddings + text) to find relevant assets.
    """
    try:
        # Generate query embedding
        from src.core.simulator.provider import Provider
        import os
        
        provider = Provider(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_BASE_URL")
        )
        
        query_embedding = await provider.generate_embedding(request.query)
        
        # Perform hybrid search
        results = await asset_manager.hybrid_search(
            query=request.query,
            query_embedding=query_embedding,
            top_k=request.top_k,
            simulation_id=request.simulation_id
        )
        
        # Format results
        search_results = []
        for embedding, score in results:
            # Get the source asset or perception
            if embedding.parent_type == 'asset':
                asset = await asset_manager.get_asset(str(embedding.parent_id))
                if asset:
                    search_results.append(SearchResult(
                        asset_id=asset.id,
                        asset_name=asset.name,
                        content_type='asset',
                        content=embedding.text_content,
                        score=score,
                        metadata=embedding.metadata
                    ))
            elif embedding.parent_type == 'perception':
                perception = await asset_manager.get_perception(str(embedding.parent_id))
                if perception:
                    asset = await asset_manager.get_asset(str(perception.asset_id))
                    if asset:
                        search_results.append(SearchResult(
                            asset_id=asset.id,
                            asset_name=asset.name,
                            content_type=perception.kind,
                            content=embedding.text_content,
                            score=score,
                            metadata=embedding.metadata
                        ))
        
        return search_results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

