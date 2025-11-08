import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from src.core.analyst.analyst import create_report
from pprint import pprint
from src.core.shared.config_serializer import decode_config

MODEL = "anthropic/claude-sonnet-4"



async def main():
    with open("tests/config.json", "r") as f:
        config = json.load(f)
    with open("tests/data.json", "r") as f:
        data = json.load(f)
    
    result, done = await create_report(
        config=decode_config(config),
        data=data,
        sources=[],
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url=os.getenv("OPENROUTER_BASE_URL"),
        model=MODEL,
        max_turns=120,
    )
    pprint(result)
    print(done)


if __name__ == "__main__":
    asyncio.run(main())