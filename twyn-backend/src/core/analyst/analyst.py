from typing import Optional, Tuple
from datetime import datetime
from pprint import pformat

from openai import AsyncOpenAI

from src.core.shared.agent import Agent, ContextCallback
from src.core.analyst.prompts import ANALYST_AGENT_PROMPT
from src.core.analyst.tools import (
    add_text,
    remove_text,
    replace_text,
    think,
    search_web,
    generate_plot,
    # Vision tools
    list_assets,
    insert_figure_from_asset,
    quote_from_asset,
    search_asset_content,
)
from src.core.analyst.context import AnalystContext


async def create_report(
    config: dict,
    data: list,
    sources: list,
    api_key: str,
    base_url: str,
    model: str,
    max_turns: int = 60,
    max_validation_retries: int = 3,
    context_callback: Optional[ContextCallback] = None,
) -> Tuple[AnalystContext, bool]:
    """Create a report from the simulation results.
    
    Args:
        config: The simulation configuration
        data: The simulation data to analyze
        sources: The online sources used during the whole simulation
        api_key: API key
        base_url: Base URL
        model: Model to use for the analyst agent
        max_turns: Maximum number of turns the analyst agent will take
        max_validation_retries: Maximum number of validation retry attempts
        context_callback: Optional callback for real-time context updates

    Returns:
        Tuple containing the context and a boolean indicating if the analysis was successful
    """
    
    # ===== Analyst Agent =====
    analyst_agent = Agent(
        instructions=ANALYST_AGENT_PROMPT.replace("{{today}}", datetime.now().strftime("%Y-%m-%d")),
        model=model,
        tools=[
            add_text, 
            remove_text, 
            replace_text, 
            think, 
            search_web,
            generate_plot,
            # Vision tools
            list_assets,
            insert_figure_from_asset,
            quote_from_asset,
            search_asset_content,
        ],
        visible_context_field="analysis",
        base_url=base_url,
        api_key=api_key,
        context_callback=context_callback,
    )

    # ===== Initialize Context =====
    context = AnalystContext(
        analysis="",
        client=AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        ),
        data=data,
        config=config,
        sources=sources,
    )

    new_input = [
        {
            "role": "user",
            "content": f"The following is the original simulation request from the user:\n {config['user_query']}\nThis is the simulation configuration:\n {pformat(config, indent=4)}\n\nI will now start working on the analysys..."
        }
    ]
    validation_attempts = 0

    while True:
        await analyst_agent.run(
            input=new_input,
            context=context,
            max_turns=max_turns
        )

        if context.analysis is not None:
            break
        else:
            validation_attempts += 1
            if validation_attempts >= max_validation_retries:
                return context, False

            error_msg = "No report was written. You need to write a comprehensive analysis report based on the simulation results and follow the provided instructions. Please analyze the data, generate appropriate plots, and create a well-structured markdown report."
            new_input = [{"role": "user", "content": error_msg}]

    return context, bool(context.analysis)
