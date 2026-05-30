# Agent Handoff

This document is for agents taking over this repository. It summarizes the current serverless implementation, the important entry points, and the traps that have already been debugged.

## Current Direction

The active product direction is CHART-002: Cloudflare Worker serverless chart artifacts.

The Worker does not generate PNG on the server. It returns one of:

- `config`: normalized chart JSON for client rendering.
- `svg`: Worker-generated SVG for simple charts.
- `html`: browser shell for complex charts rendered with GPT-Vis.

PNG export is a browser-side viewer feature. The legacy Node.js PNG SSR path has been isolated under `legacy/node-ssr/` and is not part of the active root install or Worker bundle.

## Main Commands

```bash
npm run dev
npm run html:smoke
npm run svg:smoke
npm run deploy -- --dry-run
npm run deploy
```

`npm run dev` starts Wrangler. The port may be `8787` or the next free port if one is already occupied.

Wrangler may print an EPERM warning when writing logs under `~/Library/Preferences/.wrangler/logs`. In this local sandbox that has not blocked dry-run builds.

## Runtime Entry Points

| Area | File | Purpose |
| --- | --- | --- |
| Worker entry | `src/worker.js` | Handles `/health`, `/viewer`, `/render`, validation, stable hash, Cache API. |
| HTML shell and viewer | `src/renderers/html-shell.js` | Builds `/viewer` and `response_format=html`; loads GPT-Vis browser UMD; handles Apply, client rendering, downloads. |
| Simple SVG renderers | `src/renderers/svg.js` | Worker-side SVG for `line`, `bar`, `column`, `pie`, `summary`. |
| Worker config | `wrangler.toml` | Worker name, main module, compatibility date, vars. |
| HTML smoke | `src/html-smoke.js` | Structural checks for generated HTML/viewer shell. |
| SVG smoke | `src/svg-smoke.js` | Structural checks for simple SVG renderers. |
| Legacy Node SSR | `legacy/node-ssr/` | Old PNG SSR service; archived for reference only. |

## Worker Request Flow

`src/worker.js` exports the Cloudflare Worker `fetch` handler.

Flow for `POST /render`:

1. `readJsonBody()` enforces `MAX_BODY_BYTES` and parses JSON.
2. `validatePayload()` checks `type`, `data` or `liquid.percent`, `theme`, `width`, `height`, `options`, and `response_format`.
3. `buildConfigPayload()` normalizes the chart object.
4. `hashPayload()` hashes a stable-stringified normalized chart.
5. `buildCacheRequest()` builds a Cache API key using `CACHE_NAMESPACE`, format, and hash.
6. Cache hit returns the cached response with `X-Chart-Cache: hit`.
7. Cache miss returns:
   - `renderSvg(chart)` for simple `response_format=svg`.
   - `renderChartHtml(chart, hash)` for `response_format=html`.
   - normalized config JSON for default `response_format=config`.

Important current constants:

- `CACHE_NAMESPACE = "worker-v16"` in `src/worker.js`.
- `CACHE_BUSTER = "viewer-v16"` in `src/renderers/html-shell.js`.
- GPT-Vis browser version is fixed to `@antv/gpt-vis@0.6.1`.
- Root `package.json` intentionally has no `canvas` or `@antv/gpt-vis-ssr` dependency.

Do not change these casually. Bump them when cached HTML or response semantics change.

## Payload Contract

Core payload fields:

- `type`: required chart type string.
- `data`: required non-empty array for most chart types.
- `title`: optional string.
- `width`: integer `100..4096`, default `900`.
- `height`: integer `100..4096`, default `520`.
- `theme`: `default`, `dark`, or `academy`; `light` normalizes to `default`.
- `options`: optional object.
- `response_format`: `config`, `svg`, or `html`.

`response_format=png` and `Accept: image/png` intentionally return `422 unsupported_response_format` in the Worker.

`width` and `height` mean chart artifact size and download size. The viewer container must follow the chart size; it must not become the source of truth for scaling the chart.

## Viewer Implementation Logic

The viewer is built entirely in `src/renderers/html-shell.js`.

High-level flow:

1. `/viewer` returns `renderViewerHtml()`.
2. Initial payload is written to `#payload-input`.
3. Viewer starts by calling `renderPayload("config")`.
4. Config response is rendered in-browser by `renderGptVis(data.chart)`.
5. `Apply` copies Theme/W/H controls into the payload and rerenders.

Apply behavior:

- Theme/W/H do not auto-render on change.
- `Apply` triggers rerender.
- Pressing Enter in W/H also triggers Apply.
- Payload textarea does not rerender on blur.

GPT-Vis rendering path:

- Uses React 18 UMD and `@antv/gpt-vis@0.6.1` UMD.
- Uses `GPTVisLite + withChartCode` with a `vis-chart` markdown block.
- `renderGptVis()` unmounts the previous React root before rendering a new chart. This is important because GPT-Vis/G2 can otherwise retain stale measurement state.
- `toGptVisChart()` injects:
  - `width`
  - `height`
  - `autoFit: false`
  - `containerStyle: { width, height }`
  - matching `options.width`, `options.height`, `options.autoFit`, `options.containerStyle`

Sizing rules:

- `prepareChartFrame()` sets CSS variables:
  - `--chart-width`
  - `--chart-frame-height`
  - `--chart-inner-height`
