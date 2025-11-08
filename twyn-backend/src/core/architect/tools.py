import re
from typing import Literal, TypeAlias

from agents import RunContextWrapper, function_tool

from src.core.architect.context import ArchitectContext
from src.core.shared.models import InitialValueVariable, UniformVariable, NormalVariable, CategoricalVariable, DerivedVariable
from src.core.shared.models import OptionAction, NumberAction, TextAction

# ===== Helper Functions =====
def str_to_alphanumeric(s):
    s = s.strip()
    s = re.sub(r'[^a-zA-Z0-9]', '_', s)
    s = s.strip('_')
    return s

# ===== Initialize/Add Tools =====
@function_tool
def initialize_simulation_parameters(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    step_unit: str, 
    number_of_steps: int
):
    """Initialize the simulation configuration with parameters. This function sets up the initial parameters and should only be called once.
    
    Args:
        thought: The thought process behind initializing the simulation parameters.
        step_unit: The unit of progression (e.g., 'round', 'day', 'minute').
        number_of_steps: Number of steps to run the simulation.
    """
    

    # Checks
    error_msgs = []
    if number_of_steps <= 0:
        error_msgs.append("number_of_steps must be a positive integer")
    if step_unit == "":
        error_msgs.append("step_unit must be a non-empty string")
    if error_msgs:
        return "There were errors in creating simulation parameters:\n- " + "\n- ".join(error_msgs)
    
    # Execution
    ctx.context.config["step_unit"] = step_unit.lower()
    ctx.context.config["number_of_steps"] = number_of_steps
    
    return "Initialized simulation parameters"

@function_tool
def add_agent_group(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    description: str,
    number_of_agents: int, 
    memory_length: int,
):
    """Add a new agent group to the simulation.
    
    Args:
        thought: The thought process behind adding a new agent group.
        agent_group_name: Name for the agent group.
        description: Description for the agent group.
        number_of_agents: Number of agents in this agent group.
        memory_length: Number of past steps each agent in this agent group remembers, use 0 if the agent group does not have a memory.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)

    # Checks
    error_msgs = []
    if agent_group_name == "":
        error_msgs.append("agent_group_name must be a non-empty string")
    if agent_group_name in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' already exists")
    if description == "":
        error_msgs.append("description must be a non-empty string")
    if number_of_agents <= 0:
        error_msgs.append("number_of_agents must be a positive integer")
    if memory_length < 0:
        error_msgs.append("memory_length must be a non-negative integer")
    if error_msgs:
        return "There were errors in adding the agent group:\n- " + "\n- ".join(error_msgs)

    # Execution
    ctx.context.config["agent_groups"][agent_group_name] = {
        "description": description,
        "number_of_agents": number_of_agents,
        "memory_length": memory_length,
        "variables": {},
        "actions": {}
    }

    return f"Added agent group '{agent_group_name}' with {number_of_agents} agents and {memory_length} memory length"

@function_tool
def add_variable(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    variable_name: str, 
    description: str, 
    unit: str | None, 
    visibility: bool, 
    update_rule: str | None, 
    args: InitialValueVariable | UniformVariable | NormalVariable | CategoricalVariable | DerivedVariable
):
    """Add a new variable to the simulation.
    
    Args:
        thought: The thought process behind adding a new variable.
        agent_group_name: Name of the agent group to which the variable belongs.
        variable_name: Name for the variable.
        description: Description for the variable.
        unit: Unit for the variable, or `null` if the variable does not have a unit.
        visibility: Boolean indicating whether the variable is visible to the agent when making decisions.
        update_rule: String containing a Python expression for updating the variable (can be `null` if the variable does not need to be updated).
        args: Arguments for the variable.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)
    variable_name = str_to_alphanumeric(variable_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found, please add an agent group first")
    if variable_name == "":
        error_msgs.append("variable_name must be a non-empty string")
    if description == "":
        error_msgs.append("description must be a non-empty string")
    if unit == "":
        error_msgs.append("unit must be a non-empty string or `null`")
    if update_rule == "":
        error_msgs.append("update_rule must be a non-empty string or `null`")
    if agent_group_name in ctx.context.config["agent_groups"] and variable_name in ctx.context.config["agent_groups"][agent_group_name]["variables"]:
        error_msgs.append(f"variable_name '{variable_name}' conflicts with an existing variable_name in agent group '{agent_group_name}'")
    if agent_group_name in ctx.context.config["agent_groups"] and variable_name in ctx.context.config["agent_groups"][agent_group_name]["actions"]:
        error_msgs.append(f"variable_name '{variable_name}' conflicts with an existing action_name in agent group '{agent_group_name}'")
    if error_msgs:
        return "There were errors in adding the variable:\n- " + "\n- ".join(error_msgs)

    # Execution
    ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name] = {
        "description": description,
        "unit": unit,
        "visibility": visibility,
        "update_rule": update_rule,
        "args": args
    }

    return f"Added variable '{variable_name}' to agent group '{agent_group_name}'"

