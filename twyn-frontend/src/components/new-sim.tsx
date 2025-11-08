'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Component, Loader2, Plus, X, FileIcon } from 'lucide-react';
import { SimulationService } from '@/services/simulationService';
import { DatabaseService } from '@/services/databaseService';
import { useUser } from '@/contexts/user-context';
import { toast } from "sonner";

// Predefined prompts
const predefinedPrompts = [
  {
    title: "Market Entry Strategy",
    prompt: "Simulate how local competitors, suppliers, and customers react when a major US retailer enters the European market. Track pricing changes, customer loyalty shifts, and supplier negotiations."
  },
  {
    title: "Product Launch Impact",
    prompt: "Model consumer adoption of a new electric vehicle in three different income segments. Observe early adopters, price sensitivity, and word-of-mouth effects over the first two years."
  },
  {
    title: "Competitive Response",
    prompt: "Simulate how established banks react when a fintech startup offers zero-fee checking accounts. Track customer switching, fee adjustments, and service improvements."
  },
  {
    title: "Merger Integration",
    prompt: "Model employee reactions when two pharmaceutical companies merge, including different departments, seniority levels, and geographic locations. Track productivity, turnover, and cultural adaptation."
  },
  {
    title: "Digital Transformation",
    prompt: "Simulate how employees across different age groups and departments respond to mandatory adoption of new AI tools. Observe training uptake, resistance patterns, and productivity changes."
  },
  {
    title: "Remote Work Policy",
    prompt: "Model the effects of a Fortune 500 company switching from full remote to hybrid work. Include managers, individual contributors, and support staff. Track collaboration, satisfaction, and real estate costs."
  },
  {
    title: "Dynamic Pricing Strategy",
    prompt: "Simulate customer reactions when an airline implements AI-driven dynamic pricing. Include business travelers, leisure customers, and price-sensitive segments. Track booking patterns and revenue."
  },
  {
    title: "Subscription Model Transition",
    prompt: "Model how existing customers react when a software company switches from one-time purchases to monthly subscriptions. Observe churn, upgrade patterns, and customer lifetime value."
  },
  {
    title: "Premium Tier Introduction",
    prompt: "Simulate market response when a streaming service launches a premium tier with exclusive content. Track subscriber migration, new sign-ups, and competitor reactions."
  },
  {
    title: "Supply Chain Disruption",
    prompt: "Model how a global electronics manufacturer adapts when a key supplier faces production delays. Include procurement teams, manufacturing plants, and retail partners."
  },
  {
    title: "Automation Implementation",
    prompt: "Simulate workforce and customer reactions when a retail chain introduces self-checkout systems in 50% of stores. Track employee displacement, customer satisfaction, and operational efficiency."
  },
  {
    title: "Sustainability Initiative",
    prompt: "Model stakeholder responses when a fashion brand commits to 100% sustainable materials. Include suppliers, customers, investors, and environmental groups."
  },
  {
    title: "Regulatory Compliance",
    prompt: "Simulate how financial institutions adapt to new data privacy regulations. Include compliance teams, IT departments, and customer service. Track implementation costs and customer trust."
  },
  {
    title: "Industry Regulation",
    prompt: "Model how ride-sharing drivers, passengers, and traditional taxi companies react to new city regulations requiring background checks and vehicle inspections."
  },
  {
    title: "ESG Reporting Requirements",
    prompt: "Simulate how public companies across different industries respond to mandatory ESG reporting. Include small-cap and large-cap firms, tracking compliance costs and investor reactions."
  }
];

