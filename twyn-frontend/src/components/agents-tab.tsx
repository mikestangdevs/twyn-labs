'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Brain, Info, FileIcon, ImageIcon, FileTextIcon } from 'lucide-react';
import { SimulationService } from '@/services/simulationService';
import { SimulationState, SimulationConfigData } from '@/types/simulationApiTypes';
import Sources from './sources';
import { useAssets } from '@/hooks/useAssets';
import { PerceptionPreview } from './perception/PerceptionPreview';

// Utility function to format names by replacing underscores with spaces
const formatName = (name: string): string => {
  return name.replace(/_/g, ' ');
};

export default function AgentsTab({ simulationState }: { simulationState: SimulationState }) {
  const [isStarting, setIsStarting] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Parse the config data if available
  const configData: SimulationConfigData | null = simulationState?.config || null;
  const agentGroups = configData?.agent_groups || {};
  const numberOfSteps = configData?.number_of_steps || 0;
  const stepUnit = configData?.step_unit || 'steps';
  const sources = simulationState?.sources || [];

  // Load assets for this simulation
  const { assets, loading: assetsLoading, getPerceptions } = useAssets(simulationState.simulation_id);
  const [perceptions, setPerceptions] = useState<any[]>([]);
  const [perceptionsLoading, setPerceptionsLoading] = useState(false);

  // Load perceptions when asset is selected
  useEffect(() => {
    if (selectedAssetId) {
      setPerceptionsLoading(true);
      getPerceptions(selectedAssetId)
        .then(setPerceptions)
        .catch(err => console.error('Failed to load perceptions:', err))
        .finally(() => setPerceptionsLoading(false));
    }
  }, [selectedAssetId, getPerceptions]);

  // Check if simulation is ready to start
  const isProcessingConfig = simulationState.status === 'pending' || simulationState.status === 'processing_config';
  const isReadyToStart = simulationState.status === 'completed_config';
  const isRunning = simulationState.status === 'processing_simulation';
  const isCompleted = simulationState.status === 'completed_simulation';

  // Subscribe to raw data updates when simulation is running
  const currentStep = simulationState.current_step || 0;

  // Start analysis when simulation is completed
  useEffect(() => {
    if (isCompleted) {
      SimulationService.runAnalyst(simulationState.simulation_id).catch(error => {
        // Just log the error, don't take any other action
        console.error('Error starting analysis:', error);
      });
    }
  }, [simulationState.simulation_id, isCompleted]);

  // Calculate progress for the progress bar
  const progressValue = isCompleted ? 100 : (currentStep / numberOfSteps) * 100;

  // Handle start simulation
  const handleStartSimulation = async () => {
    try {
      setIsStarting(true);
      await SimulationService.runSimulator(simulationState.simulation_id);
    } catch (error) {
      console.error('Failed to start simulation:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // Render agent group with skeleton enhancements for missing data
  const renderAgentGroupWithSkeletons = (groupName: string, groupConfig: NonNullable<SimulationConfigData['agent_groups']>[string]) => (
    <Card key={groupName} className="w-full">
      <CardHeader className='-mb-2'>
        <CardTitle>
          {groupName.startsWith('skeleton-') ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            formatName(groupName)
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='text-xs border border-border rounded-md p-2 w-fit font-semibold'>
          {groupName.startsWith('skeleton-') ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            `${groupConfig.number_of_agents || 0} Personas`
          )}
        </div>

        {groupConfig.memory_length ? (
          <div className='flex gap-2'>
            <Brain className='w-4 h-4 text-muted-foreground flex-shrink-0' />
            <span className='text-xs text-muted-foreground font-medium'>
              Memory length of {groupConfig.memory_length} {stepUnit}
            </span>
          </div>
        ) : isProcessingConfig && (
          <div className='flex gap-2'>
            <Brain className='w-4 h-4 text-muted-foreground flex-shrink-0' />
            <Skeleton className="h-4 w-24" />
          </div>
        )}

        {groupConfig.description ? (
          <div className='flex gap-2 items-start'>
            <Info className='w-4 h-4 text-muted-foreground flex-shrink-0' />
            <span className='text-xs text-muted-foreground font-medium'>
              {groupConfig.description}
            </span>
          </div>
        ) : isProcessingConfig && (
          <div className='flex gap-2 items-start'>
            <Info className='w-4 h-4 text-muted-foreground flex-shrink-0' />
            <Skeleton className="h-4 w-40" />
          </div>
        )}

        {(groupConfig.variables && Object.keys(groupConfig.variables).length > 0) || isProcessingConfig ? (
          <div className='flex flex-col gap-2'>
            <span className='text-normal font-semibold'>Variables</span>
            <TooltipProvider>
              <div className='flex flex-wrap gap-1'>
                {groupConfig.variables && Object.entries(groupConfig.variables).map(([varName, varConfig]: [string, NonNullable<NonNullable<SimulationConfigData['agent_groups']>[string]['variables']>[string]]) => (
                  <Tooltip key={varName}>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">{formatName(varName)}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{varConfig?.description || `Variable: ${varName}`}</p>
                      {varConfig?.unit && <p>Unit: {varConfig.unit}</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {isProcessingConfig && <Skeleton className="h-6 w-16 rounded-full" />}
              </div>
            </TooltipProvider>
          </div>
        ) : null}

        {(groupConfig.actions && Object.keys(groupConfig.actions).length > 0) || isProcessingConfig ? (
          <div className='flex flex-col gap-2'>
            <span className='text-normal font-semibold'>Actions</span>
            <TooltipProvider>
              <div className='flex flex-wrap gap-1'>
                {groupConfig.actions && Object.entries(groupConfig.actions).map(([actionName, actionConfig]: [string, NonNullable<NonNullable<SimulationConfigData['agent_groups']>[string]['actions']>[string]]) => (
                  <Tooltip key={actionName}>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">{formatName(actionName)}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{actionConfig?.description || `Action: ${actionName}`}</p>
                      {actionConfig?.unit && <p>Unit: {actionConfig.unit}</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {isProcessingConfig && <Skeleton className="h-6 w-18 rounded-full" />}
              </div>
            </TooltipProvider>
          </div>
        ) : null}

      </CardContent>
    </Card>
  );

  const getAssetIcon = (type: string) => {
    if (type === 'image') return <ImageIcon className="h-4 w-4" />;
    if (type === 'pdf') return <FileTextIcon className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      <div className="-mt-5 py-4 border-b">
        <div className="text-sm mt-2 font-medium text-muted-foreground">{simulationState.prompt}</div>
      </div>
      
      <Sources sources={sources} />

      {/* Assets & Perceptions Section */}
      {assets.length > 0 && (
        <div className="py-4 border-b">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="assets" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Uploaded Assets ({assets.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {assets.map(asset => (
                    <Card 
                      key={asset.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedAssetId === asset.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedAssetId(asset.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {getAssetIcon(asset.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {asset.type} • {(asset.size_bytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {asset.perception_count || 0} insights
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Perception Preview */}
                  {selectedAssetId && (
                    <div className="mt-4">
                      <PerceptionPreview 
                        assetId={selectedAssetId}
                        perceptions={perceptions}
                        loading={perceptionsLoading}
                      />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <div className="grid auto-rows-auto gap-4 h-full overflow-y-auto py-4 px-3 " style={{ 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        }}>
          {/* Show existing agent groups with skeleton enhancements */}
          {Object.entries(agentGroups).map(([groupName, groupConfig]) => 
            renderAgentGroupWithSkeletons(groupName, groupConfig)
          )}
          
          {/* Show skeleton agent groups if processing config and no groups exist */}
          {isProcessingConfig && Object.keys(agentGroups).length === 0 && (
            renderAgentGroupWithSkeletons('skeleton-1', {})
          )}
          
          {/* Show a message if no agent groups are found and not processing */}
          {!isProcessingConfig && Object.keys(agentGroups).length === 0 && (
            <div className="text-gray-500 text-center py-8 col-span-full">
              No agent groups configured for this simulation.
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="-mb-28 flex-shrink-0 pt-4 border-t">
        <div className="flex items-center gap-4">
          <Button 
            className='text-sm font-semibold cursor-pointer rounded-full' 
            disabled={!isReadyToStart || isStarting || isRunning}
            onClick={handleStartSimulation}
          >
            {isStarting || isRunning ? 'Running...' : 'Start Simulation'}
          </Button>
          <div className="flex-1">
            <div className="text-sm font-medium mb-2 text-muted-foreground">
              {isProcessingConfig ? (
                <>
                  Simulation Duration: <Skeleton className="inline-block h-4 w-20" />
                </>
              ) : (
                `Simulation Duration: ${isCompleted ? numberOfSteps : currentStep}/${numberOfSteps} ${stepUnit}`
              )}
            </div>
            <Progress value={progressValue} className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
} 