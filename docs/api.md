# Chart Renderer Agent API

本文档面向调用 `chart-renderer` 的 agent、上游服务和自动化脚本。

当前目标 API 是 CHART-002 Cloudflare Worker 版本：服务不再在服务端生成 PNG，而是返回 SVG、HTML 或标准化 config。Phase 1 已实现 Worker skeleton 和 `config` 响应；Phase 2 已实现简单图表 SVG；Phase 3 已实现 HTML shell 和 `/viewer`；Phase 4 已实现 Cache API 缓存。

CHART-001 Node.js PNG SSR API 已标记为 legacy。旧的 `image_base64` 和 `image/png` 行为只属于历史 Node SSR 服务，不是 Worker 版本的当前契约。

## 快速结论

- Base URL：`http://127.0.0.1:8787`，容器网络内通常使用服务名和端口，例如 `http://chart-renderer:8787`。
- 健康检查：`GET /health`。
- 渲染图表：`POST /render`。
- 默认响应：JSON config，包含 `hash`、`renderer`、`format`、`chart` 和 `metadata`。
- 支持 `response_format: "config"`。
- 支持简单图表 `response_format: "svg"`：`line`、`bar`、`column`、`pie`、`summary`。
- 支持 `response_format: "html"`：返回浏览器端渲染 shell，引入 `@antv/gpt-vis@0.6.1`。
- 支持 `GET /viewer`：Worker 直接返回可编辑、预览和下载的浏览器页面。
- `response_format: "png"` 或 `Accept: image/png` 在 Worker 版本中不支持，返回 `422 unsupported_response_format`。
- 主题：`theme` 支持 `default`、`dark`、`academy`，其中 `default` 是 Light 风格。
- 当前支持的 `type`：`line`、`area`、`bar`、`column`、`pie`、`waterfall`、`word-cloud`、`liquid`、`radar`、`table`、`summary`。
- Worker 请求体上限：默认 `1000000` bytes，可通过 `MAX_BODY_BYTES` 调整。
- 生产鉴权交给上游 API gateway；Worker 内只做输入限制和错误处理。

## Agent 调用流程

1. 从“支持的 type 列表”中选择一个 `type`，不要使用列表外的类型。
2. 按该 `type` 对应的 schema 构造 payload；除 `liquid` 外通常需要非空 `data`。
3. 需要拿到标准化图表配置时，请求 `response_format: "config"` 或省略 `response_format`。
4. 简单图表需要可嵌入或下载的矢量产物时，请求 `response_format: "svg"`。
5. 复杂图表需要浏览器端渲染页面时，请求 `response_format: "html"`。
6. 不要向 Worker 请求 PNG；需要 PNG 时应在浏览器端基于 SVG/HTML/config 导出。
5. 如果返回 422，根据 `message` 修正字段后重试。
6. 如果返回 501，说明该 response format 属于后续阶段能力，应降级为 `config` 或交给调用方前端处理。

## GET /health

返回 Worker 服务状态、服务版本和当前支持的响应格式。

### Request

```http
GET /health HTTP/1.1
Host: 127.0.0.1:8787
```

### Response 200

```json
{
  "status": "ok",
  "service": "chart-renderer",
  "version": "0.2.0",
  "runtime": "cloudflare-worker",
  "formats": ["config", "svg"],
  "planned_formats": [],
  "simple_svg_types": ["line", "bar", "column", "pie", "summary"]
}
```

### Agent 处理建议

- 启动后可用 `/health` 判断 renderer 是否可用。
- `runtime` 为 `cloudflare-worker` 时，应按 CHART-002 契约处理响应。
- `formats` 表示当前已实现格式，`planned_formats` 表示后续阶段能力。

## POST /render

把 chart payload 标准化为可供浏览器端渲染的 config，或为简单图表生成 SVG。Worker 不做服务端 PNG。

## GET /viewer

Worker 直接返回浏览器端 viewer 页面。

能力：

