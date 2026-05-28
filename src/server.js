import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createCanvas } from "canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require.extensions[".css"] = () => {};
const packageJson = JSON.parse(
  await readFile(join(__dirname, "..", "package.json"), "utf8")
);
const { render } = await import("@antv/gpt-vis-ssr");

const HOST = process.env.CHART_RENDERER_HOST || "0.0.0.0";
const PORT = Number(process.env.CHART_RENDERER_PORT || 8787);
const MAX_BODY_BYTES = Number(process.env.CHART_RENDERER_MAX_BODY_BYTES || 1_000_000);
const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 520;
const MIN_SIZE = 100;
const MAX_SIZE = 4096;
const SUPPORTED_THEMES = new Set(["default", "dark", "academy"]);
const TYPE_ALIASES = new Map([
  ["table", "spreadsheet"],
  ["wordcloud", "word-cloud"],
  ["word_cloud", "word-cloud"],
  ["word cloud", "word-cloud"]
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJson(response, 200, {
        status: "ok",
        service: packageJson.name,
        version: packageJson.version,
        provider: "gpt_vis_ssr",
        dependency: {
          "@antv/gpt-vis-ssr": packageJson.dependencies["@antv/gpt-vis-ssr"]
        }
      });
    }

    if (request.method !== "POST" || url.pathname !== "/render") {
      return sendJson(response, 404, {
        error: "not_found",
        message: "Use GET /health or POST /render"
      });
    }

    const payload = await readJsonBody(request);
    const validation = validatePayload(payload);
    if (!validation.ok) {
      return sendJson(response, 422, {
        error: "invalid_chart_payload",
        message: validation.message
      });
    }

    const renderPayload = buildRenderPayload(payload);
    const startedAt = performance.now();
    let result;
    try {
      result =
        renderPayload.type === "summary"
          ? await renderSummary(renderPayload)
          : await render(renderPayload);
      const buffer = result.toBuffer();
      const durationMs = Math.round((performance.now() - startedAt) * 1000) / 1000;
      const metadata = {
        provider: renderPayload.type === "summary" ? "chart_renderer" : "gpt_vis_ssr",
        renderer_version: packageJson.dependencies["@antv/gpt-vis-ssr"],
        chart_type: renderPayload.type,
        width: renderPayload.width,
        height: renderPayload.height,
        byte_length: buffer.byteLength,
        duration_ms: durationMs
      };

      const wantsPng =
        payload.response_format === "png" ||
        request.headers.accept?.toLowerCase().includes("image/png");

      if (wantsPng) {
        response.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": String(buffer.byteLength),
          "X-Chart-Provider": metadata.provider,
          "X-Chart-Type": String(metadata.chart_type),
          "X-Chart-Width": String(metadata.width),
          "X-Chart-Height": String(metadata.height),
          "X-Render-Duration-Ms": String(metadata.duration_ms)
        });
        return response.end(buffer);
      }

      return sendJson(response, 200, {
        success: true,
        image_base64: buffer.toString("base64"),
        metadata
      });
    } catch (error) {
      return sendJson(response, 500, {
        error: "render_failed",
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      result?.destroy?.();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("body") || message.includes("JSON") ? 400 : 500;
    return sendJson(response, status, {
      error: status === 400 ? "bad_request" : "internal_error",
      message
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`chart-renderer listening on http://${HOST}:${PORT}`);
});

async function readJsonBody(request) {
  const chunks = [];
  let bytes = 0;

  for await (const chunk of request) {
    bytes += chunk.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      throw new Error(`request body exceeds ${MAX_BODY_BYTES} bytes`);
    }
    chunks.push(chunk);
  }

  if (bytes === 0) {
    throw new Error("request body is required");
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("request body must be valid JSON");
  }
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "payload must be a JSON object" };
  }
  if (typeof payload.type !== "string" || !payload.type.trim()) {
    return { ok: false, message: "type is required" };
  }
  const chartType = normalizeChartType(payload.type);
  if (payload.options !== undefined && !isPlainObject(payload.options)) {
    return { ok: false, message: "options must be an object when provided" };
  }
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
    if (payload[sizeKey] === undefined) continue;
    const value = Number(payload[sizeKey]);
    if (!Number.isInteger(value) || value < MIN_SIZE || value > MAX_SIZE) {
      return {
        ok: false,
        message: `${sizeKey} must be an integer between ${MIN_SIZE} and ${MAX_SIZE}`
      };
    }
  }
  if (
    payload.response_format !== undefined &&
    !["json", "png"].includes(String(payload.response_format))
  ) {
    return { ok: false, message: "response_format must be either json or png" };
  }
  return { ok: true };
}

