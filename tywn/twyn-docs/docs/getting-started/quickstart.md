---
sidebar_position: 1
---

# Quickstart

Get up and running with the Twyn API in under 5 minutes.

## Prerequisites

- An active Twyn account (sign up at [twyn.it](https://twyn.it))
- An API key (get one from your [dashboard](https://twyn.it/api-keys))
- A terminal with `curl` (or your preferred HTTP client)

## Step 1: Get Your API Key

1. Log in to your [Twyn dashboard](https://twyn.it)
2. Navigate to **Settings** → **API Keys**
3. Click **Create New Key**
4. Give it a name (e.g., "Development")
5. Copy the key - **you won't be able to see it again!**

Your API key will look like this:
```
twyn_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

:::warning Keep Your API Key Secret
Never commit your API key to version control or share it publicly. Treat it like a password.
:::

## Step 2: Create Your First Simulation

Let's create a simulation to model customer churn from a price increase:

```bash
curl -X POST https://api.twyn.it/v1/simulations \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Simulate the impact of a 10% price increase on customer churn for a SaaS company with 1000 customers"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "title": "Price Increase Churn Impact Analysis",
  "prompt": "Simulate the impact of a 10% price increase...",
  "tags": [],
  "tenant_id": "your-tenant-id",
  "created_at": "2025-11-24T01:00:00Z",
  "updated_at": "2025-11-24T01:00:00Z",
  "lifecycle": {
    "states": [
      {
        "name": "PENDING",
        "at": "2025-11-24T01:00:00Z"
      }
    ]
  }
}
```

✅ Your simulation is now running! Save the `id` from the response.

## Step 3: Check the Status

The simulation goes through three phases:
1. **Architect** - Designs the simulation (1-2 minutes)
2. **Simulator** - Runs the simulation (2-3 minutes)
3. **Analyst** - Analyzes results (1-2 minutes)

Poll for status using the simulation ID:

```bash
curl https://api.twyn.it/v1/simulations/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING_SIMULATION",
  "lifecycle": {
    "states": [
      {"name": "PENDING", "at": "2025-11-24T01:00:00Z"},
      {"name": "PROCESSING_CONFIG", "at": "2025-11-24T01:00:01Z"},
      {"name": "COMPLETED_CONFIG", "at": "2025-11-24T01:01:30Z"},
      {"name": "PROCESSING_SIMULATION", "at": "2025-11-24T01:01:31Z"}
    ]
  }
}
```

**Status Values:**
- `PENDING` - Simulation created
- `PROCESSING_CONFIG` - Architect is working
- `COMPLETED_CONFIG` - Configuration ready
- `PROCESSING_SIMULATION` - Simulator is running
- `COMPLETED_SIMULATION` - Simulation complete
- `PROCESSING_ANALYSIS` - Analyst is analyzing
- `COMPLETED_ANALYSIS` - ✅ **Ready!**

:::tip Polling Best Practice
Poll every 5 seconds until status is `COMPLETED_ANALYSIS`. Most simulations complete in 4-6 minutes.
:::

## Step 4: Get the Results

Once status is `COMPLETED_ANALYSIS`, fetch the full results:

```bash
curl https://api.twyn.it/v1/simulations/550e8400-e29b-41d4-a716-446655440000/results \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

**Response includes:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED_ANALYSIS",
  "config": {
    "step_unit": "week",
    "number_of_steps": 24,
    "agent_groups": [...]
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
            "variables": {"satisfaction": 0.68},
            "actions": {"churn": 0.05}
          }
        ]
      }
    ]
  },
  "analysis": {
    "executive_summary": "A 10% price increase results in moderate churn...",
    "key_drivers": [
      "Price sensitivity is highest among SMB customers",
      "Churn peaks in weeks 2-4 after price change"
    ],
    "risks": [
      "High churn risk for customers with satisfaction < 0.6",
      "Competitor switching likely in enterprise segment"
    ],
    "recommendations": [
      "Phase the rollout by customer segment",
      "Offer loyalty discounts to high-risk customers",
      "Improve value communication before price change"
    ],
    "report_markdown": "# Full Analysis Report\n\n..."
  }
}
```

## Step 5: Analyze the Insights

The `analysis` section contains:

- **executive_summary**: High-level overview
- **key_drivers**: Main factors influencing the outcome
- **risks**: Potential issues to watch for
- **recommendations**: Actionable next steps
- **report_markdown**: Full detailed report

## What's Next?

🎉 **Congratulations!** You've run your first simulation.

Now explore:

- [Authentication Guide](./authentication) - Manage API keys and security
- [Creating Simulations](../guides/create-simulation) - Advanced options
- [Managing Scenarios](../guides/managing-scenarios) - Organize your simulations
- [API Reference](/docs/api-reference) - Complete endpoint documentation

## Need Help?

- 📚 [Browse Guides](../guides/create-simulation)
- 💬 [GitHub Issues](https://github.com/twyn/twyn)
- 📧 [Email Support](mailto:support@twyn.it)

## Example: Using JavaScript

```javascript
const TWYN_API_KEY = 'your_api_key_here';
const TWYN_API_URL = 'https://api.twyn.it/v1';

// Create simulation
const createResponse = await fetch(`${TWYN_API_URL}/simulations`, {
  method: 'POST',
  headers: {
    'X-API-Key': TWYN_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Simulate 10% price increase impact on customer churn'
  })
});

const simulation = await createResponse.json();
console.log('Simulation created:', simulation.id);

// Poll for completion
async function waitForCompletion(simulationId) {
  while (true) {
    const statusResponse = await fetch(
      `${TWYN_API_URL}/simulations/${simulationId}`,
      { headers: { 'X-API-Key': TWYN_API_KEY } }
    );
    
    const status = await statusResponse.json();
    console.log('Status:', status.status);
    
    if (status.status === 'COMPLETED_ANALYSIS') {
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
  }
}

await waitForCompletion(simulation.id);

// Get results
const resultsResponse = await fetch(
  `${TWYN_API_URL}/simulations/${simulation.id}/results`,
  { headers: { 'X-API-Key': TWYN_API_KEY } }
);

const results = await resultsResponse.json();
console.log('Analysis:', results.analysis.executive_summary);
console.log('Recommendations:', results.analysis.recommendations);
```

## Common Issues

### 401 Unauthorized
- Check that you included the `X-API-Key` header
- Verify your API key is valid and hasn't expired

### 409 Conflict (when fetching results)
- The simulation hasn't completed yet
- Keep polling the status endpoint until `COMPLETED_ANALYSIS`

### Simulation stuck in PROCESSING_*
- Most simulations complete in 4-6 minutes
- If stuck for >10 minutes, contact support with the simulation ID