- 编辑 chart payload。
- 请求 `config`、`svg`、`html` 三种格式。
- 使用 `@antv/gpt-vis@0.6.1` 在浏览器端渲染复杂图表。
- 下载 JSON config、SVG、PNG。

如果 GPT-Vis CDN 加载失败，或 GPT-Vis 报告当前图表类型不支持，页面会使用内置浏览器 fallback renderer。当前 fallback 已覆盖 `radar`。

### 支持的 type

本服务当前只承诺支持下表中的 `type`。Agent 生成 payload 时必须从这些值中选择，不要把其他图表系统的类型名直接传入。

| `type` | 用途 | 必要输入 | 常见使用场景 | 备注 |
| --- | --- | --- | --- | --- |
| `line` | 折线图 | `data[].time`, `data[].value` | 价格、TVL、持仓人数等时间序列趋势 | 可用 `data[].group` 渲染多系列。 |
| `area` | 面积图 | `data[].time`, `data[].value` | 累计量、区间趋势、份额随时间变化 | `options.stack: true` 可做堆叠面积图。 |
| `bar` | 横向柱状图 | `data[].category`, `data[].value` | 分类排名、交易所成交量、Top N 对比 | 类目名称较长时优先用 `bar`。 |
| `column` | 纵向柱状图 | `data[].category`, `data[].value` | 月度/季度对比、短类目分类对比 | 类目较短时优先用 `column`。 |
| `pie` | 饼图/环图 | `data[].category`, `data[].value` | 份额占比、持有人结构、供应分布 | `options.innerRadius > 0` 可做环图。 |
| `waterfall` | 瀑布图 | `data[].category`，普通项提供 `value` | 收入成本拆解、资金流入流出、净变化解释 | 总计项使用 `isTotal: true`。 |
| `word-cloud` | 词云 | `data[].text`, `data[].value` | 叙事关键词、社区讨论主题、风险标签热度 | `Word Cloud`、`wordcloud`、`word_cloud` 会规范化为 `word-cloud`。 |
| `liquid` | 水波进度图 | `percent` | 覆盖率、完成率、风险阈值进度 | 不需要 `data`；可用 `shape` 控制形状。 |
| `radar` | 雷达图 | `data[].group`, `data[].name`, `data[].value` | 多维评分、项目对比、风险画像 | 每个 `group` 应包含同一组 `name` 维度。 |
| `table` | 表格图片 | `data` 任意对象数组 | 关键指标列表、Top 项明细、报告表格 | 对外统一使用 `table`。 |
| `summary` | 指标摘要卡 | `data[].label`, `data[].value` | 报告头部 KPI、市场快照、风险摘要 | 服务内置渲染。 |

### Request Headers

| Header | 必填 | 说明 |
| --- | --- | --- |
| `Content-Type: application/json` | 是 | 请求体必须是 JSON。 |
| `Accept: image/png` | 否 | Worker 版本不支持，会返回 `422 unsupported_response_format`。 |

### Request Body Schema

| 字段 | 类型 | 必填 | 默认值 | 约束 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `type` | string | 是 | 无 | trim 后不能为空 | 图表类型。支持大小写不敏感输入，例如 `Column` 会规范化为 `column`。 |
| `data` | array | 大多数类型必填 | 无 | 非空数组 | 图表数据。`liquid` 不需要 `data`，使用 `percent`。 |
| `title` | string | 否 | 无 | 非字符串会被忽略 | 图表标题。 |
| `width` | integer | 否 | `900` | `100..4096` | 渲染图表和下载图片的目标宽度。 |
| `height` | integer | 否 | `520` | `100..4096` | 渲染图表和下载图片的目标高度。 |
| `theme` | string | 否 | `default` | `default`、`dark`、`academy` | 主题。`light` 会作为 `default` 处理。 |
| `percent` | number | `liquid` 必填 | 无 | `0..1` | 水波图百分比，例如 `0.72` 表示 72%。 |
| `shape` | string | 否 | `circle` | `rect`、`circle`、`pin`、`triangle` | `liquid` 专用形状。也可放在 `options.shape`。 |
| `options` | object | 否 | `{}` | 必须是对象 | 类型附加配置，例如坐标轴标题、堆叠、配色、表格列顺序。 |
| `response_format` | string | 否 | `config` | `config`、`svg`、`html` | `svg` 仅支持简单图表；`html` 返回浏览器端 shell。 |

