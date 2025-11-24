---
sidebar_position: 3
---

# Making Requests

Learn the fundamentals of working with the Twyn API including request patterns, response handling, and error management.

## Base URL

All API requests are made to:

**Production:**
```
https://api.twyn.it/v1
```

**Development:**
```
http://localhost:8000/v1
```

## Request Format

### Headers

Every request must include:

```
X-API-Key: your_api_key_here
Content-Type: application/json
```

### Example Request

```bash
curl -X POST https://api.twyn.it/v1/simulations \
  -H "X-API-Key: twyn_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Your simulation prompt"}'
```

## HTTP Methods

The API uses standard HTTP methods:

| Method | Usage |
|--------|-------|
| `GET` | Retrieve resources |
| `POST` | Create new resources |
| `PUT` | Replace entire resources |
| `PATCH` | Update specific fields |
| `DELETE` | Remove resources |

## Response Format

### Success Responses

All successful responses return JSON:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED_ANALYSIS",
  "title": "Price Increase Analysis",
  ...
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (successful deletion) |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid API key) |
| `403` | Forbidden (access denied) |
| `404` | Not Found |
| `409` | Conflict (resource not ready) |
| `422` | Unprocessable Entity (invalid format) |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message here"
}
```

Or for structured errors:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "status": "CURRENT_STATUS"
}
```

### Common Errors

#### 401 Unauthorized

```json
{
  "detail": "Invalid or missing API key"
}
```

**Fix:** Include valid `X-API-Key` header

#### 404 Not Found

```json
{
  "detail": "Simulation with ID abc123 not found"
}
```

**Fix:** Check the resource ID

#### 409 Conflict

```json
{
  "error": "SIMULATION_NOT_COMPLETE",
  "message": "Simulation is still running",
  "status": "PROCESSING_SIMULATION"
}
```

**Fix:** Wait and retry

#### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "prompt"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Fix:** Check request body format

### Error Handling Pattern

**Python:**
```python
import requests

response = requests.post(url, headers=headers, json=data)

if response.status_code == 401:
    print("Authentication failed - check API key")
elif response.status_code == 409:
    print("Resource not ready - retry later")
elif response.status_code >= 400:
    print(f"Error: {response.json()}")
else:
    result = response.json()
    print(f"Success: {result}")
```

**JavaScript:**
```javascript
try {
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 401) {
      console.error('Authentication failed');
    } else if (response.status === 409) {
      console.log('Not ready yet, retry...');
    } else {
      console.error('Error:', error);
    }
    
    throw new Error(error.detail || error.message);
  }

  const result = await response.json();
  console.log('Success:', result);
  
} catch (err) {
  console.error('Request failed:', err);
}
```

## Pagination

List endpoints support pagination:

```bash
GET /v1/simulations?limit=20&offset=0
```

**Parameters:**
- `limit`: Results per page (1-100, default: 20)
- `offset`: Number of results to skip

**Response:**
```json
{
  "items": [...],
  "total": 145,
  "limit": 20,
  "offset": 0
}
```

**Pagination Pattern:**

```python
def fetch_all_simulations(api_key):
    all_items = []
    offset = 0
    limit = 100
    
    while True:
        response = requests.get(
            f'{API_URL}/simulations?limit={limit}&offset={offset}',
            headers={'X-API-Key': api_key}
        )
        data = response.json()
        
        all_items.extend(data['items'])
        
        if len(data['items']) < limit:
            break  # No more pages
            
        offset += limit
    
    return all_items
```

## Filtering

Many endpoints support filtering:

```bash
# Filter by status
GET /v1/simulations?status=COMPLETED_ANALYSIS

# Filter by tag
GET /v1/simulations?tag=pricing

# Filter by date range
GET /v1/simulations?created_after=2025-11-01T00:00:00Z&created_before=2025-11-30T23:59:59Z

# Combine filters
GET /v1/simulations?status=COMPLETED_ANALYSIS&tag=pricing&limit=50
```

## Polling Pattern

For long-running operations (simulations), use polling:

