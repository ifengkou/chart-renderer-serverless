import assert from "node:assert/strict";
import { renderChartHtml, renderViewerHtml } from "./renderers/html-shell.js";

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
assert.match(html, /@antv\/gpt-vis@0\.5\.7/);
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
assert.match(viewer, /id="payload-input"/);
assert.match(viewer, /id="theme-select"/);
assert.match(viewer, /id="width-input"/);
assert.match(viewer, /id="height-input"/);
assert.match(viewer, /id="render-config"/);
assert.match(viewer, /id="render-svg"/);
assert.match(viewer, /id="render-html"/);

console.log(JSON.stringify({ success: true, html_cases: 2 }));
