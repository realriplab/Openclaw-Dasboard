# Openclaw Dashboard

Real-time visualization panel for OpenClaw multi-agent systems. Monitor your AI agents' status and progress from anywhere - local or remote.

## Purpose

Openclaw Dashboard provides a live, visual interface for users running multiple OpenClaw agents. Whether you're managing agents on your local machine or accessing them remotely, this dashboard gives you instant visibility into:

- **Agent Activity**: See which agents are working or idle in real-time
- **Status Overview**: Color-coded indicators for quick status assessment  
- **Remote Access**: View your agent fleet from any browser, anywhere
- **Progress Tracking**: Monitor ongoing tasks and agent utilization

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Local Machine  │────▶│  Cloudflare      │◀────│  Browser Client │
│  (OpenClaw      │     │  Worker + DO     │     │  (Dashboard)    │
│   Agents)       │     │  (Real-time Hub) │     │  (Any Device)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
       bridge.py              Durable Object           SSE Stream
                              (State Sync)            (Live Updates)
```

## Live Demo

- **Dashboard**: `https://openclaw.realrip.com`
- **API**: `https://openclaw.realrip.com/api/agents/:teamId`
- **Real-time Stream**: `https://openclaw.realrip.com/api/sse/:teamId`

## Features

- **Real-time Updates**: Server-Sent Events (SSE) for instant status changes
- **Multi-tenant**: Support multiple teams/agents with isolated data
- **Cloud Native**: Deployed on Cloudflare's edge network for global low latency
- **Local Bridge**: Python script pushes local agent status to cloud
- **CI/CD**: GitHub Actions auto-deployment on every push

## Quick Start

### For OpenClaw Users

1. **Start the Local Bridge** (pushes your agent status to cloud):

```bash
cd local-bridge
pip install aiohttp
export WORKER_URL="https://openclaw.realrip.com"
export API_TOKEN="your-token"
python3 bridge.py
```

2. **View Your Dashboard**:
   
   Open `https://openclaw.realrip.com` in any browser

### For Developers

**Deploy Your Own Instance:**

```bash
# 1. Clone
git clone https://github.com/realriplab/Openclaw-Dasboard.git
cd Openclaw-Dasboard

# 2. Deploy Worker
cd worker
npm install -g wrangler
wrangler login
wrangler deploy

# 3. Configure CI/CD
# Add CLOUDFLARE_API_TOKEN to GitHub Secrets
```

## Project Structure

```
.
├── .github/workflows/      # GitHub Actions CI/CD
│   └── deploy.yml
├── worker/                 # Cloudflare Worker (Edge API)
│   ├── src/
│   │   ├── index.ts
│   │   ├── durable-objects/
│   │   │   └── AgentState.ts    # Real-time state management
│   │   └── types.ts
│   ├── wrangler.toml
│   └── package.json
├── local-bridge/           # Local agent status pusher
│   └── bridge.py
├── web/                    # Astro frontend (WIP)
└── test-sse.html           # SSE connection test page
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Edge API** | Cloudflare Workers + Durable Objects |
| **Real-time** | Server-Sent Events (SSE) |
| **Local Bridge** | Python + aiohttp |
| **Frontend** | Tailwind CSS + Canvas (Astro 6 planned) |
| **CI/CD** | GitHub Actions |
| **Domain** | Cloudflare (realrip.com) |

## Configuration

### GitHub Actions Setup

1. Visit: `https://github.com/realriplab/Openclaw-Dasboard/settings/secrets/actions`
2. Add **New repository secret**:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Your Cloudflare API Token

**Create Cloudflare Token:**
1. https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → **Custom token**
3. Permissions:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read (your domain)

## Roadmap

- [x] Core Worker + Durable Object infrastructure
- [x] SSE real-time streaming
- [x] Local bridge agent detection
- [x] Custom domain deployment
- [x] GitHub Actions CI/CD
- [x] English internationalization
- [ ] Astro frontend dashboard
- [ ] Cloudflare Access authentication
- [ ] Multi-team/tenant support
- [ ] Historical data analytics

## License

MIT © Openclaw Project