#### 顶层参数说明

| 参数 | 详细说明 | 使用案例 |
| --- | --- | --- |
| `type` | 选择渲染模板。必须使用“支持的 type”表中的值；服务会把大小写归一化，并处理少量别名。 | `{"type": "column"}` 或 `{"type": "Word Cloud"}`。 |
| `data` | 图表数据数组。字段名由 `type` 决定，服务不会自动从 `date/price` 映射到 `time/value`。 | `line` 使用 `[{"time":"2026-05-01","value":1.12}]`。 |
| `title` | 图表标题。建议短句，避免把长解释文字放入标题。 | `"title": "Token price"`。 |
| `width` / `height` | 图表产物尺寸契约：Worker SVG、HTML shell 中的 GPT-Vis 图表、浏览器下载的 SVG/PNG 都应以这组尺寸为目标。预览容器只跟随并容纳图表，不作为缩放图表的来源。默认 `900x520` 适合报告正文；最小 `100`，最大 `4096`。 | 缩略图可用 `{"width": 480, "height": 280}`。 |
| `theme` | 视觉主题。`default` 是 Light；`dark` 用于深色报告或暗色背景；`academy` 用于更偏学术/报告风格的浅色图。 | `{"theme": "dark"}`。 |
| `percent` | `liquid` 专用进度值，范围 `0..1`。不要传百分数字符串。 | `{"type":"liquid","percent":0.72}` 表示 72%。 |
| `shape` | `liquid` 专用形状，也可写在 `options.shape`。 | `"shape": "circle"`。 |
| `options` | 类型附加配置，例如坐标轴标题、堆叠、分组、配色、表格列顺序。核心字段放顶层，附加字段放 `options`。 | `{"options":{"axisYTitle":"Volume","style":{"palette":["#1677ff"]}}}`。 |
| `response_format` | 响应格式。Worker 默认 `config`。`svg` 支持简单图表。`png` 不支持；请求头 `Accept: image/png` 也会触发明确错误。 | `{"response_format":"svg"}`。 |

字段合并规则：

- 服务会先展开 `options`。
- 再用顶层 `type`、`data`、`title`、`width`、`height`、`theme`、`percent` 覆盖同名字段。
- 因此 agent 应把核心字段放在顶层，把样式、坐标轴标题等附加配置放在 `options`。
- 当前服务不是通用 `xField/yField/angleField/colorField` 映射风格；多数类型读取固定字段名。
- 表格对外统一使用 `type: "table"`。
- `summary` 是服务层内置的轻量指标卡 SVG 渲染。

### Type Data Schema

| `type` | `data` 必要字段 | 可选字段 | 说明 |
| --- | --- | --- | --- |
| `line` | `time`, `value` | `group` | 折线图固定读取 `time` 作为 x 轴，`value` 作为 y 轴；有 `group` 时渲染多系列。 |
| `area` | `time`, `value` | `group` | 面积图固定读取 `time/value`；堆叠面积图设置 `options.stack: true` 并提供 `group`。 |
| `bar` | `category`, `value` | `group` | 横向柱状图固定读取 `category/value`；有 `group` 时可配合 `options.group` 或 `options.stack`。 |
| `column` | `category`, `value` | `group` | 纵向柱状图固定读取 `category/value`；有 `group` 时可配合 `options.group` 或 `options.stack`。 |
| `pie` | `category`, `value` | 无 | 饼图固定读取 `category` 作为颜色分类，`value` 作为扇区数值。 |
| `waterfall` | `category` | `value`, `isIntermediateTotal`, `isTotal` | 瀑布图按顺序累加 `value`；总计项设置 `isTotal: true`。 |
| `word-cloud` | `text`, `value` | 无 | 词云固定读取 `text` 和 `value`。也接受 `Word Cloud` 输入，服务会规范化。 |
| `liquid` | 无 | 无 | 水波图不需要 `data`，必须提供顶层 `percent` 或 `options.percent`。 |
| `radar` | `group`, `name`, `value` | 无 | 雷达图按 `group` 聚合系列，`name` 是维度，`value` 是分值。 |
| `table` | 任意对象字段 | 无 | 表格渲染；可用 `options.columns` 控制列顺序。 |
| `summary` | `label`, `value` | `delta`, `description`, `status` | 指标摘要卡；`status: "negative"` 或负数 delta 会用负向颜色。 |

