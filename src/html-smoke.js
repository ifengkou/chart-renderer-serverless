import assert from "node:assert/strict";
import { renderApiDocsHtml } from "./renderers/api-docs.js";
import { renderChartHtml, renderViewerHtml } from "./renderers/html-shell.js";
import { renderLandingHtml } from "./renderers/landing-page.js";

const chart = {
  type: "radar",
  title: "Risk <Profile> & Review",
  width: 900,
  height: 520,
  theme: "default",
  options: {},
  data: [
    { group: "Token A", name: "Liquidity", value: 80 },
    { group: "Token A", name: "Risk", value: 40 }
  ]
};

const html = renderChartHtml(chart, "sha256:test");
assert.match(html, /^<!doctype html>/);
assert.match(html, /@antv\/gpt-vis@0\.6\.1/);
assert.match(html, /rel="icon" href="\/favicon\.svg"/);
assert.match(html, /id="chart-root"/);
assert.match(html, /id="download-json"/);
assert.match(html, /id="download-svg"/);
assert.match(html, /id="download-png"/);
assert.match(html, /html-to-image@1\.11\.11/);
assert.equal(html.includes("Risk <Profile> & Review"), false);
assert.ok(html.includes("Risk &lt;Profile&gt; &amp; Review"));
assert.ok(html.includes("\\u003cProfile\\u003e"));

const viewer = renderViewerHtml();
assert.match(viewer, /^<!doctype html>/);
assert.match(viewer, /rel="icon" href="\/favicon\.svg"/);
assert.match(viewer, /class="brand-logo" src="\/logo\.svg"/);
assert.match(viewer, /id="payload-input"/);
assert.match(viewer, /id="theme-select"/);
assert.match(viewer, /id="width-input"/);
assert.match(viewer, /id="height-input"/);
assert.match(viewer, /id="apply-controls"/);
assert.match(viewer, /id="render-config"/);
assert.match(viewer, /id="render-svg"/);
assert.match(viewer, /id="render-html"/);
assert.doesNotMatch(viewer, /chartRoot\.style\.setProperty\("--chart-width"/);
assert.doesNotMatch(viewer, /\[class\*="TabContainer-gpt-vis"\][\s\S]*width: var\(--chart-width/);
assert.match(viewer, /chartRoot\.style\.removeProperty\("--chart-width"\)/);
assert.match(viewer, /chart-size-host/);
assert.match(viewer, /applyChartHostSize\(chart\)/);
assert.match(viewer, /--chart-host-width/);
assert.match(viewer, /\[chartType\.Waterfall \|\| "waterfall", gptVis\.Waterfall\]/);
assert.match(viewer, /\[chartType\.Liquid \|\| "liquid", gptVis\.Liquid\]/);
assert.match(viewer, /\[chartType\.Table \|\| "table", gptVis\.Table\]/);
assert.match(viewer, /renderFallbackWaterfall\(chart\)/);
assert.match(viewer, /data-chart-node="fallback-waterfall"/);
assert.match(viewer, /renderFallbackLiquid\(chart\)/);
assert.match(viewer, /data-chart-node="fallback-liquid"/);
assert.doesNotMatch(viewer, /Rendered with @antv\/gpt-vis/);

const apiDocs = renderApiDocsHtml();
assert.match(apiDocs, /^<!doctype html>/);
assert.match(apiDocs, /Chart Renderer API/);
assert.match(apiDocs, /href="\/viewer"/);
assert.match(apiDocs, /POST \/render/);
assert.match(apiDocs, /\/docs\/api/);
assert.match(apiDocs, /response_format=png/);
assert.match(apiDocs, /\.panel \{[\s\S]*max-width: 100%/);
assert.match(apiDocs, /\.panel table \{[\s\S]*overflow-x: auto/);

const landing = renderLandingHtml();
assert.match(landing, /^<!doctype html>/);
assert.match(landing, /Render charts without server-side canvas/);
assert.match(landing, /href="\/viewer"/);
assert.match(landing, /href="\/api"/);
assert.match(landing, /src="\/logo\.svg"/);
assert.match(landing, /POST \/render/);

console.log(JSON.stringify({ success: true, html_cases: 4 }));
