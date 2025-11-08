from fastapi import APIRouter, Depends, BackgroundTasks

from src.api.deps import get_simulation_manager
from src.api.simulation_manager import SimulationManager
from src.api.models import SimulationState


router = APIRouter(
    prefix="/simulator",
    tags=["simulator"]
)


@router.post("/{simulation_id}", response_model=SimulationState)
async def run_simulator(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    manager: SimulationManager = Depends(get_simulation_manager)
):
    """
    Run the simulator for a given simulation.
    
    Args:
        simulation_id: The ID of the simulation to run the simulator for
        manager: The SimulationManager instance (injected)
        
    Returns:
        SimulationState: The updated simulation state
    """
    # Add the simulation processing to background tasks
    background_tasks.add_task(manager.run_simulator, simulation_id)
    
    simulation_state = await manager.get_simulation(simulation_id)
    
    return simulation_state
