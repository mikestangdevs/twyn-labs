---
sidebar_position: 1
---

# API Reference

The interactive API reference is temporarily unavailable. Please refer to the comprehensive documentation in the guides section.

## Alternative API Documentation

You can access the API documentation through:

1. **FastAPI Interactive Docs**: [https://api.twyn.it/docs](https://api.twyn.it/docs)
2. **OpenAPI JSON**: [https://api.twyn.it/openapi.json](https://api.twyn.it/openapi.json)
3. **Development Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) (when running locally)

## V1 API Endpoints

### Simulations

- `POST /v1/simulations` - Create a new simulation
- `GET /v1/simulations/{id}` - Get simulation status
- `GET /v1/simulations/{id}/results` - Get complete results
- `GET /v1/simulations` - List simulations with filters

### API Keys

- `POST /v1/keys` - Create a new API key
- `GET /v1/keys` - List your API keys
- `GET /v1/keys/{key_id}` - Get key details
- `PATCH /v1/keys/{key_id}` - Update a key
- `DELETE /v1/keys/{key_id}` - Delete a key

### Scenarios

- `POST /v1/scenarios` - Create a scenario
- `GET /v1/scenarios` - List scenarios
- `GET /v1/scenarios/{id}` - Get scenario details
- `PUT /v1/scenarios/{id}` - Update scenario
- `DELETE /v1/scenarios/{id}` - Delete scenario

### Configuration

- `GET /v1/simulations/{id}/config` - Get simulation config
- `PUT /v1/simulations/{id}/config` - Update config
- `POST /v1/simulations/{id}/architect` - Re-run architect
- `POST /v1/simulations/with-config` - Create with custom config

## For Complete Documentation

See the [Getting Started](../getting-started/quickstart) guide for complete examples and detailed information.

