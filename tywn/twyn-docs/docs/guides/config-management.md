---
sidebar_position: 4
---

# Configuration Management

Learn how to view, edit, and customize simulation configurations.

## Configuration Structure

A simulation configuration defines:

- **step_unit**: Time unit (day, week, month, quarter, year)
- **number_of_steps**: How many time steps to simulate
- **agent_groups**: Collections of agents with variables and actions

## Viewing Configuration

Get the config after Architect completes:

```bash
curl https://api.twyn.it/v1/simulations/{id}/config \
  -H "X-API-Key: your_api_key_here"
```

**Example response:**
```json
{
  "step_unit": "week",
  "number_of_steps": 24,
  "agent_groups": [
    {
      "id": "customers",
      "name": "Customers",
      "description": "SaaS customers",
      "number_of_agents": 1000,
      "variables": {
        "satisfaction": {
          "type": "normal",
          "mean": 0.75,
          "std": 0.15
        }
      },
      "actions": {
        "churn": {
          "type": "binary",
          "description": "Cancel subscription"
        }
      }
    }
  ]
}
```

## Editing Configuration

Update the config before running the simulator:

```bash
curl -X PUT https://api.twyn.it/v1/simulations/{id}/config \
  -H "X-API-Key": your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "step_unit": "month",
    "number_of_steps": 12,
    "agent_groups": [...]
  }'
```

:::warning
Editing the config after COMPLETED_CONFIG will reset the simulation and clear any existing data/analysis.
:::

## Re-running Architect

Re-run the Architect with custom parameters:

```bash
curl -X POST https://api.twyn.it/v1/simulations/{id}/architect \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Simulate price increase with focus on enterprise customers",
    "max_turns": 30,
    "model": "gpt-4o"
  }'
```

## Creating with Custom Config

Skip Architect entirely with a pre-defined config:

```bash
curl -X POST https://api.twyn.it/v1/simulations/with-config \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Reference prompt",
    "config": {...}
  }'
```

## Variable Types

### Normal Distribution
```json
{
  "satisfaction": {
    "type": "normal",
    "mean": 0.75,
    "std": 0.15
  }
}
```

### Uniform Distribution
```json
{
  "budget": {
    "type": "uniform",
    "min": 1000,
    "max": 10000
  }
}
```

### Initial Value
```json
{
  "tenure": {
    "type": "initial_value",
    "value": 12
  }
}
```

## Action Types

### Binary
```json
{
  "churn": {
    "type": "binary",
    "description": "Cancel subscription"
  }
}
```

### Discrete
```json
{
  "plan_choice": {
    "type": "discrete",
    "description": "Choose pricing plan"
  }
}
```

### Continuous
```json
{
  "spend": {
    "type": "continuous",
    "description": "Monthly spend amount"
  }
}
```

## Next Steps

- [Simulation Lifecycle](../concepts/simulation-lifecycle)
- [Data Models](../concepts/data-models)
- [API Reference](/docs/api-reference)