### Type 使用案例

| `type` | 推荐 payload 片段 |
| --- | --- |
| `line` | `{"type":"line","data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}]}` |
| `area` | `{"type":"area","data":[{"time":"Q1","value":10},{"time":"Q2","value":18}]}` |
| `bar` | `{"type":"bar","data":[{"category":"Binance","value":1280000},{"category":"Coinbase","value":920000}]}` |
| `column` | `{"type":"column","data":[{"category":"Jan","value":120},{"category":"Feb","value":180}]}` |
| `pie` | `{"type":"pie","data":[{"category":"Top 10","value":42},{"category":"Others","value":58}]}` |
| `waterfall` | `{"type":"waterfall","data":[{"category":"Start","value":100},{"category":"Cost","value":-20},{"category":"Total","isTotal":true}]}` |
| `word-cloud` | `{"type":"word-cloud","data":[{"text":"liquidity","value":42},{"text":"holders","value":64}]}` |
| `liquid` | `{"type":"liquid","percent":0.72,"shape":"circle"}` |
| `radar` | `{"type":"radar","data":[{"group":"Token A","name":"Liquidity","value":80},{"group":"Token A","name":"Risk","value":40}]}` |
| `table` | `{"type":"table","data":[{"metric":"Price","value":"$1.12"}],"options":{"columns":["metric","value"]}}` |
| `summary` | `{"type":"summary","data":[{"label":"Price","value":"$1.12","delta":"+3.4%"}]}` |

常见附加配置：

| 字段位置 | 类型 | 适用类型 | 说明 |
| --- | --- | --- | --- |
| `options.axisXTitle` | string | `line`, `area`, `bar`, `column`, `waterfall` | x 轴标题。 |
| `options.axisYTitle` | string | `line`, `area`, `bar`, `column`, `waterfall` | y 轴标题。 |
| `options.group` | boolean | `bar`, `column` | 当数据含 `group` 字段时，渲染分组柱状图。 |
| `options.stack` | boolean | `area`, `bar`, `column` | 当数据含 `group` 字段时，渲染堆叠图。 |
| `options.innerRadius` | number | `pie` | `0..1`，大于 0 时渲染为环图。 |
| `options.shape` | string | `liquid` | `rect`、`circle`、`pin`、`triangle`。也可放在顶层 `shape`。 |
| `options.align` | boolean | `radar` | 是否统一各维度最大值。 |
| `options.columns` | string[] | `table` | 普通表格列顺序。 |
| `options.rows` | string[] | `table` | 存在 `rows` 或 `values` 时渲染交叉表。 |
| `options.values` | string[] | `table` | 交叉表数值字段。 |
| `options.style.palette` | string[] | 常见图表 | 自定义颜色序列。 |

### Config Response 200

Phase 1 默认响应为 JSON config：

```json
{
  "success": true,
  "hash": "sha256:...",
  "renderer": "client-config",
  "format": "config",
  "chart": {
    "type": "line",
    "data": [
      {"time": "2026-05-01", "value": 1.12}
    ],
    "title": "Token price",
    "width": 900,
    "height": 520,
    "theme": "default",
    "options": {}
  },
  "metadata": {
    "cache": "miss",
    "runtime": "cloudflare-worker"
  }
}
```

