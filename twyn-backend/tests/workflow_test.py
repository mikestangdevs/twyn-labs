"""
Test file for the end-to-end workflow process that includes:
1. Architect phase: Initial creation of the simulation configuration
2. Simulation phase: Running simulations based on architect output
3. Analyst phase: Analyzing simulation results
4. Email notification: Sending results to user

Each step's results are automatically saved to the Supabase database.
If any step fails, error logs are stored in the database for debugging.
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from supabase import create_client
from src.api_dep.supabase_utils import run_architect, run_simulation, run_analyst, run_send_email, add_item_to_table



# Test request ID - replace with actual request ID when testing
request_id = "66a90cbc-b821-4240-9c67-963a776b73e2"

# Initialize Supabase client with environment variables
supabase_client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)


async def run_workflow(request_id: str):
    """
    Executes the complete workflow sequence.
    Each step is dependent on the success of the previous step.
    All results and errors are automatically logged to the database.
    
    Args:
        request_id (str): Unique identifier for the workflow request
    """
    # Step 0: Reset the status and error logs in the database to null values
    add_item_to_table(
            supabase_client=supabase_client,
            table_name="simulation_results",
            request_id=request_id,
            data="started",
            column="status"
        )
    add_item_to_table(
            supabase_client=supabase_client,
            table_name="simulation_results",
            request_id=request_id,
            data=None,
            column="error_logs"
        )
    # Step 1: Run architect phase
    result = await run_architect(supabase_client, request_id)
    if result['status'] == 'success':
        # Step 2: Run simulation if architect was successful
        result = await run_simulation(supabase_client, request_id)
    if result['status'] == 'success':
        # Step 3: Run analyst if simulation was successful
        result = await run_analyst(supabase_client, request_id)
        if result['status'] == 'success':
            # Step 4: Send email notification if all previous steps were successful
            result = await run_send_email(supabase_client, request_id)

# Execute the workflow test
asyncio.run(run_workflow(request_id))
# asyncio.run(run_simulation(supabase_client, request_id))
# asyncio.run(run_analyst(supabase_client, request_id))
# asyncio.run(run_send_email(supabase_client, request_id))