function buildRenderPayload(payload) {
  const chartType = normalizeChartType(payload.type);
  const options = isPlainObject(payload.options) ? payload.options : {};
  const theme = normalizeTheme(payload.theme ?? options.theme);
  return {
    ...options,
    type: chartType,
    ...(Array.isArray(payload.data) ? { data: payload.data } : {}),
    title: typeof payload.title === "string" ? payload.title : undefined,
    width: payload.width === undefined ? DEFAULT_WIDTH : Number(payload.width),
    height: payload.height === undefined ? DEFAULT_HEIGHT : Number(payload.height),
    ...(theme ? { theme } : {}),
    ...(payload.percent !== undefined ? { percent: Number(payload.percent) } : {}),
    ...(payload.shape !== undefined ? { shape: payload.shape } : {})
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeChartType(type) {
  const normalized = String(type).trim().toLowerCase();
  return TYPE_ALIASES.get(normalized) || normalized;
}

function normalizeTheme(theme) {
  if (theme === undefined || theme === null || theme === "") return undefined;
  const normalized = String(theme).trim().toLowerCase();
  if (normalized === "light") return "default";
  return SUPPORTED_THEMES.has(normalized) ? normalized : null;
}

async function renderSummary(options) {
  const {
    data = [],
    title,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    theme = "default"
  } = options;
  const ratio = 2;
  const canvas = createCanvas(width * ratio, height * ratio);
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);

  const colors = summaryTheme(theme);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, height);

  const margin = 32;
  const titleHeight = title ? 48 : 0;
  if (title) {
    context.fillStyle = colors.text;
    context.font = "600 24px Arial";
    context.fillText(String(title), margin, 38);
  }

  const items = data.map((item) => (isPlainObject(item) ? item : { value: item }));
  const columnCount = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(items.length))));
  const gap = 16;
  const cardWidth = (width - margin * 2 - gap * (columnCount - 1)) / columnCount;
  const rowCount = Math.ceil(items.length / columnCount);
  const availableHeight = height - margin * 2 - titleHeight - gap * Math.max(0, rowCount - 1);
  const cardHeight = Math.max(96, availableHeight / Math.max(1, rowCount));

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);
    const x = margin + column * (cardWidth + gap);
    const y = margin + titleHeight + row * (cardHeight + gap);
    drawSummaryItem(context, item, { x, y, width: cardWidth, height: cardHeight }, colors);
  }

  return {
    toBuffer: () => canvas.toBuffer("image/png"),
    destroy: () => {}
  };
}

function drawSummaryItem(context, item, rect, colors) {
  const { x, y, width, height } = rect;
  const label = String(item.label ?? item.name ?? item.title ?? "Metric");
  const value = String(item.value ?? item.metric ?? item.amount ?? "");
  const delta = item.delta ?? item.change ?? item.trend;
  const description = item.description ?? item.note ?? item.summary;
  const status = String(item.status ?? "").toLowerCase();

  context.fillStyle = colors.card;
  roundRect(context, x, y, width, height, 8);
  context.fill();
  context.strokeStyle = colors.border;
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = colors.muted;
  context.font = "500 14px Arial";
  context.fillText(label, x + 18, y + 30);

  context.fillStyle = colors.text;
  context.font = "700 30px Arial";
  fitText(context, value, x + 18, y + 70, width - 36, 30);

  if (delta !== undefined && delta !== null && delta !== "") {
    context.fillStyle = status === "negative" || String(delta).trim().startsWith("-")
      ? colors.negative
      : colors.positive;
    context.font = "600 14px Arial";
    context.fillText(String(delta), x + 18, y + 98);
  }

  if (description) {
    context.fillStyle = colors.muted;
    context.font = "400 13px Arial";
    wrapText(context, String(description), x + 18, y + height - 34, width - 36, 17, 2);
  }
}

function summaryTheme(theme) {
  if (theme === "dark") {
    return {
      background: "#0b0f17",
      card: "#121826",
      border: "#263247",
      text: "#f8fafc",
      muted: "#a7b0c0",
      positive: "#4ade80",
      negative: "#fb7185"
    };
  }
  if (theme === "academy") {
    return {
      background: "#fffdf7",
      card: "#ffffff",
      border: "#d8ccb2",
      text: "#2d2618",
      muted: "#74664e",
      positive: "#16794c",
      negative: "#b42318"
    };
  }
  return {
    background: "#ffffff",
    card: "#f8fafc",
    border: "#d9e1ec",
    text: "#111827",
    muted: "#667085",
    positive: "#079455",
    negative: "#d92d20"
  };
}

function fitText(context, text, x, y, maxWidth, fontSize) {
  let size = fontSize;
  while (size > 14) {
    context.font = `700 ${size}px Arial`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  context.fillText(text, x, y);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/);
  let line = "";
  let lineIndex = 0;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, y + lineIndex * lineHeight);
      line = word;
      lineIndex += 1;
      if (lineIndex >= maxLines) return;
    } else {
      line = candidate;
    }
  }
  if (line && lineIndex < maxLines) {
    context.fillText(line, x, y + lineIndex * lineHeight);
  }
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}
