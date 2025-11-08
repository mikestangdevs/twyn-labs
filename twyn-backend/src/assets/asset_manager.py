"""
In-memory asset manager - matches the pattern of SimulationManager.
Stores assets, perceptions, and embeddings in memory.
"""
from collections import defaultdict
from typing import Dict, List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from src.assets.models import Asset, Perception, Embedding


class AssetManager:
    """
    Manages assets, perceptions, and embeddings in memory.
    Mirrors the SimulationManager pattern.
    """
    
    def __init__(self):
        # In-memory storage
        self.assets: Dict[str, Asset] = {}
        self.perceptions: Dict[str, List[Perception]] = defaultdict(list)  # asset_id -> [perceptions]
        self.embeddings: Dict[str, List[Embedding]] = defaultdict(list)  # parent_id -> [embeddings]
        
    # Asset operations
    
    async def add_asset(self, asset: Asset) -> Asset:
        """Add a new asset to storage."""
        self.assets[str(asset.id)] = asset
        return asset
    
    async def get_asset(self, asset_id: str) -> Optional[Asset]:
        """Get asset by ID."""
        return self.assets.get(asset_id)
    
    async def list_assets(
        self,
        simulation_id: Optional[str] = None,
        type_filter: Optional[str] = None
    ) -> List[Asset]:
        """List assets, optionally filtered."""
        assets = list(self.assets.values())
        
        if simulation_id:
            assets = [a for a in assets if str(a.simulation_id) == simulation_id]
        
        if type_filter:
            assets = [a for a in assets if a.type == type_filter]
        
        return assets
    
    async def delete_asset(self, asset_id: str) -> bool:
        """Delete an asset and its perceptions."""
        if asset_id in self.assets:
            del self.assets[asset_id]
            # Clean up perceptions
            if asset_id in self.perceptions:
                del self.perceptions[asset_id]
            # Clean up embeddings
            if asset_id in self.embeddings:
                del self.embeddings[asset_id]
            return True
        return False
    
    # Perception operations
    
    async def add_perception(self, perception: Perception) -> Perception:
        """Add a perception result."""
        asset_id = str(perception.asset_id)
        self.perceptions[asset_id].append(perception)
        return perception
    
    async def get_perceptions(
        self,
        asset_id: str,
        kind: Optional[str] = None
    ) -> List[Perception]:
        """Get perceptions for an asset."""
        perceptions = self.perceptions.get(asset_id, [])
        
        if kind:
            perceptions = [p for p in perceptions if p.kind == kind]
        
        return perceptions
    
    async def get_perception(self, perception_id: str) -> Optional[Perception]:
        """Get a specific perception by ID."""
        for perceptions in self.perceptions.values():
            for p in perceptions:
                if str(p.id) == perception_id:
                    return p
        return None
    
    # Embedding operations
    
    async def add_embedding(self, embedding: Embedding) -> Embedding:
        """Add an embedding."""
        parent_id = str(embedding.parent_id)
        self.embeddings[parent_id].append(embedding)
        return embedding
    
    async def search_embeddings(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        simulation_id: Optional[str] = None
    ) -> List[tuple[Embedding, float]]:
        """
        Simple cosine similarity search over embeddings.
        Returns list of (embedding, similarity_score) tuples.
        """
        import math
        
        def cosine_similarity(a: List[float], b: List[float]) -> float:
            """Compute cosine similarity between two vectors."""
            dot = sum(x * y for x, y in zip(a, b))
            mag_a = math.sqrt(sum(x * x for x in a))
            mag_b = math.sqrt(sum(y * y for y in b))
            if mag_a == 0 or mag_b == 0:
                return 0.0
            return dot / (mag_a * mag_b)
        
        # Collect all embeddings
        all_embeddings = []
        for parent_id, emb_list in self.embeddings.items():
            for emb in emb_list:
                # Filter by simulation if specified
                if simulation_id and emb.parent_type == 'asset':
                    asset = await self.get_asset(str(emb.parent_id))
                    if asset and str(asset.simulation_id) != simulation_id:
                        continue
                all_embeddings.append(emb)
        
        # Calculate similarities
        results = []
        for emb in all_embeddings:
            score = cosine_similarity(query_embedding, emb.embedding)
            results.append((emb, score))
        
        # Sort by score and return top_k
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    async def text_search(
        self,
        query: str,
        simulation_id: Optional[str] = None
    ) -> List[tuple[Embedding, float]]:
        """
        Simple text-based search (BM25-lite).
        Returns list of (embedding, relevance_score) tuples.
        """
        query_terms = set(query.lower().split())
        
        # Collect all embeddings with text content
        all_embeddings = []
        for parent_id, emb_list in self.embeddings.items():
            for emb in emb_list:
                # Filter by simulation if specified
                if simulation_id and emb.parent_type == 'asset':
                    asset = await self.get_asset(str(emb.parent_id))
                    if asset and str(asset.simulation_id) != simulation_id:
                        continue
                all_embeddings.append(emb)
        
        # Score by term overlap
        results = []
        for emb in all_embeddings:
            if not emb.text_content:
                continue
            
            text_terms = set(emb.text_content.lower().split())
            overlap = len(query_terms & text_terms)
            if overlap > 0:
                # Simple relevance: overlap / total unique terms
                score = overlap / len(query_terms | text_terms)
                results.append((emb, score))
        
        # Sort by score
        results.sort(key=lambda x: x[1], reverse=True)
        return results
    
    async def hybrid_search(
        self,
        query: str,
        query_embedding: List[float],
        top_k: int = 5,
        simulation_id: Optional[str] = None,
        semantic_weight: float = 0.7
    ) -> List[tuple[Embedding, float]]:
        """
        Hybrid search combining semantic (embeddings) and text (BM25).
        
        Args:
            query: Text query
            query_embedding: Query embedding vector
            top_k: Number of results to return
            simulation_id: Optional filter by simulation
            semantic_weight: Weight for semantic vs text (0-1, default 0.7)
        """
        # Get semantic results
        semantic_results = await self.search_embeddings(
            query_embedding, top_k=top_k * 2, simulation_id=simulation_id
        )
        
        # Get text results
        text_results = await self.text_search(query, simulation_id=simulation_id)
        
        # Combine scores
        text_weight = 1.0 - semantic_weight
        combined_scores = {}
        
        # Add semantic scores
        for emb, score in semantic_results:
            emb_id = str(emb.id)
            combined_scores[emb_id] = {
                'embedding': emb,
                'score': score * semantic_weight
            }
        
        # Add text scores
        for emb, score in text_results:
            emb_id = str(emb.id)
            if emb_id in combined_scores:
                combined_scores[emb_id]['score'] += score * text_weight
            else:
                combined_scores[emb_id] = {
                    'embedding': emb,
                    'score': score * text_weight
                }
        
        # Sort and return top_k
        results = [(v['embedding'], v['score']) for v in combined_scores.values()]
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

