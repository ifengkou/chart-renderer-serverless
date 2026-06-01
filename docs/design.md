# Chart Viewer Redesign

本文档定义 `/viewer` 的下一版产品界面。它面向 agent 调试、上游 API 验证、图表预览和下载，不是营销页，也不是纯 JSON 表单。

配套静态预览：[`viewer-design-preview.html`](./viewer-design-preview.html)。

## Design Direction

`/viewer` 应该像一个轻量图表产物工作台：

- 左侧是 request 与 payload inspector。
- 右侧是图表 artifact stage。
- 顶部只放全局身份、当前状态和下载动作。
- 界面要安静、密集、可扫描，适合反复调试。

不要使用 hero、装饰插图、大面积渐变、嵌套卡片或营销式介绍。控件应该像工具，不像宣传模块。

## User Jobs

1. 粘贴或编辑 chart payload。
2. 选择 Worker 返回模式：`config`、`svg`、`html`。
3. 修改会写回 payload 的 chart parameters：`theme`、`width`、`height`。
4. 查看当前渲染结果和 Worker metadata。
5. 下载当前图表的 JSON、SVG 或 PNG。

## Information Architecture

### App Header

Header 承担全局上下文，不承担主要编辑任务。

- Brand：`chart-renderer`
- Runtime badge：`Worker`
- Status：`Rendered`、`Working`、`Error`
- Download actions：`JSON`、`SVG`、`PNG`

不要在 visible UI 中展示 `@antv/gpt-vis` 版本。

### Left Inspector

左侧固定宽度，推荐 `420px`，承载输入与请求控制。

Sections:

1. `Request`
   - `Config`、`SVG`、`HTML`
   - 这是 `response_format` 快捷入口，不是 chart 参数。
   - 点击后立即用该格式请求 `/render`。

2. `Chart parameters`
   - `Theme`
   - `Width`
   - `Height`
   - `Apply changes`
   - 这些字段会同步回 payload。

3. `Payload`
   - JSON textarea。
   - 不做 blur-trigger render。
   - 不在用户输入过程中自动格式化。

4. `Response`
   - `status`
   - `format`
   - `cache`
   - `hash`
   - `renderer`

### Right Preview

右侧是 artifact stage，不是信息卡片集合。

- Preview header：chart title、artifact size、format、cache。
- Chart viewport：铺满剩余空间。
- `.chart-root` 负责滚动条。
- 图表尺寸来自 payload `width/height`，不是容器尺寸。
- 图表大于右侧区域时，右侧 viewport 内滚动。

## Layout

Desktop:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ chart-renderer  Worker  Rendered                         JSON SVG PNG       │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Request               │ Risk profile                    900 x 520 HTML hit  │
│ [Config][SVG][HTML]   ├─────────────────────────────────────────────────────┤
│                       │                                                     │
│ Chart parameters      │  chart-root scroll viewport                         │
│ Theme [Default]       │                                                     │
│ Size  [900] [520]     │                                                     │
│ [Apply changes]       │                                                     │
│                       │                                                     │
│ Payload editor        │                                                     │
│                       │                                                     │
│ Response metadata     │                                                     │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

Mobile:

- Header wraps naturally.
- Inspector stacks above preview.
- Preview keeps at least `420px` height.
- Request buttons remain one row where possible.

## Visual System

The UI should feel precise and durable. Use contrast, spacing, and alignment instead of decoration.

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg` | `#eef2f7` | App chrome background |
| `--panel` | `#ffffff` | Header, inspector, stage |
| `--panel-soft` | `#f8fafc` | Code and metadata surfaces |
| `--line` | `#d8e0eb` | Borders and dividers |
| `--line-strong` | `#bdc9d8` | Active separators |
| `--text` | `#101828` | Primary text |
| `--muted` | `#667085` | Secondary labels |
| `--faint` | `#98a2b3` | Metadata hints |
| `--accent` | `#1d4ed8` | Primary controls |
| `--accent-soft` | `#e8f0ff` | Active segmented state |
| `--green` | `#15803d` | Success/cache hit |
| `--amber` | `#b45309` | Warning/cache miss |
| `--red` | `#b42318` | Error |

Radius:

- Inputs/buttons: `6px`
- Major surfaces: `8px`
- Pills: `999px`

Typography:

- App title: `18px`, weight `800`
- Section title: `12px`, uppercase, weight `800`
- Body/control text: `13px`
- Code: `12px`, line-height `1.55`
- Do not scale font size with viewport width.

## Interaction Rules

- `Config/SVG/HTML` changes `response_format` and immediately renders.
- `Apply changes` syncs Theme/W/H to payload and renders using current request mode.
- Enter in W/H behaves like Apply.
- Payload textarea does not render on blur.
- Download buttons operate on current rendered artifact.
- Errors render in status and response metadata, not alerts.

## Component Notes

### Request Segmented Control

Use equal-width buttons. Active state should be visually clear but not loud. The label should be `Request`, not `Render`, because the control changes response mode.

### Chart Parameters

Keep a compact label/control grid. Width and height sit together under `Size`.

### Payload Editor

Use line numbers in the visual design if feasible. In implementation, plain textarea can remain, but surrounding UI should make it feel like an editor.

### Response Metadata

Use small rows or compact chips. Hash should truncate visually while preserving the full value in `title`.

### Preview Stage

Use one main surface with a header and viewport. Do not put chart preview inside multiple nested cards. The stage can have a subtle inner toolbar/status line, but the chart itself should remain the focus.

## Implementation Notes

Keep existing DOM IDs where possible:

- `payload-input`
- `result-output`
- `theme-select`
- `width-input`
- `height-input`
- `apply-controls`
- `render-config`
- `render-svg`
- `render-html`
- `download-json`
- `download-svg`
- `download-png`
- `chart-root`
- `status`

The redesign can still live in `src/renderers/html-shell.js` with inline CSS and JS. No frontend build step is required.

## Acceptance Criteria

- `Request` and `Chart parameters` are visually and semantically separate.
- The page reads as a professional tool, not a raw form.
- Right preview owns scrollbars and does not scale chart dimensions.
- Download actions are easy to find but not confused with render format.
- Status, cache, format, and hash are visible without overwhelming the preview.
- No visible library version appears in the UI.
- The static preview can be opened directly and communicates the final layout clearly.
