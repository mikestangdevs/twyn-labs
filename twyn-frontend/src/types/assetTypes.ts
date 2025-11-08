/**
 * TypeScript types for multimodal assets and perceptions.
 * Matches backend models in src/assets/models.py
 */

export type AssetType = 'image' | 'pdf' | 'video' | 'audio' | 'csv';

export type PerceptionKind = 
  | 'caption' 
  | 'ocr' 
  | 'entities' 
  | 'transcript' 
  | 'table' 
  | 'diagram';

export interface Asset {
  id: string;
  simulation_id: string;
  user_id: string;
  name: string;
  type: AssetType;
  mime: string;
  size_bytes: number;
  storage_uri: string;
  thumbnail_uri?: string;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Perception {
  id: string;
  asset_id: string;
  kind: PerceptionKind;
  data: Record<string, any>;
  quality_score?: number;
  locator?: string; // page number, timestamp, etc.
  created_at: string;
}

export interface PerceptionRequest {
  asset_id: string;
  tasks: PerceptionKind[];
  hints?: Record<string, any>;
}

export interface AssetSummary {
  id: string;
  name: string;
  type: AssetType;
  size_bytes: number;
  perception_count: number;
  has_caption: boolean;
  has_ocr: boolean;
  has_transcript: boolean;
}

export interface SearchResult {
  asset_id: string;
  asset_name: string;
  asset_type: AssetType;
  perception_id?: string;
  perception_kind?: PerceptionKind;
  content_snippet: string;
  locator?: string;
  score: number;
  metadata: Record<string, any>;
}

// Specific perception data structures
export interface CaptionData {
  caption: string;
  confidence: number;
  tags: string[];
}

export interface OCRData {
  text: string;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }>;
  language: string;
  confidence: number;
}

export interface TableData {
  markdown: string;
  csv: string;
  rows: number;
  columns: number;
  headers: string[];
}

export interface TranscriptData {
  text: string;
  segments: Array<{
    text: string;
    start: number; // seconds
    end: number;   // seconds
  }>;
  language: string;
  duration_seconds: number;
}

// Upload types
export interface UploadInitResponse {
  asset_id: string;
  upload_url: string;
  expires_at: string;
}

export interface UploadCompleteRequest {
  asset_id: string;
  perception_tasks?: PerceptionKind[];
}

// Asset processing status
export type AssetProcessingStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed';

export interface AssetProcessingUpdate {
  asset_id: string;
  status: AssetProcessingStatus;
  perceptions?: Perception[];
  progress?: {
    current: number;
    total: number;
  };
  error?: string;
}

