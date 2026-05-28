var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/renderers/html-shell.js
var GPT_VIS_VERSION = "0.5.5";
var REACT_VERSION = "18";
var HTML_TO_IMAGE_VERSION = "1.11.11";
var CACHE_BUSTER = "viewer-v4";
function renderChartHtml(chart, hash) {
  const title = chart.title || `${chart.type} chart`;
  const state = {
    mode: "single",
    chart,
    hash,
    endpoint: "/render",
    gptVisVersion: GPT_VIS_VERSION,
    cacheBuster: CACHE_BUSTER
  };
  return htmlDocument({
    title,
    state,
    body: `
      <main class="shell shell-single">
        <header class="topbar">
          <div>
            <p class="eyebrow">chart-renderer</p>
            <h1>${escapeHtml(title)}</h1>
          </div>
          <div class="actions">
            <button id="download-json" type="button">JSON</button>
            <button id="download-svg" type="button">SVG</button>
            <button id="download-png" type="button">PNG</button>
          </div>
        </header>
        <section class="preview-wrap">
          <div id="status" class="status">Rendering...</div>
          <div id="chart-root" class="chart-root" aria-live="polite"></div>
        </section>
      </main>
    `
  });
}
__name(renderChartHtml, "renderChartHtml");
function renderViewerHtml() {
  const defaultPayload = {
    type: "radar",
    response_format: "html",
    title: "Risk profile",
    data: [
      { group: "Token A", name: "Liquidity", value: 80 },
      { group: "Token A", name: "Volume", value: 65 },
      { group: "Token A", name: "Risk", value: 40 },
      { group: "Token B", name: "Liquidity", value: 55 },
      { group: "Token B", name: "Volume", value: 70 },
      { group: "Token B", name: "Risk", value: 60 }
    ]
  };
  const state = {
    mode: "viewer",
    payload: defaultPayload,
    endpoint: "/render",
    gptVisVersion: GPT_VIS_VERSION,
    cacheBuster: CACHE_BUSTER
  };
  return htmlDocument({
    title: "Chart Viewer",
    state,
    body: `
      <main class="shell shell-viewer">
        <header class="topbar">
          <div>
            <p class="eyebrow">chart-renderer</p>
            <h1>Chart Viewer</h1>
          </div>
          <div class="actions">
            <button id="render-config" type="button">Config</button>
            <button id="render-svg" type="button">SVG</button>
            <button id="render-html" type="button">HTML</button>
            <button id="download-json" type="button">JSON</button>
            <button id="download-svg" type="button">SVG</button>
            <button id="download-png" type="button">PNG</button>
          </div>
        </header>
        <section class="workspace">
          <aside class="editor-panel">
            <div class="control-row">
              <label for="theme-select">Theme</label>
              <select id="theme-select">
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="academy">Academy</option>
              </select>
            </div>
            <textarea id="payload-input" spellcheck="false"></textarea>
            <pre id="result-output" class="result-output"></pre>
          </aside>
          <section class="preview-wrap">
            <div id="status" class="status">Ready</div>
            <div id="chart-root" class="chart-root" aria-live="polite"></div>
          </section>
        </section>
      </main>
    `
  });
}
__name(renderViewerHtml, "renderViewerHtml");
function htmlDocument({ title, state, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${viewerCss()}</style>
</head>
<body>
  ${body}
  <script id="chart-state" type="application/json">${safeJson(state)}<\/script>
  <script src="https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react@${REACT_VERSION}/umd/react.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/@antv/gpt-vis@${GPT_VIS_VERSION}/dist/umd/index.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/html-to-image@${HTML_TO_IMAGE_VERSION}/dist/html-to-image.min.js"><\/script>
  <script>${viewerJs()}<\/script>
</body>
</html>`;
}
__name(htmlDocument, "htmlDocument");
function viewerCss() {
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f7fb;
      color: #111827;
    }
    .shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 18px 24px;
      border-bottom: 1px solid #d9e1ec;
      background: #ffffff;
    }
    .eyebrow {
      margin: 0 0 2px;
      color: #667085;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.2;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    button {
      min-width: 70px;
      height: 34px;
      border: 1px solid #c9d4e5;
      border-radius: 6px;
      background: #ffffff;
      color: #111827;
      font-weight: 700;
      cursor: pointer;
    }
    button:hover { background: #f1f5f9; }
    .workspace {
      flex: 1;
      display: grid;
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      min-height: 0;
    }
    .editor-panel {
      display: grid;
      grid-template-rows: auto minmax(260px, 1fr) 180px;
      gap: 12px;
      padding: 16px;
      border-right: 1px solid #d9e1ec;
      background: #ffffff;
      min-height: 0;
    }
    .control-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .control-row label {
      color: #667085;
      font-size: 13px;
      font-weight: 700;
    }
    select {
      height: 34px;
      min-width: 140px;
      border: 1px solid #c9d4e5;
      border-radius: 6px;
      background: #ffffff;
      color: #111827;
      font-weight: 700;
    }
    textarea,
    .result-output {
      width: 100%;
      margin: 0;
      padding: 12px;
      border: 1px solid #c9d4e5;
      border-radius: 6px;
      background: #fbfdff;
      font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      color: #111827;
      resize: none;
      overflow: auto;
    }
    .preview-wrap {
      flex: 1;
      min-height: 0;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .status {
      min-height: 24px;
      color: #667085;
      font-size: 13px;
      font-weight: 600;
    }
    .chart-root {
      flex: 1;
      min-height: 640px;
      background: #ffffff;
      border: 1px solid #d9e1ec;
      border-radius: 8px;
      padding: 18px;
      overflow: auto;
    }
    .chart-root[data-theme="dark"] {
      background: #0b0f17;
      border-color: #263247;
      color: #f8fafc;
    }
    .chart-root[data-theme="academy"] {
      background: #fffdf7;
      border-color: #d8ccb2;
      color: #2d2618;
    }
    .chart-root > pre {
      min-width: var(--chart-width, 900px);
      margin: 0;
      font-family: inherit;
      white-space: normal;
    }
    .chart-root > svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .chart-root canvas {
      display: block;
      max-width: none;
    }
    .chart-root [class*="gpt-vis"],
    .chart-root [class*="__sc-"],
    .chart-root [class*="-gpt-vis-"] {
      max-height: none !important;
    }
    .chart-root .dESCVp {
      height: var(--chart-inner-height, 700px) !important;
      min-height: var(--chart-inner-height, 700px) !important;
    }
    .chart-root iframe {
      width: 100%;
      min-width: var(--chart-width, 900px);
      min-height: var(--chart-frame-height, 700px);
      border: 0;
    }
    .shell-single .chart-root {
      min-height: 700px;
    }
    @media (max-width: 860px) {
      .topbar { align-items: flex-start; flex-direction: column; }
      .actions { justify-content: flex-start; }
      .workspace { grid-template-columns: 1fr; }
      .editor-panel { border-right: 0; border-bottom: 1px solid #d9e1ec; }
    }
  `;
}
__name(viewerCss, "viewerCss");
function viewerJs() {
  return `
    const state = JSON.parse(document.getElementById("chart-state").textContent);
    const endpoint = state.endpoint || "/render";
    const chartRoot = document.getElementById("chart-root");
    const statusEl = document.getElementById("status");
    const payloadInput = document.getElementById("payload-input");
    const themeSelect = document.getElementById("theme-select");
    const resultOutput = document.getElementById("result-output");
    let currentConfig = state.chart || null;
    let currentPayload = state.payload || state.chart || null;
    let currentSvg = "";
    let currentHtml = "";
    let currentHash = state.hash || "";
    let currentFormat = "config";
    let pendingGptVisChart = null;
    const themeColors = {
      default: { background: "#ffffff", border: "#d9e1ec", text: "#111827", muted: "#667085", grid: "#d9e1ec" },
      dark: { background: "#0b0f17", border: "#263247", text: "#f8fafc", muted: "#a7b0c0", grid: "#263247" },
      academy: { background: "#fffdf7", border: "#d8ccb2", text: "#2d2618", muted: "#74664e", grid: "#d8ccb2" }
    };

    function setStatus(message) {
      statusEl.textContent = message;
    }

    function toMarkdown(chart) {
      return "\\n\\\`\\\`\\\`vis-chart\\n" + JSON.stringify(chart, null, 2) + "\\n\\\`\\\`\\\`\\n";
    }

    function renderGptVis(chart) {
      currentConfig = chart;
      currentSvg = "";
      currentHtml = "";
      pendingGptVisChart = chart;
      prepareChartFrame(chart);
      chartRoot.innerHTML = "";
      if (!window.React || !window.ReactDOM || !window.GPTVis) {
        renderFallbackChart(chart);
        setStatus("Rendered with built-in browser fallback; @antv/gpt-vis could not be loaded.");
        return;
      }
      const Component = createGptVisComponent(window.GPTVis);
      const root = window.ReactDOM.createRoot(chartRoot);
      root.render(window.React.createElement(Component, null, toMarkdown(toGptVisChart(chart))));
      setStatus("Rendered with @antv/gpt-vis@" + state.gptVisVersion);
      window.setTimeout(() => adjustGptVisHeight(chart), 100);
      window.setTimeout(() => adjustGptVisHeight(chart), 500);
      window.setTimeout(() => {
        if (/not supported/i.test(chartRoot.textContent || "")) {
          renderFallbackChart(chart);
          setStatus("Rendered with built-in browser fallback after GPT-Vis reported an unsupported chart type.");
        }
      }, 300);
    }

    function createGptVisComponent(gptVis) {
      if (gptVis.GPTVisLite && gptVis.withChartCode) {
        const chartType = gptVis.ChartType || {};
        const pairs = [
          [chartType.Line || "line", gptVis.Line],
          [chartType.Column || "column", gptVis.Column],
          [chartType.Pie || "pie", gptVis.Pie],
          [chartType.Bar || "bar", gptVis.Bar],
          [chartType.Area || "area", gptVis.Area],
          [chartType.Radar || "radar", gptVis.Radar],
          [chartType.WordCloud || "word-cloud", gptVis.WordCloud],
          [chartType.Treemap || "treemap", gptVis.Treemap],
          [chartType.DualAxes || "dual-axes", gptVis.DualAxes],
          [chartType.Scatter || "scatter", gptVis.Scatter],
          [chartType.Histogram || "histogram", gptVis.Histogram],
          [chartType.FlowDiagram || "flow-diagram", gptVis.FlowDiagram],
          [chartType.FishboneDiagram || "fishbone-diagram", gptVis.FishboneDiagram],
          [chartType.MindMap || "mind-map", gptVis.MindMap],
          [chartType.NetworkGraph || "network-graph", gptVis.NetworkGraph]
        ];
        const components = {};
        for (const [type, component] of pairs) {
          if (type && component) components[type] = component;
        }
        const renderers = {
          code: gptVis.withChartCode({ components })
        };
        return function ShellGptVisLite(props) {
          return window.React.createElement(gptVis.GPTVisLite, { components: renderers }, props.children);
        };
      }
      return gptVis.GPTVis || gptVis.default || gptVis;
    }

    function toGptVisChart(chart) {
      const next = JSON.parse(JSON.stringify(chart));
      delete next.theme;
      if (next.options) delete next.options.theme;
      return next;
    }

    function chartTheme(chart) {
      const value = String(chart?.theme || chart?.options?.theme || "default").toLowerCase();
      return themeColors[value] ? value : "default";
    }

    function prepareChartFrame(chart) {
      const width = Number(chart?.width) || 900;
      const height = Number(chart?.height) || 520;
      chartRoot.dataset.theme = chartTheme(chart);
      chartRoot.style.setProperty("--chart-width", width + "px");
      chartRoot.style.setProperty("--chart-frame-height", Math.max(700, height + 180) + "px");
      chartRoot.style.setProperty("--chart-inner-height", Math.max(520, height) + "px");
      chartRoot.style.minHeight = Math.max(640, height + 180) + "px";
    }

    function adjustGptVisHeight(chart) {
      const height = Math.max(520, Number(chart?.height) || 520);
      const canvas = findRenderableCanvas(chartRoot);
      if (!canvas) return;
      let node = canvas.parentElement;
      while (node && node !== chartRoot) {
        const box = node.getBoundingClientRect();
        if (box.height <= 340 || /dESCVp/.test(node.className || "")) {
          node.style.height = height + "px";
          node.style.minHeight = height + "px";
          node.style.maxHeight = "none";
        }
        node = node.parentElement;
      }
    }

    function renderFallbackChart(chart) {
      if (chart.type === "radar") {
        renderFallbackRadar(chart);
        return;
      }
      chartRoot.innerHTML =
        '<div class="fallback-card"><h2>' + escapeHtml(chart.title || chart.type + ' chart') + '</h2><pre>' +
        escapeHtml(JSON.stringify(chart, null, 2)) +
        '</pre></div>';
    }

    function renderFallbackRadar(chart) {
      prepareChartFrame(chart);
      const data = Array.isArray(chart.data) ? chart.data : [];
      const groups = [...new Set(data.map((item) => item.group || "Series"))];
      const names = [...new Set(data.map((item) => item.name || item.category || item.label || "Metric"))];
      const width = chart.width || 900;
      const height = chart.height || 520;
      const colors = themeColors[chartTheme(chart)];
      const cx = width / 2;
      const cy = height / 2 + 16;
      const radius = Math.min(width, height) * 0.32;
      const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
      const palette = ["#2563eb", "#16a34a", "#dc2626", "#9333ea"];
      const point = (nameIndex, value) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * nameIndex) / Math.max(1, names.length);
        const r = radius * ((Number(value) || 0) / max);
        return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
      };
      const axis = names.map((name, index) => {
        const [x, y] = point(index, max);
        return '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="' + colors.grid + '"/>' +
          '<text x="' + x + '" y="' + y + '" font-size="12" fill="' + colors.muted + '">' + escapeHtml(name) + '</text>';
      }).join("");
      const polygons = groups.map((group, groupIndex) => {
        const points = names.map((name, nameIndex) => {
          const row = data.find((item) => (item.group || "Series") === group && (item.name || item.category || item.label || "Metric") === name);
          return point(nameIndex, row ? row.value : 0).map((n) => Math.round(n * 100) / 100).join(",");
        }).join(" ");
        const color = palette[groupIndex % palette.length];
        return '<polygon data-chart-node="fallback-radar" points="' + points + '" fill="' + color + '22" stroke="' + color + '" stroke-width="3"/>' +
          '<text x="24" y="' + (34 + groupIndex * 22) + '" font-size="13" fill="' + color + '">' + escapeHtml(group) + '</text>';
      }).join("");
      currentSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '">' +
        '<title>' + escapeHtml(chart.title || "Radar chart") + '</title><rect width="100%" height="100%" fill="' + colors.background + '"/>' +
        '<text x="24" y="28" font-size="22" font-weight="700" fill="' + colors.text + '">' + escapeHtml(chart.title || "Radar chart") + '</text>' +
        axis + polygons + '</svg>';
      chartRoot.innerHTML = currentSvg;
    }

    function renderSvg(svg) {
      currentSvg = svg;
      currentHtml = "";
      chartRoot.innerHTML = svg;
      setStatus("Rendered SVG");
    }

    async function renderPayload(format) {
      const payload = readPayloadInput();
      payload.response_format = format;
      currentFormat = format;
      currentPayload = payload;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const contentType = response.headers.get("content-type") || "";
      currentHash = response.headers.get("x-chart-hash") || currentHash;
      if (contentType.includes("image/svg+xml")) {
        const svg = await response.text();
        renderSvg(svg);
        if (resultOutput) resultOutput.textContent = svg.slice(0, 2000);
        return;
      }
      if (contentType.includes("text/html")) {
        const html = await response.text();
        currentHtml = html;
        currentSvg = "";
        prepareChartFrame(currentPayload || currentConfig);
        chartRoot.innerHTML = '<iframe title="Rendered HTML chart" srcdoc="' + escapeAttribute(html) + '"></iframe>';
        if (resultOutput) resultOutput.textContent = html.slice(0, 2000);
        setStatus("Rendered HTML shell");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Render failed");
      }
      if (data.format === "config") {
        currentConfig = data.chart;
        currentHash = data.hash || currentHash;
        syncThemeControl(data.chart);
        renderGptVis(data.chart);
        if (resultOutput) resultOutput.textContent = JSON.stringify(data, null, 2);
      }
    }

    function readPayloadInput() {
      return payloadInput ? JSON.parse(payloadInput.value) : { ...currentConfig };
    }

    function writePayloadInput(payload) {
      if (payloadInput) payloadInput.value = JSON.stringify(payload, null, 2);
    }

    function syncThemeControl(payload) {
      if (!themeSelect) return;
      themeSelect.value = chartTheme(payload);
    }

    function applyThemeSelection() {
      const payload = readPayloadInput();
      payload.theme = themeSelect.value;
      writePayloadInput(payload);
      currentPayload = payload;
      return renderPayload(currentFormat || "config");
    }

    function downloadBlob(filename, type, content) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    async function downloadSvg() {
      const exportRoot = getExportRoot();
      const embeddedSvg = findRenderableSvg(exportRoot);
      if (!currentSvg && embeddedSvg) {
        currentSvg = new XMLSerializer().serializeToString(embeddedSvg);
      }
      const canvas = findRenderableCanvas(exportRoot);
      if (!currentSvg && canvas) {
        currentSvg = canvasToSvg(canvas);
      }
      if (!currentSvg) {
        const payload = { ...(currentPayload || currentConfig), response_format: "svg" };
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          currentSvg = await response.text();
        } else if (window.htmlToImage) {
          currentSvg = await window.htmlToImage.toSvg(exportRoot, { backgroundColor: themeColors[chartTheme(currentConfig || currentPayload)].background });
        } else {
          throw new Error("Current chart is not available as Worker SVG.");
        }
      }
      downloadBlob((currentHash || "chart") + ".svg", "image/svg+xml", currentSvg);
      setStatus("Downloaded SVG");
    }

    function downloadJson() {
      const content = JSON.stringify(currentConfig || currentPayload, null, 2);
      downloadBlob((currentHash || "chart") + ".json", "application/json", content);
    }

    async function downloadPng() {
      const exportRoot = getExportRoot();
      const embeddedSvg = findRenderableSvg(exportRoot);
      if (!currentSvg && embeddedSvg) {
        currentSvg = new XMLSerializer().serializeToString(embeddedSvg);
      }
      const renderedCanvas = findRenderableCanvas(exportRoot);
      if (!currentSvg && renderedCanvas) {
        const blob = await new Promise((resolve) => renderedCanvas.toBlob(resolve, "image/png"));
        if (blob) {
          downloadBlob((currentHash || "chart") + ".png", "image/png", blob);
          setStatus("Downloaded PNG");
          return;
        }
      }
      if (currentSvg) {
        const image = new Image();
        const svgBlob = new Blob([currentSvg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || 900;
        canvas.height = image.naturalHeight || 520;
        canvas.getContext("2d").drawImage(image, 0, 0);
        URL.revokeObjectURL(url);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = (currentHash || "chart") + ".png";
        link.click();
        URL.revokeObjectURL(pngUrl);
        setStatus("Downloaded PNG");
        return;
      }
      if (!window.htmlToImage) throw new Error("PNG export library failed to load.");
      const blob = await window.htmlToImage.toBlob(exportRoot, { backgroundColor: themeColors[chartTheme(currentConfig || currentPayload)].background });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = (currentHash || "chart") + ".png";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded PNG");
    }

    function getExportRoot() {
      const iframe = chartRoot.querySelector("iframe");
      return iframe?.contentDocument?.getElementById("chart-root") || iframe?.contentDocument?.body || chartRoot;
    }

    function findRenderableSvg(root) {
      const svgs = Array.from(root.querySelectorAll("svg"));
      return svgs.find((svg) => {
        const box = svg.getBoundingClientRect();
        return svg.querySelector("[data-chart-node]") || svg.getAttribute("role") === "img" || box.width > 160 && box.height > 120;
      }) || null;
    }

    function findRenderableCanvas(root) {
      const canvases = Array.from(root.querySelectorAll("canvas"));
      return canvases.find((canvas) => canvas.width > 160 && canvas.height > 120) || null;
    }

    function canvasToSvg(canvas) {
      const width = canvas.width || canvas.getBoundingClientRect().width || 900;
      const height = canvas.height || canvas.getBoundingClientRect().height || 520;
      return '<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '">' +
        '<title>' + escapeHtml(currentConfig?.title || currentPayload?.title || "Chart") + '</title>' +
        '<image href="' + canvas.toDataURL("image/png") + '" width="' + width + '" height="' + height + '"/></svg>';
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function escapeAttribute(value) {
      return escapeHtml(value).replaceAll("\`", "&#96;");
    }

    async function safeRun(task) {
      try {
        setStatus("Working...");
        await task();
      } catch (error) {
        setStatus(error.message || String(error));
      }
    }

    window.addEventListener("unhandledrejection", (event) => {
      const message = event.reason?.message || String(event.reason || "");
      if (pendingGptVisChart && /Unknown Component: theme\\.default|not supported/i.test(message)) {
        event.preventDefault();
        renderFallbackChart(pendingGptVisChart);
        setStatus("Rendered with built-in browser fallback after GPT-Vis failed: " + message);
      }
    });

    if (payloadInput) {
      payloadInput.value = JSON.stringify(state.payload, null, 2);
      syncThemeControl(state.payload);
      themeSelect?.addEventListener("change", () => safeRun(applyThemeSelection));
      document.getElementById("render-config").addEventListener("click", () => safeRun(() => renderPayload("config")));
      document.getElementById("render-svg").addEventListener("click", () => safeRun(() => renderPayload("svg")));
      document.getElementById("render-html").addEventListener("click", () => safeRun(() => renderPayload("html")));
    }
    document.getElementById("download-json").addEventListener("click", () => safeRun(downloadJson));
    document.getElementById("download-svg").addEventListener("click", () => safeRun(downloadSvg));
    document.getElementById("download-png").addEventListener("click", () => safeRun(downloadPng));

    if (state.mode === "single") {
      renderGptVis(state.chart);
    } else {
      renderPayload("config");
    }
  `;
}
__name(viewerJs, "viewerJs");
function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026").replaceAll("\\u2028", "\\\\u2028").replaceAll("\\u2029", "\\\\u2029");
}
__name(safeJson, "safeJson");
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
__name(escapeHtml, "escapeHtml");

