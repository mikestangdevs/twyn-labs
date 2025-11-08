#!/usr/bin/env python3
"""Diagnose simulation stuck issue"""
import requests
import sys

sim_id = "e524fb8b-fa58-46e9-9479-15b50bd5f122"

try:
    # Check backend health
    print("1. Checking backend health...")
    try:
        r = requests.get("http://localhost:8000/", timeout=2)
        print("   ✅ Backend responding")
    except Exception as e:
        print(f"   ❌ Backend not responding: {e}")
        sys.exit(1)
    
    # Check simulation state
    print(f"\n2. Checking simulation {sim_id}...")
    r = requests.get(f"http://localhost:8000/simulations/{sim_id}", timeout=5)
    data = r.json()
    
    print(f"   Status: {data.get('status')}")
    print(f"   Current Step: {data.get('current_step')}/180")
    print(f"   Data Points: {len(data.get('data', []))}")
    print(f"   Error Log: {data.get('error_log') or 'None'}")
    
    # Check if stuck
    if data.get('status') == 'processing_simulation':
        current_step = data.get('current_step')
        data_points = len(data.get('data', []))
        
        if current_step != data_points:
            print(f"\n⚠️  ISSUE DETECTED:")
            print(f"   Current step ({current_step}) doesn't match data points ({data_points})")
            print(f"   Simulation might be stuck on step {current_step}")
        
        # Check last step data
        if data.get('data'):
            last_step = data['data'][-1]
            print(f"\n3. Last completed step data:")
            print(f"   Step: {last_step.get('step_number', '?')}")
            print(f"   Agents active: {len(last_step.get('agents', []))}")
    
    elif data.get('status') == 'completed_simulation':
        print("\n✅ Simulation completed!")
    
    elif data.get('status') == 'failed':
        print(f"\n❌ Simulation failed: {data.get('error_log')}")
    
    print("\n" + "="*50)
    print("RECOMMENDATION:")
    
    if data.get('status') == 'processing_simulation' and data.get('current_step', 0) >= 148:
        print("The simulation has good progress (148+ steps).")
        print("If stuck for >2 minutes, consider:")
        print("  1. Check OpenRouter API status")
        print("  2. Check backend logs for timeout errors")
        print("  3. Force complete and run analysis on existing data")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

