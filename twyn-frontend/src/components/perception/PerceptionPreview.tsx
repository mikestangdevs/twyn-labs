/**
 * Perception preview component.
 * Displays captions, OCR text, tables, transcripts, and other perception results.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileTextIcon,
  ImageIcon,
  TableIcon,
  MicIcon,
  AlertCircleIcon
} from 'lucide-react';
import type {
  Perception,
  CaptionData,
  OCRData,
  TableData,
  TranscriptData
} from '@/types/assetTypes';

interface PerceptionPreviewProps {
  assetId: string;
  perceptions: Perception[];
  loading?: boolean;
  error?: string | null;
}

function CaptionView({ data }: { data: CaptionData }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Caption:</p>
        <p className="text-sm text-muted-foreground">{data.caption}</p>
      </div>
      
      {data.tags && data.tags.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Tags:</p>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      )}
      
      {data.confidence && (
        <div>
          <p className="text-sm font-medium">
            Confidence: {(data.confidence * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}

function OCRView({ data }: { data: OCRData }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Extracted Text:</p>
        <div className="h-[300px] w-full rounded border p-4 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{data.text}</pre>
        </div>
      </div>
      
      {data.language && (
        <p className="text-sm text-muted-foreground">
          Language: {data.language}
        </p>
      )}
      
      {data.confidence && (
        <p className="text-sm text-muted-foreground">
          Confidence: {(data.confidence * 100).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

function TableView({ data }: { data: TableData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-medium">Rows</p>
          <p className="text-muted-foreground">{data.rows || 'N/A'}</p>
        </div>
        <div>
          <p className="font-medium">Columns</p>
          <p className="text-muted-foreground">{data.columns || 'N/A'}</p>
        </div>
        <div>
          <p className="font-medium">Headers</p>
          <p className="text-muted-foreground">
            {data.headers?.length || 0}
          </p>
        </div>
      </div>
      
      {data.markdown && (
        <div>
          <p className="text-sm font-medium mb-2">Table (Markdown):</p>
          <div className="h-[300px] w-full rounded border p-4 overflow-y-auto">
            <pre className="text-sm">{data.markdown}</pre>
          </div>
        </div>
      )}
      
      {data.csv && (
        <div>
          <p className="text-sm font-medium mb-2">CSV Format:</p>
          <div className="h-[200px] w-full rounded border p-4 overflow-y-auto">
            <pre className="text-sm">{data.csv}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function TranscriptView({ data }: { data: TranscriptData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Duration</p>
          <p className="text-muted-foreground">
            {data.duration_seconds ? `${data.duration_seconds}s` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="font-medium">Language</p>
          <p className="text-muted-foreground">{data.language || 'N/A'}</p>
        </div>
      </div>
      
      {data.text && (
        <div>
          <p className="text-sm font-medium mb-2">Full Transcript:</p>
          <div className="h-[200px] w-full rounded border p-4 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{data.text}</p>
          </div>
        </div>
      )}
      
      {data.segments && data.segments.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Segments:</p>
          <div className="h-[300px] w-full rounded border p-4 overflow-y-auto">
            <div className="space-y-3">
              {data.segments.map((segment, idx) => (
                <div key={idx} className="text-sm">
                  <p className="text-muted-foreground text-xs mb-1">
                    {segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s
                  </p>
                  <p>{segment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PERCEPTION_ICONS = {
  caption: ImageIcon,
  ocr: FileTextIcon,
  table: TableIcon,
  transcript: MicIcon,
  entities: FileTextIcon,
  diagram: ImageIcon,
};

export function PerceptionPreview({
  assetId,
  perceptions,
  loading = false,
  error = null
}: PerceptionPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    // Set the first perception kind as active tab
    if (perceptions.length > 0 && !activeTab) {
      setActiveTab(perceptions[0].kind);
    }
  }, [perceptions, activeTab]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (perceptions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No perceptions available for this asset.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group perceptions by kind
  const groupedPerceptions = perceptions.reduce((acc, perception) => {
    if (!acc[perception.kind]) {
      acc[perception.kind] = [];
    }
    acc[perception.kind].push(perception);
    return acc;
  }, {} as Record<string, Perception[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Perception Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(groupedPerceptions).length}, 1fr)` }}>
            {Object.keys(groupedPerceptions).map(kind => {
              const Icon = PERCEPTION_ICONS[kind as keyof typeof PERCEPTION_ICONS] || FileTextIcon;
              return (
                <TabsTrigger key={kind} value={kind} className="capitalize">
                  <Icon className="h-4 w-4 mr-2" />
                  {kind}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(groupedPerceptions).map(([kind, perceptionList]) => (
            <TabsContent key={kind} value={kind} className="mt-4">
              {perceptionList.map((perception, idx) => (
                <div key={perception.id || idx}>
                  {kind === 'caption' && <CaptionView data={perception.data as CaptionData} />}
                  {kind === 'ocr' && <OCRView data={perception.data as OCRData} />}
                  {kind === 'table' && <TableView data={perception.data as TableData} />}
                  {kind === 'transcript' && <TranscriptView data={perception.data as TranscriptData} />}
                  {kind === 'entities' && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Entities:</p>
                      <pre className="text-sm bg-muted p-4 rounded">
                        {JSON.stringify(perception.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PerceptionPreview;

