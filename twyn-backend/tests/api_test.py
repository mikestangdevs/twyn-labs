import os
import sys
import requests

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

api_url = "http://localhost:8000"

response = requests.post(f"{api_url}/simulations", json={"prompt": "Public goods game"})

print(response.json())

response = requests.post(f"{api_url}/architect/{response.json()['simulation_id']}")