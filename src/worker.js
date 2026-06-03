import { FAVICON_SVG, LOGO_SVG } from "./assets.js";
import { renderApiDocsHtml } from "./renderers/api-docs.js";
import { renderChartHtml, renderViewerHtml } from "./renderers/html-shell.js";
import { renderLandingHtml } from "./renderers/landing-page.js";
import { canRenderSvg, renderSvg, SIMPLE_SVG_TYPES } from "./renderers/svg.js";

const SERVICE_NAME = "chart-renderer";
const SERVICE_VERSION = "0.2.0";
const CACHE_NAMESPACE = "worker-v17";
const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 520;
const MIN_SIZE = 100;
const MAX_SIZE = 4096;
const DEFAULT_MAX_BODY_BYTES = 1_000_000;
const SUPPORTED_THEMES = new Set(["default", "dark", "academy"]);
const SUPPORTED_RESPONSE_FORMATS = new Set(["config", "svg", "html"]);
const TYPE_ALIASES = new Map([
  ["table", "table"],
  ["spreadsheet", "table"],
  ["wordcloud", "word-cloud"],
  ["word_cloud", "word-cloud"],
  ["word cloud", "word-cloud"]
]);

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/") {
        return new Response(renderLandingHtml(), {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      }

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

      if (request.method === "GET" && (url.pathname === "/api" || url.pathname === "/docs/api")) {
        return new Response(renderApiDocsHtml(), {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      }

      if (request.method === "GET" && (url.pathname === "/favicon.svg" || url.pathname === "/favicon.ico")) {
        return svgAssetResponse(FAVICON_SVG);
      }

      if (request.method === "GET" && url.pathname === "/logo.svg") {
        return svgAssetResponse(LOGO_SVG);
      }

      if (request.method !== "POST" || url.pathname !== "/render") {
        return jsonResponse(404, {
          error: "not_found",
          message: "Use GET /health, GET /viewer, GET /api, or POST /render"
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

function validatePayload(payload, request) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "payload must be a JSON object" };
  }
  if (typeof payload.type !== "string" || !payload.type.trim()) {
    return { ok: false, message: "type is required" };
  }
  if (payload.options !== undefined && !isPlainObject(payload.options)) {
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
    if (payload[sizeKey] === undefined) continue;
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

function buildConfigPayload(payload) {
  const options = isPlainObject(payload.options) ? payload.options : {};
  const theme = normalizeTheme(payload.theme ?? options.theme);
  const chart = {
    type: normalizeChartType(payload.type),
    width: payload.width === undefined ? DEFAULT_WIDTH : Number(payload.width),
    height: payload.height === undefined ? DEFAULT_HEIGHT : Number(payload.height),
    theme: theme || "default",
    options
  };

  if (Array.isArray(payload.data)) {
    chart.data = payload.data;
  }
  if (typeof payload.title === "string") {
    chart.title = payload.title;
  }
  if (payload.percent !== undefined) {
    chart.percent = Number(payload.percent);
  } else if (options.percent !== undefined) {
    chart.percent = Number(options.percent);
  }
  if (payload.shape !== undefined) {
    chart.shape = payload.shape;
  } else if (options.shape !== undefined) {
    chart.shape = options.shape;
  }

  return chart;
}

function resolveResponseFormat(payload, request) {
  const requested = payload?.response_format;
  if (requested !== undefined && requested !== null && requested !== "") {
    return String(requested).trim().toLowerCase();
  }
  const accept = request.headers.get("accept")?.toLowerCase() || "";
  if (accept.includes("image/png")) return "png";
  if (accept.includes("image/svg+xml")) return "svg";
  if (accept.includes("text/html")) return "html";
  return "config";
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

async function hashPayload(payload) {
  const canonical = stableStringify(payload);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function jsonResponse(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function svgAssetResponse(svg) {
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

function quoteEtag(value) {
  return `"${value.replaceAll('"', "")}"`;
}

function buildCacheRequest(url, format, hash) {
  const cacheUrl = new URL("/", url.origin);
  cacheUrl.pathname = `/__chart-cache/${CACHE_NAMESPACE}/${encodeURIComponent(format)}/${encodeURIComponent(hash)}`;
  return new Request(cacheUrl.toString(), {
    method: "GET"
  });
}

function withCacheStatus(response, status) {
  const headers = new Headers(response.headers);
  headers.set("X-Chart-Cache", status);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
