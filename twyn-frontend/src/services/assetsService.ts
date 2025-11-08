/**
 * Asset service for multimodal file upload and perception.
 * Handles communication with backend asset APIs.
 */

import { 
  Asset, 
  AssetSummary, 
  Perception, 
  PerceptionRequest, 
  UploadInitResponse,
  SearchResult
} from '@/types/assetTypes';

const BASE_URL = 'http://localhost:8000';

export class AssetsAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AssetsAPIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AssetsAPIError(
      errorData.detail || `HTTP Error: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

export class AssetsService {
  
  /**
   * Initialize asset upload and get signed upload URL
   */
  static async initUpload(
    simulationId: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<UploadInitResponse> {
    const response = await fetch(`${BASE_URL}/assets/upload/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        simulation_id: simulationId,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
      }),
    });

    return handleResponse<UploadInitResponse>(response);
  }

  /**
   * Upload file directly to storage using signed URL
   */
  static async uploadFile(
    uploadUrl: string,
    file: File
  ): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new AssetsAPIError(
        'Failed to upload file to storage',
        response.status
      );
    }
  }

  /**
   * Complete upload and trigger perception processing
   */
  static async completeUpload(
    assetId: string,
    perceptionTasks?: string[]
  ): Promise<Asset> {
    const response = await fetch(`${BASE_URL}/assets/upload/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset_id: assetId,
        perception_tasks: perceptionTasks || ['caption', 'ocr'],
      }),
    });

    return handleResponse<Asset>(response);
  }

  /**
   * Full upload workflow: init → upload → complete
   * NOTE: In-memory mode skips actual file upload
   */
  static async uploadAsset(
    simulationId: string,
    file: File,
    perceptionTasks?: string[]
  ): Promise<Asset> {
    // Step 1: Initialize upload
    const { asset_id, upload_url } = await this.initUpload(
      simulationId,
      file.name,
      file.size,
      file.type
    );

    // Step 2: Upload to storage (skip for in-memory mode)
    // Check if it's a mock URL (in-memory mode)
    const isMockUrl = upload_url.includes('localhost:8000');
    if (!isMockUrl) {
      await this.uploadFile(upload_url, file);
    }
    // In memory mode, we skip actual file upload - metadata is enough

    // Step 3: Complete and trigger perception
    return await this.completeUpload(asset_id, perceptionTasks);
  }

  /**
   * List all assets for a simulation
   */
  static async listAssets(
    simulationId: string,
    typeFilter?: string
  ): Promise<AssetSummary[]> {
    const params = new URLSearchParams({ simulation_id: simulationId });
    if (typeFilter) {
      params.append('type', typeFilter);
    }

    const response = await fetch(`${BASE_URL}/assets?${params}`);
    return handleResponse<AssetSummary[]>(response);
  }

  /**
   * Get details of a specific asset
   */
  static async getAsset(assetId: string): Promise<Asset> {
    const response = await fetch(`${BASE_URL}/assets/${assetId}`);
    return handleResponse<Asset>(response);
  }

  /**
   * Delete an asset
   */
  static async deleteAsset(assetId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/assets/${assetId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new AssetsAPIError('Failed to delete asset', response.status);
    }
  }

  /**
   * Get download URL for an asset
   */
  static async getDownloadUrl(assetId: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/assets/${assetId}/download`);
    const data = await handleResponse<{ download_url: string }>(response);
    return data.download_url;
  }

  /**
   * List all perceptions for an asset
   */
  static async listPerceptions(assetId: string): Promise<Perception[]> {
    const response = await fetch(`${BASE_URL}/assets/${assetId}/perceptions`);
    return handleResponse<Perception[]>(response);
  }

  /**
   * Get a specific perception
   */
  static async getPerception(perceptionId: string): Promise<Perception> {
    const response = await fetch(`${BASE_URL}/perceptions/${perceptionId}`);
    return handleResponse<Perception>(response);
  }

  /**
   * Trigger or re-run perception tasks on an asset
   */
  static async perceive(
    assetId: string,
    tasks: string[],
    hints?: Record<string, any>
  ): Promise<Perception[]> {
    const response = await fetch(`${BASE_URL}/assets/${assetId}/perceive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks,
        hints,
      }),
    });

    return handleResponse<Perception[]>(response);
  }

  /**
   * Search assets by content
   */
  static async searchAssets(
    query: string,
    simulationId?: string,
    topK: number = 5
  ): Promise<SearchResult[]> {
    const response = await fetch(`${BASE_URL}/assets/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        simulation_id: simulationId,
        top_k: topK,
      }),
    });

    return handleResponse<SearchResult[]>(response);
  }
}

export default AssetsService;