// src/renderers/svg.js
var PALETTE = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];
var THEMES = {
  default: {
    background: "#ffffff",
    panel: "#f8fafc",
    border: "#d9e1ec",
    text: "#111827",
    muted: "#667085",
    grid: "#e5e7eb",
    positive: "#079455",
    negative: "#d92d20"
  },
  dark: {
    background: "#0b0f17",
    panel: "#121826",
    border: "#263247",
    text: "#f8fafc",
    muted: "#a7b0c0",
    grid: "#263247",
    positive: "#4ade80",
    negative: "#fb7185"
  },
  academy: {
    background: "#fffdf7",
    panel: "#ffffff",
    border: "#d8ccb2",
    text: "#2d2618",
    muted: "#74664e",
    grid: "#e7ddc7",
    positive: "#16794c",
    negative: "#b42318"
  }
};
var SIMPLE_SVG_TYPES = ["line", "bar", "column", "pie", "summary"];
function canRenderSvg(type) {
  return SIMPLE_SVG_TYPES.includes(type);
}
__name(canRenderSvg, "canRenderSvg");
function renderSvg(chart) {
  if (chart.type === "line") return renderLine(chart);
  if (chart.type === "bar") return renderBar(chart);
  if (chart.type === "column") return renderColumn(chart);
  if (chart.type === "pie") return renderPie(chart);
  if (chart.type === "summary") return renderSummary(chart);
  throw new Error(`SVG rendering is not supported for chart type: ${chart.type}`);
}
__name(renderSvg, "renderSvg");
function renderLine(chart) {
  const ctx = createContext(chart);
  const data = numericData(chart.data, "value");
  const inner = plotBox(ctx);
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domain = paddedDomain(min, max);
  const count = Math.max(1, data.length - 1);
  const points = data.map((item, index) => ({
    x: inner.x + inner.width * index / count,
    y: scaleValue(item.value, domain, inner.y + inner.height, inner.y)
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${round(point.x)} ${round(point.y)}`).join(" ");
  return svgShell(ctx, [
    grid(ctx, inner),
    axes(ctx, inner),
    `<path data-chart-node="line-path" d="${path}" fill="none" stroke="${PALETTE[0]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    ...points.map((point, index) => {
      const label = labelFor(data[index], index);
      return `<circle data-chart-node="line-point" cx="${round(point.x)}" cy="${round(point.y)}" r="4" fill="${PALETTE[0]}"><title>${escapeXml(label)}: ${escapeXml(data[index].value)}</title></circle>`;
    }),
    xLabels(ctx, inner, data.map((item, index) => labelFor(item, index))),
    yLabels(ctx, inner, domain)
  ]);
}
__name(renderLine, "renderLine");
function renderBar(chart) {
  const ctx = createContext(chart);
  const data = numericData(chart.data, "value").slice(0, 24);
  const inner = plotBox(ctx);
  const max = Math.max(...data.map((item) => item.value), 0);
  const barGap = 8;
  const barHeight = Math.max(8, (inner.height - barGap * Math.max(0, data.length - 1)) / data.length);
  const nodes = data.map((item, index) => {
    const y = inner.y + index * (barHeight + barGap);
    const width = max === 0 ? 0 : item.value / max * inner.width;
    const label = labelFor(item, index);
    return [
      `<rect data-chart-node="bar" x="${inner.x}" y="${round(y)}" width="${round(width)}" height="${round(barHeight)}" rx="4" fill="${PALETTE[index % PALETTE.length]}"><title>${escapeXml(label)}: ${escapeXml(item.value)}</title></rect>`,
      `<text x="${inner.x - 10}" y="${round(y + barHeight * 0.66)}" text-anchor="end" font-size="12" fill="${ctx.colors.muted}">${escapeXml(truncate(label, 18))}</text>`,
      `<text x="${round(inner.x + width + 8)}" y="${round(y + barHeight * 0.66)}" font-size="12" fill="${ctx.colors.text}">${escapeXml(formatNumber(item.value))}</text>`
    ].join("");
  });
  return svgShell(ctx, [grid(ctx, inner), axes(ctx, inner), ...nodes]);
}
__name(renderBar, "renderBar");
function renderColumn(chart) {
  const ctx = createContext(chart);
  const data = numericData(chart.data, "value").slice(0, 32);
  const inner = plotBox(ctx);
  const max = Math.max(...data.map((item) => item.value), 0);
  const gap = 10;
  const columnWidth = Math.max(6, (inner.width - gap * Math.max(0, data.length - 1)) / data.length);
  const nodes = data.map((item, index) => {
    const height = max === 0 ? 0 : item.value / max * inner.height;
    const x = inner.x + index * (columnWidth + gap);
    const y = inner.y + inner.height - height;
    const label = labelFor(item, index);
    return [
      `<rect data-chart-node="column" x="${round(x)}" y="${round(y)}" width="${round(columnWidth)}" height="${round(height)}" rx="4" fill="${PALETTE[index % PALETTE.length]}"><title>${escapeXml(label)}: ${escapeXml(item.value)}</title></rect>`,
      `<text x="${round(x + columnWidth / 2)}" y="${inner.y + inner.height + 18}" text-anchor="middle" font-size="11" fill="${ctx.colors.muted}">${escapeXml(truncate(label, 10))}</text>`
    ].join("");
  });
  return svgShell(ctx, [grid(ctx, inner), axes(ctx, inner), ...nodes, yLabels(ctx, inner, [0, max])]);
}
__name(renderColumn, "renderColumn");
function renderPie(chart) {
  const ctx = createContext(chart);
  const data = numericData(chart.data, "value").filter((item) => item.value > 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = Math.max(60, Math.min(ctx.width, ctx.height) * 0.28);
  const cx = ctx.width * 0.38;
  const cy = ctx.height * 0.56;
  let startAngle = -Math.PI / 2;
  const slices = data.map((item, index) => {
    const angle = total === 0 ? 0 : item.value / total * Math.PI * 2;
    const endAngle = startAngle + angle;
    const d = arcPath(cx, cy, radius, startAngle, endAngle);
    const label = labelFor(item, index);
    const node = `<path data-chart-node="pie-slice" d="${d}" fill="${PALETTE[index % PALETTE.length]}" stroke="${ctx.colors.background}" stroke-width="2"><title>${escapeXml(label)}: ${escapeXml(formatNumber(item.value))}</title></path>`;
    startAngle = endAngle;
    return node;
  });
  const legend = data.map((item, index) => {
    const y = ctx.margin.top + 70 + index * 24;
    const label = `${labelFor(item, index)} ${total ? Math.round(item.value / total * 100) : 0}%`;
    return `<g data-chart-node="pie-legend"><rect x="${ctx.width * 0.66}" y="${y - 11}" width="12" height="12" rx="2" fill="${PALETTE[index % PALETTE.length]}"/><text x="${ctx.width * 0.66 + 20}" y="${y}" font-size="13" fill="${ctx.colors.text}">${escapeXml(truncate(label, 28))}</text></g>`;
  });
  return svgShell(ctx, [
    `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(radius)}" fill="${ctx.colors.panel}" stroke="${ctx.colors.border}"/>`,
    ...slices,
    ...legend
  ]);
}
__name(renderPie, "renderPie");
function renderSummary(chart) {
  const ctx = createContext(chart);
  const data = (chart.data || []).map((item) => isPlainObject(item) ? item : { value: item });
  const titleOffset = chart.title ? 48 : 0;
  const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(data.length))));
  const gap = 16;
  const cardWidth = (ctx.width - ctx.margin.left - ctx.margin.right - gap * (columns - 1)) / columns;
  const rows = Math.ceil(data.length / columns);
  const availableHeight = ctx.height - ctx.margin.top - ctx.margin.bottom - titleOffset - gap * Math.max(0, rows - 1);
  const cardHeight = Math.max(96, availableHeight / Math.max(1, rows));
  const cards = data.map((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = ctx.margin.left + column * (cardWidth + gap);
    const y = ctx.margin.top + titleOffset + row * (cardHeight + gap);
    const label = String(item.label ?? item.name ?? item.title ?? "Metric");
    const value = String(item.value ?? item.metric ?? item.amount ?? "");
    const delta = item.delta ?? item.change ?? item.trend;
    const description = item.description ?? item.note ?? item.summary;
    const status = String(item.status ?? "").toLowerCase();
    const deltaColor = status === "negative" || String(delta ?? "").trim().startsWith("-") ? ctx.colors.negative : ctx.colors.positive;
    return `<g data-chart-node="summary-card">
      <rect x="${round(x)}" y="${round(y)}" width="${round(cardWidth)}" height="${round(cardHeight)}" rx="8" fill="${ctx.colors.panel}" stroke="${ctx.colors.border}"/>
      <text x="${round(x + 18)}" y="${round(y + 30)}" font-size="14" font-weight="600" fill="${ctx.colors.muted}">${escapeXml(truncate(label, 28))}</text>
      <text x="${round(x + 18)}" y="${round(y + 70)}" font-size="30" font-weight="700" fill="${ctx.colors.text}">${escapeXml(truncate(value, 18))}</text>
      ${delta === void 0 || delta === null || delta === "" ? "" : `<text x="${round(x + 18)}" y="${round(y + 98)}" font-size="14" font-weight="600" fill="${deltaColor}">${escapeXml(String(delta))}</text>`}
      ${description ? `<text x="${round(x + 18)}" y="${round(y + cardHeight - 28)}" font-size="13" fill="${ctx.colors.muted}">${escapeXml(truncate(String(description), 42))}</text>` : ""}
    </g>`;
  });
  return svgShell(ctx, cards);
}
__name(renderSummary, "renderSummary");
function createContext(chart) {
  const width = chart.width || 900;
  const height = chart.height || 520;
  return {
    width,
    height,
    title: chart.title || "",
    colors: THEMES[chart.theme] || THEMES.default,
    margin: { top: chart.title ? 72 : 38, right: 48, bottom: 58, left: 96 }
  };
}
__name(createContext, "createContext");
function svgShell(ctx, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 ${ctx.width} ${ctx.height}" width="${ctx.width}" height="${ctx.height}">
  <title>${escapeXml(ctx.title || "Chart")}</title>
  <rect width="100%" height="100%" fill="${ctx.colors.background}"/>
  ${ctx.title ? `<text data-chart-node="title" x="${ctx.margin.left}" y="40" font-size="24" font-weight="700" fill="${ctx.colors.text}">${escapeXml(ctx.title)}</text>` : ""}
  ${body.join("\n  ")}
</svg>`;
}
__name(svgShell, "svgShell");
function plotBox(ctx) {
  return {
    x: ctx.margin.left,
    y: ctx.margin.top,
    width: ctx.width - ctx.margin.left - ctx.margin.right,
    height: ctx.height - ctx.margin.top - ctx.margin.bottom
  };
}
__name(plotBox, "plotBox");
function grid(ctx, box) {
  const lines = [];
  for (let index = 0; index <= 4; index += 1) {
    const y = box.y + box.height * index / 4;
    lines.push(`<line data-chart-node="grid-line" x1="${box.x}" y1="${round(y)}" x2="${box.x + box.width}" y2="${round(y)}" stroke="${ctx.colors.grid}" stroke-width="1"/>`);
  }
  return lines.join("");
}
__name(grid, "grid");
function axes(ctx, box) {
  return `<g data-chart-node="axes"><line x1="${box.x}" y1="${box.y + box.height}" x2="${box.x + box.width}" y2="${box.y + box.height}" stroke="${ctx.colors.border}"/><line x1="${box.x}" y1="${box.y}" x2="${box.x}" y2="${box.y + box.height}" stroke="${ctx.colors.border}"/></g>`;
}
__name(axes, "axes");
function xLabels(ctx, box, labels) {
  if (!labels.length) return "";
  const indexes = labels.length <= 4 ? labels.map((_, index) => index) : [0, Math.floor((labels.length - 1) / 2), labels.length - 1];
  return indexes.map((index) => {
    const x = box.x + box.width * index / Math.max(1, labels.length - 1);
    return `<text data-chart-node="x-label" x="${round(x)}" y="${box.y + box.height + 22}" text-anchor="middle" font-size="12" fill="${ctx.colors.muted}">${escapeXml(truncate(labels[index], 16))}</text>`;
  }).join("");
}
__name(xLabels, "xLabels");
function yLabels(ctx, box, domain) {
  const min = Array.isArray(domain) ? domain[0] : 0;
  const max = Array.isArray(domain) ? domain[1] : 0;
  return [min, max].map((value, index) => {
    const y = index === 0 ? box.y + box.height : box.y + 4;
    return `<text data-chart-node="y-label" x="${box.x - 12}" y="${round(y)}" text-anchor="end" font-size="12" fill="${ctx.colors.muted}">${escapeXml(formatNumber(value))}</text>`;
  }).join("");
}
__name(yLabels, "yLabels");
function numericData(data = [], valueKey) {
  return data.map((item, index) => ({
    ...item,
    __index: index,
    value: Number(item?.[valueKey])
  })).filter((item) => Number.isFinite(item.value));
}
__name(numericData, "numericData");
function labelFor(item, fallbackIndex) {
  return String(
    item?.time ?? item?.category ?? item?.label ?? item?.name ?? item?.text ?? `Item ${fallbackIndex + 1}`
  );
}
__name(labelFor, "labelFor");
function paddedDomain(min, max) {
  if (min === max) {
    const pad2 = Math.abs(min || 1) * 0.2;
    return [min - pad2, max + pad2];
  }
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}
__name(paddedDomain, "paddedDomain");
function scaleValue(value, domain, targetMin, targetMax) {
  const [min, max] = domain;
  return targetMin - (value - min) / (max - min) * (targetMin - targetMax);
}
__name(scaleValue, "scaleValue");
function arcPath(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return [
    `M ${round(cx)} ${round(cy)}`,
    `L ${round(start.x)} ${round(start.y)}`,
    `A ${round(radius)} ${round(radius)} 0 ${largeArcFlag} 0 ${round(end.x)} ${round(end.y)}`,
    "Z"
  ].join(" ");
}
__name(arcPath, "arcPath");
function polarToCartesian(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  };
}
__name(polarToCartesian, "polarToCartesian");
function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
__name(escapeXml, "escapeXml");
function truncate(value, maxLength) {
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1))}\u2026` : text;
}
__name(truncate, "truncate");
function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return Math.abs(number) >= 1e3 ? number.toLocaleString("en-US", { maximumFractionDigits: 1 }) : String(round(number));
}
__name(formatNumber, "formatNumber");
function round(value) {
  return Math.round(Number(value) * 100) / 100;
}
__name(round, "round");
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject, "isPlainObject");

