import { SimulationState } from "@/types/simulationApiTypes";

// Base URL for the Twyn SSE API
const BASE_URL = 'http://localhost:8000';



export interface CreateSimulationRequest {
  prompt: string;
}

export interface CreateSimulationResponse extends SimulationState {}

// API Error class for better error handling
export class SimulationAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'SimulationAPIError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new SimulationAPIError(
      errorData.detail || `HTTP Error: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

// Simulation Service Class
export class SimulationService {
  
  /**
   * Get the SSE stream URL for a simulation
   */
  static getStreamUrl(simulationId: string): string {
    return `${BASE_URL}/simulations/${simulationId}/stream`;
  }

  /**
   * Creates a new simulation with the given prompt
   */
  static async createSimulation(prompt: string): Promise<CreateSimulationResponse> {
    const response = await fetch(`${BASE_URL}/simulations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt
      } as CreateSimulationRequest)
    });

    return handleResponse<CreateSimulationResponse>(response);
  }

  /**
   * Triggers the architect stage for a simulation
   * This runs in the background and processes the simulation configuration
   */
  static async runArchitect(simulationId: string): Promise<SimulationState> {
    const response = await fetch(`${BASE_URL}/simulations/architect/${simulationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return handleResponse<SimulationState>(response);
  }

  /**
   * Triggers the simulator stage for a simulation
   * This runs in the background and executes the simulation
   */
  static async runSimulator(simulationId: string): Promise<SimulationState> {
    const response = await fetch(`${BASE_URL}/simulations/simulator/${simulationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return handleResponse<SimulationState>(response);
  }

  /**
   * Triggers the analyst stage for a simulation
   * This runs in the background and analyzes the simulation results
   */
  static async runAnalyst(simulationId: string): Promise<SimulationState> {
    const response = await fetch(`${BASE_URL}/simulations/analyst/${simulationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return handleResponse<SimulationState>(response);
  }
}

// Export default for convenience
export default SimulationService;
