#!/usr/bin/env python3
"""
Openclaw Dashboard Bridge - Smart Version
Auto-detects OpenClaw status and pushes accordingly
"""

import asyncio
import aiohttp
import json
import os
import sys
import glob
import time
import socket
from datetime import datetime, timezone
from typing import Dict, List, Any

# Configuration
TEAM_ID = os.getenv("TEAM_ID", "yunhe-core")
WORKER_URL = os.getenv("WORKER_URL", "https://openclaw-dashboard.realriplab.workers.dev")
API_TOKEN = os.getenv("API_TOKEN", "yunhe-2024-offline")
PUSH_INTERVAL = int(os.getenv("PUSH_INTERVAL", "5"))
GATEWAY_PORT = 18789  # OpenClaw gateway port

# Agent definitions
AGENTS = [
    {"id": "coder", "name": "Coder", "color": "#3498db", "role": "Engineering"},
    {"id": "writer", "name": "Writer", "color": "#e74c3c", "role": "Content"},
    {"id": "founder", "name": "Founder", "color": "#9b59b6", "role": "Leadership"},
    {"id": "investor", "name": "Investor", "color": "#f39c12", "role": "Investment"},
    {"id": "coach", "name": "Coach", "color": "#1abc9c", "role": "People"},
    {"id": "main", "name": "Main", "color": "#00bcd4", "role": "General"}
]


def is_openclaw_running() -> bool:
    """Check if OpenClaw gateway is running by checking port"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('127.0.0.1', GATEWAY_PORT))
        sock.close()
        return result == 0
    except:
        return False


def check_session_activity(agent_id: str, threshold_seconds: int = 120) -> bool:
    """Check if agent has active sessions by looking at session file mtimes"""
    base_path = f"/Users/a66/.openclaw/agents/{agent_id}/sessions"
    
    if not os.path.exists(base_path):
        return False
    
    now = time.time()
    
    try:
        jsonl_files = glob.glob(os.path.join(base_path, "*.jsonl"))
        
        for f in jsonl_files:
            try:
                mtime = os.path.getmtime(f)
                age_seconds = now - mtime
                
                if age_seconds < threshold_seconds:
                    return True
            except:
                pass
                
    except Exception as e:
        print(f"Error checking {agent_id}: {e}")
    
    return False


def get_local_agent_status() -> Dict[str, Any]:
    """Get current status of all local agents"""
    agents_status = []
    
    for agent in AGENTS:
        is_active = check_session_activity(agent["id"])
        agents_status.append({
            **agent,
            "status": "working" if is_active else "idle",
            "lastSeen": datetime.now(timezone.utc).isoformat()
        })
    
    return {
        "teamId": TEAM_ID,
        "agents": agents_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


async def push_status(session: aiohttp.ClientSession) -> bool:
    """Push current status to Cloudflare Worker"""
    try:
        status = get_local_agent_status()
        
        url = f"{WORKER_URL}/api/report/{TEAM_ID}"
        headers = {
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        }
        
        async with session.post(url, json=status, headers=headers) as resp:
            if resp.status == 200:
                working = len([a for a in status["agents"] if a["status"] == "working"])
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Pushed {working}/{len(AGENTS)} agents working")
                return True
            else:
                text = await resp.text()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Failed: HTTP {resp.status} - {text}")
                return False
                
    except aiohttp.ClientError as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Connection error: {e}")
        return False
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Error: {e}")
        return False


async def main():
    """Main loop - push status every PUSH_INTERVAL seconds"""
    print("=" * 60)
    print("Openclaw Dashboard Bridge - Smart Mode")
    print("=" * 60)
    print(f"Team ID: {TEAM_ID}")
    print(f"Worker URL: {WORKER_URL}")
    print(f"Push Interval: {PUSH_INTERVAL}s")
    print(f"Monitoring {len(AGENTS)} agents")
    print("=" * 60)
    print("")
    
    async with aiohttp.ClientSession() as session:
        while True:
            # Check if OpenClaw is running
            if is_openclaw_running():
                # OpenClaw is running, push data
                await push_status(session)
            else:
                # OpenClaw not running, show waiting message
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ⏳ Waiting for OpenClaw...")
            
            await asyncio.sleep(PUSH_INTERVAL)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nStopped by user")
        sys.exit(0)
