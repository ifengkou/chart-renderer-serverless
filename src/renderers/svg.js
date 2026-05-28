const PALETTE = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];
const THEMES = {
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

export const SIMPLE_SVG_TYPES = ["line", "bar", "column", "pie", "summary"];

export function canRenderSvg(type) {
  return SIMPLE_SVG_TYPES.includes(type);
}

export function renderSvg(chart) {
  if (chart.type === "line") return renderLine(chart);
  if (chart.type === "bar") return renderBar(chart);
  if (chart.type === "column") return renderColumn(chart);
  if (chart.type === "pie") return renderPie(chart);
  if (chart.type === "summary") return renderSummary(chart);
  throw new Error(`SVG rendering is not supported for chart type: ${chart.type}`);
}

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
    x: inner.x + (inner.width * index) / count,
    y: scaleValue(item.value, domain, inner.y + inner.height, inner.y)
  }));
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${round(point.x)} ${round(point.y)}`)
    .join(" ");

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

function renderBar(chart) {
  const ctx = createContext(chart);
  const data = numericData(chart.data, "value").slice(0, 24);
  const inner = plotBox(ctx);
  const max = Math.max(...data.map((item) => item.value), 0);
  const barGap = 8;
  const barHeight = Math.max(8, (inner.height - barGap * Math.max(0, data.length - 1)) / data.length);

  const nodes = data.map((item, index) => {
    const y = inner.y + index * (barHeight + barGap);
    const width = max === 0 ? 0 : (item.value / max) * inner.width;
    const label = labelFor(item, index);
    return [
      `<rect data-chart-node="bar" x="${inner.x}" y="${round(y)}" width="${round(width)}" height="${round(barHeight)}" rx="4" fill="${PALETTE[index % PALETTE.length]}"><title>${escapeXml(label)}: ${escapeXml(item.value)}</title></rect>`,
      `<text x="${inner.x - 10}" y="${round(y + barHeight * 0.66)}" text-anchor="end" font-size="12" fill="${ctx.colors.muted}">${escapeXml(truncate(label, 18))}</text>`,
      `<text x="${round(inner.x + width + 8)}" y="${round(y + barHeight * 0.66)}" font-size="12" fill="${ctx.colors.text}">${escapeXml(formatNumber(item.value))}</text>`
    ].join("");
  });

  return svgShell(ctx, [grid(ctx, inner), axes(ctx, inner), ...nodes]);
}

function renderColumn(chart) {
  const ctx = createContext(chart);
  const data = numericData(chart.data, "value").slice(0, 32);
  const inner = plotBox(ctx);
  const max = Math.max(...data.map((item) => item.value), 0);
  const gap = 10;
  const columnWidth = Math.max(6, (inner.width - gap * Math.max(0, data.length - 1)) / data.length);

  const nodes = data.map((item, index) => {
    const height = max === 0 ? 0 : (item.value / max) * inner.height;
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

function renderPie(chart) {
  const ctx = createContext(chart);
  const data = numericData(chart.data, "value").filter((item) => item.value > 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = Math.max(60, Math.min(ctx.width, ctx.height) * 0.28);
  const cx = ctx.width * 0.38;
  const cy = ctx.height * 0.56;
  let startAngle = -Math.PI / 2;

  const slices = data.map((item, index) => {
    const angle = total === 0 ? 0 : (item.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const d = arcPath(cx, cy, radius, startAngle, endAngle);
    const label = labelFor(item, index);
    const node = `<path data-chart-node="pie-slice" d="${d}" fill="${PALETTE[index % PALETTE.length]}" stroke="${ctx.colors.background}" stroke-width="2"><title>${escapeXml(label)}: ${escapeXml(formatNumber(item.value))}</title></path>`;
    startAngle = endAngle;
    return node;
  });

  const legend = data.map((item, index) => {
    const y = ctx.margin.top + 70 + index * 24;
    const label = `${labelFor(item, index)} ${total ? Math.round((item.value / total) * 100) : 0}%`;
    return `<g data-chart-node="pie-legend"><rect x="${ctx.width * 0.66}" y="${y - 11}" width="12" height="12" rx="2" fill="${PALETTE[index % PALETTE.length]}"/><text x="${ctx.width * 0.66 + 20}" y="${y}" font-size="13" fill="${ctx.colors.text}">${escapeXml(truncate(label, 28))}</text></g>`;
  });

  return svgShell(ctx, [
    `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(radius)}" fill="${ctx.colors.panel}" stroke="${ctx.colors.border}"/>`,
    ...slices,
    ...legend
  ]);
}

