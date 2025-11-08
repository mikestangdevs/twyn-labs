-- Migration: Add multimodal vision & asset tables
-- Date: 2025-11-08
-- Description: Tables for asset storage, perception results, and embeddings

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Assets table: stores uploaded files
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'pdf', 'video', 'audio', 'csv')),
  mime TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  storage_uri TEXT NOT NULL UNIQUE,
  thumbnail_uri TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perception results: derived data from processing assets
CREATE TABLE IF NOT EXISTS asset_perceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('caption', 'ocr', 'entities', 'transcript', 'table', 'diagram')),
  data JSONB NOT NULL,
  quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
  locator TEXT,  -- page number, timestamp, region, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS asset_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL CHECK (parent_type IN ('asset', 'perception')),
  parent_id UUID NOT NULL,
  embedding VECTOR(1536),  -- OpenAI ada-002 dimension
  text_content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend simulations table with asset tracking
ALTER TABLE simulations 
  ADD COLUMN IF NOT EXISTS has_assets BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS asset_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asset_processing_status TEXT DEFAULT 'none'
    CHECK (asset_processing_status IN ('none', 'processing', 'completed', 'failed'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_simulation ON assets(simulation_id);
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_created ON assets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_perceptions_asset ON asset_perceptions(asset_id);
CREATE INDEX IF NOT EXISTS idx_perceptions_kind ON asset_perceptions(kind);
CREATE INDEX IF NOT EXISTS idx_perceptions_data ON asset_perceptions USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_perceptions_created ON asset_perceptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_embeddings_parent ON asset_embeddings(parent_type, parent_id);
-- IVFFlat index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON asset_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Row-level security policies (if using Supabase RLS)
-- Users can only access their own assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY assets_user_policy ON assets
  FOR ALL
  USING (user_id = auth.uid());

-- Users can only access perceptions of their assets
ALTER TABLE asset_perceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY perceptions_user_policy ON asset_perceptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_perceptions.asset_id
        AND assets.user_id = auth.uid()
    )
  );

-- Users can only access embeddings of their assets/perceptions
ALTER TABLE asset_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY embeddings_user_policy ON asset_embeddings
  FOR ALL
  USING (
    (parent_type = 'asset' AND EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_embeddings.parent_id
        AND assets.user_id = auth.uid()
    ))
    OR
    (parent_type = 'perception' AND EXISTS (
      SELECT 1 FROM asset_perceptions ap
      JOIN assets a ON a.id = ap.asset_id
      WHERE ap.id = asset_embeddings.parent_id
        AND a.user_id = auth.uid()
    ))
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update simulation asset count
CREATE OR REPLACE FUNCTION update_simulation_asset_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE simulations 
    SET asset_count = asset_count + 1,
        has_assets = TRUE
    WHERE id = NEW.simulation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE simulations 
    SET asset_count = asset_count - 1,
        has_assets = (asset_count - 1 > 0)
    WHERE id = OLD.simulation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sim_asset_count
  AFTER INSERT OR DELETE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_asset_count();

-- Comments for documentation
COMMENT ON TABLE assets IS 'Stores uploaded multimodal assets (images, PDFs, audio, video, CSV)';
COMMENT ON TABLE asset_perceptions IS 'Stores perception results from processing assets (captions, OCR, transcripts, etc.)';
COMMENT ON TABLE asset_embeddings IS 'Stores vector embeddings for semantic search over assets and perceptions';
COMMENT ON COLUMN asset_perceptions.locator IS 'Location reference: page number, timestamp, row range, etc.';
COMMENT ON COLUMN asset_embeddings.parent_type IS 'What the embedding represents: asset metadata or perception content';

