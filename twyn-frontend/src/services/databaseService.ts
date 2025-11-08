import { createClient } from '@/utils/supabase/client';
import { SimulationState } from '@/types/simulationApiTypes';
import { SupabaseClient } from '@supabase/supabase-js';

export class DatabaseService {
  /**
   * Add a simulation to the database
   */
  public static async addSimulation(simulationId: string, userId: string, title: string, prompt: string, status: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('simulations')
      .insert({
        id: simulationId,
        user_id: userId,
        title: title,
        prompt: prompt,
        status: status
      });
  }

  /**
   * Toggle star status for a simulation
   */
  public static async toggleSimulationStar(simulationId: string, starred: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('simulations')
      .update({ is_starred: starred })
      .eq('id', simulationId);

    if (error) {
      throw new Error(`Failed to update simulation star status: ${error.message}`);
    }
  }

  /**
   * Delete a simulation
   */
  public static async deleteSimulation(simulationId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', simulationId);

    if (error) {
      throw new Error(`Failed to delete simulation: ${error.message}`);
    }
  }

  /**
   * Update simulation title
   */
  public static async updateSimulationTitle(simulationId: string, title: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('simulations')
      .update({ title })
      .eq('id', simulationId);

    if (error) {
      throw new Error(`Failed to update simulation title: ${error.message}`);
    }
  }

  /**
   * Fetch a simulationState by simulationId
   */
  public static async fetchSimulationState(simulationId: string): Promise<SimulationState> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch simulation state: ${error.message}`);
    }

    // Fetch related data - use maybeSingle() to handle cases where data doesn't exist yet
    const [config, rawData, analysis] = await Promise.all([
      supabase
        .from('simulation_configs')
        .select('config_data, sources')
        .eq('simulation_id', simulationId)
        .maybeSingle(),
      supabase
        .from('simulation_raw_data')
        .select('raw_data, step_number')
        .eq('simulation_id', simulationId)
        .maybeSingle(),
      supabase
        .from('simulation_analyses')
        .select('analysis')
        .eq('simulation_id', simulationId)
        .maybeSingle()
    ]);

    // Check for errors in related data queries
    if (config.error) {
      throw new Error(`Failed to fetch simulation config: ${config.error.message}`);
    }
    if (rawData.error) {
      throw new Error(`Failed to fetch simulation raw data: ${rawData.error.message}`);
    }
    if (analysis.error) {
      throw new Error(`Failed to fetch simulation analysis: ${analysis.error.message}`);
    }

    // Construct simulation state
    const state: SimulationState = {
      simulation_id: simulationId,
      status: data.status,
      title: data.title,
      prompt: data.prompt,
      config: config.data?.config_data || null,
      sources: config.data?.sources || null,
      data: rawData.data?.raw_data || null,
      current_step: rawData.data?.step_number || null,
      analysis: analysis.data?.analysis || null,
      error_log: data.error_message || null
    };

    return state;
  }

  /**
   * Update tables with new simulationState
   */
  public static async updateSimulationState(simulationState: SimulationState): Promise<void> {
    const supabase = createClient();
    
    try {
      // Update main simulation record
      const { error: simulationError } = await supabase
        .from('simulations')
        .update({
          status: simulationState.status,
          title: simulationState.title,
          prompt: simulationState.prompt,
          error_message: simulationState.error_log
        })
        .eq('id', simulationState.simulation_id);

      if (simulationError) {
        throw new Error(`Failed to update simulation: ${simulationError.message}`);
      }

      // Upsert config data if it exists
      if (simulationState.config !== null || simulationState.sources !== null) {
        const { error: configError } = await supabase
          .from('simulation_configs')
          .upsert({
            simulation_id: simulationState.simulation_id,
            config_data: simulationState.config,
            sources: simulationState.sources
          }, {
            onConflict: 'simulation_id'
          });

        if (configError) {
          throw new Error(`Failed to upsert simulation config: ${configError.message}`);
        }
      }

      // Upsert raw data if it exists
      if (simulationState.data !== null || simulationState.current_step !== null) {
        const { error: rawDataError } = await supabase
          .from('simulation_raw_data')
          .upsert({
            simulation_id: simulationState.simulation_id,
            raw_data: simulationState.data,
            step_number: simulationState.current_step
          }, {
            onConflict: 'simulation_id'
          });

        if (rawDataError) {
          throw new Error(`Failed to upsert simulation raw data: ${rawDataError.message}`);
        }
      }

      // Upsert analysis if it exists
      if (simulationState.analysis !== null) {
        const { error: analysisError } = await supabase
          .from('simulation_analyses')
          .upsert({
            simulation_id: simulationState.simulation_id,
            analysis: simulationState.analysis
          }, {
            onConflict: 'simulation_id'
          });

        if (analysisError) {
          throw new Error(`Failed to upsert simulation analysis: ${analysisError.message}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to update simulation state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch user profile information
   */
  public static async getUserProfile(userId: string, supabase?: SupabaseClient): Promise<{ id: string; email: string; full_name: string; plan: string; created_at: string } | null> {
    const client = supabase || createClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
  }
} 