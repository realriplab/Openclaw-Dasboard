# Openclaw Dashboard

AI Agent 实时状态仪表盘 - 多租户 SaaS 解决方案

## 架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   本地机器       │────▶│  Cloudflare      │◀────│   浏览器客户端   │
│  (Agent 状态)   │     │  Worker + DO     │     │  (实时仪表盘)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
       bridge.py              Durable Object           SSE Stream
```

## 在线地址

- **仪表盘**: `https://openclaw.realrip.com`
- **API 端点**: `https://openclaw.realrip.com/api/agents/:teamId`
- **SSE 流**: `https://openclaw.realrip.com/api/sse/:teamId`

## 快速开始

### 1. 本地推送桥

```bash
cd local-bridge
pip install aiohttp
export WORKER_URL="https://openclaw.realrip.com"
export API_TOKEN="your-token"
python3 bridge.py
```

### 2. Worker 部署

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler deploy
```

## 项目结构

```
.
├── worker/              # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts
│   │   ├── durable-objects/AgentState.ts
│   │   └── types.ts
│   ├── wrangler.toml
│   └── package.json
├── local-bridge/        # 本地状态推送
│   └── bridge.py
├── web/                 # Astro 前端 (待开发)
└── test-sse.html        # SSE 测试页面
```

## 技术栈

- **后端**: Cloudflare Workers + Durable Objects
- **实时通信**: Server-Sent Events (SSE)
- **本地桥接**: Python + aiohttp
- **前端**: Tailwind CSS + Canvas (Astro 6 开发中)

## License

MIT