响应头包含：

| Header | 说明 |
| --- | --- |
| `ETag` | payload hash。 |
| `X-Chart-Hash` | payload hash。 |
| `X-Chart-Type` | 标准化图表类型。 |
| `X-Chart-Renderer` | `client-config`。 |
| `X-Chart-Cache` | `miss` 或 `hit`。同一标准化 payload 第二次请求应命中 `hit`。 |

### SVG Response 200

简单图表请求 `response_format: "svg"` 时返回 SVG：

```http
HTTP/1.1 200 OK
Content-Type: image/svg+xml; charset=utf-8
X-Chart-Renderer: worker-svg
X-Chart-Type: line
```

当前支持的 SVG 类型：

| `type` | 主要 SVG 节点 |
| --- | --- |
| `line` | `data-chart-node="line-path"`、`line-point` |
| `bar` | `data-chart-node="bar"` |
| `column` | `data-chart-node="column"` |
| `pie` | `data-chart-node="pie-slice"` |
| `summary` | `data-chart-node="summary-card"` |

SVG 响应会包含合法 `<svg>`、`viewBox`、`title`，并对用户文本做 XML escaping。

### Unsupported SVG Chart Type 422

复杂图表请求 `response_format: "svg"` 时返回：

```json
{
  "error": "unsupported_svg_chart_type",
  "message": "SVG rendering is not supported for chart type: radar. Use response_format=config or html.",
  "hash": "sha256:...",
  "chart_type": "radar"
}
```

### Unsupported PNG Response 422

当请求体包含 `"response_format": "png"`，或请求头包含 `Accept: image/png` 时，Worker 返回：

```json
{
  "error": "unsupported_response_format",
  "message": "Server-side PNG rendering is not supported in the Worker version. Use svg/html/config and download PNG in the browser."
}
```

### HTML Response 200

当请求 `response_format: "html"` 时，返回 standalone HTML shell：

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
X-Chart-Renderer: client-html
```

HTML shell 包含 JSON、SVG、PNG 下载按钮。复杂图表在浏览器端通过 `@antv/gpt-vis@0.6.1` 渲染。

实现注意：

- Worker 会继续校验并保留 `theme` 到标准化 config。简单 SVG renderer 会直接使用 `default`、`dark`、`academy` 主题。
- `/viewer` 浏览器端渲染复杂图表时，会把 `theme` 字段传给 GPT-Vis；`@antv/gpt-vis@0.6.1` 支持 `default`、`dark`、`academy` 主题。
- `/viewer` 提供 Theme、W、H 和 Apply 控件；只有点击 Apply，或在 W/H 输入框按 Enter，才会把控件值同步到 payload 并重新渲染；这些控件在左侧边栏分行排布，避免窄宽度下溢出。
- `/viewer` 的页面预览容器保持中性的白色工作区，不随 `theme` 改变；`theme` 只传给图表渲染逻辑。
- `/viewer` 将 `width`、`height` 作为图表渲染尺寸和下载尺寸；预览容器跟随图表尺寸扩展，只负责完整展示图表，不作为图表缩放来源。
- `/viewer` 在 GPT-Vis 渲染后触发 resize/reflow；页面只约束 GPT-Vis 工作区以便库完成正确测量，不再强行拉伸 canvas，避免图表变形或回落到内部默认小尺寸。
- 下载 SVG 时，页面优先序列化真正的图表 SVG；如果当前复杂图表由 canvas 渲染，则导出一个包含 canvas PNG data URL 的 SVG 包装。下载 PNG 时，页面优先导出真正的图表 canvas 或 SVG，而不是工具栏图标。

## CHART-001 Legacy PNG SSR API

以下 `image_base64` 和 `image/png` 响应只适用于历史 Node.js SSR 服务，不属于 Cloudflare Worker 版本当前契约。历史实现已隔离到 `legacy/node-ssr/`，根安装和 Worker bundle 不再包含 `canvas` 或 `@antv/gpt-vis-ssr`。

### PNG Response 200

当请求体包含 `"response_format": "png"`，或请求头包含 `Accept: image/png` 时，响应体为 PNG binary。

响应头包含基础 metadata：

| Header | 说明 |
| --- | --- |
| `Content-Type: image/png` | PNG binary 响应。 |
| `Content-Length` | PNG 字节数。 |
| `X-Chart-Provider` | 常规图表为 `gpt_vis_ssr`；`summary` 为 `chart_renderer`。 |
| `X-Chart-Type` | 实际渲染的图表类型。 |
| `X-Chart-Width` | 实际宽度。 |
| `X-Chart-Height` | 实际高度。 |
| `X-Render-Duration-Ms` | 渲染耗时，单位毫秒。 |

## 示例

### Line Chart，JSON 响应

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{
    "type": "line",
    "title": "Token price",
    "width": 900,
    "height": 520,
    "data": [
      {"time": "2026-05-01", "value": 1.12},
      {"time": "2026-05-02", "value": 1.18},
      {"time": "2026-05-03", "value": 1.15}
    ],
    "options": {
      "axisXTitle": "Date",
      "axisYTitle": "Price"
    }
  }'
```

