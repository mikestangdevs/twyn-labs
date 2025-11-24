# Twyn API Documentation

This directory contains the Docusaurus-based documentation site for the Twyn V1 API.

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Generate API Documentation

To regenerate the API reference from the OpenAPI schema (make sure the backend is running on `localhost:8000`):

```bash
npm run gen-api-docs
```

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static hosting service.

## Deployment

The site is configured to deploy to `docs.twyn.it`. You can deploy using:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

See the deployment configuration section in the main documentation for details.

## Project Structure

```
twyn-docs/
├── docs/                    # Documentation markdown files
│   ├── getting-started/    # Getting started guides
│   ├── guides/             # User guides
│   ├── concepts/           # Conceptual documentation
│   ├── examples/           # Code examples
│   └── api-reference/      # Auto-generated API docs
├── src/                    # React components and pages
├── static/                 # Static assets
└── docusaurus.config.ts    # Docusaurus configuration
```
