# Generating API Reference from OpenAPI

The API reference documentation is automatically generated from the FastAPI OpenAPI schema.

## Prerequisites

1. Start the backend server:
```bash
cd twyn-backend
python run.py
```

The server should be running on `http://localhost:8000`

## Generate API Docs

Run the following command from the `twyn-docs` directory:

```bash
npm run gen-api-docs
```

This will:
1. Fetch the OpenAPI schema from `http://localhost:8000/openapi.json`
2. Generate markdown files in `docs/api-reference/`
3. Update the sidebar configuration

## View the Docs

Start the development server:

```bash
npm start
```

Navigate to `/docs/api-reference` to see the generated API documentation.

## Updating API Docs

Whenever you make changes to the FastAPI endpoints:

1. Restart the backend server
2. Run `npm run gen-api-docs` again
3. The docs will be automatically updated

## Configuration

The OpenAPI plugin configuration is in `docusaurus.config.ts`:

```typescript
plugins: [
  [
    'docusaurus-plugin-openapi-docs',
    {
      id: "api",
      docsPluginId: "classic",
      config: {
        twyn: {
          specPath: "http://localhost:8000/openapi.json",
          outputDir: "docs/api-reference",
          sidebarOptions: {
            groupPathsBy: "tag",
            categoryLinkSource: "tag",
          },
        },
      },
    }
  ]
]
```

##Interactive Features

The generated API docs include:
- **Try It Out**: Test endpoints directly from the browser
- **Code Examples**: Auto-generated for multiple languages
- **Request/Response Examples**: Based on FastAPI models
- **Authentication**: Pre-configured API key input

