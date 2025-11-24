---
sidebar_position: 2
---

# Authentication

Learn how to securely authenticate with the Twyn API using API keys.

## Overview

The Twyn V1 API uses **API key authentication**. Every request must include an `X-API-Key` header with a valid API key.

```bash
curl https://api.twyn.it/v1/simulations \
  -H "X-API-Key: twyn_live_your_key_here"
```

## API Key Format

Twyn API keys have the following format:

```
twyn_{environment}_{64_character_hex_string}
```

**Examples:**
- Production: `twyn_live_1234567890abcdef...`
- Testing: `twyn_test_abcdef1234567890...`

## Getting Your First API Key

### From the Dashboard

1. Log in to [twyn.it](https://twyn.it)
2. Go to **Settings** → **API Keys**
3. Click **Create New Key**
4. Provide a name (e.g., "Production Server")
5. Set a rate limit (default: 1000 requests/hour)
6. Optionally set an expiration date
7. Click **Create**

:::warning Save Your Key Immediately
The API key is shown only once. Copy it to a secure location immediately. If you lose it, you'll need to create a new one.
:::

### Programmatically

You can also create API keys using the API itself (requires an existing API key):

```bash
curl -X POST https://api.twyn.it/v1/keys \
  -H "X-API-Key: YOUR_EXISTING_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Server",
    "rate_limit": 500,
    "expires_in_days": 90
  }'
```

**Response:**
```json
{
  "key_id": "key_abc123",
  "api_key": "twyn_live_new_key_here",
  "tenant_id": "your-tenant-id",
  "name": "Development Server",
  "rate_limit": 500,
  "expires_at": "2026-02-22T01:00:00Z",
  "created_at": "2025-11-24T01:00:00Z"
}
```

## Using API Keys

### HTTP Header

Include your API key in the `X-API-Key` header:

```bash
curl https://api.twyn.it/v1/simulations/123 \
  -H "X-API-Key: twyn_live_your_key_here"
```

### cURL

```bash
# Option 1: Inline
curl -H "X-API-Key: twyn_live_..." https://api.twyn.it/v1/simulations

# Option 2: From environment variable
export TWYN_API_KEY="twyn_live_..."
curl -H "X-API-Key: $TWYN_API_KEY" https://api.twyn.it/v1/simulations
```

### Python

```python
import os
import requests

API_KEY = os.environ.get('TWYN_API_KEY')
API_URL = 'https://api.twyn.it/v1'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

response = requests.get(f'{API_URL}/simulations', headers=headers)
simulations = response.json()
```

### JavaScript/Node.js

```javascript
const TWYN_API_KEY = process.env.TWYN_API_KEY;
const TWYN_API_URL = 'https://api.twyn.it/v1';

const headers = {
  'X-API-Key': TWYN_API_KEY,
  'Content-Type': 'application/json'
};

const response = await fetch(`${TWYN_API_URL}/simulations`, { headers });
const simulations = await response.json();
```

### TypeScript

```typescript
interface TwynConfig {
  apiKey: string;
  baseUrl?: string;
}

class TwynClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: TwynConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.twyn.it/v1';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getSimulation(id: string) {
    return this.request(`/simulations/${id}`);
  }
}

// Usage
const client = new TwynClient({
  apiKey: process.env.TWYN_API_KEY!
});

const simulation = await client.getSimulation('sim_123');
```

## Managing API Keys

### List All Keys

View all API keys for your tenant:

```bash
curl https://api.twyn.it/v1/keys \
  -H "X-API-Key: twyn_live_your_key_here"
```

**Response:**
```json
{
  "keys": [
    {
      "key_id": "key_abc123",
      "tenant_id": "your-tenant-id",
      "name": "Production Server",
      "is_active": true,
      "rate_limit": 1000,
      "created_at": "2025-11-01T00:00:00Z",
      "expires_at": null,
      "last_used_at": "2025-11-24T00:30:00Z",
      "usage_count": 1523
    },
    {
      "key_id": "key_def456",
      "tenant_id": "your-tenant-id",
      "name": "Development",
      "is_active": true,
      "rate_limit": 500,
      "created_at": "2025-11-15T00:00:00Z",
      "expires_at": "2026-02-15T00:00:00Z",
      "last_used_at": "2025-11-23T18:00:00Z",
      "usage_count": 234
    }
  ],
  "total": 2
}
```

### Get Key Details

```bash
curl https://api.twyn.it/v1/keys/key_abc123 \
  -H "X-API-Key: twyn_live_your_key_here"
```

### Update a Key

Update the name or enable/disable a key:

```bash
curl -X PATCH https://api.twyn.it/v1/keys/key_abc123 \
  -H "X-API-Key: twyn_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server (Updated)",
    "is_active": false
  }'
```

:::tip Disable Instead of Delete
Disabling a key (`is_active: false`) is better than deleting it because it preserves usage history and can be re-enabled if needed.
:::

### Delete a Key

Permanently revoke an API key:

```bash
curl -X DELETE https://api.twyn.it/v1/keys/key_abc123 \
  -H "X-API-Key: twyn_live_your_key_here"
```

:::danger This Action is Permanent
Deleted keys cannot be recovered. Consider disabling instead.
:::

## Security Best Practices

### Do's ✅

- **Store keys in environment variables** - Never hardcode them
- **Use different keys for each environment** - dev, staging, production
- **Set expiration dates** - Rotate keys periodically
- **Use appropriate rate limits** - Match your expected usage
- **Monitor key usage** - Check `usage_count` and `last_used_at` regularly
- **Revoke unused keys** - Delete or disable keys you're not using

### Don'ts ❌

- **Don't commit keys to version control** - Add to `.gitignore`
- **Don't share keys between services** - Create separate keys
- **Don't use production keys in development** - Use test keys
- **Don't log API keys** - Redact them in logs
- **Don't embed keys in client-side code** - API keys are for server-side only
- **Don't use the same key forever** - Rotate periodically

### Environment Variables

**Development:**
```bash
# .env.local (add to .gitignore)
TWYN_API_KEY=twyn_test_dev_key_here
```

**Production:**
```bash
# Set in your hosting platform (Vercel, Heroku, AWS, etc.)
TWYN_API_KEY=twyn_live_prod_key_here
```

## Rate Limiting

Each API key has a rate limit (default: 1000 requests/hour).

**Response headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1700000000
```

**When rate limited (429 response):**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 45 minutes.",
  "retry_after": 2700
}
```

## Tenant Isolation

API keys are tied to a **tenant** (your organization). All resources (simulations, scenarios, etc.) are automatically scoped to your tenant.

- ✅ You can only access your own simulations
- ✅ You can only manage your own API keys
- ✅ Your data is isolated from other tenants

## Error Responses

### 401 Unauthorized

Missing or invalid API key:

```json
{
  "detail": "Invalid or missing API key"
}
```

**Fix:** Check that you included the `X-API-Key` header with a valid key.

### 403 Forbidden

Attempting to access a resource from a different tenant:

```json
{
  "detail": "Access denied: simulation belongs to different tenant"
}
```

**Fix:** Verify you're using the correct API key for your tenant.

### 429 Too Many Requests

Rate limit exceeded:

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again later.",
  "retry_after": 3600
}
```

**Fix:** Wait for the rate limit to reset or increase your key's rate limit.

## Testing Authentication

Test your API key with a simple request:

```bash
curl https://api.twyn.it/v1/keys \
  -H "X-API-Key: twyn_live_your_key_here"
```

**If successful**, you'll see a list of your API keys.

**If failed**, you'll see a 401 error - check your key and try again.

## Next Steps

- [Making Requests](./making-requests) - Learn request/response patterns
- [Create a Simulation](../guides/create-simulation) - Build your first simulation
- [API Reference](/docs/api-reference) - Complete endpoint documentation

