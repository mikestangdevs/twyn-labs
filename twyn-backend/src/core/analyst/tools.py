from typing import Literal
from agents import RunContextWrapper, function_tool

from src.core.analyst.context import AnalystContext
from src.core.analyst.visualization.plot_creator import create_plot

@function_tool
def add_text(
    ctx: RunContextWrapper[AnalystContext],
    thought: str,
    text: str,
    location: Literal["start", "end"] | None,
    reference_text: str | None,
    relative_position: Literal["before", "after"] | None
) -> str:
    """Add text to the report at a specified location.
    
    Args:
        thought: The thought process behind adding the text.
        text: The exact markdown text to add. For adding plots, use the following syntax when adding text: ![{plot_name}]({plot_url})
        location: Where to add the text - either "start" or "end" of the report. If specified, this takes precedence over reference_text and relative_position.
        reference_text: Existing exact markdown text to use as a reference point. Required if location is None and relative_position is specified.
        relative_position: Whether to add the text "before" or "after" the reference_text. Only used if location is None.
    """
    # If location is specified, use absolute positioning
    if location is not None:
        if location == "start":
            ctx.context.analysis = text + ctx.context.analysis
        elif location == "end":
            ctx.context.analysis += text
    
    # If no location specified, use relative positioning
    else:
        if not relative_position or not reference_text:
            return "Error: both reference_text and relative_position are required when location is not specified"
        
        if reference_text not in ctx.context.analysis:
            return f"Error: reference text '{reference_text}' not found in the report"
        
        if relative_position == "before":
            idx = ctx.context.analysis.index(reference_text)
            ctx.context.analysis = ctx.context.analysis[:idx] + text + ctx.context.analysis[idx:]
        elif relative_position == "after":
            idx = ctx.context.analysis.index(reference_text) + len(reference_text)
            ctx.context.analysis = ctx.context.analysis[:idx] + text + ctx.context.analysis[idx:]
    
    return "Text successfully added"

@function_tool
def remove_text(
    ctx: RunContextWrapper[AnalystContext],
    thought: str,
    text: str
) -> str:
    """Remove text from the report.
    
    Args:
        thought: The thought process behind removing the text.
        text: The exact markdown text to remove.
    """
    if text not in ctx.context.analysis:
        return f"Error: text '{text}' not found in the report"
    
    ctx.context.analysis = ctx.context.analysis.replace(text, "", 1)  # Remove first occurrence
    
    return "Text successfully removed"

@function_tool
def replace_text(
    ctx: RunContextWrapper[AnalystContext],
    thought: str,
    old_text: str,
    new_text: str
) -> str:
    """Replace text in the report.
    
    Args:
        thought: The thought process behind replacing the text.
        old_text: The exact markdown text to replace.
        new_text: The exact markdown text to replace it with.
    """
    if old_text not in ctx.context.analysis:
        return f"Error: text '{old_text}' not found in the report"
    
    ctx.context.analysis = ctx.context.analysis.replace(old_text, new_text, 1)  # Replace first occurrence
    
    return "Text successfully replaced"

@function_tool
def generate_plot(
    ctx: RunContextWrapper[AnalystContext],
    thought: str,
    variable_action_name: str,
    agent_group_name: str,
) -> dict | str:
    """Generate a plot for the given variable/action of the given agent group.

    Args:
        thought: The thought process behind generating the plot.
        variable_action_name: The name of the variable/action to plot.
        agent_group_name: The name of the agent group to plot.
    """
    # Check if agent group exists
    if agent_group_name not in ctx.context.config['agent_groups']:
        return f"Error: agent group '{agent_group_name}' does not exist"
    
    # Check if variable/action exists
    if agent_group_name in ctx.context.config['agent_groups'] and variable_action_name not in ctx.context.config['agent_groups'][agent_group_name]['variables'] and variable_action_name not in ctx.context.config['agent_groups'][agent_group_name]['actions']:
        return f"Error: variable/action '{variable_action_name}' for agent group '{agent_group_name}' does not exist"
    
    image = create_plot(ctx.context.config, ctx.context.data, agent_group_name, variable_action_name)

    if image["image"] is None:
        return f"Warning: No plot available for variable/action '{variable_action_name}' for agent group '{agent_group_name}'"

    return image

# ===== Additional Tools =====
@function_tool
def think(ctx: RunContextWrapper[AnalystContext], text: str):
    """Record structured thoughts, analysis, reasoning, or planning steps.
    This tool does not modify the report content directly but helps structure
    the analytical process.

    Args:
        text: The detailed structured thought, analysis, or plan itself.
    """

    return "Thought completed"

@function_tool
async def search_web(ctx: RunContextWrapper[AnalystContext], query: str):
    """Search the web for information.

    Args:
        query: The query to search the web for.
    """

    try:
        response = await ctx.context.client.chat.completions.create(
            model="perplexity/sonar",
            messages=[{"role": "user", "content": query}],
        )
        result = response.choices[0].message.content
        if result:
            if hasattr(response, 'citations') and response.citations:
                ctx.context.sources.extend(response.citations)
            return result
        else:
            raise Exception("No results found.")
    except Exception as e:
        return f"Error searching the web. Please try again."


