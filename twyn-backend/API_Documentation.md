# Twyn SSE API Documentation

## Overview

The Twyn SSE API is a Server-Sent Events Backend API that handles simulation workflows through three main stages: Architect, Simulator, and Analyst. The API uses FastAPI and provides real-time updates through Server-Sent Events (SSE).

**Base URL:** `http://localhost:8000` (development)

**API Version:** 1.0.0

## Table of Contents

- [Authentication](#authentication)
- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [Simulations](#simulations)
  - [Architect](#architect)
  - [Simulator](#simulator)
  - [Analyst](#analyst)
- [Server-Sent Events](#server-sent-events)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Authentication

Currently, no authentication is required. The API accepts requests from all origins (CORS enabled).

## Data Models

### SimulationStatus (Enum)

Represents the current status of a simulation:

```json
{
  "PENDING": "pending",
  "PROCESSING_CONFIG": "processing_config",
  "COMPLETED_CONFIG": "completed_config",
  "PROCESSING_SIMULATION": "processing_simulation",
  "COMPLETED_SIMULATION": "completed_simulation",
  "PROCESSING_ANALYSIS": "processing_analysis",
  "COMPLETED_ANALYSIS": "completed_analysis",
  "FAILED": "failed"
}
```

### SimulationState

The main data structure representing a simulation:

```json
{
  "simulation_id": "string (UUID4)",
  "prompt": "string | null",
  "time_created": "string (ISO datetime) | null",
  "status": "SimulationStatus | null",
  "title": "string | null",
  "config": "object | null",
  "data": "object | null",
  "current_step": "number | null",
  "analysis": "string | null",
  "error_log": "string | null"
}
```

### CreateSimulationRequest

Request body for creating a new simulation:

```json
{
  "prompt": "string (required)"
}
```

### SSEMessage

Standard Server-Sent Events message format:

```json
{
  "id": "string",
  "event": "string (default: 'message')",
  "data": "SimulationState"
}
```

## Endpoints

### Simulations

#### Create Simulation

**POST** `/simulations/`

Creates a new simulation instance with the given prompt.

**Request Body:**
```json
{
  "prompt": "Your simulation prompt here"
}
```

**Response:** `200 OK`
```json
{
  "simulation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "prompt": "Your simulation prompt here",
  "time_created": "2024-01-01T12:00:00Z",
  "status": "pending",
  "title": null,
  "config": null,
  "data": null,
  "current_step": null,
  "analysis": null,
  "error_log": null
}
```

#### Get Simulation

**GET** `/simulations/{simulation_id}`

Retrieves the current state of a specific simulation.

**Path Parameters:**
- `simulation_id` (string, required): The UUID of the simulation

**Response:** `200 OK`
```json
{
  "simulation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "prompt": "Your simulation prompt here",
  "time_created": "2024-01-01T12:00:00Z",
  "status": "processing_config",
  "title": "Generated Simulation Title",
  "config": { /* simulation configuration */ },
  "data": { /* simulation data */ },
  "current_step": 1,
  "analysis": null,
  "error_log": null
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "Simulation with ID {simulation_id} not found"
}
```

#### Stream Simulation Updates

**GET** `/simulations/{simulation_id}/stream`

Establishes a Server-Sent Events stream to receive real-time updates for a simulation.

**Path Parameters:**
- `simulation_id` (string, required): The UUID of the simulation

**Response:** `200 OK` (Server-Sent Events stream)

**Headers:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Stream Events:**
- `update`: Regular simulation state updates
- `error`: Error messages

### Architect

#### Run Architect

**POST** `/architect/{simulation_id}`

Triggers the architect stage for a simulation. This runs in the background.

**Path Parameters:**
- `simulation_id` (string, required): The UUID of the simulation

**Response:** `200 OK`
```json
{
  "simulation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "prompt": "Your simulation prompt here",
  "time_created": "2024-01-01T12:00:00Z",
  "status": "processing_config",
  "title": null,
  "config": null,
  "data": null,
  "current_step": null,
  "analysis": null,
  "error_log": null
}
```

### Simulator

#### Run Simulator

**POST** `/simulator/{simulation_id}`

Triggers the simulator stage for a simulation. This runs in the background.

**Path Parameters:**
- `simulation_id` (string, required): The UUID of the simulation

**Response:** `200 OK`
```json
{
  "simulation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "prompt": "Your simulation prompt here",
  "time_created": "2024-01-01T12:00:00Z",
  "status": "processing_simulation",
  "title": "Generated Simulation Title",
  "config": { /* simulation configuration */ },
  "data": null,
  "current_step": null,
  "analysis": null,
  "error_log": null
}
```

### Analyst

#### Run Analyst

**POST** `/analyst/{simulation_id}`

Triggers the analyst stage for a simulation. This runs in the background.

**Path Parameters:**
- `simulation_id` (string, required): The UUID of the simulation

**Response:** `200 OK`
```json
{
  "simulation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "prompt": "Your simulation prompt here",
  "time_created": "2024-01-01T12:00:00Z",
  "status": "processing_analysis",
  "title": "Generated Simulation Title",
  "config": { /* simulation configuration */ },
  "data": { /* simulation data */ },
  "current_step": 5,
  "analysis": null,
  "error_log": null
}
```

## Server-Sent Events

The SSE stream (`/simulations/{simulation_id}/stream`) sends events in the following format:

```
id: 1
event: update
data: {"simulation_id": "...", "status": "processing_config", ...}

id: 2
event: update
data: {"simulation_id": "...", "status": "completed_config", ...}

id: 3
event: error
data: {"simulation_id": "...", "error_log": "Error message", ...}
```

### Event Types:
- `update`: Regular simulation state updates
- `error`: Error occurred during simulation

### Stream Termination:
The stream automatically terminates when:
- Simulation reaches `completed_analysis` status
- Simulation reaches `failed` status
- An error occurs

## Error Handling

### HTTP Status Codes:
- `200 OK`: Successful request
- `404 Not Found`: Simulation not found
- `422 Unprocessable Entity`: Invalid request data
- `500 Internal Server Error`: Server error

### Error Response Format:
```json
{
  "detail": "Error description"
}
```

## Usage Examples

### Complete Simulation Workflow

#### 1. Create a Simulation
```javascript
const response = await fetch('http://localhost:8000/simulations/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Simulate a market crash scenario'
  })
});

const simulation = await response.json();
const simulationId = simulation.simulation_id;
```

#### 2. Set up SSE Stream
```javascript
const eventSource = new EventSource(`http://localhost:8000/simulations/${simulationId}/stream`);

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Simulation update:', data);
  
  // Handle different statuses
  switch(data.status) {
    case 'pending':
      console.log('Simulation created, waiting to start...');
      break;
    case 'processing_config':
      console.log('Architect is processing configuration...');
      break;
    case 'completed_config':
      console.log('Configuration completed:', data.config);
      break;
    case 'processing_simulation':
      console.log('Simulator is running...');
      break;
    case 'completed_simulation':
      console.log('Simulation completed:', data.data);
      break;
    case 'processing_analysis':
      console.log('Analyst is analyzing results...');
      break;
    case 'completed_analysis':
      console.log('Analysis completed:', data.analysis);
      eventSource.close();
      break;
    case 'failed':
      console.error('Simulation failed:', data.error_log);
      eventSource.close();
      break;
  }
};

eventSource.addEventListener('error', function(event) {
  const data = JSON.parse(event.data);
  console.error('Simulation error:', data.error_log);
});
```

#### 3. Trigger Simulation Stages
```javascript
// Start architect
await fetch(`http://localhost:8000/architect/${simulationId}`, {
  method: 'POST'
});

// Wait for architect to complete, then start simulator
// (You can check status via SSE or polling)

await fetch(`http://localhost:8000/simulator/${simulationId}`, {
  method: 'POST'
});

// Wait for simulator to complete, then start analyst

await fetch(`http://localhost:8000/analyst/${simulationId}`, {
  method: 'POST'
});
```

#### 4. Get Simulation State (Alternative to SSE)
```javascript
const simulationState = await fetch(`http://localhost:8000/simulations/${simulationId}`);
const data = await simulationState.json();
console.log('Current simulation state:', data);
```

### React Example with Hooks

```javascript
import { useState, useEffect } from 'react';

function useSimulation(simulationId) {
  const [simulation, setSimulation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!simulationId) return;

    const eventSource = new EventSource(`http://localhost:8000/simulations/${simulationId}/stream`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSimulation(data);
      setIsLoading(false);
    };

    eventSource.addEventListener('error', (event) => {
      const data = JSON.parse(event.data);
      setError(data.error_log);
      setIsLoading(false);
    });

    return () => {
      eventSource.close();
    };
  }, [simulationId]);

  return { simulation, isLoading, error };
}

// Usage in component
function SimulationView({ simulationId }) {
  const { simulation, isLoading, error } = useSimulation(simulationId);

  if (isLoading) return <div>Loading simulation...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>{simulation.title || 'Untitled Simulation'}</h2>
      <p>Status: {simulation.status}</p>
      <p>Step: {simulation.current_step}</p>
      {simulation.analysis && (
        <div>
          <h3>Analysis</h3>
          <p>{simulation.analysis}</p>
        </div>
      )}
    </div>
  );
}
```

## Notes for Frontend Development

1. **Real-time Updates**: Use Server-Sent Events for real-time simulation updates instead of polling
2. **Background Processing**: All simulation stages (Architect, Simulator, Analyst) run in the background
3. **Error Handling**: Always handle both HTTP errors and SSE error events
4. **Stream Management**: Remember to close EventSource connections when components unmount
5. **Status Tracking**: Use the simulation status to drive UI state and progress indicators
6. **UUID Handling**: Simulation IDs are UUID4 strings, store them appropriately
7. **CORS**: API allows all origins in development, update for production 