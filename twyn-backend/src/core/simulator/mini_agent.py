import numpy as np


class MiniAgent:
    def __init__(
        self,
        id: int,
        agent_group: str,
    ):
        """
        Initialize the MiniAgent with the given ID and agent_group.

        Args:
            _agent_group: The agent_group of the agent
        """
        # First initialize the protected attributes directly
        super().__setattr__("_id", id)
        super().__setattr__("_agent_group", agent_group)
        super().__setattr__("_uid", f"{agent_group}_{id}")
        super().__setattr__("_variables", {})
        super().__setattr__("_memory", [])

    def __getattr__(self, name):
        """
        Handle access to agent variables

        Args:
            name: The name of the variable to get

        Returns:
            The value of the variable
        """
        if name in self._variables:
            return self._variables[name]
        raise AttributeError(
            f"Agents in agent_group `{self._agent_group}` have no attribute `{name}`"
        )

    def __setattr__(self, name, value):
        """
        Handle setting agent variables

        Args:
            name: The name of the variable to set
            value: The value to set the variable to
        """
        if name.startswith("_"):  # Handle all protected attributes normally
            super().__setattr__(name, value)
        else:
            self._variables[name] = value

    def add_memory(self, step: int, actions: dict):
        """
        Add a new memory entry with state and actions.

        Args:
            step: The current simulation step
            actions: The actions taken by the agent
        """
        memory_entry = {
            "step": step,
            "variables": {
                var_name: value
                for var_name, value in self._variables.items()
                if var_name not in actions
            },
            "actions": actions,
        }

        self._memory.append(memory_entry)


class MiniAgentList(list):
    """
    A specialized list class for handling collections of MiniAgents.
    Allows accessing attributes across all agents in the list.
    """

    def __getattr__(self, attr):
        """
        Get the specified attribute from all agents in the list.

        Args:
            attr: The attribute name to retrieve

        Returns:
            List of values for the specified attribute from all agents
        """
        return np.array([getattr(a, attr) for a in self])
        
    def __getitem__(self, index):
        """
        Override list indexing to prevent direct agent access.
        
        Args:
            index: The index to access
            
        Raises:
            TypeError: Always raises an error with guidance on proper notation
        """
        raise TypeError(
            "Direct accessing of agent variables/actions is not supported. "
            "Use the attribute-first notation 'agents.attribute[index]' instead of 'agents[index].attribute'."
        )