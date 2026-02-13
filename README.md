# Openclaw Dashboard

Real-time visualization dashboard for OpenClaw multi-agent systems. Monitor your AI agents' status and progress from anywhere - local or remote.

![Dashboard Preview](https://openclaw-dashboard-85d.pages.dev/preview.png)

## ✨ Features

- **🔴 Real-time Monitoring**: Live agent status updates via Server-Sent Events (SSE)
- **🏢 Office Visualization**: Interactive Canvas-based office floor plan
- **📊 Agent Details**: Click any agent to view workspace and statistics
- **📈 History Tracking**: D1 database stores 30 days of agent activity
- **🔐 Access Control**: Cloudflare Access protects your dashboard
- **📱 Responsive**: Works on desktop, tablet, and mobile

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Mac (Local)                         │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  OpenClaw       │───▶│  Bridge (Python)                    │ │
│  │  (6 Agents)     │    │  - Detects agent activity           │ │
│  └─────────────────┘    │  - Pushes to Cloudflare every 5s    │ │
│                         └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge (Global)                     │
│  ┌──────────────────┐    ┌────────────────────────────────────┐ │
│  │  Worker + DO     │◀───│  D1 Database                       │ │
│  │  - REST API      │    │  - Agent history (30 days)         │ │
│  │  - SSE Stream    │    │  - Statistics                      │ │
│  └──────────────────┘    └────────────────────────────────────┘ │
│           ▲                                                     │
│           │                                                      │
│  ┌──────────────────┐                                            │
│  │  Pages (Astro)   │                                            │
│  │  - Dashboard UI  │                                            │
│  │  - Canvas Viz    │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Browser
┌─────────────────────────────────────────────────────────────────┐
│                     You (Any Device)                            │
│         https://dashboard.openclaw.realrip.com                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### For OpenClaw Users

Just want to monitor your agents?

1. **Install the bridge service** (one-time setup):
```bash
cd ~/.openclaw/workspace-coder/ai-office-saas/local-bridge
./install-service.sh
```

2. **Access your dashboard**:
```
https://dashboard.openclaw.realrip.com
```

3. **Login with PIN**:
   - Enter your email: `your-email@example.com`
   - Check inbox for 6-digit PIN
   - Enter PIN to access dashboard

### For Developers

Want to deploy your own instance?

#### Prerequisites

- Cloudflare account
- GitHub account
- Node.js 20+
- Python 3.9+

#### 1. Clone & Setup

```bash
git clone https://github.com/realriplab/Openclaw-Dasboard.git
cd Openclaw-Dasboard
```

#### 2. Deploy Cloudflare Worker

```bash
cd worker
npm install -g wrangler
wrangler login

# Create D1 database
wrangler d1 create openclaw-history

# Copy database ID to wrangler.toml
# Edit: database_id = "your-database-id"

# Deploy
wrangler deploy
```

#### 3. Setup GitHub Secrets

1. Go to: `https://github.com/YOUR_USERNAME/Openclaw-Dasboard/settings/secrets/actions`
2. Add secret: `CLOUDFLARE_API_TOKEN`
   - Get token from: https://dash.cloudflare.com/profile/api-tokens
   - Permissions: `Cloudflare Workers:Edit`, `Zone:Read`

#### 4. Deploy Frontend

Push to GitHub triggers automatic deployment:
```bash
git push origin main
```

Or manual deploy:
```bash
cd web
npm install
npm run build
npx wrangler pages deploy dist
```

#### 5. Configure Cloudflare Access

1. Go to: https://dash.cloudflare.com → Zero Trust → Access → Applications
2. Add Application → Self-hosted
3. Domain: `dashboard.YOUR_DOMAIN.com`
4. Identity: One-time PIN
5. Policy: Allow your email

#### 6. Start Local Bridge

```bash
cd local-bridge
pip install aiohttp
export WORKER_URL="https://your-worker.your-account.workers.dev"
python3 bridge.py
```

## 📖 Usage

### Dashboard Interface

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Openclaw Dashboard              Active: 3/6    ● Live   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────┐  │
│  │                          │  │  [Coder]    ● Working   │  │
│  │   🏢 Office Floor Plan   │  │  [Writer]   ○ Idle      │  │
│  │                          │  │  [Founder]  ● Working   │  │
│  │   ┌───┐ ┌───┐ ┌───┐     │  │  [Investor] ○ Idle      │  │
│  │   │ C │ │ W │ │ F │     │  │  [Coach]    ● Working   │  │
│  │   └───┘ └───┘ └───┘     │  │  [Main]     ○ Idle      │  │
│  │                          │  └─────────────────────────┘  │
│  │   ┌───┐ ┌───┐ ┌───┐     │                               │
│  │   │ I │ │Co │ │ M │     │                               │
│  │   └───┘ └───┘ └───┘     │                               │
│  │                          │                               │
│  └──────────────────────────┘                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Agent Card States

| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | **Working** | Agent has active session (last 2 min) |
| ⚪ | **Idle** | No recent activity |

### Click Agent for Details

Click any agent card to see:
- Agent name & role
- Current status
- Workspace path
- Activity statistics (coming soon)

## 🔌 API Reference

### Real-time Stream
```
GET /api/sse/:teamId
```
Server-Sent Events for live updates.

### Get Current Status
```bash
curl https://your-worker.workers.dev/api/agents/yunhe-core
```

Response:
```json
{
  "teamId": "yunhe-core",
  "agents": [
    {
      "id": "coder",
      "name": "Coder",
      "status": "working",
      "color": "#3498db",
      "role": "Engineering",
      "lastSeen": "2026-02-13T05:00:00Z"
    }
  ],
  "timestamp": "2026-02-13T05:00:00Z"
}
```

### Report Status (Bridge)
```bash
curl -X POST https://your-worker.workers.dev/api/report/yunhe-core \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agents": [...], "timestamp": "..."}'
```

### Get History
```bash
# Last 24 hours
curl https://your-worker.workers.dev/api/history/yunhe-core

# Agent stats (7 days)
curl https://your-worker.workers.dev/api/history/yunhe-core/coder?days=7
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKER_URL` | - | Cloudflare Worker URL |
| `API_TOKEN` | - | Authentication token |
| `TEAM_ID` | `yunhe-core` | Team identifier |
| `PUSH_INTERVAL` | `5` | Seconds between pushes |

### wrangler.toml

```toml
name = "openclaw-dashboard"
main = "src/index.ts"
compatibility_date = "2025-02-13"

[[d1_databases]]
binding = "DB"
database_name = "openclaw-history"
database_id = "your-database-id"

[[durable_objects.bindings]]
name = "AGENT_STATE"
class_name = "AgentState"
```

## 🛠️ Development

### Local Development

```bash
# Start frontend dev server
cd web
npm install
npm run dev

# In another terminal, start bridge
cd local-bridge
python3 bridge.py
```

### Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── deploy.yml           # Deploy Worker
│       └── deploy-frontend.yml  # Deploy Pages
├── worker/                       # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts             # Main entry
│   │   ├── lib/
│   │   │   └── HistoryDB.ts     # D1 database
│   │   └── durable-objects/
│   │       └── AgentState.ts    # DO state
│   └── wrangler.toml
├── web/                          # Astro Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── index.astro      # Dashboard
│   │   ├── components/
│   │   │   └── AgentModal.astro # Detail panel
│   │   └── lib/
│   │       └── OfficeVisualization.js
│   └── astro.config.mjs
└── local-bridge/                 # Python bridge
    ├── bridge.py                 # Original
    ├── bridge-smart.py          # Auto-detect version
    └── install-service.sh       # macOS service installer
```

## 📊 Monitoring & Logs

### Bridge Logs
```bash
# Real-time log
tail -f /tmp/openclaw-bridge.log

# Error log
tail -f /tmp/openclaw-bridge.error.log
```

### Service Management
```bash
# Check status
launchctl list | grep openclaw

# Stop service
launchctl stop com.openclaw.dashboard.bridge

# Start service
launchctl start com.openclaw.dashboard.bridge

# Uninstall
launchctl unload ~/Library/LaunchAgents/com.openclaw.dashboard.bridge.plist
rm ~/Library/LaunchAgents/com.openclaw.dashboard.bridge.plist
```

## 🔒 Security

- **Cloudflare Access**: All routes protected by email PIN
- **API Token**: Required for bridge to push data
- **D1 Database**: Encrypted at rest
- **No PII**: Only stores agent status, no personal data

## 🐛 Troubleshooting

### Bridge not pushing data
```bash
# Check if OpenClaw is running
lsof -i :18789

# Check bridge logs
tail /tmp/openclaw-bridge.log

# Restart bridge
launchctl stop com.openclaw.dashboard.bridge
launchctl start com.openclaw.dashboard.bridge
```

### Dashboard not updating
1. Check Worker URL in browser console
2. Verify Access authentication
3. Check SSE connection in Network tab

### Access denied
1. Clear browser cookies
2. Re-authenticate with email PIN
3. Check Access policy includes your email

## 📈 Roadmap

- [x] Core dashboard with real-time updates
- [x] Office visualization
- [x] Agent detail panel
- [x] D1 database for history
- [x] Cloudflare Access protection
- [x] GitHub Actions CI/CD
- [x] Smart bridge with auto-detection
- [ ] History charts & graphs
- [ ] Offline notifications
- [ ] Multi-team support
- [ ] Mobile app

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing`
5. Open Pull Request

## 📄 License

MIT © Openclaw Project

## 🙏 Credits

- [Astro](https://astro.build/) - Web framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge computing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [OpenClaw](https://github.com/openclaw/openclaw) - Multi-agent system

---

**Questions?** Open an issue or contact: realriplab@gmail.com
