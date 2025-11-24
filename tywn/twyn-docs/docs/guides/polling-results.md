---
sidebar_position: 2
---

# Polling for Results

Learn efficient patterns for checking simulation status and retrieving results.

## Basic Polling

Poll every 5 seconds until completion:

```python
import time
import requests

def poll_simulation(simulation_id, api_key, interval=5, timeout=600):
    """Poll simulation until complete or timeout"""
    start_time = time.time()
    url = f'https://api.twyn.it/v1/simulations/{simulation_id}'
    headers = {'X-API-Key': api_key}
    
    while time.time() - start_time < timeout:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        status = data['status']
        print(f'Status: {status}')
        
        if status == 'COMPLETED_ANALYSIS':
            return data
        elif status == 'FAILED':
            raise Exception(f"Simulation failed: {data.get('error_log')}")
        
        time.sleep(interval)
    
    raise TimeoutError('Simulation timeout')
```

## Exponential Backoff

For better efficiency, gradually increase poll intervals:

```python
import time

def poll_with_backoff(simulation_id, api_key, max_wait=600):
    """Poll with exponential backoff"""
    intervals = [2, 5, 10, 15, 30]  # seconds
    start = time.time()
    interval_index = 0
    
    while time.time() - start < max_wait:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if data['status'] == 'COMPLETED_ANALYSIS':
            return data
        elif data['status'] == 'FAILED':
            raise Exception('Simulation failed')
        
        # Use exponential backoff
        interval = intervals[min(interval_index, len(intervals) - 1)]
        time.sleep(interval)
        interval_index += 1
```

## Async Polling (Python)

For concurrent operations:

```python
import asyncio
import aiohttp

async def poll_async(simulation_id, api_key):
    """Async polling"""
    url = f'https://api.twyn.it/v1/simulations/{simulation_id}'
    headers = {'X-API-Key': api_key}
    
    async with aiohttp.ClientSession() as session:
        while True:
            async with session.get(url, headers=headers) as response:
                data = await response.json()
                
                if data['status'] == 'COMPLETED_ANALYSIS':
                    return data
                elif data['status'] == 'FAILED':
                    raise Exception('Failed')
                
                await asyncio.sleep(5)

# Run multiple simulations concurrently
simulations = ['id1', 'id2', 'id3']
results = await asyncio.gather(*[poll_async(sid, api_key) for sid in simulations])
```

## JavaScript Polling

```javascript
async function pollSimulation(simulationId, apiKey, timeout = 600000) {
  const startTime = Date.now();
  const url = `https://api.twyn.it/v1/simulations/${simulationId}`;
  const headers = { 'X-API-Key': apiKey };
  
  while (Date.now() - startTime < timeout) {
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    console.log(`Status: ${data.status}`);
    
    if (data.status === 'COMPLETED_ANALYSIS') {
      return data;
    } else if (data.status === 'FAILED') {
      throw new Error(`Simulation failed: ${data.error_log}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Timeout');
}
```

## Best Practices

### Recommended Intervals

| Phase | Duration | Poll Interval |
|-------|----------|---------------|
| PROCESSING_CONFIG | 1-2 min | 5 seconds |
| PROCESSING_SIMULATION | 2-4 min | 5-10 seconds |
| PROCESSING_ANALYSIS | 1-2 min | 5 seconds |

### Do's ✅

- Poll every 5 seconds minimum
- Implement timeout (10 minutes max)
- Handle network errors gracefully
- Log status changes
- Use exponential backoff for long waits

### Don'ts ❌

- Don't poll faster than 1 second
- Don't poll indefinitely without timeout
- Don't ignore error responses
- Don't create new connections for each poll (reuse)

## Next Steps

- [Managing Scenarios](./managing-scenarios)
- [Config Management](./config-management)

