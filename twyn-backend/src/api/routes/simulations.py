from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uuid
import asyncio
import json
from datetime import datetime
import time
from copy import deepcopy

from src.api.deps import get_simulation_manager
from src.api.simulation_manager import SimulationManager
from src.api.models import SimulationState, SimulationStatus


router = APIRouter(
    prefix="/simulations",
    tags=["simulations"]
)


class CreateSimulationRequest(BaseModel):
    prompt: str


@router.post("/", response_model=SimulationState)
async def create_simulation(
    request: CreateSimulationRequest,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Create a new simulation instance with the given prompt.
    
    Args:
        request: The request containing the prompt for the simulation
        manager: The SimulationManager instance (injected)
        
    Returns:
        SimulationState: The initial simulation state with generated UUID4
    """
    # Generate unique simulation ID
    simulation_id = str(uuid.uuid4())
    
    # Create initial simulation state using the manager
    simulation_state = await manager.add_simulation(simulation_id, request.prompt)
    
    return simulation_state


@router.get("/{simulation_id}", response_model=SimulationState)
async def get_simulation(
    simulation_id: str,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Get the current state of a simulation.
    
    Args:
        simulation_id: The ID of the simulation to retrieve
        manager: The SimulationManager instance (injected)
        
    Returns:
        SimulationState: The current simulation state
    """
    simulation_state = await manager.get_simulation(simulation_id)
    if simulation_state is None:
        raise HTTPException(status_code=404, detail=f"Simulation with ID {simulation_id} not found")
    
    return simulation_state


def format_sse_message(data: dict, event: str = "update") -> str:
    """
    Format data as SSE message.
    
    Args:
        data: The data to send
        event: The SSE event type (e.g., 'update', 'heartbeat', 'error', 'end')
        
    Returns:
        str: Formatted SSE message
    """
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

def simulation_has_changed(current: SimulationState, previous: SimulationState | None) -> bool:
    """Check if simulation state has changed"""
    if previous is None:
        return True
    
    return current != previous

@router.get("/{simulation_id}/stream")
async def stream_simulation(
    simulation_id: str,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Stream simulation updates using Server-Sent Events (SSE).
    Includes heartbeats and only sends data when meaningful changes occur.
    
    Args:
        simulation_id: The ID of the simulation to stream
        manager: The SimulationManager instance (injected)
        
    Returns:
        StreamingResponse: SSE response that streams simulation updates
    """
    async def event_generator():
        previous_state = None
        last_heartbeat = time.time()
        heartbeat_interval = 30  # Send heartbeat every 30 seconds
        data_check_interval = 1  # Check for data changes every second
        
        # Send initial connection message
        yield format_sse_message({
            "message": "Connected to simulation stream",
            "simulation_id": simulation_id,
            "timestamp": time.time()
        }, "connection")
        
        while True:
            try:
                current_time = time.time()
                
                # Check if it's time for a heartbeat
                if current_time - last_heartbeat >= heartbeat_interval:
                    yield format_sse_message({
                        "simulation_id": simulation_id,
                        "timestamp": current_time,
                        "connection_active": True
                    }, "heartbeat")
                    last_heartbeat = current_time
                
                # Get current simulation state
                current_state = await manager.get_simulation(simulation_id)
                
                # Handle non-existent simulation
                if current_state is None:
                    yield format_sse_message({
                        "simulation_id": simulation_id,
                        "error_log": f"Simulation with ID {simulation_id} not found",
                        "timestamp": current_time
                    }, "error")
                    break
                
                # Check if state has changed
                if simulation_has_changed(current_state, previous_state):
                    # Send the current state
                    yield format_sse_message({
                        "timestamp": current_time,
                        **current_state.model_dump()
                    }, "update")
                    previous_state = deepcopy(current_state)
                
                # If simulation is in a final state, stop streaming
                if current_state.status in [SimulationStatus.COMPLETED_ANALYSIS, SimulationStatus.FAILED]:
                    # Send the current final state
                    yield format_sse_message({
                        "timestamp": current_time,
                        **current_state.model_dump()
                    }, "end")
                    previous_state = current_state
                    break
                
                # Wait before next check
                await asyncio.sleep(data_check_interval)
                
            except Exception as e:
                yield format_sse_message({
                    "simulation_id": simulation_id,
                    "error_log": f"Error streaming simulation: {str(e)}",
                    "timestamp": time.time()
                }, "error")
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


@router.post("/architect/{simulation_id}", response_model=SimulationState)
async def run_architect(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Trigger the architect phase for a simulation.
    
    Args:
        simulation_id: The ID of the simulation to run architect on
        background_tasks: FastAPI background tasks handler
        manager: The SimulationManager instance (injected)
        
    Returns:
        SimulationState: The current simulation state
    """
    simulation_state = await manager.get_simulation(simulation_id)
    if simulation_state is None:
        raise HTTPException(status_code=404, detail=f"Simulation with ID {simulation_id} not found")
    
    # Run architect in background
    background_tasks.add_task(manager.run_architect, simulation_id)
    
    return simulation_state


@router.post("/simulator/{simulation_id}", response_model=SimulationState)
async def run_simulator(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Trigger the simulator phase for a simulation.
    
    Args:
        simulation_id: The ID of the simulation to run simulator on
        background_tasks: FastAPI background tasks handler
        manager: The SimulationManager instance (injected)
        
    Returns:
        SimulationState: The current simulation state
    """
    simulation_state = await manager.get_simulation(simulation_id)
    if simulation_state is None:
        raise HTTPException(status_code=404, detail=f"Simulation with ID {simulation_id} not found")
    
    # Run simulator in background
    background_tasks.add_task(manager.run_simulator, simulation_id)
    
    return simulation_state


@router.post("/analyst/{simulation_id}", response_model=SimulationState)
async def run_analyst(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Trigger the analyst phase for a simulation.
    
    Args:
        simulation_id: The ID of the simulation to run analyst on
        background_tasks: FastAPI background tasks handler
        manager: The SimulationManager instance (injected)
        
    Returns:
        SimulationState: The current simulation state
    """
    simulation_state = await manager.get_simulation(simulation_id)
    if simulation_state is None:
        raise HTTPException(status_code=404, detail=f"Simulation with ID {simulation_id} not found")
    
    # Run analyst in background
    background_tasks.add_task(manager.run_analyst, simulation_id)
    
    return simulation_state


@router.post("/restore", response_model=SimulationState)
async def restore_simulation(
    simulation_state: SimulationState,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Restore a simulation state (useful for recovering from backend restarts).
    """
    print(f"[RESTORE] Storing simulation_id: {simulation_state.simulation_id} (type: {type(simulation_state.simulation_id)})")
    print(f"[RESTORE] Current keys in manager: {list(manager.simulations.keys())}")
    manager.simulations[simulation_state.simulation_id] = simulation_state
    print(f"[RESTORE] Keys after storing: {list(manager.simulations.keys())}")
    return simulation_state
