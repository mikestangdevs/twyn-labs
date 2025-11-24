---
sidebar_position: 4
---

# TypeScript Examples

Type-safe TypeScript SDK examples.

## Type Definitions

```typescript
// types.ts
export interface Simulation {
  id: string;
  status: SimulationStatus;
  title: string;
  prompt: string;
  tags: string[];
  tenant_id: string;
  scenario_id?: string;
  created_at: string;
  updated_at: string;
  lifecycle: {
    states: LifecycleEntry[];
  };
}

export type SimulationStatus =
  | 'PENDING'
  | 'PROCESSING_CONFIG'
  | 'COMPLETED_CONFIG'
  | 'PROCESSING_SIMULATION'
  | 'COMPLETED_SIMULATION'
  | 'PROCESSING_ANALYSIS'
  | 'COMPLETED_ANALYSIS'
  | 'FAILED';

export interface SimulationResults {
  id: string;
  status: SimulationStatus;
  config: SimulationConfig;
  metrics: Metrics;
  analysis: Analysis;
}

export interface Analysis {
  executive_summary: string;
  key_drivers: string[];
  risks: string[];
  recommendations: string[];
  report_markdown: string;
}

export interface CreateSimulationRequest {
  prompt: string;
  title?: string;
  tags?: string[];
  scenario_id?: string;
  metadata?: Record<string, any>;
}
```

## Type-Safe Client

```typescript
// client.ts
import type {
  Simulation,
  SimulationResults,
  CreateSimulationRequest
} from './types';

export class TwynClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.twyn.it/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`HTTP ${response.status}: ${error.detail}`);
    }

    return response.json();
  }

  async createSimulation(request: CreateSimulationRequest): Promise<Simulation> {
    return this.request<Simulation>('/simulations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getSimulation(id: string): Promise<Simulation> {
    return this.request<Simulation>(`/simulations/${id}`);
  }

  async getResults(id: string): Promise<SimulationResults> {
    return this.request<SimulationResults>(`/simulations/${id}/results`);
  }

  async waitForCompletion(
    id: string,
    maxWait: number = 600000,
    interval: number = 5000
  ): Promise<Simulation> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const sim = await this.getSimulation(id);

      console.log(`Status: ${sim.status}`);

      if (sim.status === 'COMPLETED_ANALYSIS') {
        return sim;
      }

      if (sim.status === 'FAILED') {
        throw new Error('Simulation failed');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Timeout after ${maxWait}ms`);
  }
}
```

## Usage Example

```typescript
// main.ts
import { TwynClient } from './client';
import type { SimulationResults } from './types';

async function main() {
  const client = new TwynClient(process.env.TWYN_API_KEY!);

  // Create simulation with type safety
  const sim = await client.createSimulation({
    prompt: 'Simulate 15% price increase impact on churn',
    title: 'Q4 Pricing Analysis',
    tags: ['pricing', 'churn'],
  });

  console.log(`✓ Created simulation: ${sim.id}`);

  // Wait for completion
  console.log('⏳ Waiting for completion...');
  await client.waitForCompletion(sim.id);

  // Get results
  const results: SimulationResults = await client.getResults(sim.id);

  // Type-safe access to analysis
  const {
    executive_summary,
    key_drivers,
    recommendations
  } = results.analysis;

  console.log('\n=== ANALYSIS ===');
  console.log(executive_summary);

  console.log('\n=== KEY DRIVERS ===');
  key_drivers.forEach(driver => console.log(`  • ${driver}`));

  console.log('\n=== RECOMMENDATIONS ===');
  recommendations.forEach(rec => console.log(`  • ${rec}`));
}

main().catch(console.error);
```

## With React Hook

```typescript
// useTwynSimulation.ts
import { useState, useEffect } from 'react';
import { TwynClient } from './client';
import type { Simulation, SimulationResults } from './types';

export function useTwynSimulation(simulationId: string) {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const client = new TwynClient(process.env.REACT_APP_TWYN_API_KEY!);

    async function fetchSimulation() {
      try {
        // Poll for completion
        const sim = await client.waitForCompletion(simulationId);
        setSimulation(sim);

        // Fetch results
        const res = await client.getResults(simulationId);
        setResults(res);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchSimulation();
  }, [simulationId]);

  return { simulation, results, loading, error };
}

// Usage in component
function SimulationView({ simulationId }: { simulationId: string }) {
  const { simulation, results, loading, error } = useTwynSimulation(simulationId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!results) return null;

  return (
    <div>
      <h2>{simulation?.title}</h2>
      <p>{results.analysis.executive_summary}</p>
      <h3>Recommendations</h3>
      <ul>
        {results.analysis.recommendations.map((rec, i) => (
          <li key={i}>{rec}</li>
        ))}
      </ul>
    </div>
  );
}
```