@function_tool
def add_action(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    action_name: str, 
    description: str, 
    unit: str | None, 
    args: OptionAction | NumberAction | TextAction
):
    """Add a new action to the simulation.
    
    Args:
        thought: The thought process behind adding a new action.
        agent_group_name: Name of the agent group to which the action belongs.
        action_name: Name for the action.
        description: Description for the action.
        unit: Unit for the action, or `null` if the action does not have a unit.
        args: Arguments for the action.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)
    action_name = str_to_alphanumeric(action_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found, please add an agent group first")
    if action_name == "":
        error_msgs.append("action_name must be a non-empty string")
    if action_name == "thought":
        error_msgs.append("action_name 'thought' is reserved for the thought process of the agent, please choose a different action name")
    if description == "":
        error_msgs.append("description must be a non-empty string")
    if unit == "":
        error_msgs.append("unit must be a non-empty string or `null`")
    if agent_group_name in ctx.context.config["agent_groups"] and action_name in ctx.context.config["agent_groups"][agent_group_name]["variables"]:
        error_msgs.append(f"action_name '{action_name}' conflicts with an existing variable_name in agent group '{agent_group_name}'")
    if agent_group_name in ctx.context.config["agent_groups"] and action_name in ctx.context.config["agent_groups"][agent_group_name]["actions"]:
        error_msgs.append(f"action_name '{action_name}' conflicts with an existing action_name in agent group '{agent_group_name}'")
    if error_msgs:
        return "There were errors in adding the action:\n- " + "\n- ".join(error_msgs)

    # Execution
    ctx.context.config["agent_groups"][agent_group_name]["actions"][action_name] = {
        "description": description,
        "unit": unit,
        "args": args
    }

    return f"Added action '{action_name}' to agent group '{agent_group_name}'"


# ===== Modify Tools =====
NO_CHANGE = "NO_CHANGE"
NoChangeType: TypeAlias = Literal["NO_CHANGE"]

@function_tool  
def modify_simulation_parameters(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    step_unit: str | NoChangeType, 
    number_of_steps: int | NoChangeType
):
    """Modify the simulation parameters.
    
    Args:
        thought: The thought process behind modifying the simulation parameters.
        step_unit: The unit of progression (e.g., 'round', 'day', 'minute').
        number_of_steps: Number of steps to run the simulation.
    """
    

    # Checks
    error_msgs = []
    if number_of_steps != NO_CHANGE and number_of_steps <= 0:
        error_msgs.append("number_of_steps must be a positive integer")
    if step_unit != NO_CHANGE and step_unit == "":
        error_msgs.append("step_unit must be a non-empty string")
    if error_msgs:
        return "There were errors in modifying the simulation parameters:\n- " + "\n- ".join(error_msgs)
    
    # Execution
    ctx.context.config["step_unit"] = step_unit.lower() if step_unit != NO_CHANGE else ctx.context.config["step_unit"]
    ctx.context.config["number_of_steps"] = number_of_steps if number_of_steps != NO_CHANGE else ctx.context.config["number_of_steps"]

    return f"Modified simulation parameters"

@function_tool
def modify_agent_group(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    description: str | NoChangeType,
    number_of_agents: int | NoChangeType, 
    memory_length: int | NoChangeType
):
    """Modify the parameters of an existing agent group.

    Args:
        thought: The thought process behind modifying the agent group parameters.
        agent_group_name: Name of the agent group to modify.
        description: Description for the agent group. Default is NO_CHANGE.
        number_of_agents: Number of agents in this agent group, or `null` if the number of agents is not to be modified. Default is NO_CHANGE.
        memory_length: Number of past steps each agent in this agent group remembers, use 0 if the agent group does not have a memory. Default is NO_CHANGE.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found, please add an agent group first, available agent groups: {ctx.context.config['agent_groups'].keys()}")
    if description == "":
        error_msgs.append("Description must be a non-empty string or NO_CHANGE")
    if number_of_agents != NO_CHANGE and number_of_agents <= 0:
        error_msgs.append("Number of agents must be a positive integer")
    if memory_length != NO_CHANGE and memory_length < 0:
        error_msgs.append("Memory length must be a non-negative integer")
    if error_msgs:
        return "There were errors in modifying agent group:\n- " + "\n- ".join(error_msgs)

    # Execution
    ctx.context.config["agent_groups"][agent_group_name] = {
        "description": description if description != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["description"],
        "number_of_agents": number_of_agents if number_of_agents != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["number_of_agents"],
        "memory_length": memory_length if memory_length != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["memory_length"]
    }

    return f"Modified agent group '{agent_group_name}'"

