---
sidebar_position: 1
---

# cURL Examples

Complete examples using cURL for all common API operations.

## Setup

Store your API key in an environment variable:

```bash
export TWYN_API_KEY="twyn_live_your_key_here"
```

## Create Simulation

```bash
curl -X POST https://api.twyn.it/v1/simulations \
  -H "X-API-Key: $TWYN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Simulate 15% price increase impact on customer churn for 1000 SaaS customers",
    "title": "Q4 Pricing Analysis",
    "tags": ["pricing", "churn"]
  }'
```

## Check Status

```bash
SIM_ID="550e8400-e29b-41d4-a716-446655440000"

curl https://api.twyn.it/v1/simulations/$SIM_ID \
  -H "X-API-Key: $TWYN_API_KEY"
```

## Get Results

```bash
curl https://api.twyn.it/v1/simulations/$SIM_ID/results \
  -H "X-API-Key: $TWYN_API_KEY"
```

## List Simulations

```bash
# List all
curl "https://api.twyn.it/v1/simulations?limit=20" \
  -H "X-API-Key: $TWYN_API_KEY"

# Filter by status
curl "https://api.twyn.it/v1/simulations?status=COMPLETED_ANALYSIS&limit=50" \
  -H "X-API-Key: $TWYN_API_KEY"

# Filter by tag
curl "https://api.twyn.it/v1/simulations?tag=pricing" \
  -H "X-API-Key: $TWYN_API_KEY"
```

## Manage Scenarios

```bash
# Create scenario
curl -X POST https://api.twyn.it/v1/scenarios \
  -H "X-API-Key: $TWYN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 2025 Pricing Tests",
    "description": "Various pricing strategies"
  }'

# List scenarios
curl https://api.twyn.it/v1/scenarios \
  -H "X-API-Key: $TWYN_API_KEY"

# Update scenario
SCENARIO_ID="scenario_123"
curl -X PUT https://api.twyn.it/v1/scenarios/$SCENARIO_ID \
  -H "X-API-Key: $TWYN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 2025 Pricing Tests (Final)"
  }'

# Delete scenario
curl -X DELETE https://api.twyn.it/v1/scenarios/$SCENARIO_ID \
  -H "X-API-Key: $TWYN_API_KEY"
```

## Manage API Keys

```bash
# List all keys
curl https://api.twyn.it/v1/keys \
  -H "X-API-Key: $TWYN_API_KEY"

# Create new key
curl -X POST https://api.twyn.it/v1/keys \
  -H "X-API-Key: $TWYN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Key",
    "rate_limit": 500,
    "expires_in_days": 90
  }'

# Get key details
KEY_ID="key_abc123"
curl https://api.twyn.it/v1/keys/$KEY_ID \
  -H "X-API-Key: $TWYN_API_KEY"

# Update key
curl -X PATCH https://api.twyn.it/v1/keys/$KEY_ID \
  -H "X-API-Key: $TWYN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Key (Updated)",
    "is_active": false
  }'

# Delete key
curl -X DELETE https://api.twyn.it/v1/keys/$KEY_ID \
  -H "X-API-Key: $TWYN_API_KEY"
```

## Configuration Management

```bash
# Get config
curl https://api.twyn.it/v1/simulations/$SIM_ID/config \
  -H "X-API-Key: $TWYN_API_KEY"

# Update config
curl -X PUT https://api.twyn.it/v1/simulations/$SIM_ID/config \
  -H "X-API-Key: $TWYN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "step_unit": "month",
    "number_of_steps": 12,
    "agent_groups": [...]
  }'
```

## Complete Workflow

```bash
#!/bin/bash
# complete-workflow.sh

set -e

API_KEY="$TWYN_API_KEY"
API_URL="https://api.twyn.it/v1"

# 1. Create simulation
echo "Creating simulation..."
RESPONSE=$(curl -s -X POST "$API_URL/simulations" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Simulate 15% price increase impact",
    "title": "Price Analysis"
  }')

SIM_ID=$(echo $RESPONSE | jq -r '.id')
echo "Simulation created: $SIM_ID"

# 2. Poll for completion
echo "Waiting for completion..."
while true; do
  STATUS=$(curl -s "$API_URL/simulations/$SIM_ID" \
    -H "X-API-Key: $API_KEY" | jq -r '.status')
  
  echo "  Status: $STATUS"
  
  if [ "$STATUS" == "COMPLETED_ANALYSIS" ]; then
    break
  elif [ "$STATUS" == "FAILED" ]; then
    echo "Simulation failed!"
    exit 1
  fi
  
  sleep 5
done

# 3. Get results
echo "Fetching results..."
RESULTS=$(curl -s "$API_URL/simulations/$SIM_ID/results" \
  -H "X-API-Key: $API_KEY")

echo "=== ANALYSIS ==="
echo $RESULTS | jq -r '.analysis.executive_summary'

echo -e "\n=== RECOMMENDATIONS ==="
echo $RESULTS | jq -r '.analysis.recommendations[]' | while read rec; do
  echo "  • $rec"
done
```

Usage:
```bash
chmod +x complete-workflow.sh
./complete-workflow.sh
```

