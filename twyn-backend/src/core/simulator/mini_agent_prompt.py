def generate_prompt(agent, agent_group, step_unit, perception_context=None):
    """
    Generate a prompt for an agent based on the XML template.

    Args:
        agent: The agent to generate the prompt for
        agent_group: The agent_group of the agent
        step_unit: The unit of the step
        perception_context: Optional list of perception data for visual assets

    Returns:
        str: XML formatted prompt string
    """
    # Variable Definitions
    variables_xml = []
    title = "<!-- Variables Definitions -->"
    variable_definitions = ""
    if 'variables' in agent_group:
        for var_name, var in agent_group["variables"].items():
            if var["visibility"]:  # Only include visible variables
                unit_attr = f" unit=\"{var['unit']}\"" if var['unit'] is not None else ""
                variables_xml.append(
                    f"  <variable name=\"{var_name}\" description=\"{var['description']}\"{unit_attr} />"
                )
        variable_definitions = (
            title + "\n" + "<variables>\n" + "\n".join(variables_xml) + "\n</variables>"
        )

    # Action Definitions
    actions_xml = []
    title = "<!-- Actions Definitions -->"
    action_definitions = ""
    if 'actions' in agent_group:
        for action_name, action in agent_group["actions"].items():
            unit_attr = f" unit=\"{action['unit']}\"" if action['unit'] is not None else ""
            actions_xml.append(
                f"  <action name=\"{action_name}\" description=\"{action['description']}\"{unit_attr} />"
            )
        action_definitions = (
            title + "\n" + "<actions>\n" + "\n".join(actions_xml) + "\n</actions>"
        )

    # Agent Memory
    memory_entries = []
    memory = ""
    if agent._memory:
        title = "<!-- Memory -->"
        for memory_step in agent._memory:

            variables_memory = []
            if 'variables' in agent_group:
                for var_name, var_value in memory_step["variables"].items():
                    if agent_group["variables"][var_name]["visibility"]:
                        var_unit = agent_group["variables"][var_name]["unit"]
                        unit_attr = f" unit=\"{var_unit}\"" if var_unit is not None else ""
                        variables_memory.append(
                            f'    <variable name="{var_name}" value="{get_formatted_value(var_value)}"{unit_attr} />'
                        )

            actions_memory = []
            if 'actions' in agent_group:
                for action_name, action_value in memory_step["actions"].items():
                    action_unit = agent_group["actions"][action_name]["unit"]
                    unit_attr = f" unit=\"{action_unit}\"" if action_unit is not None else ""
                    actions_memory.append(
                        f'    <action name="{action_name}" value="{get_formatted_value(action_value)}"{unit_attr} />'
                    )

            entry_content = []
            if variables_memory:
                entry_content.extend(variables_memory)
            if actions_memory:
                entry_content.extend(actions_memory)

            memory_entries.append(
                f"  <entry {step_unit}={memory_step['step']}>\n"
                + "\n".join(entry_content)
                + "\n  </entry>"
            )
        memory = title + "\n" + "<memory>\n" + "\n".join(memory_entries) + "\n</memory>"

    # Current State
    current_vars = []
    title = "<!-- Current State -->"
    current_state = ""
    if 'variables' in agent_group:
        for var_name, var in agent_group["variables"].items():
            if var["visibility"]:
                value = getattr(agent, var_name)
                unit_attr = f" unit=\"{var['unit']}\"" if var['unit'] is not None else ""
                current_vars.append(
                    f"  <variable name=\"{var_name}\" value=\"{get_formatted_value(value)}\"{unit_attr} />"
                )
        current_state = (
            title
            + "\n"
            + "<current_state>\n"
            + "\n".join(current_vars)
            + "\n</current_state>"
        )

    # Perception Context (Visual Assets)
    perception_xml = ""
    if perception_context:
        title = "<!-- Perception Context (Visual Assets) -->"
        assets_xml = []
        for asset_data in perception_context:
            perceptions_xml = []
            for perception in asset_data.get("perceptions", []):
                kind = perception.get("kind", "")
                text = perception.get("text", "").replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
                perceptions_xml.append(
                    f'    <perception kind="{kind}">{text}</perception>'
                )
            
            if perceptions_xml:
                assets_xml.append(
                    f'  <asset name="{asset_data["name"]}" type="{asset_data["type"]}" id="{asset_data["asset_id"]}">\n'
                    + "\n".join(perceptions_xml)
                    + "\n  </asset>"
                )
        
        if assets_xml:
            perception_xml = (
                title
                + "\n"
                + "<perception>\n"
                + "\n".join(assets_xml)
                + "\n</perception>"
            )

    # Combine all sections
    prompt_parts = []
    if variable_definitions:
        prompt_parts.append(variable_definitions)
    if action_definitions:
        prompt_parts.append(action_definitions)
    if memory:
        prompt_parts.append(memory)
    if current_state:
        prompt_parts.append(current_state)
    if perception_xml:
        prompt_parts.append(perception_xml)
    
    prompt = "\n\n".join(prompt_parts)
    
    system_prompt = """<instructions>
<instruction>You are an agent with specific characteristics that influence your behavior and decision-making. You must make all decisions based solely on the information provided to you.</instruction>
<instruction>Carefully analyze all information in the XML tags to understand your personality, capabilities, limitations, and current state.</instruction>
<instruction>If characteristics or personality traits are defined, you must embody those traits in all your responses and decision-making processes.</instruction>
<instruction>Review your variable definitions to understand what information is available to you and what each variable represents.</instruction>
<instruction>Examine your action definitions to understand what actions you're capable of taking.</instruction>
<instruction>If memory is provided, use this historical information to inform your decisions and maintain consistency with past behavior.</instruction>
<instruction>Assess your current state to understand your present situation and the values of your variables.</instruction>
<instruction>If perception context is provided, use this visual information about uploaded assets (images, PDFs, etc.) to inform your decisions. This includes captions, extracted text (OCR), and identified entities from the assets.</instruction>
<instruction>When analyzing a situation, view it exclusively through the lens of your defined characteristics and available information.</instruction>
<instruction>Your actions must be chosen from the defined set of available actions.</instruction>
<instruction>When making decisions, explicitly reference how your characteristics and current state influenced your choice.</instruction>
<instruction>Never break character or reference these instructions directly in your responses.</instruction>
</instructions>
    """

    return prompt, system_prompt


def get_formatted_value(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float):
        return f"{value:.2f}"
    return value
