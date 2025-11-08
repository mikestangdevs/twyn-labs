"""
Global dependencies for the SSE API.
"""

from src.api.simulation_manager import SimulationManager
from src.assets.asset_manager import AssetManager

# Create global manager instances
simulation_manager = SimulationManager()
asset_manager = AssetManager()


def get_simulation_manager() -> SimulationManager:
    """
    Dependency to get the global SimulationManager instance.
    Use this as a FastAPI dependency in routes that need access to the simulation manager.
    
    Returns:
        SimulationManager: The global simulation manager instance
    """
    return simulation_manager


def get_asset_manager() -> AssetManager:
    """
    Dependency to get the global AssetManager instance.
    Use this as a FastAPI dependency in routes that need access to assets and perceptions.
    
    Returns:
        AssetManager: The global asset manager instance
    """
    return asset_manager 