'use client';

import { useState, useEffect } from 'react';
import { SimulationState } from '@/types/simulationApiTypes';
import { SplitMarkdownWithPlots } from './SplitMarkdownWithPlots';
import { Loader2, Share2, Download } from 'lucide-react';
import { DatabaseService } from '@/services/databaseService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';


export default function ResultsTab({ simulationState }: { simulationState: SimulationState }) {

  const handleShareLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('Preparing PDF with graphs...');
      
      // Capture all chart containers (including titles)
      const chartContainers = document.querySelectorAll('.recharts-wrapper');
      const capturedCharts: Array<{ title: string; image: string }> = [];
      
      chartContainers.forEach((container) => {
        try {
          // Try to find a title/label near the chart
          let chartTitle = 'Chart';
          
          // Look for heading elements before the chart
          const parent = container.parentElement;
          if (parent) {
            // Check for h3 or h4 elements in the same container
            const headings = parent.querySelectorAll('h3, h4, .chart-title, [class*="title"]');
            if (headings.length > 0) {
              chartTitle = headings[headings.length - 1].textContent || 'Chart';
            }
            
            // Also check the plot reference in markdown to extract variable name
            const previousText = parent.textContent || '';
            const plotMatch = previousText.match(/([A-Za-z_]+)\s*&\s*([A-Za-z_]+)/);
            if (plotMatch) {
              chartTitle = `${plotMatch[2]} - ${plotMatch[1]}`;
            }
          }
          
          // Get the SVG element
          const svg = container.querySelector('svg.recharts-surface');
          if (!svg) return;
          
          // Clone the SVG
          const svgClone = svg.cloneNode(true) as SVGElement;
          
          // Get computed styles
          const computedStyle = window.getComputedStyle(svg);
          svgClone.setAttribute('width', computedStyle.width || '700');
          svgClone.setAttribute('height', computedStyle.height || '400');
          
          // Serialize the SVG
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svgClone);
          
          // Encode as data URL
          const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
          
          capturedCharts.push({
            title: chartTitle,
            image: svgDataUrl
          });
        } catch (err) {
          console.error('Error capturing chart', err);
        }
      });

      // Create a clean version for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow pop-ups to download PDF');
        return;
      }

      // Get the markdown content
      const markdownContent = simulationState.analysis || '';
      const title = simulationState.title || 'Simulation Report';
      
      // Process markdown to replace plot references with captured images
      let processedContent = markdownContent;
      let chartIndex = 0;
      
      // Replace ![plot](...) with actual chart images WITH TITLES
      processedContent = processedContent.replace(/!\[.*?\]\((.*?)\)/g, (match, plotRef) => {
        const chartData = capturedCharts[chartIndex];
        chartIndex++;
        if (chartData) {
          // Extract variable and group name from plot reference
          const [itemName, groupName] = plotRef.split('&');
          const displayTitle = chartData.title !== 'Chart' ? chartData.title : 
            (itemName && groupName ? `${groupName} - ${itemName}` : 'Chart');
          
          return `<div style="margin: 30px 0; page-break-inside: avoid;">
            <h4 style="text-align: center; margin-bottom: 10px; color: #333;">${displayTitle}</h4>
            <img src="${chartData.image}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
          </div>`;
        }
        return '';
      });
      
      // Convert markdown to proper HTML comprehensively
      // First, normalize line endings and clean up
      processedContent = processedContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      // Process headers FIRST before anything else (with flexible spacing)
      processedContent = processedContent
        .replace(/^####\s+(.*?)$/gm, '<h4>$1</h4>')
        .replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>')
        // Also catch headers without space after #
        .replace(/^####([^\s].*?)$/gm, '<h4>$1</h4>')
        .replace(/^###([^\s].*?)$/gm, '<h3>$1</h3>')
        .replace(/^##([^\s].*?)$/gm, '<h2>$1</h2>')
        .replace(/^#([^\s].*?)$/gm, '<h1>$1</h1>');
      
      // Now process other markdown
      processedContent = processedContent
        // Code blocks (preserve them before other processing)
        .replace(/```[\s\S]*?```/g, (match) => {
          const code = match.replace(/```\w*\n?/g, '').trim();
          return `<pre><code>${code}</code></pre>`;
        })
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold and italic (bold first to avoid conflicts)
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\_\_\_(.*?)\_\_\_/g, '<strong><em>$1</em></strong>')
        .replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>')
        .replace(/\_(.*?)\_/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
        // Lists (unordered)
        .replace(/^\* (.*?)$/gm, '<li>$1</li>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/^(\+ .*?)$/gm, '<li>$1</li>')
        // Lists (ordered)
        .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
        // Wrap consecutive <li> in <ul> or <ol>
        .replace(/(<li>.*?<\/li>(\n)*)+/g, (match) => {
          return '<ul>' + match + '</ul>';
        })
        // Blockquotes
        .replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>')
        // Horizontal rules
        .replace(/^---$/gm, '<hr>')
        .replace(/^\*\*\*$/gm, '<hr>')
        // Convert double newlines to paragraph breaks
        .replace(/\n\n+/g, '</p><p>')
        // Single newlines become line breaks
        .replace(/\n/g, '<br>')
        // Wrap content in paragraphs (but not headers or other block elements)
        .split(/<(h[1-6]|ul|ol|pre|blockquote|hr)>/)
        .map((chunk, index) => {
          // Every odd index is a tag name, skip it
          if (index % 2 === 1) return '<' + chunk + '>';
          // Even indices are content between tags
          if (chunk.trim() && !chunk.startsWith('</')) {
            return '<p>' + chunk + '</p>';
          }
          return chunk;
        })
        .join('')
        // Clean up excessive tags
        .replace(/<p><\/p>/g, '')
        .replace(/<p>\s*<br>\s*<\/p>/g, '')
        .replace(/<p>(<\/[^>]+>)/g, '$1')
        .replace(/(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<h[1-6]>)/g, '$1');
      
      // Create a print-friendly HTML document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                max-width: 900px;
                margin: 0 auto;
                padding: 40px 20px;
                color: #333;
              }
              h1 { 
                font-size: 28px; 
                font-weight: 700; 
                margin: 30px 0 20px 0; 
                border-bottom: 2px solid #000; 
                padding-bottom: 10px; 
                line-height: 1.3;
              }
              h1:first-child { margin-top: 0; }
              h2 { 
                font-size: 22px; 
                font-weight: 700; 
                margin: 30px 0 15px 0; 
                border-bottom: 1px solid #ccc; 
                padding-bottom: 8px; 
                line-height: 1.3;
              }
              h3 { 
                font-size: 18px; 
                font-weight: 700; 
                margin: 25px 0 12px 0; 
                line-height: 1.3;
              }
              h4 { 
                font-size: 16px; 
                font-weight: 600; 
                margin: 20px 0 10px 0; 
                line-height: 1.3;
              }
              p { margin: 12px 0; line-height: 1.6; }
              strong { font-weight: 700; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
              code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 14px; }
              pre code { background: none; padding: 0; }
              img { max-width: 100%; height: auto; page-break-inside: avoid; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 20px; color: #666; }
              @media print {
                body { padding: 20px; }
                h1, h2, h3 { page-break-after: avoid; }
                pre, table, img { page-break-inside: avoid; }
              }
              .metadata { color: #666; font-size: 14px; margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
              .metadata p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="metadata">
              <p><strong>Simulation ID:</strong> ${simulationState.simulation_id}</p>
              <p><strong>Status:</strong> ${simulationState.status}</p>
              <p><strong>Steps:</strong> ${simulationState.current_step || 'N/A'}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div>
              ${processedContent}
            </div>
            <script>
              // Auto-print when loaded
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success('Opening print dialog - save as PDF');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  // Show loading state if report is being processed
  if (simulationState.status === 'processing_analysis') {
    return (
      <div className="p-4 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p>Analyzing simulation results...</p>
      </div>
    );
  }

  // Show message if report is not yet available
  if (simulationState.status !== 'completed_analysis' || !simulationState.analysis || !simulationState.config) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">
          Results will be available once the simulation report is completed.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex justify-center h-[calc(100vh-7rem)]">
      <div className="bg-muted rounded-xl p-4 max-w-5xl pt-1 text-sm w-full h-full overflow-y-auto flex flex-col">
        <div className="flex justify-end gap-2 mb-4">
          <Button
            onClick={handleShareLink}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SplitMarkdownWithPlots
            markdown={simulationState.analysis}
            config={simulationState.config}
            simData={simulationState.data}
          />
        </div>
      </div>
    </div>
  );
} 