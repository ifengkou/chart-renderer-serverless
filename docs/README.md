# Chart Renderer Worker Docs

`chart-renderer` is now a Cloudflare Worker chart artifact service.

The current service does not generate PNG on the server. It validates chart payloads, returns `config`/`svg`/`html`, caches artifacts with the Workers Cache API, and provides `/viewer` for browser-side rendering and downloads.

## 文档索引

- Agent 调用 API 文档：`docs/api.md`
- Agent 接手说明：`docs/agent-handoff.md`
- CHART-002 Cloudflare Worker Serverless 改造计划：`docs/serverless-implementation-plan.md`
- CHART-001 历史 Node SSR 计划：`docs/implementation-plan.md`
- 独立迁出检查清单：`docs/standalone-readiness.md`

## 当前状态

状态：CHART-002 Worker 路径为当前默认能力；CHART-001 Node PNG SSR 已隔离到 `legacy/node-ssr/`。

已完成：

- `src/worker.js` 提供 Cloudflare Worker 入口。
- `GET /health` 返回 Worker runtime metadata。
- `GET /viewer` 由 Worker 直接返回浏览器 viewer。
- `POST /render` 支持 `response_format=config`。
- 简单图表支持 Worker SVG：`line`、`bar`、`column`、`pie`、`summary`。
- 复杂图表支持 HTML shell，由浏览器端 `@antv/gpt-vis@0.6.1` 渲染。
- 浏览器 viewer 支持下载 JSON config、SVG 和 PNG。
- `response_format=png` 和 `Accept: image/png` 在 Worker 中返回明确的 `422 unsupported_response_format`。
- Cache API 使用 stable hash，返回 `ETag`、`X-Chart-Hash`、`X-Chart-Cache`。
- R2 仅作为后续可选升级记录在工程文档中，当前不实现。
- Node SSR、Dockerfile、docker-compose 已隔离到 `legacy/node-ssr/`。
- 根依赖已移除 `canvas` 和 `@antv/gpt-vis-ssr`，全量安装不再编译 native canvas。

## 实现入口

| 文件 | 作用 |
| --- | --- |
| `src/worker.js` | Worker request handler、payload 校验、hash、Cache API、路由。 |
| `src/renderers/html-shell.js` | `/viewer` 和复杂图表 HTML shell；浏览器端 GPT-Vis 渲染和下载。 |
| `src/renderers/svg.js` | Worker 内简单 SVG renderer。 |
| `wrangler.toml` | Cloudflare Worker 配置。 |
| `legacy/node-ssr/` | 历史 Node PNG SSR 实现，仅保留作参考。 |

## 本地运行

```bash
npm install
npm run dev
```

健康检查：

```bash
curl -s http://127.0.0.1:8787/health
```

SVG 示例：

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{"type":"line","response_format":"svg","width":900,"height":520,"data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}],"title":"Smoke test"}'
```

PNG legacy 错误示例：

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{"type":"line","response_format":"png","data":[{"time":"2026-05-01","value":1.12}]}'
```

## 验证

```bash
npm run html:smoke
npm run svg:smoke
npm run deploy -- --dry-run
```

## 发布

```bash
npx wrangler login
npm run deploy
```

发布配置来自根目录 `wrangler.toml`。
