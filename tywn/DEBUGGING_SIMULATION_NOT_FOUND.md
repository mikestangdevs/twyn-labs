# Debugging: Simulation Not Found Issue

## Problem
Simulations are being created but then immediately return "not found" when the frontend tries to fetch them via SSE stream.

## Root Cause (Suspected)
One of the following:
1. **Database write failures** - The simulation creation is failing to persist to Supabase, but the error is being silently swallowed
2. **RLS (Row Level Security) issues** - Supabase RLS policies might be blocking reads
3. **Race condition** - Though unlikely given the retry logic in place

## Changes Made

### 1. Frontend: Added Error Visibility (`agents-tab.tsx`)
- Added `isFailed` status check
- Display red Alert box when simulation fails
- Shows the actual `error_log` from the backend

### 2. Backend: Enhanced Logging

#### `simulation_manager.py`
- Added detailed logging when database writes fail
- Logs user_id, scenario_id, and full error details
- Added logging to `get_simulation()` to track cache hits/misses

#### `database.py`
- Enhanced error logging with:
  - Error type
  - user_id and scenario_id
  - Full error representation
  - Error dict details

#### `routes/simulations.py`
- Added logger import
- Log warnings on each retry attempt
- Log error when giving up after max retries

## How to Diagnose

### Step 1: Check Backend Logs
When you create a new simulation, look for these log messages in Railway:

**Success case:**
```
Created and persisted simulation {id} for user {user_id}
Found simulation {id} in memory cache
```

**Failure case:**
```
Failed to persist new simulation {id}: {error}
  user_id: {user_id}
  scenario_id: {scenario_id}
  Error type: {type}
  Full error: {error}
```

**SSE Stream not finding simulation:**
```
Simulation {id} not in cache, checking database...
Simulation {id} not found, retry 1/5
Simulation {id} not found, retry 2/5
...
Simulation {id} not found after 5 retries - giving up
```

### Step 2: Check What the Logs Reveal

**If you see database write failures:**
- Check that SUPABASE_SERVICE_ROLE_KEY is set correctly
- Verify the key has permissions to write to the simulations table
- Check if there are any RLS policies blocking writes

**If database writes succeed but SSE can't find it:**
- Check if multiple backend instances are running
- Verify the simulation_id matches between creation and fetch
- Look for any UUID format issues

**If scenario_id is causing issues:**
- Verify the scenario exists in the database
- Check if the scenario belongs to the correct user
- Look for foreign key constraint violations

### Step 3: Verify Supabase Setup

Check that the service role key being used bypasses RLS:
```bash
# In Railway backend environment variables:
SUPABASE_SERVICE_ROLE_KEY=<should be the service_role key, NOT anon key>
```

The service role key should bypass all RLS policies. If using the anon key instead, RLS will block operations.

## Expected Behavior After Fix

1. **New simulation created** → See "Created and persisted simulation" in logs
2. **SSE stream connects** → See "Found simulation in memory cache"
3. **Architect starts** → Status changes from `pending` to `processing_config`
4. **If failure occurs** → Red alert box in UI shows exact error

## Files Modified

### Frontend
- `src/components/agents-tab.tsx` - Added error handling UI
- `src/components/ui/alert.tsx` - New Alert component

### Backend
- `src/api/simulation_manager.py` - Enhanced logging
- `src/api/database.py` - Enhanced logging
- `src/api/routes/simulations.py` - Enhanced logging

## Next Steps

1. **Deploy these changes** to Railway
2. **Create a new simulation** (in a scenario or not)
3. **Watch the Railway logs** carefully
4. **Share the logs** with me so I can identify the exact issue

The enhanced logging will reveal exactly where the failure is occurring.


