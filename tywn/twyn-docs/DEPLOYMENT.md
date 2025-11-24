# Twyn Documentation Deployment Guide

This guide covers deploying the Twyn documentation site to a subdomain (docs.twyn.it).

## Prerequisites

- Domain name (twyn.it)
- Access to DNS configuration
- Hosting platform account (Vercel, Netlify, or Cloudflare Pages)

## Option 1: Vercel (Recommended)

### Setup

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the `twyn-docs` directory:
```bash
cd twyn-docs
vercel
```

4. Follow the prompts:
   - Project name: `twyn-docs`
   - Framework: `Docusaurus`
   - Build command: `npm run build`
   - Output directory: `build`

### Configure Custom Domain

1. In Vercel dashboard, go to your project settings
2. Navigate to **Domains**
3. Add `docs.twyn.it`
4. Follow DNS configuration instructions

### DNS Configuration

Add these DNS records:

```
Type: CNAME
Name: docs
Value: cname.vercel-dns.com
```

### Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
# None required for static site
```

### Auto-Deploy

Push to GitHub to automatically deploy:

1. Connect your GitHub repository
2. Set branch to `main`
3. Enable auto-deploy on push

## Option 2: Netlify

### Setup

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
cd twyn-docs
netlify deploy --prod
```

3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`

### Custom Domain

1. Go to **Domain settings**
2. Add custom domain: `docs.twyn.it`
3. Configure DNS:

```
Type: CNAME
Name: docs
Value: your-site.netlify.app
```

## Option 3: Cloudflare Pages

### Setup

1. Connect GitHub repository
2. Build settings:
   - Framework: `Docusaurus`
   - Build command: `npm run build`
   - Build output: `build`

### Custom Domain

1. Navigate to **Custom domains**
2. Add `docs.twyn.it`
3. DNS automatically configured if using Cloudflare DNS

## GitHub Actions (CI/CD)

Create `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'twyn-docs/**'
  pull_request:
    branches: [main]
    paths:
      - 'twyn-docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: twyn-docs/package-lock.json
      
      - name: Install dependencies
        working-directory: twyn-docs
        run: npm ci
      
      - name: Build
        working-directory: twyn-docs
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: twyn-docs
          vercel-args: '--prod'
```

## Backend CORS Configuration

Update backend to allow docs subdomain:

```python
# twyn-backend/src/api/main.py

allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://localhost:3001,https://www.twyn.it,https://twyn.it,https://docs.twyn.it"
)
```

## Testing Deployment

1. **Build locally:**
```bash
cd twyn-docs
npm run build
npm run serve
```

2. **Test production build:**
   - Check all links work
   - Verify API reference loads
   - Test search functionality
   - Check responsive design

3. **Verify DNS:**
```bash
dig docs.twyn.it
nslookup docs.twyn.it
```

## SSL/TLS

All recommended platforms provide free SSL certificates automatically.

## Monitoring

### Uptime Monitoring

Use services like:
- Uptime Robot
- Pingdom
- Better Uptime

Monitor: `https://docs.twyn.it`

### Analytics

Add Google Analytics in `docusaurus.config.ts`:

```typescript
themeConfig: {
  // ... other config
  gtag: {
    trackingID: 'G-XXXXXXXXXX',
    anonymizeIP: true,
  },
}
```

## Maintenance

### Updating Documentation

1. Edit markdown files in `docs/`
2. Commit and push to GitHub
3. Auto-deploys on push to main

### Regenerating API Docs

```bash
# Start backend
cd twyn-backend
python run.py

# In another terminal
cd twyn-docs
npm run gen-api-docs
git add docs/api-reference
git commit -m "Update API documentation"
git push
```

### Cache Invalidation

Most platforms auto-invalidate cache on deploy. Manual invalidation:

**Vercel:**
```bash
vercel --prod --force
```

**Netlify:**
```bash
netlify deploy --prod --clear-cache
```

## Troubleshooting

### Build Fails

Check:
- Node version (should be 18+)
- Dependencies installed (`npm ci`)
- No TypeScript errors (`npm run typecheck`)

### Links Broken

- Use relative links: `./page` not `/page`
- Check `docusaurus.config.ts` baseUrl setting

### API Docs Not Generating

- Ensure backend is running on localhost:8000
- Check OpenAPI endpoint: `curl http://localhost:8000/openapi.json`
- Verify plugin configuration in `docusaurus.config.ts`

## Security

- Enable HTTPS only
- Set up security headers
- Regular dependency updates: `npm audit`

## Next Steps

- Set up custom 404 page
- Add sitemap.xml (auto-generated)
- Configure robots.txt
- Set up search (Algolia DocSearch)

