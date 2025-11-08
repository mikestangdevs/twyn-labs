'use client';

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "@/styles/markdown.module.css";
import { MarkdownPlot } from "@/components/plots/MarkdownPlot";
import { SimulationConfigData } from "@/types/simulationApiTypes";
import { AgentData } from "@/types/agent";

interface SplitMarkdownWithPlotsProps {
  markdown: string;
  config: SimulationConfigData;
  simData: AgentData[][];
}

export function SplitMarkdownWithPlots({ 
  markdown, 
  config, 
  simData 
}: SplitMarkdownWithPlotsProps) {
  // Regular expression to match ![plot](plotReference) pattern in markdown
  const plotReferenceRegex = /!\[.*?\]\((.*?)\)/g;
  const parts = [];
  
  let lastIndex = 0;
  let match;
  let index = 0;
  
  // Find all plot references and split the markdown
  while ((match = plotReferenceRegex.exec(markdown)) !== null) {
    // Add text before the plot reference
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        content: markdown.substring(lastIndex, match.index),
        key: `md-${index}`
      });
      index++;
    }
    
    // Add the plot reference
    parts.push({
      type: 'plot',
      content: match[1], // The plot reference (src attribute)
      key: `plot-${index}`
    });
    index++;
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last plot
  if (lastIndex < markdown.length) {
    parts.push({
      type: 'markdown',
      content: markdown.substring(lastIndex),
      key: `md-${index}`
    });
  }
  
  // Constants for plot optimization
  const MAX_AGENT_SAMPLES = 30; // Max individual agent lines to render
  const MAX_TIME_STEPS = 100;    // Max time steps to render for histograms
  
  // Render each part
  return (
    <>
      {parts.map(part => {
        if (part.type === 'markdown') {
          return (
            <div key={part.key} className={styles.markdownContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.content}
              </ReactMarkdown>
            </div>
          );
        } else {
          return (
            <div key={part.key}>
              <MarkdownPlot 
                src={part.content} 
                config={config} 
                simData={simData}
                maxAgentSamples={MAX_AGENT_SAMPLES}
                maxTimeSteps={MAX_TIME_STEPS}
              />
            </div>
          );
        }
      })}
    </>
  );
} 