// src/worker.js
var SERVICE_NAME = "chart-renderer";
var SERVICE_VERSION = "0.2.0";
var CACHE_NAMESPACE = "worker-v4";
var DEFAULT_WIDTH = 900;
var DEFAULT_HEIGHT = 520;
var MIN_SIZE = 100;
var MAX_SIZE = 4096;
var DEFAULT_MAX_BODY_BYTES = 1e6;
var SUPPORTED_THEMES = /* @__PURE__ */ new Set(["default", "dark", "academy"]);
var SUPPORTED_RESPONSE_FORMATS = /* @__PURE__ */ new Set(["config", "svg", "html"]);
var TYPE_ALIASES = /* @__PURE__ */ new Map([
  ["table", "table"],
  ["spreadsheet", "table"],
  ["wordcloud", "word-cloud"],
  ["word_cloud", "word-cloud"],
  ["word cloud", "word-cloud"]
]);
var worker_default = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname === "/health") {
        return jsonResponse(200, {
          status: "ok",
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          runtime: "cloudflare-worker",
          formats: ["config", "svg", "html"],
          planned_formats: [],
          simple_svg_types: SIMPLE_SVG_TYPES
        });
      }
      if (request.method === "GET" && url.pathname === "/viewer") {
        return new Response(renderViewerHtml(), {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      }
      if (request.method !== "POST" || url.pathname !== "/render") {
        return jsonResponse(404, {
          error: "not_found",
          message: "Use GET /health, GET /viewer, or POST /render"
        });
      }
      const payload = await readJsonBody(request, env);
      const validation = validatePayload(payload, request);
      if (!validation.ok) {
        return jsonResponse(validation.status ?? 422, {
          error: validation.error ?? "invalid_chart_payload",
          message: validation.message
        });
      }
      const chart = buildConfigPayload(payload);
      const hash = await hashPayload(chart);
      const format = resolveResponseFormat(payload, request);
      const cacheRequest = buildCacheRequest(url, format, hash);
      const cachedResponse = await caches.default.match(cacheRequest);
      if (cachedResponse) {
        return withCacheStatus(cachedResponse, "hit");
      }
      let response;
      if (format === "svg") {
        if (!canRenderSvg(chart.type)) {
          return jsonResponse(422, {
            error: "unsupported_svg_chart_type",
            message: `SVG rendering is not supported for chart type: ${chart.type}. Use response_format=config or html.`,
            hash,
            chart_type: chart.type
          });
        }
        const svg = renderSvg(chart);
        response = new Response(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": quoteEtag(hash),
            "X-Chart-Hash": hash,
            "X-Chart-Type": chart.type,
            "X-Chart-Renderer": "worker-svg",
            "X-Chart-Cache": "miss"
          }
        });
        await caches.default.put(cacheRequest, withCacheStatus(response.clone(), "hit"));
        return response;
      }
      if (format === "html") {
        response = new Response(renderChartHtml(chart, hash), {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": quoteEtag(hash),
            "X-Chart-Hash": hash,
            "X-Chart-Type": chart.type,
            "X-Chart-Renderer": "client-html",
            "X-Chart-Cache": "miss"
          }
        });
        await caches.default.put(cacheRequest, withCacheStatus(response.clone(), "hit"));
        return response;
      }
      response = jsonResponse(200, {
        success: true,
        hash,
        renderer: "client-config",
        format: "config",
        chart,
        metadata: {
          cache: "miss",
          runtime: "cloudflare-worker"
        }
      }, {
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": quoteEtag(hash),
        "X-Chart-Hash": hash,
        "X-Chart-Type": chart.type,
        "X-Chart-Renderer": "client-config",
        "X-Chart-Cache": "miss"
      });
      await caches.default.put(cacheRequest, withCacheStatus(jsonResponse(200, {
        success: true,
        hash,
        renderer: "client-config",
        format: "config",
        chart,
        metadata: {
          cache: "hit",
          runtime: "cloudflare-worker"
        }
      }, {
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": quoteEtag(hash),
        "X-Chart-Hash": hash,
        "X-Chart-Type": chart.type,
        "X-Chart-Renderer": "client-config",
        "X-Chart-Cache": "hit"
      }), "hit"));
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("body") || message.includes("JSON") ? 400 : 500;
      return jsonResponse(status, {
        error: status === 400 ? "bad_request" : "internal_error",
        message
      });
    }
  }
};
async function readJsonBody(request, env) {
  const maxBodyBytes = Number(env?.MAX_BODY_BYTES || DEFAULT_MAX_BODY_BYTES);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBodyBytes) {
    throw new Error(`request body exceeds ${maxBodyBytes} bytes`);
  }
  const body = await request.text();
  const byteLength = new TextEncoder().encode(body).byteLength;
  if (byteLength === 0) {
    throw new Error("request body is required");
  }
  if (byteLength > maxBodyBytes) {
    throw new Error(`request body exceeds ${maxBodyBytes} bytes`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("request body must be valid JSON");
  }
}
__name(readJsonBody, "readJsonBody");
function validatePayload(payload, request) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "payload must be a JSON object" };
  }
  if (typeof payload.type !== "string" || !payload.type.trim()) {
    return { ok: false, message: "type is required" };
  }
  if (payload.options !== void 0 && !isPlainObject2(payload.options)) {
    return { ok: false, message: "options must be an object when provided" };
  }
  const format = resolveResponseFormat(payload, request);
  if (format === "png") {
    return {
      ok: false,
      status: 422,
      error: "unsupported_response_format",
      message: "Server-side PNG rendering is not supported in the Worker version. Use svg/html/config and download PNG in the browser."
    };
  }
  if (!SUPPORTED_RESPONSE_FORMATS.has(format)) {
    return {
      ok: false,
      message: "response_format must be one of config, svg, or html"
    };
  }
  const chartType = normalizeChartType(payload.type);
  const theme = normalizeTheme(payload.theme ?? payload.options?.theme);
  if (theme === null) {
    return { ok: false, message: "theme must be one of default, dark, academy" };
  }
  if (chartType === "liquid") {
    const percent = Number(payload.percent ?? payload.options?.percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 1) {
      return { ok: false, message: "liquid percent must be a number between 0 and 1" };
    }
  } else if (!Array.isArray(payload.data) || payload.data.length === 0) {
    return { ok: false, message: "data must be a non-empty array" };
  }
  for (const sizeKey of ["width", "height"]) {
    if (payload[sizeKey] === void 0) continue;
    const value = Number(payload[sizeKey]);
    if (!Number.isInteger(value) || value < MIN_SIZE || value > MAX_SIZE) {
      return {
        ok: false,
        message: `${sizeKey} must be an integer between ${MIN_SIZE} and ${MAX_SIZE}`
      };
    }
  }
  return { ok: true };
}
__name(validatePayload, "validatePayload");
function buildConfigPayload(payload) {
  const options = isPlainObject2(payload.options) ? payload.options : {};
  const theme = normalizeTheme(payload.theme ?? options.theme);
  const chart = {
    type: normalizeChartType(payload.type),
    width: payload.width === void 0 ? DEFAULT_WIDTH : Number(payload.width),
    height: payload.height === void 0 ? DEFAULT_HEIGHT : Number(payload.height),
    theme: theme || "default",
    options
  };
  if (Array.isArray(payload.data)) {
    chart.data = payload.data;
  }
  if (typeof payload.title === "string") {
    chart.title = payload.title;
  }
  if (payload.percent !== void 0) {
    chart.percent = Number(payload.percent);
  } else if (options.percent !== void 0) {
    chart.percent = Number(options.percent);
  }
  if (payload.shape !== void 0) {
    chart.shape = payload.shape;
  } else if (options.shape !== void 0) {
    chart.shape = options.shape;
  }
  return chart;
}
__name(buildConfigPayload, "buildConfigPayload");
function resolveResponseFormat(payload, request) {
  const requested = payload?.response_format;
  if (requested !== void 0 && requested !== null && requested !== "") {
    return String(requested).trim().toLowerCase();
  }
  const accept = request.headers.get("accept")?.toLowerCase() || "";
  if (accept.includes("image/png")) return "png";
  if (accept.includes("image/svg+xml")) return "svg";
  if (accept.includes("text/html")) return "html";
  return "config";
}
__name(resolveResponseFormat, "resolveResponseFormat");
function isPlainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject2, "isPlainObject");
function normalizeChartType(type) {
  const normalized = String(type).trim().toLowerCase();
  return TYPE_ALIASES.get(normalized) || normalized;
}
__name(normalizeChartType, "normalizeChartType");
function normalizeTheme(theme) {
  if (theme === void 0 || theme === null || theme === "") return void 0;
  const normalized = String(theme).trim().toLowerCase();
  if (normalized === "light") return "default";
  return SUPPORTED_THEMES.has(normalized) ? normalized : null;
}
__name(normalizeTheme, "normalizeTheme");
async function hashPayload(payload) {
  const canonical = stableStringify(payload);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}
__name(hashPayload, "hashPayload");
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (isPlainObject2(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
__name(stableStringify, "stableStringify");
function jsonResponse(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}
__name(jsonResponse, "jsonResponse");
function quoteEtag(value) {
  return `"${value.replaceAll('"', "")}"`;
}
__name(quoteEtag, "quoteEtag");
function buildCacheRequest(url, format, hash) {
  const cacheUrl = new URL("/", url.origin);
  cacheUrl.pathname = `/__chart-cache/${CACHE_NAMESPACE}/${encodeURIComponent(format)}/${encodeURIComponent(hash)}`;
  return new Request(cacheUrl.toString(), {
    method: "GET"
  });
}
__name(buildCacheRequest, "buildCacheRequest");
function withCacheStatus(response, status) {
  const headers = new Headers(response.headers);
  headers.set("X-Chart-Cache", status);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(withCacheStatus, "withCacheStatus");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-WUw0at/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-WUw0at/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
