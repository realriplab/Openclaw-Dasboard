# Local Development Guide

## Quick Start

### 1. Start Frontend (Terminal 1)

```bash
cd web
pnpm install
pnpm dev
```

Frontend will be available at: `http://localhost:4321`

### 2. Start Bridge (Terminal 2)

```bash
cd local-bridge
python3 bridge.py
```

Or use the smart version:
```bash
python3 bridge-smart.py
```

### 3. Mock Data (Optional)

If you don't have OpenClaw running, you can use the mock bridge:

```bash
cd local-bridge
python3 mock-bridge.py
```

## Environment Variables

Create a `.env` file in `local-bridge/`:

```bash
WORKER_URL=http://localhost:8787  # For local Worker dev
# Or use production Worker:
# WORKER_URL=https://your-worker.workers.dev

API_TOKEN=your-token
TEAM_ID=default
```

## Testing Canvas Locally

The Canvas visualization uses a fixed 1200x700 design resolution. It will:
- Scale to fit the container width
- Maintain aspect ratio
- Handle Retina displays automatically

## Troubleshooting

### Canvas not rendering
1. Check browser console for errors
2. Verify `office.resize()` is called on init
3. Check container has proper dimensions

### SSE not connecting
1. Verify Worker URL is correct
2. Check team ID matches in URL and bridge
3. Open browser dev tools → Network → WS/SSE tab

### Bridge not pushing
1. Check `WORKER_URL` environment variable
2. Verify API token is set
3. Check bridge logs for errors
