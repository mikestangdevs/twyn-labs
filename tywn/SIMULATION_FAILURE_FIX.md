# Simulation Instant Failure Fix

## Problem
Simulations were failing instantly with the error:
```
TypeError: 'NoneType' object is not subscriptable
```

The error occurred in the analyst when trying to access `config['user_query']`.

## Root Cause
The analyst code in `analyst.py` line 116 was trying to access a required field `config['user_query']`, but this field was not always present in the simulation configuration:

```python
f"...{config['user_query']}..."  # This throws KeyError if 'user_query' is missing
```

The `user_query` field was expected to contain the original simulation prompt, but:
1. It wasn't always being preserved when configs were edited/saved
2. Some simulations might have been created without this field set

## Fix Applied

### 1. Made analyst handle missing `user_query` gracefully
**File:** `twyn-backend/src/core/analyst/analyst.py`

Changed from:
```python
new_input = [
    {
        "role": "user",
        "content": f"The following is the original simulation request from the user:\n {config['user_query']}..."
    }
]
```

To:
```python
# Get user query from config or use a default message
user_query = config.get('user_query', 'No specific request provided') if config else 'No configuration available'

new_input = [
    {
        "role": "user",
        "content": f"The following is the original simulation request from the user:\n {user_query}..."
    }
]
```

### 2. Added safeguard to populate `user_query` if missing
**File:** `twyn-backend/src/api/simulation_manager.py`

Added code before calling `create_report`:
```python
# Decode config and ensure user_query is set
decoded_config = decode_config(simulation_state.config)
if decoded_config and 'user_query' not in decoded_config:
    # Fallback to simulation prompt if user_query is missing
    decoded_config['user_query'] = simulation_state.prompt or "No specific user request available"
    logger.info(f"[{simulation_id}] Added missing user_query from simulation prompt")
```

## Testing
To test the fix:
1. Restart the backend server
2. Create a new simulation or run an existing one
3. The simulation should complete successfully without instant failure

## Files Modified
- `twyn-backend/src/core/analyst/analyst.py` - Made user_query access safe
- `twyn-backend/src/api/simulation_manager.py` - Added user_query fallback logic