### Bar Chart，PNG 响应

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -H "Accept: image/png" \
  -d '{
    "type": "bar",
    "title": "Volume by exchange",
    "width": 900,
    "height": 520,
    "data": [
      {"category": "Binance", "value": 1280000},
      {"category": "Coinbase", "value": 920000},
      {"category": "Kraken", "value": 310000}
    ],
    "options": {
      "axisXTitle": "Exchange",
      "axisYTitle": "Volume"
    }
  }' \
  -o /tmp/chart-renderer-bar.png
```

### Pie Chart，请求体指定 PNG

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pie",
    "title": "Holder segments",
    "response_format": "png",
    "data": [
      {"category": "Top 10", "value": 42},
      {"category": "Top 100", "value": 33},
      {"category": "Others", "value": 25}
    ],
    "options": {
      "innerRadius": 0
    }
  }' \
  -o /tmp/chart-renderer-pie.png
```

### Column Chart，Dark Theme

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -H "Accept: image/png" \
  -d '{
    "type": "Column",
    "theme": "dark",
    "title": "Monthly volume",
    "data": [
      {"category": "Jan", "value": 120},
      {"category": "Feb", "value": 180},
      {"category": "Mar", "value": 150}
    ]
  }' \
  -o /tmp/chart-renderer-column-dark.png
```

### Liquid Chart

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{
    "type": "liquid",
    "title": "Liquidity coverage",
    "percent": 0.72,
    "shape": "circle",
    "response_format": "png"
  }' \
  -o /tmp/chart-renderer-liquid.png
```

### Table Chart

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{
    "type": "table",
    "title": "Key metrics",
    "response_format": "png",
    "data": [
      {"metric": "Price", "value": "$1.12"},
      {"metric": "Volume", "value": "$1.28M"}
    ],
    "options": {
      "columns": ["metric", "value"]
    }
  }' \
  -o /tmp/chart-renderer-table.png
```

### Summary Cards

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -d '{
    "type": "summary",
    "theme": "academy",
    "title": "Token snapshot",
    "response_format": "png",
    "data": [
      {"label": "Price", "value": "$1.12", "delta": "+3.4%"},
      {"label": "Volume", "value": "$1.28M", "delta": "-2.1%"},
      {"label": "Risk", "value": "Medium", "description": "Liquidity concentration remains elevated."}
    ]
  }' \
  -o /tmp/chart-renderer-summary.png
```

## 错误响应

错误响应均为 JSON：

```json
{
  "error": "invalid_chart_payload",
  "message": "data must be a non-empty array"
}
```

