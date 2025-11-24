# Production URLs Configuration

All documentation has been updated to use production URLs.

## Primary URLs

### Production API
- **Base URL**: `https://api.twyn.it/v1`
- **Swagger UI**: `https://api.twyn.it/docs`
- **OpenAPI JSON**: `https://api.twyn.it/openapi.json`
- **Redoc**: `https://api.twyn.it/redoc`

### Documentation Site
- **Production**: `https://docs.twyn.it`
- **Development**: `http://localhost:3002` (auto-selected port)

### Main Application
- **Dashboard**: `https://twyn.it` or `https://www.twyn.it`
- **API Keys**: `https://twyn.it/api-keys`
- **Settings**: `https://twyn.it/settings`

## Updated Files

All documentation files now reference production URLs:

✅ **Getting Started**
- `docs/getting-started/quickstart.md` - Uses `api.twyn.it`
- `docs/getting-started/authentication.md` - Uses `api.twyn.it`
- `docs/getting-started/making-requests.md` - Production + dev URLs clearly labeled

✅ **Guides**
- `docs/guides/create-simulation.md` - All examples use `api.twyn.it`
- `docs/guides/polling-results.md` - Production URLs
- `docs/guides/managing-scenarios.md` - Production URLs
- `docs/guides/config-management.md` - Production URLs

✅ **Examples**
- `docs/examples/curl.md` - All cURL examples use `api.twyn.it`
- `docs/examples/python.md` - Default base URL is `https://api.twyn.it/v1`
- `docs/examples/javascript.md` - Default base URL is `https://api.twyn.it/v1`
- `docs/examples/typescript.md` - Default base URL is `https://api.twyn.it/v1`

✅ **API Reference**
- `docs/api-reference/index.md` - Links to production Swagger UI

✅ **Configuration**
- `docusaurus.config.ts` - OpenAPI spec path set to `https://api.twyn.it/openapi.json`
- `docusaurus.config.ts` - Site URL set to `https://docs.twyn.it`

## Development vs Production

Where both are mentioned, they're clearly labeled:

**Production (default):**
```bash
curl https://api.twyn.it/v1/simulations
```

**Development (when explicitly needed):**
```bash
curl http://localhost:8000/v1/simulations
```

## Environment Variables

Code examples use environment variables for API keys:

**Bash:**
```bash
export TWYN_API_KEY="twyn_live_your_key_here"
```

**Python:**
```python
API_KEY = os.environ.get('TWYN_API_KEY')
API_URL = 'https://api.twyn.it/v1'
```

**JavaScript/TypeScript:**
```javascript
const TWYN_API_KEY = process.env.TWYN_API_KEY;
const TWYN_API_URL = 'https://api.twyn.it/v1';
```

## CORS Configuration Required

The backend needs to allow the docs subdomain. Already configured in `twyn-backend/src/api/main.py`:

```python
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://localhost:3001,https://www.twyn.it,https://twyn.it,https://docs.twyn.it"
)
```

## Testing Production URLs

Once deployed, test these endpoints:

```bash
# Health check
curl https://api.twyn.it/docs

# OpenAPI spec
curl https://api.twyn.it/openapi.json

# V1 endpoint (requires API key)
curl https://api.twyn.it/v1/simulations \
  -H "X-API-Key: your_key_here"
```

## DNS Configuration

For `docs.twyn.it` to work, you'll need:

```
Type: CNAME
Name: docs
Value: [your-hosting-provider].com (e.g., cname.vercel-dns.com)
```

See `DEPLOYMENT.md` for full deployment instructions.