@function_tool
def modify_variable(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    variable_name: str, 
    description: str | NoChangeType, 
    unit: str | None | NoChangeType, 
    visibility: bool | NoChangeType, 
    update_rule: str | None | NoChangeType, 
    args: InitialValueVariable | UniformVariable | NormalVariable | CategoricalVariable | DerivedVariable | NoChangeType
):
    """Modify the parameters of an existing variable in an agent group.
    
    Args:
        thought: The thought process behind modifying the variable parameters.
        agent_group_name: Name of the agent group to modify.
        variable_name: Name of the variable to modify.
        description: Description of the variable. Default is NO_CHANGE.
        unit: Unit of the variable, or `null` if the variable does not have a unit. Default is NO_CHANGE.
        visibility: Boolean indicating whether the variable is visible to the agent when making decisions. Default is NO_CHANGE.
        update_rule: String containing a Python expression for updating the variable (can be `null` if the variable does not need to be updated). Default is NO_CHANGE.
        args: Arguments for the variable. Default is NO_CHANGE.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)
    variable_name = str_to_alphanumeric(variable_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found, please add an agent group first, available agent groups: {ctx.context.config['agent_groups'].keys()}")
    if agent_group_name in ctx.context.config["agent_groups"] and variable_name not in ctx.context.config["agent_groups"][agent_group_name]["variables"]:
        error_msgs.append(f"variable_name '{variable_name}' not found in agent group '{agent_group_name}', please add a variable first")
    if description == "":
        error_msgs.append("Description must be a non-empty string or NO_CHANGE")
    if unit == "":
        error_msgs.append("Unit must be a non-empty string or `null` or NO_CHANGE")
    if update_rule == "":
        error_msgs.append("Update rule must be a non-empty string or `null` or NO_CHANGE")
    if agent_group_name in ctx.context.config["agent_groups"] and variable_name not in ctx.context.config["agent_groups"][agent_group_name]["variables"]:
        error_msgs.append(f"variable_name '{variable_name}' not found in agent group '{agent_group_name}'")
    if error_msgs:
        return "There were errors in modifying the variable:\n- " + "\n- ".join(error_msgs)

    # Execution
    ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name] = {
        "description": description if description != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name]["description"],
        "unit": unit if unit != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name]["unit"],
        "visibility": visibility if visibility != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name]["visibility"],
        "update_rule": update_rule if update_rule != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name]["update_rule"],
        "args": args if args != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name]["args"]
    }

    return f"Modified variable '{variable_name}' in agent group '{agent_group_name}'"

@function_tool
def modify_action(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    action_name: str, 
    description: str | NoChangeType, 
    unit: str | None | NoChangeType, 
    args: OptionAction | NumberAction | TextAction | NoChangeType
):
    """Modify the parameters of an existing action in an agent group.
    
    Args:
        thought: The thought process behind modifying the action parameters.
        agent_group_name: Name of the agent group to modify.
        action_name: Name of the action to modify.
        description: Description of the action. Default is NO_CHANGE.
        unit: Unit of the action, or `null` if the action does not have a unit. Default is NO_CHANGE.
        args: Arguments for the action. Default is NO_CHANGE.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)
    action_name = str_to_alphanumeric(action_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found, please add an agent group first, available agent groups: {ctx.context.config['agent_groups'].keys()}")
    if agent_group_name in ctx.context.config["agent_groups"] and action_name not in ctx.context.config["agent_groups"][agent_group_name]["actions"]:
        error_msgs.append(f"action_name '{action_name}' not found in agent group '{agent_group_name}', please add an action first, available actions: {ctx.context.config['agent_groups'][agent_group_name]['actions'].keys()}")
    if description == "":
        error_msgs.append("Description must be a non-empty string or NO_CHANGE")
    if unit == "":
        error_msgs.append("Unit must be a non-empty string or `null` or NO_CHANGE")
    if agent_group_name in ctx.context.config["agent_groups"] and action_name not in ctx.context.config["agent_groups"][agent_group_name]["actions"]:
        error_msgs.append(f"action_name '{action_name}' not found in agent group '{agent_group_name}'")
    if action_name == "thought":
        error_msgs.append("action_name 'thought' is reserved for the thought process of the agent, please choose a different action name")
    if error_msgs:
        return "There were errors in modifying the action:\n- " + "\n- ".join(error_msgs)

    # Execution
    ctx.context.config["agent_groups"][agent_group_name]["actions"][action_name] = {
        "description": description if description != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["actions"][action_name]["description"],
        "unit": unit if unit != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["actions"][action_name]["unit"],
        "args": args if args != NO_CHANGE else ctx.context.config["agent_groups"][agent_group_name]["actions"][action_name]["args"]
    }

    return f"Modified action '{action_name}' in agent group '{agent_group_name}'"


# ===== Delete Tools =====
@function_tool
def delete_agent_group(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str
):
    """Delete an agent group from the configuration.

    Args:
        thought: The thought process behind deleting the agent group.
        agent_group_name: Name of the agent group to delete.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found to delete, available agent groups: {ctx.context.config['agent_groups'].keys()}")
    if error_msgs:
        return "There were errors in deleting the agent group:\n- " + "\n- ".join(error_msgs)
    
    # Execution
    del ctx.context.config["agent_groups"][agent_group_name]

    return f"Deleted agent group '{agent_group_name}'"

@function_tool
def delete_variable(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    variable_name: str
):
    """Delete a variable in an agent group from the configuration.

    Args:
        thought: The thought process behind deleting the variable.
        agent_group_name: Name of the agent group to delete the variable from.
        variable_name: Name of the variable to delete.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)
    variable_name = str_to_alphanumeric(variable_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found to delete, available agent groups: {ctx.context.config['agent_groups'].keys()}")
    if agent_group_name in ctx.context.config["agent_groups"] and variable_name not in ctx.context.config["agent_groups"][agent_group_name]["variables"]:
        error_msgs.append(f"variable_name '{variable_name}' not found in agent group '{agent_group_name}', available variables: {ctx.context.config['agent_groups'][agent_group_name]['variables'].keys()}")
    if error_msgs:
        return "There were errors in deleting the variable:\n- " + "\n- ".join(error_msgs)
    
    # Execution
    del ctx.context.config["agent_groups"][agent_group_name]["variables"][variable_name]

    return f"Deleted variable '{variable_name}' from agent group '{agent_group_name}'"

@function_tool
def delete_action(
    ctx: RunContextWrapper[ArchitectContext], 
    thought: str, 
    agent_group_name: str, 
    action_name: str
):
    """Delete an action in an agent group from the configuration.

    Args:
        thought: The thought process behind deleting the action.
        agent_group_name: Name of the agent group to delete the action from.
        action_name: Name of the action to delete.
    """
    

    # Adjust names
    agent_group_name = str_to_alphanumeric(agent_group_name)
    action_name = str_to_alphanumeric(action_name)

    # Checks
    error_msgs = []
    if agent_group_name not in ctx.context.config["agent_groups"]:
        error_msgs.append(f"agent_group_name '{agent_group_name}' not found to delete, available agent groups: {ctx.context.config['agent_groups'].keys()}")
    if agent_group_name in ctx.context.config["agent_groups"] and action_name not in ctx.context.config["agent_groups"][agent_group_name]["actions"]:
        error_msgs.append(f"action_name '{action_name}' not found in agent group '{agent_group_name}', available actions: {ctx.context.config['agent_groups'][agent_group_name]['actions'].keys()}")
    if error_msgs:
        return "There were errors in deleting the action:\n- " + "\n- ".join(error_msgs)
    
    # Execution
    del ctx.context.config["agent_groups"][agent_group_name]["actions"][action_name]

    return f"Deleted action '{action_name}' from agent group '{agent_group_name}'"


# ===== Additional Tools =====
@function_tool
def think(ctx: RunContextWrapper[ArchitectContext], text: str):
    """Use this tool to think about the plan and research.

    Args:
        text: Your thoughts on the plan and research.
    """
    

    return "Thought completed"

@function_tool
async def search_web(ctx: RunContextWrapper[ArchitectContext], query: str):
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


# Vision & Asset Tools for Architect

@function_tool
async def list_assets(
    ctx: RunContextWrapper,
    simulation_id: str,
    type_filter: str = None
) -> str:
    """
    List all assets uploaded for a simulation.
    
    Use this to see what images, PDFs, CSVs, etc. the user has provided.
    
    Args:
        ctx: Context wrapper
        simulation_id: ID of the simulation
        type_filter: Optional filter by type ('image', 'pdf', 'csv', 'audio', 'video')
    
    Returns:
        List of assets with names, types, and IDs
    
    Example:
        assets = await list_assets(ctx, simulation_id)
        # Returns: "Found 2 assets: data.pdf (pdf), chart.png (image)"
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
        asset_list.append(f"- {asset.name} (ID: {asset.id}, type: {asset.type}, size: {asset.size_bytes} bytes)")
    
    return f"Found {len(assets)} asset(s):\n" + "\n".join(asset_list)


@function_tool
async def inspect_asset(
    ctx: RunContextWrapper,
    asset_id: str,
    tasks: list = None
) -> str:
    """
    Inspect an asset and get perception results (caption, OCR, tables, etc.).
    
    Use this to extract data from uploaded files to inform your configuration.
    For example, extract a pricing table from a PDF or read text from an image.
    
    Args:
        ctx: Context wrapper
        asset_id: ID of the asset to inspect
        tasks: List of perception tasks to run ['caption', 'ocr', 'entities', 'table']
               If None, runs all applicable tasks for the asset type
    
    Returns:
        Perception results as formatted text
    
    Example:
        # Extract table from PDF
        result = await inspect_asset(ctx, "pdf-asset-id", tasks=['table'])
        # Returns: "Table extracted:\n| Product | Price |\n| Widget | $10 |\n..."
    """
    # TODO: Fetch asset, run perception if needed, return results
    # For now, return placeholder
    return f"Asset {asset_id} inspection pending. (Perception worker integration needed)"


@function_tool
async def search_asset_content(
    ctx: RunContextWrapper,
    query: str,
    simulation_id: str = None
) -> str:
    """
    Search through uploaded assets by content (captions, OCR text, tables).
    
    Use this to find specific information across all uploaded files.
    For example, find "pricing data" or "customer segments".
    
    Args:
        ctx: Context wrapper
        query: What to search for
        simulation_id: Optional - limit to specific simulation
    
    Returns:
        Relevant snippets from assets that match the query
    
    Example:
        results = await search_asset_content(ctx, "pricing table", sim_id)
        # Returns: "Found in data.pdf page 3: [table with prices]"
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
        
        snippet = embedding.text_content[:200] + "..." if len(embedding.text_content) > 200 else embedding.text_content
        formatted_results.append(f"[Score: {score:.2f}] {source}:\n{snippet}")
    
    return f"Found {len(results)} result(s) for '{query}':\n\n" + "\n\n".join(formatted_results)