| HTTP 状态 | `error` | 常见原因 | Agent 处理建议 |
| --- | --- | --- | --- |
| 400 | `bad_request` | body 为空、JSON 非法、body 超过上限 | 修正请求体或缩小数据量后重试。 |
| 404 | `not_found` | 路径或方法错误 | 改用 `GET /health` 或 `POST /render`。 |
| 422 | `invalid_chart_payload` | 缺少 `type`、`data` 为空、尺寸非法、`theme` 非法、`liquid.percent` 非法、`options` 非对象 | 根据 `message` 修正 payload。 |
| 500 | `render_failed` | 渲染失败 | 检查 `type` 是否在本服务支持列表内、字段是否匹配该 type schema、数据规模是否过大；必要时 fallback。 |
| 500 | `internal_error` | 未预期内部错误 | 记录错误并交给上游告警或 fallback。 |

## Payload 生成建议

- 按图表类型使用约定字段：`line/area` 使用 `time/value`，`bar/column/pie` 使用 `category/value`，`word-cloud` 使用 `text/value`。
- 对时间序列，建议在 `time` 中使用 ISO 风格日期字符串，在 `value` 中传 number。
- 对数值字段，传 number，不要传带逗号或单位的字符串。
- `liquid` 只需要 `percent`，不要为了通过 schema 伪造 `data`。
- 需要表格时使用 `type: "table"`。
- 需要指标卡时使用 `type: "summary"`，每个数据项保持 `label/value` 清晰短小。
- 控制数据点数量；大批量数据应先在上游聚合或采样。
- 默认尺寸 `900x520` 适合报告和网页预览；移动端缩略图可使用更小尺寸，但不得低于 `100x100`。
- 不要把 token、密钥、钱包私密标签等敏感数据放进 `title` 或可视化字段。

## OpenAPI 摘要

```yaml
openapi: 3.0.3
info:
  title: Chart Renderer Service
  version: 0.1.0
servers:
  - url: http://127.0.0.1:8787
paths:
  /health:
    get:
      responses:
        "200":
          description: Service health and dependency metadata
          content:
            application/json:
              schema:
                type: object
  /render:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [type]
              properties:
                type:
                  type: string
                  description: Supported chart type. Use only the enum values documented by this service.
                  enum:
                    - line
                    - area
                    - bar
                    - column
                    - pie
                    - waterfall
                    - word-cloud
                    - liquid
                    - radar
                    - table
                    - summary
                data:
                  type: array
                  description: Chart data array. Required for all supported types except liquid. Field names depend on type.
                  minItems: 1
                  items:
                    type: object
                title:
                  type: string
                  description: Short chart title.
                width:
                  type: integer
                  description: Output image width in pixels.
                  minimum: 100
                  maximum: 4096
                  default: 900
                height:
                  type: integer
                  description: Output image height in pixels.
                  minimum: 100
                  maximum: 4096
                  default: 520
                theme:
                  type: string
                  description: Visual theme. default is the Light theme.
                  enum: [default, dark, academy]
                  default: default
                percent:
                  type: number
                  description: Liquid chart percentage, from 0 to 1. Required when type is liquid.
                  minimum: 0
                  maximum: 1
                shape:
                  type: string
                  description: Liquid chart shape.
                  enum: [rect, circle, pin, triangle]
                  default: circle
                options:
                  type: object
                  description: Type-specific options such as axis titles, stack/group mode, palette, or table columns.
                  additionalProperties: true
                response_format:
                  type: string
                  description: Worker response format. config returns normalized JSON config; svg returns Worker SVG for simple charts; html returns browser-rendered HTML shell. png is legacy and returns 422 in Worker.
                  enum: [config, svg, html, png]
                  default: config
      responses:
        "200":
          description: Rendered chart artifact as config JSON, SVG, or HTML shell
          content:
            application/json:
              schema:
                type: object
                required: [success, hash, renderer, format, chart]
            image/svg+xml:
              schema:
                type: string
            text/html:
              schema:
                type: string
        "400":
          description: Bad request
        "422":
          description: Invalid chart payload
        "500":
          description: Internal error
```
