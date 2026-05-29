# Standalone Readiness

本文档用于检查当前 `chart-renderer` Worker 是否可以作为独立 Cloudflare Workers 项目发布。

历史 Node PNG SSR 独立服务已隔离到 `legacy/node-ssr/`，不再是当前默认部署形态。

## 当前需要保留的文件

运行与发布：

- `package.json`
- `package-lock.json`
- `wrangler.toml`
- `.env.example`

Worker 入口：

- `src/worker.js`
- `src/renderers/html-shell.js`
- `src/renderers/svg.js`
- `src/html-smoke.js`
- `src/svg-smoke.js`

文档：

- `README.md`
- `docs/README.md`
- `docs/api.md`
- `docs/agent-handoff.md`
- `docs/serverless-implementation-plan.md`
- `docs/standalone-readiness.md`

历史参考：

- `legacy/node-ssr/`

## 不属于当前 Worker 发布路径

- 根目录不再保留 `Dockerfile` 或 `docker-compose.yml`。
- 根依赖不再包含 `canvas`。
- 根依赖不再包含 `@antv/gpt-vis-ssr`。
- 根 npm scripts 不再提供 Node SSR `start`、`start:env` 或 PNG `smoke`。

## 当前配置

`wrangler.toml` 是发布入口：

```toml
name = "chart-renderer"
main = "src/worker.js"
compatibility_date = "2026-05-28"
```

`MAX_BODY_BYTES` 控制 Worker `POST /render` 最大 JSON body 字节数。

## 独立运行检查

```bash
npm install
npm run html:smoke
npm run svg:smoke
npm run deploy -- --dry-run
npm run dev
```

健康检查：

```bash
curl -s http://127.0.0.1:8787/health
```

SVG 输出：

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{"type":"line","response_format":"svg","width":900,"height":520,"data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}],"title":"Smoke test"}'
```

PNG legacy 错误：

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{"type":"line","response_format":"png","data":[{"time":"2026-05-01","value":1.12}]}'
```

## 发布

```bash
npx wrangler login
npm run deploy
```

生产鉴权仍由上游 API gateway 负责，当前 Worker 内只做 payload 校验、大小限制、错误处理和缓存。
