/**
 * Asset uploader component with drag-and-drop support.
 * Allows users to upload images, PDFs, CSVs, audio, and video files.
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileIcon, ImageIcon, FileTextIcon, FileSpreadsheetIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AssetType } from '@/types/assetTypes';

interface AssetFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface AssetUploaderProps {
  simulationId?: string;
  onUploadComplete?: (assetId: string, file: File) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: AssetType[];
}

const MIME_TYPE_MAP: Record<AssetType, string[]> = {
  image: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/vnd.ms-excel'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return <ImageIcon className="h-8 w-8" />;
  if (file.type === 'application/pdf') return <FileTextIcon className="h-8 w-8" />;
  if (file.type.includes('csv') || file.type.includes('spreadsheet')) return <FileSpreadsheetIcon className="h-8 w-8" />;
  return <FileIcon className="h-8 w-8" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export function AssetUploader({
  simulationId,
  onUploadComplete,
  onError,
  maxFiles = 10,
  acceptedTypes = ['image', 'pdf', 'csv', 'audio', 'video'],
}: AssetUploaderProps) {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Get accepted MIME types
  const acceptedMimeTypes = acceptedTypes.flatMap(type => MIME_TYPE_MAP[type]);
  const acceptString = acceptedMimeTypes.join(',');

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const validFiles: AssetFile[] = [];

    for (const file of fileArray) {
      // Check if MIME type is accepted
      if (!acceptedMimeTypes.includes(file.type)) {
        onError?.(`File type not supported: ${file.name}`);
        continue;
      }

      // Check max files limit
      if (files.length + validFiles.length >= maxFiles) {
        onError?.(`Maximum ${maxFiles} files allowed`);
        break;
      }

      validFiles.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: 'pending',
        progress: 0,
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [acceptedMimeTypes, files.length, maxFiles, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const uploadFiles = async () => {
    if (!simulationId) {
      onError?.('No simulation ID provided');
      return;
    }

    // Upload files sequentially (could be parallelized if needed)
    for (const assetFile of files) {
      if (assetFile.status !== 'pending') continue;

      try {
        // Update status
        setFiles(prev =>
          prev.map(f => f.id === assetFile.id ? { ...f, status: 'uploading', progress: 0 } : f)
        );

        // Import the service dynamically
        const { AssetsService } = await import('@/services/assetsService');
        
        // Upload with progress simulation (real progress would need streaming support)
        const asset = await AssetsService.uploadAsset(
          simulationId,
          assetFile.file,
          ['caption', 'ocr'] // Default perception tasks
        );

        // Update status
        setFiles(prev =>
          prev.map(f => f.id === assetFile.id ? { ...f, status: 'completed', progress: 100 } : f)
        );

        onUploadComplete?.(asset.id, assetFile.file);

      } catch (error: any) {
        console.error('Upload error:', error);
        setFiles(prev =>
          prev.map(f => 
            f.id === assetFile.id 
              ? { ...f, status: 'error', error: error.message } 
              : f
          )
        );
        onError?.(error.message);
      }
    }
  };

  const hasFiles = files.length > 0;
  const canUpload = files.some(f => f.status === 'pending');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`
          border-2 border-dashed p-8 text-center cursor-pointer
          transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports: Images, PDFs, CSVs, Audio, Video (max {maxFiles} files)
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            accept={acceptString}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </Card>

      {/* File List */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            {canUpload && (
              <Button onClick={uploadFiles} size="sm">
                Upload All
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map(assetFile => (
              <Card key={assetFile.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(assetFile.file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {assetFile.file.name}
                      </p>
                      <Badge variant={
                        assetFile.status === 'completed' ? 'default' :
                        assetFile.status === 'error' ? 'destructive' :
                        assetFile.status === 'uploading' ? 'secondary' :
                        'outline'
                      }>
                        {assetFile.status}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(assetFile.file.size)}
                    </p>
                    
                    {assetFile.status === 'uploading' && (
                      <Progress value={assetFile.progress} className="mt-2" />
                    )}
                    
                    {assetFile.error && (
                      <p className="text-xs text-destructive mt-1">{assetFile.error}</p>
                    )}
                  </div>

                  {assetFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(assetFile.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetUploader;

