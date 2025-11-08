import sys
import os
import pytest
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.simulator.mini_agent import MiniAgent, MiniAgentList


def setup_test_agents():
    agents = []
    for i in range(10):
        human = MiniAgent(id=i, agent_group="humans")
        robot = MiniAgent(id=i, agent_group="robots")

        # Set test variables
        human.age = i
        human.height = i + 10
        human.active = i % 2 == 0

        robot.age = i * 2
        robot.height = i * 2 + 10
        robot.power = i * 100

        agents.append(human)
        agents.append(robot)

    return agents


def test_basic_notation():
    agents = setup_test_agents()
    human_3 = agents[4]  # 3rd human (index 4 because of alternating humans/robots)

    context = {
        "np": np,
        "self": human_3,
        **{
            agent_group: MiniAgentList([a for a in agents if a._agent_group == agent_group])
            for agent_group in {a._agent_group for a in agents}
        },
    }

    # Test basic attribute access
    assert eval("self.age", context) == 2
    assert eval("self.height", context) == 12

    # Test agent_group list access
    assert eval("humans[0].age", context) == 0
    assert eval("robots[0].age", context) == 0

    # Test array operations
    assert eval("np.mean(humans.age)", context) == 4.5
    assert eval("np.sum(robots.power)", context) == 4500

    # Test boolean filtering
    assert eval("np.sum(humans.active)", context) == 5

    # Test complex expressions
    expr = (
        "np.mean(robots.age) + np.mean(humans.age) - humans[0].age*2 + humans[1].age*3"
    )
    expected = 9 + 4.5 - 0 * 2 + 1 * 3
    assert eval(expr, context) == expected


def test_error_handling():
    agents = setup_test_agents()
    human_3 = agents[4]

    context = {
        "np": np,
        "self": human_3,
        **{
            agent_group: MiniAgentList([a for a in agents if a._agent_group == agent_group])
            for agent_group in {a._agent_group for a in agents}
        },
    }

    # Test attribute error
    with pytest.raises(AttributeError):
        eval("self.nonexistent", context)

    # Test index error
    with pytest.raises(IndexError):
        eval("humans[20].age", context)

    # Test accessing robot-specific attribute on human
    with pytest.raises(AttributeError):
        eval("humans[0].power", context)


def test_list_operations():
    agents = setup_test_agents()
    human_3 = agents[4]

    context = {
        "np": np,
        "self": human_3,
        **{
            agent_group: MiniAgentList([a for a in agents if a._agent_group == agent_group])
            for agent_group in {a._agent_group for a in agents}
        },
    }

    # Test statistical operations
    assert eval("np.std(humans.age)", context) == pytest.approx(2.8722813232690143)
    assert eval("np.median(robots.height)", context) == 19.0
    assert eval("np.max(humans.height)", context) == 19

    # Test complex filtering
    expr = "np.mean(humans.age[humans.active])"
    assert eval(expr, context) == 4.0


def test_complex_expressions():
    agents = setup_test_agents()
    human_3 = agents[4]

    context = {
        "np": np,
        "self": human_3,
        **{
            agent_group: MiniAgentList([a for a in agents if a._agent_group == agent_group])
            for agent_group in {a._agent_group for a in agents}
        },
    }

    # Test nested array operations
    assert eval("np.mean(humans.age[humans.height > 15])", context) == 7.5
    assert eval("np.sum(robots.power[robots.age > 10])", context) == 3000

    # Test boolean combinations
    assert eval("np.sum((humans.age > 5) & (humans.height < 17))", context) == 1
    assert eval("np.sum((humans.age > 2) | (humans.active))", context) == 9

    # Test complex statistical operations
    expr = "np.percentile(humans.age[humans.active], 75)"
    assert eval(expr, context) == 6.0

    # Test nested conditions
    expr = "np.mean(robots.power[robots.height > np.mean(robots.height)])"
    assert eval(expr, context) == 700.0

    # Test multi-agent_group comparisons
    expr = "np.sum(humans.age > np.mean(robots.age))"
    assert eval(expr, context) == 0

    # Test compound expressions
    expr = """np.sum(
        (humans.age > np.mean(humans.age)) & 
        (humans.height < np.median(humans.height)) & 
        humans.active
    )"""
    assert eval(expr, context) == 0


def test_edge_cases():
    agents = setup_test_agents()
    human_3 = agents[4]

    context = {
        "np": np,
        "self": human_3,
        **{
            agent_group: MiniAgentList([a for a in agents if a._agent_group == agent_group])
            for agent_group in {a._agent_group for a in agents}
        },
    }

    # Test empty array handling
    expr = "np.sum(humans.age[humans.age < 0])"
    assert eval(expr, context) == 0

    # Test boolean type conversion
    expr = "np.sum(humans.active > 0)"
    assert eval(expr, context) == 5

    # Test regular Python division by zero
    with pytest.raises(ZeroDivisionError):
        eval("1 / 0", context)

    # Test NumPy division by zero handling - returns inf/nan
    expr = "humans.age / (humans.age - humans.age)"
    result = eval(expr, context)
    assert np.all(np.isnan(result) | np.isinf(result))  # Check for nan or inf values

    # Test type mismatches
    with pytest.raises(TypeError):
        eval("humans.age + 'hello world'", context)


def test_advanced_filtering():
    agents = setup_test_agents()
    human_3 = agents[4]

    context = {
        "np": np,
        "self": human_3,
        **{
            agent_group: MiniAgentList([a for a in agents if a._agent_group == agent_group])
            for agent_group in {a._agent_group for a in agents}
        },
    }

    # Test complex filtering with multiple conditions
    expr = "np.mean(humans.age[(humans.height > 12) & (humans.active)])"
    assert eval(expr, context) == 6.0

    # Test nested filtering with cross-agent_group references
    expr = "np.sum(humans.age[robots.power > 300])"
    assert eval(expr, context) == 39

    # Test filtering with statistical thresholds
    expr = "np.sum(humans.age > np.mean(humans.age))"
    assert eval(expr, context) == 5

    # Test compound filtering with multiple aggregations
    expr = """np.mean(
        humans.height[
            (humans.age > np.mean(humans.age)) & 
            (humans.height < np.max(humans.height))
        ]
    )"""
    assert eval(expr, context) == 16.5


if __name__ == "__main__":
    pytest.main([__file__])
