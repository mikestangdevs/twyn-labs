/**
 * React hook for asset management with real-time updates.
 * Provides state and methods for uploading, listing, and managing assets.
 */

import { useState, useEffect, useCallback } from 'react';
import { AssetsService } from '@/services/assetsService';
import {
  Asset,
  AssetSummary,
  Perception,
  AssetProcessingStatus,
  SearchResult
} from '@/types/assetTypes';

export interface UseAssetsReturn {
  // State
  assets: AssetSummary[];
  loading: boolean;
  error: string | null;
  
  // Methods
  uploadAsset: (file: File, simulationId: string, perceptionTasks?: string[]) => Promise<Asset>;
  listAssets: (simulationId: string) => Promise<void>;
  getAsset: (assetId: string) => Promise<Asset>;
  deleteAsset: (assetId: string) => Promise<void>;
  getPerceptions: (assetId: string) => Promise<Perception[]>;
  searchAssets: (query: string, simulationId?: string) => Promise<SearchResult[]>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useAssets(simulationId?: string): UseAssetsReturn {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load assets for a simulation
   */
  const listAssets = useCallback(async (simId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AssetsService.listAssets(simId);
      setAssets(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a new asset
   */
  const uploadAsset = useCallback(async (
    file: File,
    simId: string,
    perceptionTasks?: string[]
  ): Promise<Asset> => {
    setLoading(true);
    setError(null);
    
    try {
      const asset = await AssetsService.uploadAsset(simId, file, perceptionTasks);
      
      // Refresh asset list
      await listAssets(simId);
      
      return asset;
    } catch (err: any) {
      setError(err.message || 'Failed to upload asset');
      console.error('Error uploading asset:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [listAssets]);

  /**
   * Get details of a specific asset
   */
  const getAsset = useCallback(async (assetId: string): Promise<Asset> => {
    setLoading(true);
    setError(null);
    
    try {
      return await AssetsService.getAsset(assetId);
    } catch (err: any) {
      setError(err.message || 'Failed to get asset');
      console.error('Error getting asset:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an asset
   */
  const deleteAsset = useCallback(async (assetId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await AssetsService.deleteAsset(assetId);
      
      // Remove from local state
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete asset');
      console.error('Error deleting asset:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get perceptions for an asset
   */
  const getPerceptions = useCallback(async (assetId: string): Promise<Perception[]> => {
    setLoading(true);
    setError(null);
    
    try {
      return await AssetsService.listPerceptions(assetId);
    } catch (err: any) {
      setError(err.message || 'Failed to get perceptions');
      console.error('Error getting perceptions:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search assets by content
   */
  const searchAssets = useCallback(async (
    query: string,
    simId?: string
  ): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);
    
    try {
      return await AssetsService.searchAssets(query, simId);
    } catch (err: any) {
      setError(err.message || 'Failed to search assets');
      console.error('Error searching assets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh asset list
   */
  const refresh = useCallback(async () => {
    if (simulationId) {
      await listAssets(simulationId);
    }
  }, [simulationId, listAssets]);

  // Auto-load assets when simulationId changes
  useEffect(() => {
    if (simulationId) {
      listAssets(simulationId);
    }
  }, [simulationId, listAssets]);

  return {
    assets,
    loading,
    error,
    uploadAsset,
    listAssets,
    getAsset,
    deleteAsset,
    getPerceptions,
    searchAssets,
    clearError,
    refresh
  };
}

export default useAssets;

