---
sidebar_position: 2
---

# Python Examples

Complete Python SDK examples with best practices.

## Installation

```bash
pip install requests
```

## Basic Client

```python
import os
import requests
import time
from typing import Optional, Dict, Any

class TwynClient:
    def __init__(self, api_key: str, base_url: str = 'https://api.twyn.it/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })
    
    def create_simulation(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Create a new simulation"""
        response = self.session.post(
            f'{self.base_url}/simulations',
            json={'prompt': prompt, **kwargs},
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    
    def get_simulation(self, simulation_id: str) -> Dict[str, Any]:
        """Get simulation status"""
        response = self.session.get(
            f'{self.base_url}/simulations/{simulation_id}',
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    
    def get_results(self, simulation_id: str) -> Dict[str, Any]:
        """Get complete results"""
        response = self.session.get(
            f'{self.base_url}/simulations/{simulation_id}/results',
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    
    def wait_for_completion(self, simulation_id: str, max_wait: int = 600, interval: int = 5):
        """Wait for simulation to complete"""
        start = time.time()
        
        while time.time() - start < max_wait:
            sim = self.get_simulation(simulation_id)
            status = sim['status']
            
            print(f'Status: {status}')
            
            if status == 'COMPLETED_ANALYSIS':
                return sim
            elif status == 'FAILED':
                raise Exception(f"Simulation failed: {sim.get('error_log')}")
            
            time.sleep(interval)
        
        raise TimeoutError(f'Simulation timeout after {max_wait}s')
    
    def list_simulations(self, **filters) -> Dict[str, Any]:
        """List simulations with filters"""
        response = self.session.get(
            f'{self.base_url}/simulations',
            params=filters,
            timeout=30
        )
        response.raise_for_status()
        return response.json()


# Usage
client = TwynClient(os.environ['TWYN_API_KEY'])

# Create and run simulation
sim = client.create_simulation(
    prompt='Simulate 15% price increase impact on churn',
    title='Q4 Pricing Analysis',
    tags=['pricing', 'churn']
)

print(f"Created simulation: {sim['id']}")

# Wait for completion
client.wait_for_completion(sim['id'])

# Get results
results = client.get_results(sim['id'])

print("\n=== Analysis ===")
print(results['analysis']['executive_summary'])

print("\n=== Recommendations ===")
for rec in results['analysis']['recommendations']:
    print(f"  • {rec}")
```

## Async Client

```python
import asyncio
import aiohttp
import os

class AsyncTwynClient:
    def __init__(self, api_key: str, base_url: str = 'https://api.twyn.it/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    async def create_simulation(self, prompt: str, **kwargs):
        """Create simulation"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f'{self.base_url}/simulations',
                json={'prompt': prompt, **kwargs},
                headers=self.headers
            ) as response:
                response.raise_for_status()
                return await response.json()
    
    async def get_simulation(self, simulation_id: str):
        """Get simulation"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f'{self.base_url}/simulations/{simulation_id}',
                headers=self.headers
            ) as response:
                response.raise_for_status()
                return await response.json()
    
    async def wait_for_completion(self, simulation_id: str, max_wait: int = 600):
        """Wait for completion"""
        start = asyncio.get_event_loop().time()
        
        while asyncio.get_event_loop().time() - start < max_wait:
            sim = await self.get_simulation(simulation_id)
            
            if sim['status'] == 'COMPLETED_ANALYSIS':
                return sim
            elif sim['status'] == 'FAILED':
                raise Exception('Simulation failed')
            
            await asyncio.sleep(5)
        
        raise TimeoutError('Timeout')


# Usage with async
async def main():
    client = AsyncTwynClient(os.environ['TWYN_API_KEY'])
    
    # Run multiple simulations concurrently
    prompts = [
        'Simulate 10% price increase',
        'Simulate 15% price increase',
        'Simulate 20% price increase'
    ]
    
    # Create all simulations
    sims = await asyncio.gather(*[
        client.create_simulation(prompt) for prompt in prompts
    ])
    
    print(f"Created {len(sims)} simulations")
    
    # Wait for all to complete
    results = await asyncio.gather(*[
        client.wait_for_completion(sim['id']) for sim in sims
    ])
    
    print("All simulations complete!")

asyncio.run(main())
```

## Error Handling

```python
from requests.exceptions import HTTPError, Timeout, RequestException

try:
    sim = client.create_simulation(prompt='Test simulation')
except HTTPError as e:
    if e.response.status_code == 401:
        print("Authentication failed - check API key")
    elif e.response.status_code == 429:
        print("Rate limited - wait before retrying")
    elif e.response.status_code >= 500:
        print("Server error - retry later")
    else:
        print(f"HTTP error: {e}")
except Timeout:
    print("Request timed out")
except RequestException as e:
    print(f"Request failed: {e}")
```

## Complete Examples

See [GitHub Repository](https://github.com/twyn/twyn-python) for a full Python SDK.

