import random
import numpy as np
import math

from src.core.simulator.mini_agent import MiniAgent, MiniAgentList
from src.core.simulator.provider import Provider
from src.core.shared.models import create_response_model
from src.core.simulator.mini_agent_prompt import generate_prompt
from src.core.shared.models import InitialValueVariable, UniformVariable, NormalVariable, CategoricalVariable, DerivedVariable
from src.core.shared.models import TextAction, OptionAction, NumberAction

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        # Handle infinite and NaN values
        if np.isnan(obj):
            return None
        elif np.isinf(obj):
            if obj > 0:
                return float(1e308)  # Max JSON-compatible float
            else:
                return float(-1e308)  # Min JSON-compatible float
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, float):
        # Handle Python's built-in float infinite and NaN values
        if math.isnan(obj):
            return None
        elif math.isinf(obj):
            if obj > 0:
                return float(1e308)  # Max JSON-compatible float
            else:
                return float(-1e308)  # Min JSON-compatible float
        return obj
    return obj

class Simulator:
    def __init__(
        self, 
        config: dict, 
    ):
        """
        Initialize the Simulation with the given configuration and provider.

        Args:
            config: The configuration of the simulation
        """
        self.config = config
        self.test_mode = False
        self.current_step = None
        self.agents = None

    async def validate(self):   
        """
        Validate the simulation configuration.

        Args:
            num_steps: The number of steps to run the simulation for (default is 10)

        Returns:
            dict: A dictionary containing the success status and any errors encountered
        """
        self.errors = set()
        self.test_mode = True

        # Validate agent groups
        has_action_group = False
        for agent_group_name, agent_group in self.config["agent_groups"].items():
            if not agent_group["variables"]:
                self.errors.add(f"Agent group `{agent_group_name}` has no variables. Each agent group must have at least one variable.")
            
            if agent_group["actions"]:
                has_action_group = True
        
        if not has_action_group:
            self.errors.add("There must be at least one agent group with at least one action.")

        # Check for derived variables referencing other derived variables
        all_derived_variables = {}
        
        # First, collect all derived variable names across all agent groups
        for agent_group_name, agent_group in self.config["agent_groups"].items():
            if "variables" in agent_group:
                for var_name, var in agent_group["variables"].items():
                    if "args" in var and isinstance(var["args"], DerivedVariable):
                        if agent_group_name not in all_derived_variables:
                            all_derived_variables[agent_group_name] = []
                        all_derived_variables[agent_group_name].append(var_name)
        
        # Then check if any derived variable's rule contains any other derived variable
        for current_group_name, agent_group in self.config["agent_groups"].items():
            if "variables" in agent_group:
                for var_name, var in agent_group["variables"].items():
                    if "args" in var and isinstance(var["args"], DerivedVariable):
                        derivation_rule = var["args"].derivation_rule
                        if derivation_rule:
                            # Check if any derived variable is in this rule
                            referenced_derived_vars = []
                            for group_name, vars_list in all_derived_variables.items():
                                for other_var in vars_list:
                                    if not (group_name == current_group_name and other_var == var_name) and f"self.{other_var}" in derivation_rule:
                                        referenced_derived_vars.append(f"`{other_var}` in `{group_name}`")
                            
                            if referenced_derived_vars:
                                self.errors.add(
                                    f"Derived variable `{var_name}` in agent group `{current_group_name}` "
                                    f"refers to other derived variables: {', '.join(referenced_derived_vars)}. "
                                    f"Derived variables cannot reference other derived variables."
                                )

        # Before running the simulation, validate that step_unit and number_of_steps are present
        if "step_unit" not in self.config:
            self.errors.add("step_unit is not present in the configuration.")
        if "number_of_steps" not in self.config:
            self.errors.add("number_of_steps is not present in the configuration.")

        # Only proceed with simulation if no errors so far
        if len(self.errors) == 0:
            step_data = self.reset()
            # Run a few steps to validate the simulation (10% of the total steps)
            validation_steps = math.ceil(self.config["number_of_steps"] * 0.1)
            for _ in range(validation_steps):
                step_data = await self.step(provider=None, model=None)
                if step_data is None:
                    break
                if len(self.errors) > 0:
                    break
        
        self.test_mode = False

        return {"success": len(self.errors) == 0, "errors": list(self.errors)}
 
    def _get_step_data(self):
        step_data = []
        for agent_group_name in self.config["agent_groups"].keys():
            for agent in self.agents:
                if agent._agent_group == agent_group_name:
                    agent_data = {
                        "_step": self.current_step,
                        "_uid": agent._uid,
                        "_id": agent._id,
                        "_agent_group": agent_group_name,
                        **{k: v for k, v in agent._variables.items()},
                    }
                    step_data.append(agent_data)
        return step_data

    def reset(self):
        """
        Reset the simulation to its initial state.
        
        Returns:
            list: Initial state data for all agents
        """

        self.current_step = 0
        self._initialize_agents()
        return convert_numpy_types(self._get_step_data())

    def _initialize_agents(self):
        self.agents = []
        for agent_group_name, agent_group in self.config["agent_groups"].items():
            # Create and initialize agents
            for i in range(agent_group["number_of_agents"]):
                agent = MiniAgent(id=i, agent_group=agent_group_name)
                self.agents.append(agent)

                # Initialize variables based on distributions
                if "variables" in agent_group:
                    for var_name, var in agent_group["variables"].items():
                        # Derived variables are initialized to None and computed later
                        value = self._get_initial_value(args=var["args"])
                        setattr(agent, var_name, value)

                # Initialize actions as variables and initial value None
                if "actions" in agent_group:
                    for action_name in agent_group["actions"].keys():
                        setattr(agent, action_name, None)

        # Initialize derived variables
        for agent_group_name, agent_group in self.config["agent_groups"].items():
            agents = [agent for agent in self.agents if agent._agent_group == agent_group_name]
            for agent in agents:
                self._get_initial_derived_value(agent, agent_group)

    def _get_initial_value(self, args):
        if isinstance(args, InitialValueVariable):
            return args.value
        elif isinstance(args, UniformVariable):
            return (
                random.randint(args.min, args.max)
                if isinstance(args.min, int) and isinstance(args.max, int)
                else random.uniform(args.min, args.max)
            )
        elif isinstance(args, NormalVariable):
            return (
                int(np.random.normal(args.mean, args.std))
                if isinstance(args.mean, int) and isinstance(args.std, int)
                else np.random.normal(args.mean, args.std)
            )
        elif isinstance(args, CategoricalVariable):
            names = [item.value for item in args.categories]
            probabilities = [item.probability/100 for item in args.categories]
            return random.choices(names, probabilities)[0]
        elif isinstance(args, DerivedVariable):
            return None

    def _get_initial_derived_value(self, agent, agent_group):
        if 'variables' in agent_group:
            for var_name, var in agent_group["variables"].items():
                if "args" in var and isinstance(var["args"], DerivedVariable):
                    derivation_rule = var["args"].derivation_rule
                    if derivation_rule:
                        value = self._eval(derivation_rule, agent, var_name, is_derived=True)
                        setattr(agent, var_name, value)

    def _eval(self, expr, agent, var_name, is_derived=False):
        context = {
            "np": np,
            "self": agent,
            **{
                agent_group: MiniAgentList([a for a in self.agents if a._agent_group == agent_group])
                for agent_group in {a._agent_group for a in self.agents}
            },
        }
        try:
            result = eval(expr, {"__builtins__": __builtins__}, context)
        except Exception as e:
            if is_derived:
                error_msg = f"Error computing derivation_rule `{expr}` for variable `{var_name}` in agent group `{agent._agent_group}`: {e}"
                if self.test_mode:
                    self.errors.add(error_msg)
                    return None
                else:
                    raise ValueError(error_msg)
            else:
                error_msg = f"Error computing update_rule `{expr}` for variable `{var_name}` in agent group `{agent._agent_group}`: {e}"
                if self.test_mode:
                    self.errors.add(error_msg)
                    return None
                else:
                    raise ValueError(error_msg)

        return result

    def _update_variables(self):
        updates = {}

        # Compute all updates
        for agent in self.agents:
            updates[agent] = {}
            agent_group = self.config["agent_groups"][agent._agent_group]
            if "variables" in agent_group:
                for var_name, var in agent_group["variables"].items():
                    if var["update_rule"]:
                        updates[agent][var_name] = self._eval(var["update_rule"], agent, var_name, is_derived=False)

        # Apply all updates
        for agent, var_updates in updates.items():
            for var_name, new_value in var_updates.items():
                setattr(agent, var_name, new_value)

    async def step(
        self, 
        provider: Provider,
        model: str,
        max_retries: int = 5,
    ):
        """
        Run a single step of the simulation.

        Args:
            provider: The provider to use for the simulation
            model: The model to use for agent responses
            max_retries: The maximum number of retries for failed requests (default is 5)

        Raises:
            RuntimeError: If simulation hasn't been reset or max steps reached or failed requests after max retries
        """
        if self.agents is None or self.current_step is None:
            error_msg = "Simulation must be reset before calling step()"
            raise RuntimeError(error_msg)

        if self.current_step >= self.config["number_of_steps"]:
            return None

        self.current_step += 1
        print(f"Starting step {self.current_step}/{self.config['number_of_steps']}...")
        self.provider = provider
        self.model = model

        # Get only agents from agent_groups that have actions
        active_agents = [
            agent
            for agent in self.agents
            if agent._agent_group
            in {agent_group_name for agent_group_name, agent_group in self.config["agent_groups"].items() if "actions" in agent_group}
        ]

        if self.test_mode:
            for agent in active_agents:
                agent_group = self.config["agent_groups"][agent._agent_group]
                action_values = {}
                
                for action_name, action in agent_group["actions"].items():
                    action_value = self._generate_random_action_value(args=action["args"])
                    action_values[action_name] = action_value
                    setattr(agent, action_name, action_value)
                
                agent.add_memory(self.current_step, action_values)
        else:
            prompt_batch = []
            for agent in active_agents:
                agent_group = self.config["agent_groups"][agent._agent_group]
                
                # Fetch perception context if visual channel is enabled
                perception_context = None
                if self._is_visual_channel_enabled(agent_group):
                    perception_context = await self._fetch_perception_context(agent_group)
                
                prompt, system_prompt = generate_prompt(
                    agent, 
                    agent_group, 
                    self.config["step_unit"],
                    perception_context=perception_context
                )

                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ]

                prompt_batch.append(
                    {
                        "id": agent._uid,
                        "messages": messages,
                        "response_format": create_response_model(agent_group["actions"]),
                    }
                )

            # Keep track of failed requests that need retry
            failed_requests = prompt_batch
            retries = 0

            # Continue retrying until all requests succeed or max retry
            while failed_requests and retries < max_retries:
                responses = await self.provider.async_batch_completion(
                    model=self.model,
                    requests=failed_requests,
                )

                # Process responses and collect actions
                new_failed_requests = []

                for response in responses:
                    agent = next(a for a in active_agents if a._uid == response["id"])
                    agent_group = self.config["agent_groups"][agent._agent_group]

                    if response["error"] is None:
                        # Add action values to the agent and update memory
                        completion = response["completion"]
                        try:
                            parsed_response = completion.choices[0].message.parsed
                            
                            # Check if response is valid
                            if parsed_response is None:
                                raise ValueError("Received null parsed response")
                                
                            # Process actions if valid
                            action_values = {
                                action_name: getattr(parsed_response, action_name).value
                                for action_name in parsed_response.model_fields.keys()
                                if action_name != 'thought'
                            }
                            agent.add_memory(self.current_step, action_values)
                            for action_name in agent_group["actions"].keys():
                                setattr(agent, action_name, action_values[action_name])
                        except Exception as e:
                            # Treat parsing errors as failed requests that need retry
                            new_failed_requests.append(
                                {
                                    "id": response["id"],
                                    "messages": response["messages"],
                                    "response_format": response["response_format"],
                                }
                            )
                    else:
                        new_failed_requests.append(
                            {
                                "id": response["id"],
                                "messages": response["messages"],
                                "response_format": response["response_format"],
                            }
                        )

                failed_requests = new_failed_requests
                retries += 1

            if failed_requests and not self.test_mode:
                error_msg = f"Failed to get responses after {max_retries} retries"
                raise RuntimeError(error_msg)

        step_data = self._get_step_data()
        self._update_variables()
        
        return convert_numpy_types(step_data)

    def _is_visual_channel_enabled(self, agent_group):
        """
        Check if visual channel is enabled for an agent group.
        
        Args:
            agent_group: The agent group configuration
            
        Returns:
            bool: True if visual channel is enabled
        """
        return agent_group.get("channels", {}).get("visual", {}).get("enabled", False)
    
    async def _fetch_perception_context(self, agent_group):
        """
        Fetch perception context for assets relevant to this agent group.
        
        Args:
            agent_group: The agent group configuration
            
        Returns:
            dict: Perception context with asset summaries and perceptions
        """
        from src.api.deps import asset_manager
        
        # Get simulation_id from config
        simulation_id = self.config.get("simulation_id")
        if not simulation_id:
            return None
        
        # Get asset selectors (filters) from agent group
        asset_selectors = agent_group.get("channels", {}).get("visual", {}).get("asset_selectors", {})
        
        # Fetch assets for this simulation
        assets = await asset_manager.list_assets(
            simulation_id=simulation_id,
            type_filter=asset_selectors.get("type")  # e.g., 'image', 'pdf'
        )
        
        if not assets:
            return None
        
        # Build perception context with asset summaries and their perceptions
        perception_data = []
        for asset in assets[:5]:  # Limit to 5 assets to control token cost
            asset_info = {
                "asset_id": str(asset.id),
                "name": asset.name,
                "type": asset.type,
                "perceptions": []
            }
            
            # Get perceptions for this asset
            perceptions = await asset_manager.list_perceptions(asset.id)
            for perception in perceptions:
                if perception.kind == 'caption':
                    caption_text = perception.data.get('caption', '')
                    if caption_text:
                        asset_info["perceptions"].append({
                            "kind": "caption",
                            "text": caption_text[:300]  # Limit to 300 chars
                        })
                elif perception.kind == 'ocr':
                    ocr_text = perception.data.get('text', '')
                    if ocr_text:
                        asset_info["perceptions"].append({
                            "kind": "ocr",
                            "text": ocr_text[:300]  # Limit to 300 chars
                        })
                elif perception.kind == 'entities':
                    entities = perception.data.get('entities', [])
                    if entities:
                        entity_summary = ', '.join([
                            f"{e.get('type', '')}: {e.get('value', '')}" 
                            for e in entities[:5]  # Limit to 5 entities
                        ])
                        asset_info["perceptions"].append({
                            "kind": "entities",
                            "text": entity_summary
                        })
            
            if asset_info["perceptions"]:  # Only include assets with perceptions
                perception_data.append(asset_info)
        
        return perception_data if perception_data else None

    def _generate_random_action_value(self, args):
        """
        Generate a random value for an action based on its type and constraints.
        
        Args:
            action: The action configuration
            
        Returns:
            A random value appropriate for the action type
        """  
        if isinstance(args, NumberAction):
            # Handle cases where min_value or max_value might be None
            min_val = args.min_value if args.min_value is not None else float('-inf')
            max_val = args.max_value if args.max_value is not None else float('inf')
            
            # If both bounds are None or infinite, return a reasonable default range
            if min_val == float('-inf') and max_val == float('inf'):
                min_val = 0
                max_val = 100
            elif min_val == float('-inf'):
                min_val = max_val - 100
            elif max_val == float('inf'):
                max_val = min_val + 100

            # Check if we should return an integer or float
            if (isinstance(args.min_value, int) or args.min_value is None) and \
               (isinstance(args.max_value, int) or args.max_value is None) and \
               (isinstance(args.min_value, int) or isinstance(args.max_value, int)):
                return random.randint(int(min_val), int(max_val))
            else:
                return random.uniform(min_val, max_val)
        elif isinstance(args, OptionAction):
            options = args.options
            if not options:
                return None
            return random.choice(options)
        elif isinstance(args, TextAction):
            return ' '.join('sample_word' for _ in range(random.randint(args.min_words, args.max_words)))
        return None
