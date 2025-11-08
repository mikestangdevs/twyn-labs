'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SourcesProps {
  sources: string[];
}

export default function Sources({ sources }: SourcesProps) {
  const maxSources = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  
  if (sources.length === 0) {
    return null;
  }

  const getWebsiteMetadata = (url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        hostname: urlObj.hostname,
        domain: urlObj.hostname.replace('www.', ''),
        path: urlObj.pathname,
      };
    } catch {
      return {
        hostname: url,
        domain: url,
        path: '',
      };
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-xs text-muted-foreground font-bold">Sources:</span>
      <div className="flex items-center -space-x-2">
        {sources.slice(0, maxSources).map((source: string, index: number) => (
          <Avatar
            key={`${source}-${index}`}
            className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform border-2 border-background bg-muted"
            style={{ zIndex: sources.length - index }}
            onClick={() => window.open(source, '_blank', 'noopener,noreferrer')}
          >
            <AvatarImage
              src={`https://www.google.com/s2/favicons?domain=${new URL(source).hostname}&sz=32`}
              alt={`Source ${index + 1}`}
            />
            <AvatarFallback className="text-xs bg-muted">
              {new URL(source).hostname.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {sources.length > maxSources && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="ml-2 text-xs text-muted-foreground font-medium hover:text-foreground cursor-pointer">
                +{sources.length - maxSources} more
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogTitle className="text-base font-semibold mb-3">
                All Sources
              </DialogTitle>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sources.map((source: string, index: number) => {
                  const metadata = getWebsiteMetadata(source);
                  return (
                    <div
                      key={`${source}-${index}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => {
                        window.open(source, '_blank', 'noopener,noreferrer');
                        setDialogOpen(false);
                      }}
                    >
                      <Avatar className="w-8 h-8 bg-muted">
                        <AvatarImage
                          src={`https://www.google.com/s2/favicons?domain=${metadata.hostname}&sz=32`}
                          alt={metadata.domain}
                        />
                        <AvatarFallback className="text-xs">
                          {metadata.domain.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {metadata.domain}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {source}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 