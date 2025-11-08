from datetime import datetime
from typing import Optional, Tuple

from openai import AsyncOpenAI

from src.core.shared.agent import Agent, ContextCallback
from src.core.architect.prompts import ARCHITECT_AGENT_PROMPT
from src.core.architect.tools import (
    initialize_simulation_parameters,
    add_agent_group,
    add_variable,
    add_action,
    modify_simulation_parameters,
    modify_agent_group,
    modify_variable,
    modify_action,
    delete_agent_group,
    delete_variable,
    delete_action,
    think,
    search_web,
    # Vision tools
    list_assets,
    inspect_asset,
    search_asset_content,
)
from src.core.simulator.simulator import Simulator
from src.core.architect.context import ArchitectContext


async def create_configuration(
    user_query: str, 
    api_key: str,
    base_url: str,
    model: str,
    max_turns: int = 60,
    max_validation_retries: int = 4,
    context_callback: Optional[ContextCallback] = None,
) -> Tuple[ArchitectContext, bool]:
    """Process a user request to create a Holodeck configuration.
    
    Args:
        user_query: The user's request for a simulation configuration
        api_key: API key
        base_url: Base URL
        model: Model to use for the architect agent
        max_turns: Maximum number of turns the architect agent will take
        max_validation_retries: Maximum number of validation retry attempts
        context_callback: Optional callback for real-time context updates

    Returns:
        Tuple containing the context and a boolean indicating if the configuration was successful
    """

    # ===== Architect Agent =====
    architect_agent = Agent(
        instructions=ARCHITECT_AGENT_PROMPT.replace("{{today}}", datetime.now().strftime("%Y-%m-%d")),
        model=model,
        tools=[
            initialize_simulation_parameters,
            add_agent_group,
            add_variable,
            add_action,
            modify_simulation_parameters,
            modify_agent_group,
            modify_variable,
            modify_action,
            delete_agent_group,
            delete_variable,
            delete_action,
            think,
            search_web,
            # Vision tools
            list_assets,
            inspect_asset,
            search_asset_content,
        ],
        visible_context_field="config",
        base_url=base_url,
        api_key=api_key,
        context_callback=context_callback,
    )

    # ===== Initialize Context =====
    context = ArchitectContext(
        config={"agent_groups": {}},
        sources=[],
        client=AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        ),
    )
    
    # ===== Run Architect Agent =====
    new_input = [{"role": "user", "content": user_query}]
    validation_attempts = 0
    
    while True:
        await architect_agent.run(
            input=new_input,
            context=context,
            max_turns=max_turns,
        )

        simulator = Simulator(context.config)
        validation_result = await simulator.validate()
        
        if validation_result["success"]:
            context.config["user_query"] = user_query
            return context, True
        else:
            validation_attempts += 1
            if validation_attempts >= max_validation_retries:
                return context, False
                
            error_msg = f"The current configuration is invalid. Please fix the following errors:\n" + "\n".join(f"- {error}" for error in validation_result['errors'])
            new_input = [{"role": "user", "content": error_msg}]
