# Chart Renderer Service

Private GPT-Vis SSR renderer for chart generation.

This service is intentionally standalone. It does not import or read files from
an outer `app/` directory, does not use `agent-model-configs`, and can be run
from this directory with its own environment file.

## Docs

- Implementation, configuration, usage, and current status: `docs/README.md`
- Agent-facing API reference: `docs/api.md`
- CHART-001 implementation plan: `docs/implementation-plan.md`
- CHART-002 Cloudflare Worker serverless migration plan: `docs/serverless-implementation-plan.md`
- Standalone migration checklist: `docs/standalone-readiness.md`

## Configuration

```bash
cp .env.example .env
```

| Variable | Default | Description |
| --- | --- | --- |
| `CHART_RENDERER_HOST` | `0.0.0.0` | HTTP bind host. |
| `CHART_RENDERER_PORT` | `8787` | HTTP bind port. |
| `CHART_RENDERER_MAX_BODY_BYTES` | `1000000` | Maximum JSON request body size. |

## API

- `GET /health`: returns service and dependency metadata.
- `POST /render`: renders a chart payload with `@antv/gpt-vis-ssr`.

Default response is JSON with `image_base64` and renderer metadata. Set
`response_format: "png"` in the request body or send `Accept: image/png` to
receive a PNG binary response.

Supported themes are `default`, `dark`, and `academy`. Common supported chart
types include `line`, `bar`, `column`, `pie`, `area`, `waterfall`,
`word-cloud`, `liquid`, `radar`, `table`, and `summary`.

## Smoke Test

```bash
npm ci
npm run smoke
npm audit --omit=dev
npm start
```

To load `.env` in local development:

```bash
npm run start:env
```

To run as a standalone Docker Compose service:

```bash
cp .env.example .env
docker compose up --build
```

```bash
curl -s http://127.0.0.1:8787/health
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{"type":"line","width":900,"height":520,"data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}],"title":"Smoke test"}'
```
