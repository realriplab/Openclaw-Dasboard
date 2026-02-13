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

### 2. Worker 部署（自动 CI/CD）

已配置 GitHub Actions，推送 `main` 分支自动部署：

```bash
git push origin main
```

**设置 GitHub Secrets：**

1. 访问: `https://github.com/realriplab/Openclaw-Dasboard/settings/secrets/actions`
2. 点击 **New repository secret**
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: [你的 Cloudflare API Token]

**创建 Token 步骤：**
1. https://dash.cloudflare.com/profile/api-tokens
2. Create Token → Custom token
3. 权限:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read (选 realrip.com)

### 3. 手动部署（备用）

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler deploy
```

## 项目结构

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions CI/CD
├── worker/                # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts
│   │   ├── durable-objects/AgentState.ts
│   │   └── types.ts
│   ├── wrangler.toml
│   └── package.json
├── local-bridge/          # 本地状态推送
│   └── bridge.py
├── web/                   # Astro 前端 (待开发)
└── test-sse.html          # SSE 测试页面
```

## 技术栈

- **后端**: Cloudflare Workers + Durable Objects
- **实时通信**: Server-Sent Events (SSE)
- **本地桥接**: Python + aiohttp
- **前端**: Tailwind CSS + Canvas (Astro 6 开发中)
- **CI/CD**: GitHub Actions

## License

MIT
