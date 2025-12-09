---
sidebar_position: 3
---

# JavaScript Examples

Complete JavaScript/Node.js examples.

## Basic Client

```javascript
const fetch = require('node-fetch'); // or use native fetch in Node 18+

class TwynClient {
  constructor(apiKey, baseUrl = 'https://api.twyn.it/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    };
  }

  async createSimulation(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/simulations`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ prompt, ...options })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async getSimulation(simulationId) {
    const response = await fetch(
      `${this.baseUrl}/simulations/${simulationId}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getResults(simulationId) {
    const response = await fetch(
      `${this.baseUrl}/simulations/${simulationId}/results`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async waitForCompletion(simulationId, maxWait = 600000, interval = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const sim = await this.getSimulation(simulationId);
      console.log(`Status: ${sim.status}`);

      if (sim.status === 'COMPLETED_ANALYSIS') {
        return sim;
      } else if (sim.status === 'FAILED') {
        throw new Error(`Simulation failed: ${sim.error_log}`);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Timeout');
  }
}

// Usage
const client = new TwynClient(process.env.TWYN_API_KEY);

(async () => {
  // Create simulation
  const sim = await client.createSimulation(
    'Simulate 15% price increase impact',
    { title: 'Q4 Pricing Analysis', tags: ['pricing'] }
  );

  console.log(`Created: ${sim.id}`);

  // Wait for completion
  await client.waitForCompletion(sim.id);

  // Get results
  const results = await client.getResults(sim.id);

  console.log('\n=== Analysis ===');
  console.log(results.analysis.executive_summary);

  console.log('\n=== Recommendations ===');
  results.analysis.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
})();
```

## With Axios

```javascript
const axios = require('axios');

class TwynClient {
  constructor(apiKey) {
    this.client = axios.create({
      baseURL: 'https://api.twyn.it/v1',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async createSimulation(prompt, options = {}) {
    const { data } = await this.client.post('/simulations', {
      prompt,
      ...options
    });
    return data;
  }

  async getSimulation(id) {
    const { data } = await this.client.get(`/simulations/${id}`);
    return data;
  }

  async waitForCompletion(id, maxWait = 600000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const sim = await this.getSimulation(id);

      if (sim.status === 'COMPLETED_ANALYSIS') return sim;
      if (sim.status === 'FAILED') throw new Error('Failed');

      await new Promise(r => setTimeout(r, 5000));
    }

    throw new Error('Timeout');
  }
}
```

## Complete Example

```javascript
const TwynClient = require('./twyn-client');

async function main() {
  const client = new TwynClient(process.env.TWYN_API_KEY);

  try {
    // Create simulation
    const sim = await client.createSimulation(
      'Simulate price increase impact',
      {
        title: 'Pricing Analysis',
        tags: ['pricing', 'churn']
      }
    );

    console.log(`✓ Created simulation: ${sim.id}`);

    // Wait for completion
    console.log('⏳ Waiting for completion...');
    await client.waitForCompletion(sim.id);

    // Get results
    const results = await client.getResults(sim.id);

    // Display analysis
    console.log('\n=== ANALYSIS ===');
    console.log(results.analysis.executive_summary);

    console.log('\n=== KEY DRIVERS ===');
    results.analysis.key_drivers.forEach(driver => {
      console.log(`  • ${driver}`);
    });

    console.log('\n=== RECOMMENDATIONS ===');
    results.analysis.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