```python
import time

def wait_for_completion(simulation_id, api_key, max_wait=600):
    """Poll until simulation completes or timeout"""
    start_time = time.time()
    
    while True:
        response = requests.get(
            f'{API_URL}/simulations/{simulation_id}',
            headers={'X-API-Key': api_key}
        )
        
        data = response.json()
        status = data['status']
        
        print(f'Status: {status}')
        
        if status == 'COMPLETED_ANALYSIS':
            return data
        elif status == 'FAILED':
            raise Exception('Simulation failed')
        
        if time.time() - start_time > max_wait:
            raise TimeoutError('Simulation timeout')
        
        time.sleep(5)  # Wait 5 seconds between polls
```

## Idempotency

Some operations are idempotent - repeating them has the same effect:

**Idempotent:**
- `GET` requests (safe to retry)
- `PUT` requests (same result)
- `DELETE` requests (same result after first call)

**Not Idempotent:**
- `POST /v1/simulations` (creates new simulation each time)
- `POST /v1/keys` (creates new key each time)

## Request Timeouts

Set reasonable timeouts to avoid hanging:

**Python:**
```python
response = requests.get(url, headers=headers, timeout=30)
```

**JavaScript:**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    headers: headers,
    signal: controller.signal
  });
} finally {
  clearTimeout(timeoutId);
}
```

## Retry Logic

Implement exponential backoff for transient errors:

```python
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST"]
)
adapter = HTTPAdapter(max_retries=retry)
session.mount('https://', adapter)

response = session.get(url, headers=headers)
```

## Rate Limiting

Monitor rate limit headers:

```python
response = requests.get(url, headers=headers)

rate_limit = int(response.headers.get('X-RateLimit-Limit', 0))
remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
reset_time = int(response.headers.get('X-RateLimit-Reset', 0))

print(f'Rate limit: {remaining}/{rate_limit} remaining')
```

## Best Practices

### Do's ✅

- **Use HTTPS** in production
- **Set timeouts** on all requests
- **Implement retry logic** for transient errors
- **Poll efficiently** (5-second intervals)
- **Handle all error codes** explicitly
- **Log requests** for debugging
- **Use connection pooling** for multiple requests

### Don'ts ❌

- **Don't poll too frequently** (< 1 second)
- **Don't ignore errors** - handle them properly
- **Don't retry infinite times** - set limits
- **Don't log API keys** - redact sensitive data
- **Don't hardcode URLs** - use constants/config

## Example: Complete Workflow

```python
import requests
import time

class TwynClient:
    def __init__(self, api_key, base_url='https://api.twyn.it/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })
    
    def create_simulation(self, prompt, **kwargs):
        """Create a new simulation"""
        response = self.session.post(
            f'{self.base_url}/simulations',
            json={'prompt': prompt, **kwargs},
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    
    def get_simulation(self, simulation_id):
        """Get simulation status"""
        response = self.session.get(
            f'{self.base_url}/simulations/{simulation_id}',
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    
    def wait_for_completion(self, simulation_id, max_wait=600):
        """Wait for simulation to complete"""
        start = time.time()
        
        while time.time() - start < max_wait:
            sim = self.get_simulation(simulation_id)
            
            if sim['status'] == 'COMPLETED_ANALYSIS':
                return sim
            elif sim['status'] == 'FAILED':
                raise Exception(f"Simulation failed: {sim.get('error_log')}")
            
            time.sleep(5)
        
        raise TimeoutError('Simulation timeout')
    
    def get_results(self, simulation_id):
        """Get full simulation results"""
        response = self.session.get(
            f'{self.base_url}/simulations/{simulation_id}/results',
            timeout=30
        )
        response.raise_for_status()
        return response.json()

# Usage
client = TwynClient('twyn_live_your_key_here')

# Create and wait
sim = client.create_simulation('Simulate price increase impact')
print(f'Created simulation: {sim["id"]}')

client.wait_for_completion(sim['id'])
results = client.get_results(sim['id'])

print(f'Analysis: {results["analysis"]["executive_summary"]}')
```

## Next Steps

- [Create Your First Simulation](../guides/create-simulation)
- [Managing Scenarios](../guides/managing-scenarios)
- [API Reference](/docs/api-reference)

