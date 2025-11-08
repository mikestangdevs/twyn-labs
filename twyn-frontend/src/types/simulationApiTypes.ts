export interface Simulation {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  is_starred: boolean;
}

export interface SimulationConfig {
  id: string;
  simulation_id: string;
  config_data: any;
  created_at: string;
}

export interface SimulationReport {
  id: string;
  simulation_id: string;
  report: string;
  created_at: string;
}

export interface SimulationRawData {
  id: string;
  simulation_id: string;
  step_number: number;
  raw_data: any;
  created_at: string;
}

export interface SimulationConfigData {
  agent_groups?: Record<string, {
    description?: string;
    variables?: Record<string, {
      description?: string;
      unit?: string;
      update_rule?: unknown;
      args?: {
        __class__?: string;
        value?: unknown;
      };
    }>;
    actions?: Record<string, {
      description?: string;
      unit?: string;
      args?: {
        __class__?: string;
      };
    }>;
    number_of_agents?: number;
    memory_length?: number;
  }>;
  step_unit?: string;
  number_of_steps?: number;
  user_query?: string;
} 

export enum SimulationStatus {
  PENDING = 'pending',
  PROCESSING_CONFIG = 'processing_config',
  COMPLETED_CONFIG = 'completed_config',
  PROCESSING_SIMULATION = 'processing_simulation',
  COMPLETED_SIMULATION = 'completed_simulation',
  PROCESSING_ANALYSIS = 'processing_analysis',
  COMPLETED_ANALYSIS = 'completed_analysis',
  FAILED = 'failed'
}

export interface SimulationState {
  simulation_id: string;
  prompt: string | null;
  status: SimulationStatus | null;
  title: string | null;
  config: SimulationConfigData | null;
  sources: any | null;
  data: any | null;
  current_step: number | null;
  analysis: string | null;
  error_log: string | null;
}