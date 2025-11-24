---
sidebar_position: 3
---

# Managing Scenarios

Organize your simulations into scenarios (folders) for better management.

## What are Scenarios?

Scenarios are organizational containers for grouping related simulations. Think of them as folders that help you:

- Group simulations by project or experiment
- Compare related simulation runs
- Organize by team, department, or use case
- Track simulation history for specific initiatives

## Creating a Scenario

```bash
curl -X POST https://api.twyn.it/v1/scenarios \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 2025 Pricing Strategy",
    "description": "Testing various pricing scenarios for Q4 rollout"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "your-tenant",
  "name": "Q4 2025 Pricing Strategy",
  "description": "Testing various pricing scenarios for Q4 rollout",
  "created_at": "2025-11-24T01:00:00Z",
  "updated_at": "2025-11-24T01:00:00Z"
}
```

## Adding Simulations to a Scenario

Include the `scenario_id` when creating simulations:

```bash
curl -X POST https://api.twyn.it/v1/simulations \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Simulate 10% price increase",
    "scenario_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## Listing Scenarios

```bash
curl https://api.twyn.it/v1/scenarios \
  -H "X-API-Key: your_api_key_here"
```

## Updating a Scenario

```bash
curl -X PUT https://api.twyn.it/v1/scenarios/550e8400... \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 2025 Pricing Strategy (Final)",
    "description": "Updated description"
  }'
```

## Deleting a Scenario

```bash
curl -X DELETE https://api.twyn.it/v1/scenarios/550e8400... \
  -H "X-API-Key: your_api_key_here"
```

:::note
Deleting a scenario doesn't delete the simulations. They remain accessible but their `scenario_id` becomes null.
:::

## Use Cases

### A/B Testing
```
Scenario: "Homepage Redesign A/B Test"
├── Simulation 1: "Control - Current Homepage"
├── Simulation 2: "Variant A - Simplified Layout"
└── Simulation 3: "Variant B - Video Hero"
```

### Pricing Strategies
```
Scenario: "2026 Pricing Strategy"
├── Simulation 1: "10% Increase"
├── Simulation 2: "15% Increase"
├── Simulation 3: "Tiered Pricing Model"
└── Simulation 4: "Usage-Based Pricing"
```

### Market Scenarios
```
Scenario: "Economic Downturn Impact"
├── Simulation 1: "Mild Recession"
├── Simulation 2: "Severe Recession"
└── Simulation 3: "Recovery Phase"
```

## Next Steps

- [Config Management](./config-management)
- [API Reference](/docs/api-reference)

