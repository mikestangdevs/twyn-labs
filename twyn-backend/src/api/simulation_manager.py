from datetime import datetime
from openai import AsyncOpenAI
from typing import Any

from src.api.models import SimulationState, SimulationStatus, SimulationTitle
from src.api.config import settings
from src.core.architect.architect import create_configuration
from src.core.analyst.analyst import create_report
from src.core.shared.agent import ContextCallback
from src.core.simulator.provider import Provider
from src.core.simulator.simulator import Simulator
from src.core.shared.config_serializer import decode_config, encode_config


class ArchitectCallback(ContextCallback):
    def __init__(self, manager: 'SimulationManager', simulation_id: str):
        self.manager = manager
        self.simulation_id = simulation_id

    async def on_context_change(self, context: Any):
        """Update simulation state when context changes."""
        simulation_state = await self.manager.get_simulation(self.simulation_id)
        if simulation_state:
            simulation_state.config = encode_config(context.config)
            simulation_state.sources = list(dict.fromkeys(context.sources)) if context.sources else None
            self.manager.simulations[self.simulation_id] = simulation_state

class SimulatorCallback(ContextCallback):
    def __init__(self, manager: 'SimulationManager', simulation_id: str):
        self.manager = manager
        self.simulation_id = simulation_id

    async def on_step_complete(self, step_data: Any):
        """Update simulation state when step completes."""
        simulation_state = await self.manager.get_simulation(self.simulation_id)
        if simulation_state:
            if simulation_state.data is None:
                simulation_state.data = [step_data]
            else:
                simulation_state.data.append(step_data)
            simulation_state.current_step = len(simulation_state.data)
            self.manager.simulations[self.simulation_id] = simulation_state
            
class AnalystCallback(ContextCallback):
    def __init__(self, manager: 'SimulationManager', simulation_id: str):
        self.manager = manager
        self.simulation_id = simulation_id

    async def on_context_change(self, context: Any):
        """Update simulation state when context changes."""
        simulation_state = await self.manager.get_simulation(self.simulation_id)
        if simulation_state:
            simulation_state.analysis = context.analysis
            self.manager.simulations[self.simulation_id] = simulation_state


