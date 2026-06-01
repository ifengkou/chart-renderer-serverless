# Chart Viewer Redesign V2

第二版遵循 `/Users/sloong/Workspace/.agents/skills/frontend-design` 的方向：选择明确且更有记忆点的美学路线，而不是普通后台表单。

配套预览：[`viewer-design-preview-v2.html`](./viewer-design-preview-v2.html)。

## Concept

**Industrial blueprint workbench**

`/viewer` 是图表产物的校准台。它不是传统 dashboard，也不是 marketing UI。V2 把它设计成一块“工程制图桌”：左侧像参数仪表与 JSON 控制台，右侧像被放在测量网格上的 chart artifact。

记忆点：

- 右侧 preview stage 使用淡蓝工程网格和坐标标尺，强调 chart artifact 的尺寸语义。
- 左侧 request/parameters/payload 像仪器面板，区块紧凑但层级清晰。
- 色彩是冷静的 graphite + blueprint blue + signal green，而不是普通 SaaS 蓝白表格。

## Product Fit

这个方向贴合项目定位：

- Worker 不生成 PNG，viewer 是浏览器端渲染和导出工作台。
- 宽高是 artifact contract，因此界面应强调 measurement、viewport、scroll。
- 用户是开发者、agent、上游服务调试者，需要精密而稳定的工具，而不是说明型页面。

## Layout

Desktop:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ CR / chart-renderer             rendered • worker       JSON SVG PNG │
├──────────────────────┬───────────────────────────────────────────────┤
│ REQUEST              │ artifact: Risk profile      900 x 520 / HTML  │
│ [CONFIG][SVG][HTML]  ├───────────────────────────────────────────────┤
│ PARAMETERS           │ blueprint viewport                            │
│ Theme                │ ┌───────────────────────────────────────────┐ │
│ Size                 │ │ measured chart artifact                   │ │
│ [Apply changes]      │ └───────────────────────────────────────────┘ │
│ PAYLOAD              │                                               │
│ JSON editor          │                                               │
│ RESPONSE             │                                               │
└──────────────────────┴───────────────────────────────────────────────┘
```

Mobile:

- Header wraps.
- Inspector stacks above preview.
- Preview keeps visible measurement rail and chart viewport.

## Visual System

V2 intentionally avoids generic white SaaS styling. It uses a technical drafting palette.

| Token | Value | Purpose |
| --- | --- | --- |
| `--ink` | `#111827` | Primary text |
| `--slate` | `#344054` | Secondary text |
| `--paper` | `#f7f9fc` | App background |
| `--panel` | `#ffffff` | Main panels |
| `--blueprint` | `#e8f1ff` | Preview blueprint grid |
| `--rule` | `#c9d6e6` | Borders and rulers |
| `--rule-dark` | `#9fb0c4` | Strong separators |
| `--signal` | `#0f9f6e` | Success/rendered |
| `--accent` | `#175cd3` | Active request mode |
| `--amber` | `#b54708` | Cache miss/warning |

Typography:

- Prefer `Aptos`, `Avenir Next`, or `ui-sans-serif` fallback for product UI.
- Use `IBM Plex Mono`, `SFMono-Regular`, or `ui-monospace` for payload and hashes.
- Section labels use uppercase with letter spacing `0.04em`.

Shape:

- Major panels: `8px`.
- Buttons/inputs: `6px`.
- Pills: clipped technical tags, not large rounded badges.

## Interaction Model

### Request

`Config / SVG / HTML` is a response mode selector. It must be visually independent from chart parameters.

- Active mode: blue filled/outlined technical toggle.
- Click immediately requests `/render`.
- It updates `response_format`.

### Parameters

Only payload-writing controls live here:

- Theme
- Width
- Height
- Apply changes

No blur-triggered updates.

### Payload

JSON editor gets the most vertical space in left panel. It should look like a working editor, not a textarea dumped into a form.

### Preview

Preview stage owns scroll. The artifact is placed inside a measured grid:

- Top rail: title, artifact size, format, cache.
- Left/top measuring marks can be decorative but should reinforce actual size.
- Chart artifact keeps exact configured W/H.

## Implementation Guidance

Use current IDs where possible:

- `render-config`
- `render-svg`
- `render-html`
- `theme-select`
- `width-input`
- `height-input`
- `apply-controls`
- `payload-input`
- `result-output`
- `status`
- `chart-root`
- `download-json`
- `download-svg`
- `download-png`

No framework or build step is required; this can be implemented inside `src/renderers/html-shell.js`.

## Acceptance Criteria

- V2 is visually distinct from V1.
- `Request` is clearly not a chart parameter section.
- The preview communicates artifact sizing and scrolling.
- Download actions stay global and easy to find.
- Payload editor feels intentional and code-oriented.
- No visible implementation library version.
- The preview HTML opens directly and represents the intended visual direction.
