'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSimulationState } from '@/hooks/useSimulationState';
import AgentsTab from '../../../components/agents-tab';
import ResultsTab from '@/components/results-tab';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function SimulationPage() {
  const router = useRouter();
  const params = useParams();
  const sim_uuid = params.sim_uuid as string;

  const { simulationState, isLoading, error } = useSimulationState(sim_uuid);

  useEffect(() => {
    // Instantly redirect if UUID format is invalid
    if (!UUID_REGEX.test(sim_uuid)) {
      router.push('/sim');
      return;
    }
  }, [sim_uuid, router]);

  // Return null for any non-ready state
  if (isLoading || error || !simulationState) {
    return null;
  }

  // Check if Results tab should be enabled
  const isResultsTabEnabled = simulationState.status === 'processing_analysis' || simulationState.status === 'completed_analysis';

  return (
    <div className="w-full mt-10 px-8">
      <Tabs defaultValue="agents">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{simulationState.title || 'New Simulation'}</h1>
          <TabsList className="w-[200px] rounded-full">
            <TabsTrigger value="agents" className="rounded-full cursor-pointer">Agents</TabsTrigger>
            <TabsTrigger value="results" disabled={!isResultsTabEnabled} className="rounded-full cursor-pointer">Results</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agents">
          <AgentsTab simulationState={simulationState} />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab simulationState={simulationState} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
