#!/usr/bin/env python3
"""Quick script to monitor simulation progress"""
import requests
import time

sim_id = "e524fb8b-fa58-46e9-9479-15b50bd5f122"
url = f"http://localhost:8000/simulations/{sim_id}"

print("Monitoring simulation progress...")
print("Press Ctrl+C to stop\n")

prev_step = None
for i in range(10):
    try:
        r = requests.get(url, timeout=5)
        data = r.json()
        step = data.get("current_step", "?")
        status = data.get("status", "?")
        
        if prev_step is not None and step != prev_step:
            print(f"[{time.strftime('%H:%M:%S')}] Step {step}/180 ({status}) ✅ PROGRESSING")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] Step {step}/180 ({status})")
        
        prev_step = step
        
        if status == "completed_simulation":
            print("\n🎉 Simulation complete!")
            break
        
        time.sleep(3)
    except Exception as e:
        print(f"Error: {e}")
        break

