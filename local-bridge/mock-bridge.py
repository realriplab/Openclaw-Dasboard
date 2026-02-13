#!/usr/bin/env python3
"""
Mock Bridge for local testing
Generates fake agent activity without needing OpenClaw
"""

import asyncio
import aiohttp
import random
import os
from datetime import datetime, timezone

WORKER_URL = os.getenv("WORKER_URL", "https://openclaw-dashboard.realriplab.workers.dev")
API_TOKEN = os.getenv("API_TOKEN", "yunhe-2024-offline")
TEAM_ID = os.getenv("TEAM_ID", "default")

AGENTS = [
    {"id": "coder", "name": "Coder", "color": "#3498db", "role": "Engineering"},
    {"id": "writer", "name": "Writer", "color": "#e74c3c", "role": "Content"},
    {"id": "founder", "name": "Founder", "color": "#9b59b6", "role": "Leadership"},
    {"id": "investor", "name": "Investor", "color": "#f39c12", "role": "Investment"},
    {"id": "coach", "name": "Coach", "color": "#1abc9c", "role": "People"},
    {"id": "main", "name": "Main", "color": "#00bcd4", "role": "General"}
]


def get_mock_status():
    """Generate random agent statuses"""
    agents = []
    for agent in AGENTS:
        # Randomly assign working/idle with weighted probability
        is_working = random.random() > 0.3  # 70% chance of working
        agents.append({
            **agent,
            "status": "working" if is_working else "idle",
            "lastSeen": datetime.now(timezone.utc).isoformat()
        })
    
    return {
        "teamId": TEAM_ID,
        "agents": agents,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


async def push_status(session):
    """Push mock status to Worker"""
    try:
        status = get_mock_status()
        
        url = f"{WORKER_URL}/api/report/{TEAM_ID}"
        headers = {
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        }
        
        async with session.post(url, json=status, headers=headers) as resp:
            if resp.status == 200:
                working = len([a for a in status["agents"] if a["status"] == "working"])
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Pushed {working}/6 agents working")
                return True
            else:
                text = await resp.text()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Failed: HTTP {resp.status} - {text}")
                return False
                
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Error: {e}")
        return False


async def main():
    """Main loop - push mock data every 5 seconds"""
    print("=" * 60)
    print("Mock Bridge for Local Testing")
    print("=" * 60)
    print(f"Team ID: {TEAM_ID}")
    print(f"Worker URL: {WORKER_URL}")
    print(f"Push Interval: 5s")
    print(f"Generating mock data for {len(AGENTS)} agents")
    print("=" * 60)
    print("")
    
    async with aiohttp.ClientSession() as session:
        while True:
            await push_status(session)
            await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nStopped by user")