class SimulationManager:
    def __init__(self):
        self.simulations = {}  # Changed from defaultdict to regular dict
        self.client = AsyncOpenAI(
            base_url=settings.openai.base_url,
            api_key=settings.openai.api_key
        )

    async def _generate_title(self, prompt: str) -> str:
        """
        Generate a concise title from a prompt using OpenAI's structured output.
        
        Args:
            prompt: The simulation prompt
            
        Returns:
            str: The generated title
        """
        completion = await self.client.beta.chat.completions.parse(
            model=settings.title_generator.model,
            messages=[
                {"role": "system", "content": settings.title_generator.prompt},
                {"role": "user", "content": prompt},
            ],
            response_format=SimulationTitle,
            temperature=0.0,
        )
        
        return completion.choices[0].message.parsed.title

    async def add_simulation(self, simulation_id: str, prompt: str) -> SimulationState:
        """
        Add a new simulation to the manager.
        
        Args:
            simulation_id: Unique identifier for the simulation
            prompt: The simulation prompt
            
        Returns:
            SimulationState: The initial simulation state
        """
        # Generate title
        title = await self._generate_title(prompt)
        
        simulation_state = SimulationState(
            simulation_id=simulation_id,
            prompt=prompt,
            time_created=datetime.now().isoformat(),
            status=SimulationStatus.PENDING,
            title=title,
            config=None,
            sources=None,
            data=None,
            current_step=None,
            analysis=None,
            error_log=None
        )
        self.simulations[simulation_id] = simulation_state
        return simulation_state

    async def get_simulation(self, simulation_id: str) -> SimulationState | None:
        """
        Get the current state of a simulation.
        
        Args:
            simulation_id: The ID of the simulation to retrieve
            
        Returns:
            SimulationState | None: The simulation state if found, None otherwise
        """
        simulation_state = self.simulations.get(simulation_id)
        return simulation_state

    async def run_architect(self, simulation_id: str) -> SimulationState | None:
        """
        Run the architect for a given simulation.

        Args:
            simulation_id: The ID of the simulation to run the architect for

        Returns:
            SimulationState | None: The updated simulation state if found, None otherwise
        """
        simulation_state = await self.get_simulation(simulation_id)
        
        if simulation_state:
            simulation_state.status = SimulationStatus.PROCESSING_CONFIG
            self.simulations[simulation_id] = simulation_state
            
            # Create callback for real-time updates
            callback = ArchitectCallback(self, simulation_id)
            
            try:
                # Generate the configuration with real-time updates
                context, done = await create_configuration(
                    user_query=simulation_state.prompt,
                    api_key=settings.openai.api_key,
                    base_url=settings.openai.base_url,
                    model=settings.architect.model,
                    max_turns=settings.architect.max_turns,
                    max_validation_retries=settings.architect.max_validation_retries,
                    context_callback=callback,
                )

                simulation_state.config = encode_config(context.config)
                if done:
                    simulation_state.status = SimulationStatus.COMPLETED_CONFIG
                else:
                    simulation_state.status = SimulationStatus.FAILED
                    simulation_state.error_log = "Failed to generate configuration"

                self.simulations[simulation_id] = simulation_state
            except Exception as e:
                simulation_state.status = SimulationStatus.FAILED
                simulation_state.error_log = str(e)
                self.simulations[simulation_id] = simulation_state

        return simulation_state
    
    async def run_simulator(self, simulation_id: str) -> SimulationState | None:
        """
        Run the simulator for a given simulation.

        Args:
            simulation_id: The ID of the simulation to run the simulator for

        Returns:
            SimulationState | None: The updated simulation state if found, None otherwise
        """
        simulation_state = await self.get_simulation(simulation_id)
        if simulation_state:
            simulation_state.status = SimulationStatus.PROCESSING_SIMULATION
            self.simulations[simulation_id] = simulation_state

            # Initialize provider
            provider = Provider(
                base_url=settings.openai.base_url,
                api_key=settings.openai.api_key
            )

            # Initialize simulation and callback
            simulator = Simulator(decode_config(simulation_state.config))
            callback = SimulatorCallback(self, simulation_id)
        
            # Run the simulation
            step_data = simulator.reset()
            # await callback.on_step_complete(step_data)

            while True:
                step_data = await simulator.step(
                    provider=provider,
                    model=settings.simulator.model,
                    max_retries=settings.simulator.max_retries
                )
                if step_data is None:
                    break
                await callback.on_step_complete(step_data)

            simulation_state.status = SimulationStatus.COMPLETED_SIMULATION
            self.simulations[simulation_id] = simulation_state

        return simulation_state

    async def run_analyst(self, simulation_id: str) -> SimulationState | None:
        """
        Run the analyst for a given simulation.

        Args:
            simulation_id: The ID of the simulation to run the analyst for

        Returns:
            SimulationState | None: The updated simulation state if found, None otherwise
        """
        simulation_state = await self.get_simulation(simulation_id)
        if simulation_state:
            simulation_state.status = SimulationStatus.PROCESSING_ANALYSIS
            self.simulations[simulation_id] = simulation_state

            # Create callback for real-time updates
            callback = AnalystCallback(self, simulation_id)

            try:
                # Generate the report with real-time updates
                context, done = await create_report(
                    config=decode_config(simulation_state.config),
                    data=simulation_state.data,
                    sources=simulation_state.sources,
                    api_key=settings.openai.api_key,
                    base_url=settings.openai.base_url,
                    model=settings.analyst.model,
                    max_turns=settings.analyst.max_turns,
                    max_validation_retries=settings.analyst.max_validation_retries,
                    context_callback=callback,
                )

                simulation_state.analysis = context.analysis
                if done:
                    simulation_state.status = SimulationStatus.COMPLETED_ANALYSIS
                else:
                    simulation_state.status = SimulationStatus.FAILED
                    simulation_state.error_log = "Failed to generate analysis"

                self.simulations[simulation_id] = simulation_state
            except Exception as e:
                simulation_state.status = SimulationStatus.FAILED
                simulation_state.error_log = str(e)
                self.simulations[simulation_id] = simulation_state

        return simulation_state
