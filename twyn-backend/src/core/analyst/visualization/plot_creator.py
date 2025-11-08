import pandas as pd
import numpy as np

# Import all plotting functions
from src.core.analyst.visualization.time_series import plot_time_series
from src.core.analyst.visualization.histogram import plot_histogram
from src.core.analyst.visualization.static_plots import plot_pie_chart, plot_static_distribution

# Mapping for variables/actions that update over time
DYNAMIC_PLOT_MAPPING = {
    "continuous": plot_time_series,
    "categorical": plot_histogram,
    "text": None  # TODO: Add visualization for text
}

# Mapping for static variables (no update rule)
STATIC_PLOT_MAPPING = {
    "continuous": plot_static_distribution,
    "categorical": plot_pie_chart,
    "text": None  # TODO: Add visualization for text
}

def is_likely_categorical(series, threshold=0.05, max_categories=10):
    n_unique = series.nunique()
    n_total = len(series)
    return (n_unique / n_total < threshold) and (n_unique <= max_categories)


def infer_derived_variable_type(df, variable_name):
    """
    Infer the type of a derived variable based on its values.
    
    Args:
        df (pandas.DataFrame): DataFrame containing the variable
        variable_name (str): Name of the variable to infer the type for
        
    Returns:
        str: One of 'continuous', 'categorical', 'text', or 'unknown'
    """
    # Get all values
    values = df[variable_name]
    
    # Get the type of the first value
    first_value = values.iloc[0]
    
    if isinstance(first_value, int | np.int64 | float | np.float64):
        if is_likely_categorical(values):
            return "categorical"
        else:
            return "continuous"
    elif isinstance(first_value, bool):
        return "categorical"
    elif isinstance(first_value, str):
        if is_likely_categorical(values):
            return "categorical"
        else:
            return "text"
    else:
        return "unknown" 
    
def create_plot(config, data, agent_group_name, variable_action_name):
    """
    Create a plot for a specific variable or action
    
    Args:
        config (dict): The configuration for the simulation
        data (list): The data from the simulation
        agent_group_name (str): The name of the agent group
        variable_action_name (str): The name of the variable or action
        
    Returns:
        dict: A dict with title and base64 image
    """
    # Create a list to store all records
    records = []
    
    # Iterate through each timestep
    for timestep in data:
        # Extract values for agents in the specified group
        for agent in timestep:
            if agent['_agent_group'] == agent_group_name:
                records.append({
                    '_step': agent['_step'],
                    '_id': agent['_id'],
                    variable_action_name: agent[variable_action_name]
                })
    
    # Create dataframe from records
    df = pd.DataFrame(records)
    
    # Check if it's a variable or action and get the description and unit
    try:
        has_update_rule = config['agent_groups'][agent_group_name]['variables'][variable_action_name]['update_rule'] is not None
        description = config['agent_groups'][agent_group_name]['variables'][variable_action_name]['description']
        unit = config['agent_groups'][agent_group_name]['variables'][variable_action_name]['unit']
    except:
        has_update_rule = True  # Actions are always dynamic
        description = config['agent_groups'][agent_group_name]['actions'][variable_action_name]['description']
        unit = config['agent_groups'][agent_group_name]['actions'][variable_action_name]['unit']

    image_data = None
    title = f"{variable_action_name}&{agent_group_name}"

    # Infer the variable type from the data
    var_type = infer_derived_variable_type(df, variable_action_name)
    
    # Get the appropriate plot mapping based on whether the variable/action updates
    plot_mapping = DYNAMIC_PLOT_MAPPING if has_update_rule else STATIC_PLOT_MAPPING
    
    # Get the plot function based on the inferred type
    plot_func = plot_mapping.get(var_type)
    
    # Create plot if we have a valid plotting function
    if plot_func:
        image_data = plot_func(df, variable_action_name, config['step_unit'], agent_group_name, description, unit)
    
    if image_data is None:
        print(title, var_type)

    return {
        "title": title, 
        "image": image_data
    }

def create_plots(config, data):
    """
    Create all plots for the given config and data

    Args:
        config (dict): The configuration for the simulation
        data (list): The data from the simulation

    Returns:
        list: A list of dicts with title and base64 image
    """
    plots = []
    
    # Iterate through each agent group in config
    for agent_group_name, agent_group_config in config['agent_groups'].items():
        # Process all variables
        if agent_group_config["variables"]:
            for var_name in agent_group_config['variables'].keys():
                plot_data = create_plot(config, data, agent_group_name, var_name)
                if plot_data["image"]:
                    plots.append(plot_data)
        
        # Process all actions
        if agent_group_config["actions"]:
            for action_name in agent_group_config['actions'].keys():
                plot_data = create_plot(config, data, agent_group_name, action_name)
                if plot_data["image"]:
                    plots.append(plot_data)
    
    return plots 