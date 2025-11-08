import { useState, useEffect } from 'react';
import { SimulationState } from '@/types/simulationApiTypes';
import { SimulationService } from '@/services/simulationService';
import { DatabaseService } from '@/services/databaseService';

interface UseSimulationStateReturn {
  simulationState: SimulationState | null;
  isLoading: boolean;
  error: string | null;
}

export function useSimulationState(simulationId: string | null): UseSimulationStateReturn {
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch simulation state from Supabase
  const fetchFromSupabase = async () => {
    if (!simulationId) {
      setIsLoading(false);
      return;
    }
    try {
      const state = await DatabaseService.fetchSimulationState(simulationId);
      setSimulationState(state);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch simulation state');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!simulationId) {
      setIsLoading(false);
      return;
    }

    // Reset states when simulation ID changes
    setError(null);
    setIsLoading(true);

    // Initial fetch from Supabase
    fetchFromSupabase();

    // Create SSE connection
    const eventSource = new EventSource(SimulationService.getStreamUrl(simulationId));

    // Handle initial connection event
    eventSource.addEventListener('connection', (event) => {
      try {
        setError(null);
      } catch (err) {
        console.warn('SSE connection failed, falling back to Supabase');
      }
    });

    // Handle heartbeat events to maintain connection status
    eventSource.addEventListener('heartbeat', (event) => {
      // Keep connection alive
    });

    // Handle 'update' events from the backend
    eventSource.addEventListener('update', (event) => {
      try {
        const data = JSON.parse(event.data);
        setSimulationState(data);
        setIsLoading(false);
        setError(null);

        // Sync the updated state to the database
        DatabaseService.updateSimulationState(data).catch((err) => {
          console.error('Failed to sync simulation state:', err);
        });
      } catch (err) {
        console.warn('Failed to parse SSE update, falling back to Supabase');
        fetchFromSupabase();
      }
    });

    // Handle 'end' events from the backend
    eventSource.addEventListener('end', (event) => {
      try {
        const data = JSON.parse(event.data);
        setSimulationState(data);
        setIsLoading(false);

        // Sync the final state to the database
        DatabaseService.updateSimulationState(data).catch((err) => {
          console.error('Failed to sync final simulation state:', err);
        });

        eventSource.close();
      } catch (err) {
        console.warn('Failed to parse SSE end event, falling back to Supabase');
        fetchFromSupabase();
      }
    });

    // Handle 'error' events from the backend
    eventSource.addEventListener('error', (event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data);
          setError(data.error_log || 'An error occurred in the simulation');
          setIsLoading(false);

          // Don't try to sync error states to database - just handle the error
          // and fallback to Supabase if needed
          console.warn('SSE error received, falling back to Supabase');
          eventSource.close();
          fetchFromSupabase();
        } catch (err) {
          console.warn('Failed to parse SSE error event, falling back to Supabase');
          eventSource.close();
          fetchFromSupabase();
        }
      } else {
        // Handle connection errors
        console.warn('SSE connection error, falling back to Supabase');
        eventSource.close();
        fetchFromSupabase();
      }
    });

    // Cleanup: close SSE connection
    return () => {
      eventSource.close();
    };
  }, [simulationId]);

  return { simulationState, isLoading, error };
}