- `--chart-inner-height` must use the exact chart height. Do not reintroduce `Math.max(520, height)` here; that caused user-entered `height: 320` to still render as `520px`.
- The preview shell may keep a larger minimum height for usability, but GPT-Vis chart wrappers and canvas must follow the chart height.
- The code avoids post-render canvas stretching. Do not set `canvas.style.width/height` manually as a fix; that previously caused distorted charts.

Tab resize logic:

- GPT-Vis has internal `图表` / `代码` tabs.
- When switching back to chart, the viewer dispatches resize events so G2 recalculates against the current wrapper size.

Download logic:

- JSON downloads the current normalized config.
- SVG first serializes an existing SVG if available.
- For complex canvas charts, SVG export wraps the canvas image in an SVG sized to payload `width/height`.
- PNG export uses a real chart canvas when possible, but resamples to payload `width/height` so browser device pixel ratio does not leak into output dimensions.

## Simple SVG Implementation

`src/renderers/svg.js` renders simple charts directly in the Worker:

- `line`
- `bar`
- `column`
- `pie`
- `summary`

It escapes XML text and uses the normalized `width`, `height`, and `theme`. Add new simple chart types here only when they can be implemented without canvas, DOM, or server-side image rendering.

## Cache API

Cache is implemented in `src/worker.js` using `caches.default`.

Key behavior:

- Hash input is the normalized chart object, not raw request body.
- `stableStringify()` sorts object keys, so equivalent payloads with different field order hash the same.
- Cache key path includes `CACHE_NAMESPACE`, `format`, and hash.
- Responses include:
  - `ETag`
  - `X-Chart-Hash`
  - `X-Chart-Cache`
  - `X-Chart-Type`
  - `X-Chart-Renderer`

When changing response body semantics or viewer HTML behavior, bump `CACHE_NAMESPACE` and `CACHE_BUSTER`.

R2 is intentionally not implemented. The optional upgrade is documented in Phase 5 of `docs/serverless-implementation-plan.md`.

If a future agent implements R2, keep Cache API as the first read layer, use the stable chart hash as the artifact identity, add an explicit R2 binding in `wrangler.toml`, and introduce storage-specific tests. Do not add R2 code as part of Cache API-only fixes.

## Known Decisions

- Keep GPT-Vis fixed at `0.6.1`.
- Do not use `latest` from CDN. Version drift would change runtime behavior without a deploy.
- Do not upgrade to GPT-Vis `1.0.0` without a dedicated adapter. Prior research found it is not a drop-in replacement for the current UMD/global API path.
- Production auth is delegated to an upstream API gateway, not the Worker.
- Do not server-render PNG in Worker unless a separate WASM renderer is introduced with strict complexity control.

## Common Verification

Smoke:

```bash
npm run html:smoke
npm run svg:smoke
npm run deploy -- --dry-run
```

Cache regression example:

```bash
curl -s -D /tmp/cache-a.headers -o /tmp/cache-a.json \
  -X POST http://127.0.0.1:8787/render \
  -H 'Content-Type: application/json' \
  -d '{"type":"line","response_format":"config","theme":"dark","width":960,"height":720,"title":"Cache check","data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}],"options":{"axisYTitle":"Price","axisXTitle":"Date"}}'

curl -s -D /tmp/cache-b.headers -o /tmp/cache-b.json \
  -X POST http://127.0.0.1:8787/render \
  -H 'Content-Type: application/json' \
  -d '{"options":{"axisXTitle":"Date","axisYTitle":"Price"},"data":[{"value":1.12,"time":"2026-05-01"},{"value":1.18,"time":"2026-05-02"}],"title":"Cache check","height":720,"width":960,"theme":"dark","response_format":"config","type":"line"}'

rg -i "^HTTP/|^ETag:|^X-Chart-Hash:|^X-Chart-Cache:" /tmp/cache-a.headers /tmp/cache-b.headers
```

Expected: first request `miss`, second request `hit`, same `X-Chart-Hash`.

Viewer checks:

- `/viewer` loads and renders the default radar chart.
- Changing W/H and clicking Apply changes payload and chart canvas CSS size.
- `height: 320` must produce canvas CSS height near `320px`, not `520px`.
- Switching GPT-Vis internal `代码` then `图表` should not shrink the chart.
- SVG and PNG download buttons should show `Downloaded SVG` and `Downloaded PNG`.

## Important Pitfalls

- Do not fix sizing by mutating `canvas.style.width` or `canvas.style.height` after GPT-Vis renders. That caused internal pixel size and CSS size to diverge and visually distort charts.
- Do not add a minimum chart inner height of `520px`. The preview container may have a minimum height, but the chart itself must honor payload height.
- Do not make Theme/W/H auto-apply on blur or change unless the user explicitly asks. Current UX is Apply-only.
- Browser automation may behave poorly with number inputs in this environment. If UI typing appends instead of replacing, verify via actual DOM/canvas metrics and avoid misdiagnosing the app.
- `.wrangler/state/...sqlite` changes during local Cache API tests. This is Miniflare local cache state.

## Release Notes For Next Agent

Before handing off or deploying after viewer changes:

1. Bump cache constants if HTML shell behavior changed.
2. Run `npm run html:smoke`.
3. Run `npm run svg:smoke`.
4. Run `npm run deploy -- --dry-run`.
5. Manually or via browser verify `/viewer` dimensions and downloads.
6. If publishing to Cloudflare, run `npm run deploy` after `npx wrangler login`.