function renderSummary(chart) {
  const ctx = createContext(chart);
  const data = (chart.data || []).map((item) => (isPlainObject(item) ? item : { value: item }));
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
    const deltaColor = status === "negative" || String(delta ?? "").trim().startsWith("-")
      ? ctx.colors.negative
      : ctx.colors.positive;

    return `<g data-chart-node="summary-card">
      <rect x="${round(x)}" y="${round(y)}" width="${round(cardWidth)}" height="${round(cardHeight)}" rx="8" fill="${ctx.colors.panel}" stroke="${ctx.colors.border}"/>
      <text x="${round(x + 18)}" y="${round(y + 30)}" font-size="14" font-weight="600" fill="${ctx.colors.muted}">${escapeXml(truncate(label, 28))}</text>
      <text x="${round(x + 18)}" y="${round(y + 70)}" font-size="30" font-weight="700" fill="${ctx.colors.text}">${escapeXml(truncate(value, 18))}</text>
      ${delta === undefined || delta === null || delta === "" ? "" : `<text x="${round(x + 18)}" y="${round(y + 98)}" font-size="14" font-weight="600" fill="${deltaColor}">${escapeXml(String(delta))}</text>`}
      ${description ? `<text x="${round(x + 18)}" y="${round(y + cardHeight - 28)}" font-size="13" fill="${ctx.colors.muted}">${escapeXml(truncate(String(description), 42))}</text>` : ""}
    </g>`;
  });

  return svgShell(ctx, cards);
}

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

function svgShell(ctx, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 ${ctx.width} ${ctx.height}" width="${ctx.width}" height="${ctx.height}">
  <title>${escapeXml(ctx.title || "Chart")}</title>
  <rect width="100%" height="100%" fill="${ctx.colors.background}"/>
  ${ctx.title ? `<text data-chart-node="title" x="${ctx.margin.left}" y="40" font-size="24" font-weight="700" fill="${ctx.colors.text}">${escapeXml(ctx.title)}</text>` : ""}
  ${body.join("\n  ")}
</svg>`;
}

function plotBox(ctx) {
  return {
    x: ctx.margin.left,
    y: ctx.margin.top,
    width: ctx.width - ctx.margin.left - ctx.margin.right,
    height: ctx.height - ctx.margin.top - ctx.margin.bottom
  };
}

function grid(ctx, box) {
  const lines = [];
  for (let index = 0; index <= 4; index += 1) {
    const y = box.y + (box.height * index) / 4;
    lines.push(`<line data-chart-node="grid-line" x1="${box.x}" y1="${round(y)}" x2="${box.x + box.width}" y2="${round(y)}" stroke="${ctx.colors.grid}" stroke-width="1"/>`);
  }
  return lines.join("");
}

function axes(ctx, box) {
  return `<g data-chart-node="axes"><line x1="${box.x}" y1="${box.y + box.height}" x2="${box.x + box.width}" y2="${box.y + box.height}" stroke="${ctx.colors.border}"/><line x1="${box.x}" y1="${box.y}" x2="${box.x}" y2="${box.y + box.height}" stroke="${ctx.colors.border}"/></g>`;
}

function xLabels(ctx, box, labels) {
  if (!labels.length) return "";
  const indexes = labels.length <= 4
    ? labels.map((_, index) => index)
    : [0, Math.floor((labels.length - 1) / 2), labels.length - 1];
  return indexes.map((index) => {
    const x = box.x + (box.width * index) / Math.max(1, labels.length - 1);
    return `<text data-chart-node="x-label" x="${round(x)}" y="${box.y + box.height + 22}" text-anchor="middle" font-size="12" fill="${ctx.colors.muted}">${escapeXml(truncate(labels[index], 16))}</text>`;
  }).join("");
}

function yLabels(ctx, box, domain) {
  const min = Array.isArray(domain) ? domain[0] : 0;
  const max = Array.isArray(domain) ? domain[1] : 0;
  return [min, max].map((value, index) => {
    const y = index === 0 ? box.y + box.height : box.y + 4;
    return `<text data-chart-node="y-label" x="${box.x - 12}" y="${round(y)}" text-anchor="end" font-size="12" fill="${ctx.colors.muted}">${escapeXml(formatNumber(value))}</text>`;
  }).join("");
}

function numericData(data = [], valueKey) {
  return data
    .map((item, index) => ({
      ...item,
      __index: index,
      value: Number(item?.[valueKey])
    }))
    .filter((item) => Number.isFinite(item.value));
}

function labelFor(item, fallbackIndex) {
  return String(
    item?.time ??
    item?.category ??
    item?.label ??
    item?.name ??
    item?.text ??
    `Item ${fallbackIndex + 1}`
  );
}

function paddedDomain(min, max) {
  if (min === max) {
    const pad = Math.abs(min || 1) * 0.2;
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function scaleValue(value, domain, targetMin, targetMax) {
  const [min, max] = domain;
  return targetMin - ((value - min) / (max - min)) * (targetMin - targetMax);
}

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

function polarToCartesian(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  };
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncate(value, maxLength) {
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1))}…` : text;
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return Math.abs(number) >= 1000 ? number.toLocaleString("en-US", { maximumFractionDigits: 1 }) : String(round(number));
}

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
