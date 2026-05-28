import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require.extensions[".css"] = () => {};
const { render } = await import("@antv/gpt-vis-ssr");

const result = await render({
  type: "line",
  data: [
    { time: "2026-05-01", value: 1.12 },
    { time: "2026-05-02", value: 1.18 }
  ],
  width: 900,
  height: 520
});

try {
  const buffer = result.toBuffer();
  if (!Buffer.isBuffer(buffer) || buffer.byteLength === 0) {
    throw new Error("render returned an empty image buffer");
  }
  console.log(JSON.stringify({ success: true, byte_length: buffer.byteLength }));
} finally {
  result.destroy();
}
