# Openclaw Dashboard

Real-time AI Agent status dashboard - Multi-tenant SaaS solution

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Local Machine  │────▶│  Cloudflare      │◀────│  Browser Client │
│  (Agent Status) │     │  Worker + DO     │     │  (Live Dashboard)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
       bridge.py              Durable Object           SSE Stream
```

## Live URL

- **Dashboard**: `https://openclaw.realrip.com`
- **API Endpoint**: `https://openclaw.realrip.com/api/agents/:teamId`
- **SSE Stream**: `https://openclaw.realrip.com/api/sse/:teamId`

## Quick Start

### 1. Local Bridge

```bash
cd local-bridge
pip install aiohttp
export WORKER_URL="https://openclaw.realrip.com"
export API_TOKEN="your-token"
python3 bridge.py
```

### 2. Worker Deployment (Auto CI/CD)

GitHub Actions configured. Push to `main` branch auto-deploys:

```bash
git push origin main
```

**Setup GitHub Secrets:**

1. Visit: `https://github.com/realriplab/Openclaw-Dasboard/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: [Your Cloudflare API Token]

**Create Token:**
1. https://dash.cloudflare.com/profile/api-tokens
2. Create Token → Custom token
3. Permissions:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read (select realrip.com)

### 3. Manual Deployment (Backup)

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler deploy
```

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions CI/CD
├── worker/                   # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts
│   │   ├── durable-objects/AgentState.ts
│   │   └── types.ts
│   ├── wrangler.toml
│   └── package.json
├── local-bridge/             # Local status pusher
│   └── bridge.py
├── web/                      # Astro frontend (WIP)
└── test-sse.html             # SSE test page
```

## Tech Stack

- **Backend**: Cloudflare Workers + Durable Objects
- **Real-time**: Server-Sent Events (SSE)
- **Local Bridge**: Python + aiohttp
- **Frontend**: Tailwind CSS + Canvas (Astro 6 WIP)
- **CI/CD**: GitHub Actions

## License

MIT
