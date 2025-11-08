import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/contexts/user-context';
import { type Simulation } from '@/types/simulationApiTypes';

interface UseSimulationHistoryReturn {
  simulations: Simulation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSimulationHistory(): UseSimulationHistoryReturn {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const supabase = createClient();

  const fetchSimulations = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('simulations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setSimulations(data || []);
    } catch (err) {
      console.error('Error fetching simulations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch simulations');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSimulations();
  }, [user?.id]);

  // Subscribe to realtime updates ONLY for active simulations
  useEffect(() => {
    if (!user?.id || simulations.length === 0) return;

    // Find simulations that are actively processing
    const activeSimulations = simulations.filter(sim => 
      ['pending', 'processing_config', 'completed_config', 'processing_simulation', 'completed_simulation', 'processing_report'].includes(sim.status)
    );

    // Only subscribe if there are active simulations
    if (activeSimulations.length === 0) return;

    const activeIds = activeSimulations.map(sim => sim.id);
    
    const subscription = supabase
      .channel('active_simulations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'simulations',
          filter: `id=in.(${activeIds.join(',')})`,
        },
        (payload) => {
          const updatedSimulation = payload.new as Simulation;
          setSimulations(prev => 
            prev.map(sim => 
              sim.id === updatedSimulation.id ? updatedSimulation : sim
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, simulations.map(s => `${s.id}-${s.status}`).join(',')]);

  // Subscribe to insertions for new simulations (low frequency)
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('new_simulations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'simulations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newSimulation = payload.new as Simulation;
          setSimulations(prev => [newSimulation, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    simulations,
    loading,
    error,
    refetch: fetchSimulations
  };
} 