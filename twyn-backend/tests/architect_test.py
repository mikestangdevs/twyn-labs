import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from src.core.architect.architect import create_configuration
from pprint import pprint
from supabase import create_client
from src.api_dep.supabase_utils import get_item_from_table


# Test request ID - replace with actual request ID when testing
request_id = "6a7cfaa0-e24c-40ab-8ca6-361c286ee5ae"

MODEL = "openai/gpt-4.1"

# Initialize Supabase client with environment variables
supabase_client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)


async def main():
    prompt = get_item_from_table(
        supabase_client=supabase_client,
        request_id=request_id,
        table_name="simulation_requests",
        column="prompt"
    )
    
    result = await create_configuration(
        user_query=prompt,
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url=os.getenv("OPENROUTER_BASE_URL"),
        model=MODEL,
        max_turns=120,
        max_validation_retries=10,
    )
    pprint(result["config"])


if __name__ == "__main__":
    asyncio.run(main())