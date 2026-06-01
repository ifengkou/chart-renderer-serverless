# Chart Renderer Worker

Cloudflare Worker chart artifact service.

The active runtime is serverless. It does not render PNG on the server and does not install native `canvas` dependencies. The Worker returns normalized config, simple SVG, or an HTML shell for browser-side GPT-Vis rendering. PNG download is handled in the browser viewer.

## Docs

- Implementation, configuration, usage, and current status: `docs/README.md`
- Agent-facing API reference: `docs/api.md`
- OpenAPI schema for Cloudflare API Shield: `docs/openapi.yaml`
- Agent handoff and implementation map: `docs/agent-handoff.md`
- CHART-002 Cloudflare Worker serverless migration plan: `docs/serverless-implementation-plan.md`
- Legacy CHART-001 Node SSR plan: `docs/implementation-plan.md`
- Standalone migration notes: `docs/standalone-readiness.md`

## Commands

```bash
npm install
npm run dev
npm run html:smoke
npm run svg:smoke
npm run deploy -- --dry-run
```

Publish to Cloudflare after login:

```bash
npx wrangler login
npm run deploy
```

## API

- `GET /health`: Worker health and runtime metadata.
- `GET /viewer`: browser viewer for editing payloads, rendering charts, and downloading JSON/SVG/PNG.
- `GET /api`: published API documentation page. `GET /docs/api` is an alias.
- `GET /logo.svg`, `GET /favicon.svg`: built-in brand assets.
- `POST /render`: returns `config`, `svg`, or `html`.

Example:

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{"type":"line","response_format":"svg","width":900,"height":520,"data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}],"title":"Smoke test"}'
```

`response_format: "png"` and `Accept: image/png` return `422 unsupported_response_format` in the Worker.

## Legacy

The historical Node.js PNG SSR implementation has been isolated under `legacy/node-ssr/` for reference. It is not part of the root install, root scripts, or Worker bundle.