# Vision & Asset Tools for Analyst

@function_tool
async def list_assets(
    ctx: RunContextWrapper,
    simulation_id: str,
    type_filter: str = None
) -> str:
    """
    List all assets available in this simulation.
    
    Use this to see what figures, tables, and data the user uploaded.
    You can reference these in your analysis and reports.
    
    Args:
        ctx: Context wrapper
        simulation_id: ID of the simulation
        type_filter: Optional filter by type ('image', 'pdf', 'csv')
    
    Returns:
        List of available assets
    
    Example:
        assets = await list_assets(ctx, simulation_id)
        # Returns: "Found 3 assets: results.csv, chart.png, report.pdf"
    """
    from src.api.deps import asset_manager
    
    assets = await asset_manager.list_assets(
        simulation_id=simulation_id,
        type_filter=type_filter
    )
    
    if not assets:
        return "No assets uploaded for this simulation."
    
    # Format as readable list
    asset_list = []
    for asset in assets:
        asset_list.append(f"- {asset.name} (ID: {asset.id}, type: {asset.type})")
    
    return f"Found {len(assets)} asset(s):\n" + "\n".join(asset_list)


@function_tool
async def insert_figure_from_asset(
    ctx: RunContextWrapper,
    asset_id: str,
    locator: str,
    caption: str
) -> str:
    """
    Insert a figure or table from an uploaded asset into your report.
    
    Use this to include visualizations, tables, or diagrams that support your analysis.
    The figure will be embedded with proper citation.
    
    Args:
        ctx: Context wrapper
        asset_id: ID of the asset (from list_assets)
        locator: Location reference (e.g., "page 3", "00:01:23", "row 5-10")
        caption: Caption to display with the figure
    
    Returns:
        Markdown string to include in report
    
    Example:
        figure = await insert_figure_from_asset(
            ctx,
            "pdf-123",
            "page 3",
            "Historical pricing trends Q1-Q4"
        )
        # Returns markdown with embedded figure and citation
    """
    # TODO: Fetch asset, generate proper markdown with citation
    return f"![{caption}](asset://{asset_id}/{locator})\n*Source: (asset name), {locator}*"


@function_tool
async def quote_from_asset(
    ctx: RunContextWrapper,
    asset_id: str,
    locator: str
) -> str:
    """
    Extract a specific quote or data snippet from an asset.
    
    Use this to pull exact text, table rows, or data points to cite in your analysis.
    
    Args:
        ctx: Context wrapper
        asset_id: ID of the asset
        locator: Location reference (page, timestamp, row range)
    
    Returns:
        The extracted content with citation
    
    Example:
        quote = await quote_from_asset(ctx, "pdf-123", "page 5")
        # Returns: "The market grew by 15% in Q4 (Source: report.pdf, page 5)"
    """
    # TODO: Fetch specific content from perception data
    return f"Quote from asset {asset_id} at {locator}. (Not yet implemented)"


@function_tool
async def search_asset_content(
    ctx: RunContextWrapper,
    query: str,
    simulation_id: str = None
) -> str:
    """
    Search through uploaded assets for relevant content.
    
    Use this to find specific data, figures, or text across all uploaded files.
    
    Args:
        ctx: Context wrapper
        query: What to search for
        simulation_id: Optional simulation filter
    
    Returns:
        Relevant content snippets from assets
    
    Example:
        results = await search_asset_content(ctx, "revenue growth", sim_id)
        # Returns: "Found in data.csv row 45: Revenue growth: 15%"
    """
    from src.api.deps import asset_manager
    from src.core.simulator.provider import Provider
    import os
    
    # Generate query embedding
    provider = Provider(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url=os.getenv("OPENROUTER_BASE_URL")
    )
    query_embedding = await provider.generate_embedding(query)
    
    # Perform hybrid search
    results = await asset_manager.hybrid_search(
        query=query,
        query_embedding=query_embedding,
        top_k=5,
        simulation_id=simulation_id
    )
    
    if not results:
        return f"No results found for '{query}'."
    
    # Format results
    formatted_results = []
    for embedding, score in results:
        # Get source asset
        if embedding.parent_type == 'asset':
            asset = await asset_manager.get_asset(str(embedding.parent_id))
            source = f"{asset.name}" if asset else "Unknown asset"
        else:  # perception
            perception = await asset_manager.get_perception(str(embedding.parent_id))
            if perception:
                asset = await asset_manager.get_asset(str(perception.asset_id))
                source = f"{asset.name} ({perception.kind})" if asset else f"Perception ({perception.kind})"
            else:
                source = "Unknown source"
        
        snippet = embedding.text_content[:150] + "..." if len(embedding.text_content) > 150 else embedding.text_content
        formatted_results.append(f"**{source}** (relevance: {score:.2f}):\n{snippet}")
    
    return f"Found {len(results)} result(s) for '{query}':\n\n" + "\n\n".join(formatted_results)

