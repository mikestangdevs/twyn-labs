

dict_1 = {
    "timestamp": 1749518992.978522,
    "simulation_id": "c413ba11-b74e-4ac8-bedd-b8018743f561",
    "prompt": "public goods game",
    "status": "processing_config",
    "title": "Public Goods Game",
    "config": {
        "agent_groups": {}
    },
    "data": None,
    "current_step": None,
    "analysis": None,
    "error_log": None
}

dict_2 = {
    "timestamp": 1749518992.978522,
    "simulation_id": "c413ba11-b74e-4ac8-bedd-b8018743f561",
    "prompt": "public goods game",
    "status": "processing_config",
    "title": "Public Goods Game",
    "config": {
        "agent_groups": {
            "agent_group_1": {
                "agent_1": {
                    "variable_action_name": "variable_1",
                    "variable_2": "value_2"
                }
            }
        }
    },
    "data": None,
    "current_step": None,
    "analysis": None,
    "error_log": None
}

print(dict_1 != dict_2)