export function NewSim() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ [key: number]: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useUser();

  // Extract first name from full_name
  const getFirstName = () => {
    if (user?.user_metadata?.full_name) {
      const name = user.user_metadata.full_name.trim();
      const firstName = name.split(' ')[0];
      return firstName;
    }
    return null;
  };

  // Get appropriate greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Afternoon';
    } else {
      return 'Evening';
    }
  };

  const firstName = getFirstName();
  const greeting = getGreeting();

  const handleSend = async () => {
    if (prompt.trim()) {
      setIsLoading(true);
      
      try {
        // Create simulation request
        const { simulation_id } = await SimulationService.createSimulation(prompt.trim());
        
        if (!simulation_id) {
          throw new Error('No simulation ID received from server');
        }

        // Add simulation to database
        if (!user?.id) {
          throw new Error('User not authenticated');
        }
        
        await DatabaseService.addSimulation(simulation_id, user.id, 'Untitled Simulation', prompt.trim(), 'pending');

        // Upload assets if any files were selected
        if (selectedFiles.length > 0) {
          const { AssetsService } = await import('@/services/assetsService');
          
          // Upload files in parallel
          const uploadPromises = selectedFiles.map(file => 
            AssetsService.uploadAsset(simulation_id, file, ['caption', 'ocr', 'table'])
              .catch(err => {
                console.error(`Failed to upload ${file.name}:`, err);
                // Don't block on individual file upload failures
                return null;
              })
          );
          
          await Promise.all(uploadPromises);
          
          toast.success(`Uploaded ${selectedFiles.length} file(s)`, {
            description: "Processing with vision capabilities"
          });
        }

        // Navigate to sim page immediately
        router.push(`/sim/${simulation_id}`);

        // Run architect in the background without waiting
        SimulationService.runArchitect(simulation_id).catch(error => {
          console.error('Error running architect:', error);
          // We can optionally show a toast here if architect fails, but user will already be on chat page
        });
        
        // Only set loading to false if everything succeeded
        setIsLoading(false);

      } catch (error) {
        console.error('Error creating simulation:', error);
        toast.error("Failed to create simulation", {
          description: "Please try again later",
        });
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Let the default behavior happen (new line)
        return;
      }
      // Prevent the default enter behavior
      e.preventDefault();
      handleSend();
    }
  };

  const handlePredefinedPrompt = (predefinedPrompt: string) => {
    setPrompt(predefinedPrompt);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const startIndex = selectedFiles.length;
    
    // Create preview URLs for image files
    files.forEach((file, idx) => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews(prev => ({ ...prev, [startIndex + idx]: previewUrl }));
      }
    });
    
    setSelectedFiles(prev => [...prev, ...files]);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    // Revoke the preview URL to free memory
    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
      setFilePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
        return newPreviews;
      });
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const startIndex = selectedFiles.length;

    // Filter for supported file types
    const supportedFiles = files.filter(file => {
      return file.type.startsWith('image/') || 
             file.type === 'application/pdf' ||
             file.type === 'text/csv' ||
             file.type === 'application/json' ||
             file.type === 'text/plain' ||
             file.type.includes('document');
    });

    if (supportedFiles.length === 0) {
      toast.error("Unsupported file type", {
        description: "Please drop images, PDFs, CSVs, or documents"
      });
      return;
    }

    if (supportedFiles.length !== files.length) {
      toast.warning(`${files.length - supportedFiles.length} file(s) skipped`, {
        description: "Some files were unsupported"
      });
    }

    // Create preview URLs for image files
    supportedFiles.forEach((file, idx) => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews(prev => ({ ...prev, [startIndex + idx]: previewUrl }));
      }
    });

    setSelectedFiles(prev => [...prev, ...supportedFiles]);

    if (supportedFiles.length > 0) {
      toast.success(`${supportedFiles.length} file(s) added`, {
        description: "Ready to upload with your simulation"
      });
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-semibold">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h2>
        </div>
        
        <div 
          className={`rounded-3xl border transition-all ${
            isDragging 
              ? 'border-primary border-2 bg-primary/5' 
              : 'border-border'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Top section - Textarea */}
          <div className="py-2 px-2 -mb-1 relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDragging ? "Drop files here..." : "Simulate anything"}
              className="min-h-[30px] max-h-[200px] border-0 !bg-transparent resize-none focus-visible:ring-0 shadow-none"
              disabled={isLoading}
            />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-sm text-primary font-medium">
                  Drop files to upload
                </div>
              </div>
            )}
          </div>
          
          {/* Selected files display */}
          {selectedFiles.length > 0 && (
            <div className="px-3 pb-2">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="relative group rounded-lg overflow-hidden border border-border bg-secondary"
                  >
                    {filePreviews[index] ? (
                      // Image preview
                      <div className="relative">
                        <img 
                          src={filePreviews[index]} 
                          alt={file.name}
                          className="h-20 w-20 object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 h-5 w-5 p-0 bg-black/50 hover:bg-destructive text-white hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      // Non-image file
                      <div className="h-20 w-32 flex flex-col items-center justify-center gap-1 px-2">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs truncate max-w-full text-center">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Bottom section - Button area */}
          <div className="px-2 pb-2 flex justify-between items-center">
            <Button 
              onClick={handleFileUpload}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 h-8 w-8 p-0 rounded-full cursor-pointer"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleSend} 
              disabled={!prompt.trim() || isLoading}
              size="sm"
              className="flex items-center gap-2 h-8 w-8 rounded-full cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Component className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Predefined prompts */}
        <div className="mt-4 flex flex-wrap gap-2 opacity-60">
          {predefinedPrompts.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handlePredefinedPrompt(item.prompt)}
              className="text-xs rounded-full cursor-pointer"
              disabled={isLoading}
            >
              {item.title}
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
} 