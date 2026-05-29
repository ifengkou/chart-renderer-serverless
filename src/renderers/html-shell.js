const GPT_VIS_VERSION = "0.6.1";
const REACT_VERSION = "18";
const HTML_TO_IMAGE_VERSION = "1.11.11";
const CACHE_BUSTER = "viewer-v14";

export function renderChartHtml(chart, hash) {
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

export function renderViewerHtml() {
  const defaultPayload = {
    type: "radar",
    response_format: "html",
    title: "Risk profile",
    width: 900,
    height: 520,
    theme: "default",
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
              <label for="width-input">W</label>
              <input id="width-input" type="number" min="100" max="4096" step="10" value="900">
              <label for="height-input">H</label>
              <input id="height-input" type="number" min="100" max="4096" step="10" value="520">
              <span></span>
              <button id="apply-controls" type="button">Apply</button>
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
  <script id="chart-state" type="application/json">${safeJson(state)}</script>
  <script src="https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react@${REACT_VERSION}/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@antv/gpt-vis@${GPT_VIS_VERSION}/dist/umd/index.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html-to-image@${HTML_TO_IMAGE_VERSION}/dist/html-to-image.min.js"></script>
  <script>${viewerJs()}</script>
</body>
</html>`;
}

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
      width: 100%;
      display: grid;
      grid-template-columns: minmax(280px, 400px) minmax(0, 1fr);
      min-height: 0;
      overflow: hidden;
    }
    .editor-panel {
      display: grid;
      grid-template-rows: auto minmax(260px, 1fr) 180px;
      gap: 12px;
      padding: 16px;
      border-right: 1px solid #d9e1ec;
      background: #ffffff;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
    }
    .control-row {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
    }
    .control-row label {
      color: #667085;
      font-size: 13px;
      font-weight: 700;
    }
    select,
    input[type="number"] {
      height: 34px;
      border: 1px solid #c9d4e5;
      border-radius: 6px;
      background: #ffffff;
      color: #111827;
      font-weight: 700;
    }
    select { min-width: 128px; }
    input[type="number"] {
      width: 100%;
      padding: 0 8px;
    }
    #apply-controls {
      width: 100%;
      min-width: 0;
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
      min-width: 0;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
    }
    .status {
      min-height: 24px;
      color: #667085;
      font-size: 13px;
      font-weight: 600;
    }
    .chart-root {
      flex: 1;
      width: 100%;
      min-width: 0;
      min-height: 0;
      background: #ffffff;
      border: 1px solid #d9e1ec;
      border-radius: 8px;
      padding: 18px;
      overflow: auto;
    }
    .chart-root > pre {
      width: 100%;
      min-width: 0;
      margin: 0;
      font-family: inherit;
      white-space: normal;
      overflow: visible !important;
    }
    .chart-root > svg {
      width: auto;
      height: auto;
      display: block;
      max-width: none;
    }
    .chart-root canvas {
      display: block;
      max-width: none;
    }
    .chart-root [class*="TabContainer-gpt-vis"],
    .chart-root [class*="TabContent-gpt-vis"],
    .chart-root [class*="StyledGPTVis-gpt-vis"],
    .chart-root [class*="ChartWrapper-gpt-vis"] {
      width: auto !important;
      min-width: 0 !important;
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .chart-root [class*="ChartWrapper-gpt-vis"] > div {
      width: auto !important;
      height: auto !important;
      overflow: visible !important;
    }
    .chart-root .chart-size-host,
    .chart-root [class*="ChartWrapper-gpt-vis"] > .chart-size-host {
      width: var(--chart-host-width) !important;
      min-width: var(--chart-host-width) !important;
      height: var(--chart-host-height) !important;
      min-height: var(--chart-host-height) !important;
      max-width: none !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .chart-root iframe {
      width: 100%;
      height: 100%;
      min-height: 0;
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

function viewerJs() {
  return `
    const state = JSON.parse(document.getElementById("chart-state").textContent);
    const endpoint = state.endpoint || "/render";
    const chartRoot = document.getElementById("chart-root");
    const statusEl = document.getElementById("status");
    const payloadInput = document.getElementById("payload-input");
    const themeSelect = document.getElementById("theme-select");
    const widthInput = document.getElementById("width-input");
    const heightInput = document.getElementById("height-input");
    const applyControls = document.getElementById("apply-controls");
    const controlRow = document.querySelector(".control-row");
    const resultOutput = document.getElementById("result-output");
    let currentConfig = state.chart || null;
    let currentPayload = state.payload || state.chart || null;
    let currentSvg = "";
    let currentHtml = "";
    let currentHash = state.hash || "";
    let currentFormat = "config";
    let pendingGptVisChart = null;
    let currentReactRoot = null;
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
      if (currentReactRoot) {
        currentReactRoot.unmount();
        currentReactRoot = null;
      }
      chartRoot.innerHTML = "";
      if (!window.React || !window.ReactDOM || !window.GPTVis) {
        renderFallbackChart(chart);
        setStatus("Rendered with built-in browser fallback; @antv/gpt-vis could not be loaded.");
        return;
      }
      const Component = createGptVisComponent(window.GPTVis);
      currentReactRoot = window.ReactDOM.createRoot(chartRoot);
      currentReactRoot.render(window.React.createElement(Component, { key: chartRenderKey(chart) }, toMarkdown(toGptVisChart(chart))));
      setStatus("Rendered with @antv/gpt-vis@" + state.gptVisVersion);
      bindGptVisTabResize();
      scheduleChartResize(chart);
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
          [chartType.Waterfall || "waterfall", gptVis.Waterfall],
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
      const { width, height } = chartSize(next);
      next.width = width;
      next.height = height;
      next.autoFit = false;
      next.containerStyle = { ...(next.containerStyle || {}), width: width + "px", height: height + "px" };
      next.options = { ...(next.options || {}), width, height, autoFit: false, containerStyle: next.containerStyle };
      return next;
    }

    function chartRenderKey(chart) {
      const { width, height } = chartSize(chart);
      return [chart?.type || "", chartTheme(chart), width, height, currentHash || ""].join(":");
    }

    function chartTheme(chart) {
      const value = String(chart?.theme || chart?.options?.theme || "default").toLowerCase();
      return themeColors[value] ? value : "default";
    }

    function prepareChartFrame(chart) {
      chartRoot.dataset.theme = chartTheme(chart);
      chartRoot.style.removeProperty("--chart-width");
      chartRoot.style.removeProperty("--chart-inner-height");
    }

    function scheduleChartResize(chart = currentConfig) {
      if (chart) prepareChartFrame(chart);
      chartRoot.classList.add("chart-resizing");
      const fireResize = () => {
        applyChartHostSize(chart);
        window.dispatchEvent(new Event("resize"));
        chartRoot.classList.remove("chart-resizing");
      };
      window.requestAnimationFrame(() => {
        fireResize();
        window.setTimeout(fireResize, 250);
      });
    }

    function applyChartHostSize(chart = currentConfig || currentPayload) {
      if (!chart) return;
      const { width, height } = chartSize(chart);
      for (const node of chartRoot.querySelectorAll(".chart-size-host")) {
        node.classList.remove("chart-size-host");
        node.style.removeProperty("--chart-host-width");
        node.style.removeProperty("--chart-host-height");
        node.style.removeProperty("width");
        node.style.removeProperty("min-width");
        node.style.removeProperty("height");
        node.style.removeProperty("min-height");
      }
      const canvas = findRenderableCanvas(chartRoot);
      const host = canvas?.parentElement || chartRoot.querySelector('[class*="ChartWrapper-gpt-vis"] > div');
      if (!host) return;
      host.classList.add("chart-size-host");
      host.style.setProperty("--chart-host-width", width + "px");
      host.style.setProperty("--chart-host-height", height + "px");
      host.style.width = width + "px";
      host.style.minWidth = width + "px";
      host.style.height = height + "px";
      host.style.minHeight = height + "px";
    }

    function bindGptVisTabResize() {
      if (chartRoot.dataset.tabResizeBound === "true") return;
      chartRoot.dataset.tabResizeBound = "true";
      chartRoot.addEventListener("click", (event) => {
        const button = event.target.closest?.("button");
        const label = (button?.textContent || "").trim().toLowerCase();
        if (label === "图表" || label === "chart") {
          window.setTimeout(() => scheduleChartResize(currentConfig), 50);
          window.setTimeout(() => scheduleChartResize(currentConfig), 300);
        }
      });
    }

    function renderFallbackChart(chart) {
      if (currentReactRoot) {
        currentReactRoot.unmount();
        currentReactRoot = null;
      }
      if (chart.type === "radar") {
        renderFallbackRadar(chart);
        return;
      }
      if (chart.type === "waterfall") {
        renderFallbackWaterfall(chart);
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

    function renderFallbackWaterfall(chart) {
      prepareChartFrame(chart);
      const data = Array.isArray(chart.data) ? chart.data : [];
      const { width, height } = chartSize(chart);
      const colors = themeColors[chartTheme(chart)];
      const margin = { top: 72, right: 32, bottom: 70, left: 64 };
      const plotWidth = Math.max(10, width - margin.left - margin.right);
      const plotHeight = Math.max(10, height - margin.top - margin.bottom);
      let running = 0;
      const steps = data.map((item, index) => {
        const value = Number(item.value) || 0;
        const isTotal = Boolean(item.isTotal);
        const start = isTotal ? 0 : running;
        const end = isTotal ? value : running + value;
        if (!isTotal) running = end;
        return {
          index,
          label: item.category || item.name || item.label || "Step " + (index + 1),
          value,
          isTotal,
          start,
          end
        };
      });
      const extents = steps.flatMap((step) => [step.start, step.end, 0]);
      const minValue = Math.min(...extents, 0);
      const maxValue = Math.max(...extents, 1);
      const span = maxValue - minValue || 1;
      const y = (value) => margin.top + ((maxValue - value) / span) * plotHeight;
      const zeroY = y(0);
      const slot = plotWidth / Math.max(1, steps.length);
      const barWidth = Math.max(18, Math.min(72, slot * 0.62));
      const bars = steps.map((step) => {
        const x = margin.left + step.index * slot + (slot - barWidth) / 2;
        const y1 = y(step.start);
        const y2 = y(step.end);
        const top = Math.min(y1, y2);
        const barHeight = Math.max(2, Math.abs(y2 - y1));
        const fill = step.isTotal ? "#2563eb" : step.value >= 0 ? "#16a34a" : "#dc2626";
        const valueY = top - 8 < margin.top ? top + barHeight + 16 : top - 8;
        return '<g data-chart-node="fallback-waterfall">' +
          '<rect x="' + round(x) + '" y="' + round(top) + '" width="' + round(barWidth) + '" height="' + round(barHeight) + '" rx="4" fill="' + fill + '"/>' +
          '<text x="' + round(x + barWidth / 2) + '" y="' + round(valueY) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + colors.text + '">' + escapeHtml(formatNumber(step.end)) + '</text>' +
          '<text x="' + round(x + barWidth / 2) + '" y="' + round(height - margin.bottom + 28) + '" text-anchor="middle" font-size="11" fill="' + colors.muted + '">' + escapeHtml(truncateLabel(step.label, 14)) + '</text>' +
          '</g>';
      }).join("");
      const connectors = steps.slice(0, -1).map((step, index) => {
        const fromX = margin.left + index * slot + (slot + barWidth) / 2;
        const toX = margin.left + (index + 1) * slot + (slot - barWidth) / 2;
        const lineY = y(step.end);
        return '<line x1="' + round(fromX) + '" y1="' + round(lineY) + '" x2="' + round(toX) + '" y2="' + round(lineY) + '" stroke="' + colors.grid + '" stroke-dasharray="4 4"/>';
      }).join("");
      currentSvg = '<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '">' +
        '<title>' + escapeHtml(chart.title || "Waterfall chart") + '</title>' +
        '<rect width="100%" height="100%" fill="' + colors.background + '"/>' +
        '<text x="24" y="34" font-size="22" font-weight="700" fill="' + colors.text + '">' + escapeHtml(chart.title || "Waterfall chart") + '</text>' +
        '<line x1="' + margin.left + '" y1="' + round(zeroY) + '" x2="' + (width - margin.right) + '" y2="' + round(zeroY) + '" stroke="' + colors.grid + '"/>' +
        '<text x="' + (margin.left - 12) + '" y="' + round(zeroY + 4) + '" text-anchor="end" font-size="12" fill="' + colors.muted + '">0</text>' +
        connectors + bars +
        '</svg>';
      chartRoot.innerHTML = currentSvg;
    }

    function renderSvg(svg) {
      if (currentReactRoot) {
        currentReactRoot.unmount();
        currentReactRoot = null;
      }
      prepareChartFrame(currentPayload || currentConfig);
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
        if (currentReactRoot) {
          currentReactRoot.unmount();
          currentReactRoot = null;
        }
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
        syncSizeControls(data.chart);
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

    function syncSizeControls(payload) {
      if (widthInput) widthInput.value = Number(payload?.width) || 900;
      if (heightInput) heightInput.value = Number(payload?.height) || 520;
    }

    function applyControlSelection() {
      const payload = readPayloadInput();
      payload.theme = themeSelect.value;
      const width = Number(widthInput?.value || 900);
      const height = Number(heightInput?.value || 520);
      payload.width = Math.min(4096, Math.max(100, Math.round(width)));
      payload.height = Math.min(4096, Math.max(100, Math.round(height)));
      writePayloadInput(payload);
      currentPayload = payload;
      return renderPayload(currentFormat || "config");
    }

    function handleControlKeydown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        safeRun(applyControlSelection);
      }
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
        const exportCanvas = canvasToExportCanvas(renderedCanvas);
        const blob = await new Promise((resolve) => exportCanvas.toBlob(resolve, "image/png"));
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
        const { width, height } = chartSize(currentConfig || currentPayload);
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);
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
      const { width, height } = chartSize(currentConfig || currentPayload);
      const blob = await window.htmlToImage.toBlob(exportRoot, { width, height, canvasWidth: width, canvasHeight: height, backgroundColor: themeColors[chartTheme(currentConfig || currentPayload)].background });
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

    function chartSize(chart) {
      const width = Math.min(4096, Math.max(100, Math.round(Number(chart?.width) || Number(chart?.options?.width) || 900)));
      const height = Math.min(4096, Math.max(100, Math.round(Number(chart?.height) || Number(chart?.options?.height) || 520)));
      return { width, height };
    }

    function formatNumber(value) {
      const number = Number(value) || 0;
      if (Math.abs(number) >= 1000000) return (number / 1000000).toFixed(1).replace(/\\.0$/, "") + "M";
      if (Math.abs(number) >= 1000) return (number / 1000).toFixed(1).replace(/\\.0$/, "") + "K";
      return String(Math.round(number * 100) / 100);
    }

    function truncateLabel(value, maxLength) {
      const text = String(value);
      return text.length > maxLength ? text.slice(0, Math.max(1, maxLength - 1)) + "..." : text;
    }

    function round(value) {
      return Math.round(value * 100) / 100;
    }

    function canvasToExportCanvas(sourceCanvas) {
      const { width, height } = chartSize(currentConfig || currentPayload);
      if (sourceCanvas.width === width && sourceCanvas.height === height) return sourceCanvas;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(sourceCanvas, 0, 0, width, height);
      return canvas;
    }

    function canvasToSvg(canvas) {
      const { width, height } = chartSize(currentConfig || currentPayload);
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
      if (pendingGptVisChart && /Unknown Component: theme\\.|not supported/i.test(message)) {
        event.preventDefault();
        renderFallbackChart(pendingGptVisChart);
        setStatus("Rendered with built-in browser fallback after GPT-Vis failed: " + message);
      }
    });

    if (payloadInput) {
      payloadInput.value = JSON.stringify(state.payload, null, 2);
      syncThemeControl(state.payload);
      syncSizeControls(state.payload);
      applyControls?.addEventListener("click", () => safeRun(applyControlSelection));
      widthInput?.addEventListener("keydown", handleControlKeydown);
      heightInput?.addEventListener("keydown", handleControlKeydown);
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

function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\\u2028", "\\\\u2028")
    .replaceAll("\\u2029", "\\\\u2029");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
