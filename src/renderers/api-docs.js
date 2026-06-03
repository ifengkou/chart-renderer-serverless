const VERSION = "0.2.0";

export function renderApiDocsHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>chart-renderer API docs</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>${apiDocsCss()}</style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <nav class="nav">
        <img src="/logo.svg" alt="chart-renderer" class="logo">
        <div class="nav-links">
          <a href="/viewer">Viewer</a>
          <a href="/health">Health</a>
          <a href="/logo.svg">Logo</a>
        </div>
      </nav>
      <section class="hero-grid">
        <div>
          <p class="eyebrow">Cloudflare Worker API</p>
          <h1>Chart Renderer API</h1>
          <p class="lede">返回标准化 config、简单 SVG 或浏览器端 HTML shell。Worker 不生成服务端 PNG，PNG 由浏览器 viewer 下载导出。</p>
        </div>
        <div class="status-card" aria-label="Runtime summary">
          <div><span>runtime</span><strong>cloudflare-worker</strong></div>
          <div><span>version</span><strong>${VERSION}</strong></div>
          <div><span>formats</span><strong>config / svg / html</strong></div>
          <div><span>png ssr</span><strong class="warn">legacy only</strong></div>
        </div>
      </section>
    </header>

    <section class="content">
      <aside class="toc">
        <a href="#endpoints">Endpoints</a>
        <a href="#render">POST /render</a>
        <a href="#formats">Formats</a>
        <a href="#types">Chart Types</a>
        <a href="#examples">Examples</a>
        <a href="#errors">Errors</a>
      </aside>

      <article class="docs">
        <section id="endpoints" class="panel">
          <h2>Endpoints</h2>
          <div class="endpoint-list">
            ${endpoint("GET", "/health", "Worker 健康检查和 runtime metadata。")}
            ${endpoint("GET", "/", "简版落地宣传页，提供 Viewer 和 API 文档入口。")}
            ${endpoint("GET", "/viewer", "可编辑 payload、预览图表并下载 JSON/SVG/PNG 的浏览器页面。")}
            ${endpoint("GET", "/api", "当前 API 文档页面。/docs/api 是同一页面别名。")}
            ${endpoint("GET", "/logo.svg", "横版 SVG logo。")}
            ${endpoint("GET", "/favicon.svg", "SVG favicon。/favicon.ico 返回同一 SVG。")}
            ${endpoint("POST", "/render", "核心渲染接口，返回 config、SVG 或 HTML。")}
          </div>
        </section>

        <section id="render" class="panel">
          <h2>POST /render</h2>
          <p>请求体必须是 JSON object。默认响应是 <code>config</code>。生产鉴权交给上游 API gateway，Worker 内只做输入限制、格式校验、缓存和错误处理。</p>
          <table>
            <thead><tr><th>字段</th><th>类型</th><th>默认</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code>type</code></td><td>string</td><td>required</td><td>图表类型，会做大小写归一化和少量别名转换。</td></tr>
              <tr><td><code>data</code></td><td>array</td><td>required*</td><td>除 <code>liquid</code> 外通常需要非空数组。</td></tr>
              <tr><td><code>title</code></td><td>string</td><td>none</td><td>图表标题。</td></tr>
              <tr><td><code>width</code></td><td>integer</td><td>900</td><td>图表与下载产物目标宽度，范围 100..4096。</td></tr>
              <tr><td><code>height</code></td><td>integer</td><td>520</td><td>图表与下载产物目标高度，范围 100..4096。</td></tr>
              <tr><td><code>theme</code></td><td>string</td><td>default</td><td><code>default</code>、<code>dark</code>、<code>academy</code>。</td></tr>
              <tr><td><code>options</code></td><td>object</td><td>{}</td><td>类型附加配置，如轴标题、堆叠、表格列顺序。</td></tr>
              <tr><td><code>response_format</code></td><td>string</td><td>config</td><td><code>config</code>、<code>svg</code>、<code>html</code>。</td></tr>
            </tbody>
          </table>
        </section>

        <section id="formats" class="panel">
          <h2>Response Formats</h2>
          <div class="format-grid">
            <div>
              <h3>config</h3>
              <p>返回标准化 JSON，包含 <code>hash</code>、<code>renderer</code>、<code>format</code>、<code>chart</code> 和 <code>metadata</code>。</p>
            </div>
            <div>
              <h3>svg</h3>
              <p>Worker 直接生成简单图表 SVG：line、bar、column、pie、summary。</p>
            </div>
            <div>
              <h3>html</h3>
              <p>返回浏览器端 HTML shell，引入 <code>@antv/gpt-vis@0.6.1</code> 渲染复杂图表。</p>
            </div>
            <div>
              <h3>png</h3>
              <p><strong>不支持。</strong>请求 <code>response_format=png</code> 或 <code>Accept: image/png</code> 返回 422。</p>
            </div>
          </div>
          <p class="note">所有 <code>/render</code> 成功响应都带有 <code>ETag</code>、<code>X-Chart-Hash</code>、<code>X-Chart-Type</code>、<code>X-Chart-Renderer</code>、<code>X-Chart-Cache</code>。</p>
        </section>

        <section id="types" class="panel">
          <h2>Chart Types</h2>
          <table>
            <thead><tr><th>type</th><th>主要字段</th><th>推荐格式</th></tr></thead>
            <tbody>
              <tr><td><code>line</code></td><td><code>time</code>, <code>value</code>, optional <code>group</code></td><td>svg / config / html</td></tr>
              <tr><td><code>bar</code>, <code>column</code></td><td><code>category</code>, <code>value</code>, optional <code>group</code></td><td>svg / config / html</td></tr>
              <tr><td><code>pie</code></td><td><code>category</code>, <code>value</code></td><td>svg / config / html</td></tr>
              <tr><td><code>summary</code></td><td><code>label</code>, <code>value</code>, optional <code>delta</code></td><td>svg</td></tr>
              <tr><td><code>area</code>, <code>radar</code>, <code>waterfall</code>, <code>word-cloud</code>, <code>liquid</code>, <code>table</code></td><td>见 Markdown API 文档</td><td>config / html</td></tr>
            </tbody>
          </table>
        </section>

        <section id="examples" class="panel">
          <h2>Examples</h2>
          <h3>SVG</h3>
          <pre><code>curl -s -X POST /render \\
  -H "Content-Type: application/json" \\
  -d '{"type":"line","response_format":"svg","title":"Token price","data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}]}'</code></pre>
          <h3>HTML Shell</h3>
          <pre><code>curl -s -X POST /render \\
  -H "Content-Type: application/json" \\
  -d '{"type":"waterfall","response_format":"html","title":"Flow bridge","data":[{"category":"Start","value":100},{"category":"Cost","value":-20},{"category":"Total","isTotal":true}]}'</code></pre>
        </section>

        <section id="errors" class="panel">
          <h2>Errors</h2>
          <table>
            <thead><tr><th>Status</th><th>error</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td>400</td><td><code>bad_request</code></td><td>请求体为空、超过上限或不是合法 JSON。</td></tr>
              <tr><td>404</td><td><code>not_found</code></td><td>路径或方法不支持。</td></tr>
              <tr><td>422</td><td><code>invalid_chart_payload</code></td><td>字段缺失、尺寸越界、主题无效等。</td></tr>
              <tr><td>422</td><td><code>unsupported_response_format</code></td><td>请求了 Worker 不支持的 PNG。</td></tr>
              <tr><td>422</td><td><code>unsupported_svg_chart_type</code></td><td>复杂图表请求了 Worker SVG。</td></tr>
            </tbody>
          </table>
        </section>
      </article>
    </section>
  </main>
