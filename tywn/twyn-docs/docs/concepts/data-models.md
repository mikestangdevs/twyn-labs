---
sidebar_position: 3
---

# Data Models

Understand the core data structures in the Twyn API.

## Simulation

Core simulation object with metadata and status.

```typescript
interface Simulation {
  id: string;                    // UUID
  status: string;                // Current status
  title: string;                 // Human-readable name
  prompt: string;                // Original prompt
  tags: string[];                // Organization tags
  tenant_id: string;             // Your tenant ID
  scenario_id?: string;          // Optional scenario
  created_at: string;            // ISO8601 timestamp
  updated_at: string;            // ISO8601 timestamp
  lifecycle: {
    states: LifecycleEntry[];
  };
}
```

## Configuration

Defines the simulation parameters.

```typescript
interface SimulationConfig {
  step_unit: string;             // "day" | "week" | "month" | "quarter" | "year"
  number_of_steps: number;       // How many time steps
  agent_groups: AgentGroup[];    // Agent group definitions
}

interface AgentGroup {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // What this group represents
  number_of_agents: number;      // Agent count
  variables: Record<string, Variable>;  // Agent properties
  actions: Record<string, Action>;      // Agent decisions
}
```

## Variables

Agent properties that can change over time.

```typescript
// Normal Distribution
interface NormalVariable {
  type: "normal";
  mean: number;
  std: number;
}

// Uniform Distribution
interface UniformVariable {
  type: "uniform";
  min: number;
  max: number;
}

// Initial Value
interface InitialValueVariable {
  type: "initial_value";
  value: number;
}
```

## Actions

Decisions agents can make.

```typescript
interface Action {
  type: "binary" | "discrete" | "continuous";
  description: string;
}
```

## Metrics

Time-series simulation data.

```typescript
interface Metrics {
  by_group: GroupMetrics[];
  global?: any;
}

interface GroupMetrics {
  group_id: string;
  timeline: TimeStep[];
}

interface TimeStep {
  step: number;
  timestamp?: string;
  variables: Record<string, number>;  // Variable values at this step
  actions: Record<string, number>;    // Action rates/values
}
```

## Analysis

Insights from the Analyst phase.

```typescript
interface Analysis {
  executive_summary: string;
  key_drivers: string[];
  risks: string[];
  recommendations: string[];
  report_markdown: string;       // Full detailed report
}
```

## Complete Results

Full simulation results combining all data.

```typescript
interface SimulationResults {
  id: string;
  status: string;
  title: string;
  prompt: string;
  tags: string[];
  tenant_id: string;
  results_version: number;       // Always 1 for V1 API
  config: SimulationConfig;
  metrics: Metrics;
  analysis: Analysis;
}
```

## Scenario

Organizational container for simulations.

```typescript
interface Scenario {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

## API Key

API key metadata (plaintext key only shown at creation).

```typescript
interface APIKeyInfo {
  key_id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
  rate_limit: number;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
}
```

## Pagination

List response format.

```typescript
interface ListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
```

## Error Response

Standard error format.

```typescript
interface ErrorResponse {
  detail: string | object;
  error?: string;              // Error code
  message?: string;            // Human-readable message
  status?: string;             // Current simulation status (for 409)
}
```

## Example: Complete Workflow Data

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED_ANALYSIS",
  "title": "Price Increase Analysis",
  "config": {
    "step_unit": "week",
    "number_of_steps": 24,
    "agent_groups": [
      {
        "id": "customers",
        "name": "Customers",
        "number_of_agents": 1000,
        "variables": {
          "satisfaction": {"type": "normal", "mean": 0.75, "std": 0.15}
        },
        "actions": {
          "churn": {"type": "binary", "description": "Cancel subscription"}
        }
      }
    ]
  },
  "metrics": {
    "by_group": [
      {
        "group_id": "customers",
        "timeline": [
          {
            "step": 0,
            "variables": {"satisfaction": 0.75},
            "actions": {"churn": 0.02}
          },
          {
            "step": 1,
            "variables": {"satisfaction": 0.71},
            "actions": {"churn": 0.04}
          }
        ]
      }
    ]
  },
  "analysis": {
    "executive_summary": "Price increase causes moderate churn...",
    "key_drivers": ["Price sensitivity highest in SMB segment"],
    "risks": ["Churn peaks in weeks 2-4"],
    "recommendations": ["Phase rollout by segment"]
  }
}
```

## Next Steps

- [Creating Simulations](../guides/create-simulation)
- [API Reference](/docs/api-reference)

