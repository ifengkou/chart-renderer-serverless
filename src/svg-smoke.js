import assert from "node:assert/strict";
import { canRenderSvg, renderSvg, SIMPLE_SVG_TYPES } from "./renderers/svg.js";

const cases = [
  {
    type: "line",
    title: "Line <Smoke> & Check",
    data: [
      { time: "2026-05-01", value: 1.12 },
      { time: "2026-05-02", value: 1.18 }
    ],
    requiredNode: 'data-chart-node="line-path"'
  },
  {
    type: "bar",
    title: "Bar Smoke",
    data: [
      { category: "A & B", value: 10 },
      { category: "C < D", value: 18 }
    ],
    requiredNode: 'data-chart-node="bar"'
  },
  {
    type: "column",
    title: "Column Smoke",
    data: [
      { category: "Jan", value: 12 },
      { category: "Feb", value: 20 }
    ],
    requiredNode: 'data-chart-node="column"'
  },
  {
    type: "pie",
    title: "Pie Smoke",
    data: [
      { category: "Top 10", value: 42 },
      { category: "Others", value: 58 }
    ],
    requiredNode: 'data-chart-node="pie-slice"'
  },
  {
    type: "summary",
    title: "Summary Smoke",
    data: [
      { label: "Price <USD>", value: "$1.12", delta: "+3.4%", description: "Escapes & remains valid" }
    ],
    requiredNode: 'data-chart-node="summary-card"'
  }
];

assert.deepEqual(SIMPLE_SVG_TYPES, ["line", "bar", "column", "pie", "summary"]);

for (const chart of cases) {
  assert.equal(canRenderSvg(chart.type), true);
  const svg = renderSvg({ ...chart, width: 900, height: 520, theme: "default", options: {} });
  assert.match(svg, /^<svg[\s>]/);
  assert.match(svg, /<\/svg>$/);
  assert.match(svg, /viewBox="0 0 900 520"/);
  assert.match(svg, /<title>/);
  assert.ok(svg.includes(chart.requiredNode), `${chart.type} should include ${chart.requiredNode}`);
  assert.equal(svg.includes("<Smoke>"), false);
  assert.equal(svg.includes("Price <USD>"), false);
  assert.ok(svg.includes("&lt;") || svg.includes("&amp;") || chart.type !== "summary");
}

console.log(JSON.stringify({ success: true, svg_cases: cases.length }));