</body>
</html>`;
}

function endpoint(method, path, description) {
  return `<div class="endpoint"><span class="method ${method.toLowerCase()}">${method}</span><code>${path}</code><p>${description}</p></div>`;
}

function apiDocsCss() {
  return `
    :root {
      --ink: #111827;
      --slate: #344054;
      --muted: #667085;
      --paper: #f7f9fc;
      --panel: #ffffff;
      --rule: #c9d6e6;
      --accent: #175cd3;
      --signal: #0f9f6e;
      --warn: #b54708;
      --mono: "IBM Plex Mono", "SFMono-Regular", Consolas, ui-monospace, monospace;
      --sans: "Avenir Next", Aptos, "Segoe UI", ui-sans-serif, system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: var(--sans);
      background:
        linear-gradient(90deg, rgba(17, 24, 39, 0.035) 1px, transparent 1px) 0 0 / 32px 32px,
        linear-gradient(rgba(17, 24, 39, 0.035) 1px, transparent 1px) 0 0 / 32px 32px,
        var(--paper);
    }
    a { color: var(--accent); text-decoration: none; font-weight: 800; }
    code, pre { font-family: var(--mono); }
    .page { min-height: 100vh; }
    .hero {
      border-bottom: 1px solid var(--rule);
      background: rgba(255, 255, 255, 0.92);
    }
    .nav {
      height: 74px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 0 32px;
      border-bottom: 1px solid var(--rule);
    }
    .logo { width: 220px; height: auto; display: block; }
    .nav-links { display: flex; gap: 18px; flex-wrap: wrap; }
    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 32px;
      padding: 44px 32px 48px;
      max-width: 1180px;
      margin: 0 auto;
    }
    .eyebrow {
      margin: 0 0 10px;
      color: var(--accent);
      font-family: var(--mono);
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 { margin: 0; font-size: 52px; line-height: 1; letter-spacing: 0; }
    .lede { max-width: 720px; color: var(--slate); font-size: 18px; line-height: 1.65; }
    .status-card {
      display: grid;
      gap: 0;
      align-self: end;
      border: 1px solid var(--rule);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
      box-shadow: 0 16px 40px rgba(23, 92, 211, 0.1);
    }
    .status-card div {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--rule);
    }
    .status-card div:last-child { border-bottom: 0; }
    .status-card span { color: var(--muted); font-family: var(--mono); font-size: 12px; font-weight: 800; }
    .status-card strong { color: var(--signal); font-family: var(--mono); font-size: 12px; }
    .status-card .warn { color: var(--warn); }
    .content {
      max-width: 1180px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 210px minmax(0, 1fr);
      gap: 24px;
      padding: 28px 32px 56px;
      min-width: 0;
    }
    .toc {
      position: sticky;
      top: 18px;
      align-self: start;
      display: grid;
      gap: 8px;
      padding: 14px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
    }
    .toc a {
      padding: 8px 10px;
      border-radius: 6px;
      color: var(--slate);
      font-size: 13px;
    }
    .toc a:hover { background: #e8f1ff; color: var(--accent); }
    .docs {
      display: grid;
      gap: 18px;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .panel {
      min-width: 0;
      max-width: 100%;
      padding: 24px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 1px 2px rgba(17, 24, 39, 0.06);
      overflow: hidden;
    }
    h2 { margin: 0 0 16px; font-size: 24px; }
    h3 { margin: 20px 0 10px; font-size: 16px; }
    p { color: var(--slate); line-height: 1.65; }
    .endpoint-list { display: grid; gap: 10px; }
    .endpoint {
      min-width: 0;
      display: grid;
      grid-template-columns: 70px 120px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: #fbfdff;
    }
    .endpoint p { margin: 0; }
    .endpoint code {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .method {
      display: inline-flex;
      justify-content: center;
      padding: 5px 8px;
      border-radius: 6px;
      color: #ffffff;
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 900;
    }
    .method.get { background: var(--accent); }
    .method.post { background: var(--signal); }
    table {
      width: 100%;
      min-width: 680px;
      border-collapse: collapse;
      overflow: hidden;
      border: 1px solid var(--rule);
      border-radius: 8px;
      font-size: 14px;
    }
    .panel table {
      display: block;
      max-width: 100%;
      overflow-x: auto;
    }
    .panel table thead,
    .panel table tbody,
    .panel table tr {
      display: table;
      width: 100%;
      table-layout: fixed;
    }
    th, td {
      padding: 12px;
      border-bottom: 1px solid var(--rule);
      text-align: left;
      vertical-align: top;
    }
    th { background: #f4f8fd; color: var(--slate); font-size: 12px; text-transform: uppercase; }
    tr:last-child td { border-bottom: 0; }
    .format-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .format-grid div {
      padding: 16px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: #fbfdff;
    }
    .format-grid h3 { margin-top: 0; }
    .note {
      padding: 12px 14px;
      border-left: 4px solid var(--accent);
      background: #e8f1ff;
    }
    pre {
      max-width: 100%;
      overflow: auto;
      padding: 16px;
      border-radius: 8px;
      background: #0f172a;
      color: #dbeafe;
      font-size: 13px;
      line-height: 1.6;
    }
    pre code {
      display: block;
      width: max-content;
      min-width: 100%;
      white-space: pre;
    }
    @media (max-width: 860px) {
      .nav { height: auto; padding: 16px; align-items: flex-start; flex-direction: column; }
      .hero-grid, .content { grid-template-columns: 1fr; padding-left: 16px; padding-right: 16px; }
      h1 { font-size: 38px; }
      .toc { position: static; }
      .endpoint { grid-template-columns: 1fr; }
      .format-grid { grid-template-columns: 1fr; }
      .logo { width: 190px; }
    }
  `;
}
