export function renderLandingHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>chart-renderer</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>${landingCss()}</style>
</head>
<body>
  <main class="site">
    <section class="hero">
      <nav class="nav">
        <img src="/logo.svg" alt="chart-renderer" class="logo">
        <div class="nav-links">
          <a href="/viewer">Viewer</a>
          <a href="/api">API Docs</a>
          <a href="/health">Health</a>
        </div>
      </nav>

      <div class="hero-layout">
        <div class="hero-copy">
          <p class="eyebrow">Cloudflare Worker chart artifacts</p>
          <h1>Render charts without server-side canvas.</h1>
          <p class="lede">返回 config、SVG 或 HTML shell，让复杂图表在浏览器端渲染。简单图表由 Worker 直接生成 SVG，PNG 下载交给 viewer。</p>
          <div class="hero-actions">
            <a class="primary" href="/viewer">Open Viewer</a>
            <a class="secondary" href="/api">Read API</a>
          </div>
        </div>

        <div class="artifact-scene" aria-label="Chart artifact preview">
          <div class="scene-ruler x"><span>0</span><span>240</span><span>480</span><span>720</span><span>900</span></div>
          <div class="scene-ruler y"><span>0</span><span>160</span><span>320</span><span>520</span></div>
          <div class="artifact">
            <div class="artifact-head">
              <div>
                <strong>Risk profile</strong>
                <span>900 x 520 · config</span>
              </div>
              <code>X-Chart-Cache: hit</code>
            </div>
            <svg class="plot" viewBox="0 0 640 300" role="img" aria-label="Line chart mock">
              <path d="M32 252H608M32 198H608M32 144H608M32 90H608M32 36H608" stroke="#d8e4f2"/>
              <path d="M32 252V36" stroke="#d8e4f2"/>
              <path d="M32 238C96 210 112 118 172 126C238 134 238 72 312 82C386 92 390 198 468 156C536 120 558 70 608 58" fill="none" stroke="#175cd3" stroke-width="7" stroke-linecap="round"/>
              <path d="M32 264C94 236 130 196 190 204C250 212 278 148 340 158C414 170 438 106 504 120C556 132 576 170 608 146" fill="none" stroke="#0f9f6e" stroke-width="7" stroke-linecap="round"/>
              <g fill="#175cd3">
                <circle cx="32" cy="238" r="7"/><circle cx="172" cy="126" r="7"/><circle cx="312" cy="82" r="7"/><circle cx="468" cy="156" r="7"/><circle cx="608" cy="58" r="7"/>
              </g>
              <g fill="#0f9f6e">
                <circle cx="32" cy="264" r="7"/><circle cx="190" cy="204" r="7"/><circle cx="340" cy="158" r="7"/><circle cx="504" cy="120" r="7"/><circle cx="608" cy="146" r="7"/>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <section class="band">
      <div class="metrics">
        <div><span>runtime</span><strong>Cloudflare Worker</strong></div>
        <div><span>formats</span><strong>config · svg · html</strong></div>
        <div><span>cache</span><strong>stable hash + Cache API</strong></div>
        <div><span>png</span><strong>browser download only</strong></div>
      </div>
    </section>

    <section class="content">
      <div class="section-head">
        <p class="eyebrow">Current contract</p>
        <h2>Small API surface, clear artifact ownership.</h2>
      </div>
      <div class="feature-grid">
        <article>
          <h3>Simple SVG</h3>
          <p>line、bar、column、pie、summary 由 Worker 直接返回可嵌入 SVG。</p>
        </article>
        <article>
          <h3>Browser HTML</h3>
          <p>复杂图表返回 HTML shell，通过 GPT-Vis 在浏览器端渲染。</p>
        </article>
        <article>
          <h3>Viewer Downloads</h3>
          <p>在 /viewer 中编辑 payload，并下载 JSON、SVG、PNG。</p>
        </article>
      </div>
    </section>

    <section class="code-band">
      <div>
        <p class="eyebrow">Try it</p>
        <h2>POST /render</h2>
      </div>
      <pre><code>curl -s -X POST /render \\
  -H "Content-Type: application/json" \\
  -d '{"type":"line","response_format":"svg","data":[{"time":"2026-05-01","value":1.12}]}'</code></pre>
    </section>
  </main>
</body>
</html>`;
}

function landingCss() {
  return `
    :root {
      --ink: #111827;
      --slate: #344054;
      --muted: #667085;
      --paper: #f7f9fc;
      --panel: #ffffff;
      --blueprint: #e8f1ff;
      --blueprint-line: rgba(23, 92, 211, 0.12);
      --rule: #c9d6e6;
      --accent: #175cd3;
      --signal: #0f9f6e;
      --mono: "IBM Plex Mono", "SFMono-Regular", Consolas, ui-monospace, monospace;
      --sans: "Avenir Next", Aptos, "Segoe UI", ui-sans-serif, system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: var(--sans);
      background: var(--paper);
    }
    a { color: inherit; text-decoration: none; }
    .hero {
      min-height: 86vh;
      position: relative;
      overflow: hidden;
      background:
        linear-gradient(90deg, var(--blueprint-line) 1px, transparent 1px) 0 0 / 28px 28px,
        linear-gradient(var(--blueprint-line) 1px, transparent 1px) 0 0 / 28px 28px,
        var(--blueprint);
    }
    .nav {
      height: 74px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 0 32px;
      border-bottom: 1px solid rgba(17, 24, 39, 0.12);
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(12px);
    }
    .logo { width: 220px; height: auto; display: block; }
    .nav-links { display: flex; gap: 18px; flex-wrap: wrap; color: var(--slate); font-size: 13px; font-weight: 850; }
    .nav-links a:hover { color: var(--accent); }
    .hero-layout {
      width: min(1180px, calc(100% - 48px));
      min-height: calc(86vh - 74px);
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
      align-items: center;
      gap: 44px;
      padding: 42px 0;
    }
    .eyebrow {
      margin: 0 0 12px;
      color: var(--accent);
      font-family: var(--mono);
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 680px;
      margin: 0;
      font-size: 64px;
      line-height: 0.98;
      letter-spacing: 0;
      font-weight: 900;
    }
    .lede {
      max-width: 610px;
      margin: 24px 0 0;
      color: var(--slate);
      font-size: 19px;
      line-height: 1.65;
      font-weight: 650;
    }
    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 32px;
    }
    .primary,
    .secondary {
      min-height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 900;
    }
    .primary { background: var(--accent); color: #ffffff; }
    .secondary { border: 1px solid var(--rule); background: rgba(255, 255, 255, 0.86); color: var(--ink); }
    .artifact-scene {
      min-width: 0;
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      grid-template-rows: 34px minmax(0, 1fr);
      border: 1px solid var(--rule);
      background: rgba(255, 255, 255, 0.58);
      box-shadow: 0 24px 70px rgba(23, 92, 211, 0.18);
    }
    .scene-ruler {
      color: var(--muted);
      background: rgba(255, 255, 255, 0.86);
      font: 10px/1 var(--mono);
      font-weight: 800;
    }
    .scene-ruler.x {
      grid-column: 2;
      display: flex;
      align-items: center;
      gap: 80px;
      padding: 0 18px;
      border-bottom: 1px solid var(--rule);
      overflow: hidden;
    }
    .scene-ruler.y {
      grid-row: 2;
      display: flex;
      flex-direction: column;
      gap: 70px;
      padding-top: 20px;
      align-items: center;
      border-right: 1px solid var(--rule);
    }
    .artifact {
      grid-column: 2;
      grid-row: 2;
      width: 100%;
      min-height: 460px;
      padding: 30px;
      background: #ffffff;
    }
    .artifact-head {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: start;
      margin-bottom: 28px;
    }
    .artifact-head strong { display: block; font-size: 24px; }
    .artifact-head span { display: block; margin-top: 6px; color: var(--muted); font-size: 13px; font-weight: 750; }
    .artifact-head code {
      padding: 7px 9px;
      border: 1px solid var(--rule);
      border-radius: 6px;
      background: #f4f8fd;
      color: var(--signal);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 850;
      white-space: nowrap;
    }
    .plot {
      width: 100%;
      height: auto;
      display: block;
    }
    .band {
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      background: #ffffff;
    }
    .metrics {
      width: min(1180px, calc(100% - 48px));
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .metrics div {
      min-width: 0;
      padding: 22px 18px;
      border-right: 1px solid var(--rule);
    }
    .metrics div:first-child { border-left: 1px solid var(--rule); }
    .metrics span {
      display: block;
      color: var(--muted);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .metrics strong {
      display: block;
      margin-top: 8px;
      font-size: 15px;
      line-height: 1.35;
    }
    .content,
    .code-band {
      width: min(1180px, calc(100% - 48px));
      margin: 0 auto;
      padding: 58px 0;
    }
    .section-head h2,
    .code-band h2 {
      max-width: 720px;
      margin: 0;
      font-size: 36px;
      line-height: 1.1;
      letter-spacing: 0;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 28px;
    }
    .feature-grid article {
      min-width: 0;
      padding: 22px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: #ffffff;
    }
    .feature-grid h3 { margin: 0 0 10px; font-size: 18px; }
    .feature-grid p { margin: 0; color: var(--slate); line-height: 1.65; }
    .code-band {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 28px;
      align-items: start;
      border-top: 1px solid var(--rule);
    }
    pre {
      min-width: 0;
      max-width: 100%;
      margin: 0;
      overflow: auto;
      padding: 18px;
      border-radius: 8px;
      background: #0f172a;
      color: #dbeafe;
      font: 13px/1.6 var(--mono);
    }
    pre code {
      display: block;
      width: max-content;
      min-width: 100%;
      white-space: pre;
    }
    @media (max-width: 920px) {
      .nav { height: auto; align-items: flex-start; flex-direction: column; padding: 16px; }
      .logo { width: 190px; }
      .hero-layout {
        width: calc(100% - 32px);
        grid-template-columns: 1fr;
        min-height: 0;
      }
      h1 { font-size: 42px; }
      .artifact { min-height: 340px; padding: 20px; }
      .metrics,
      .feature-grid,
      .code-band {
        grid-template-columns: 1fr;
      }
      .metrics div,
      .metrics div:first-child {
        border-left: 1px solid var(--rule);
        border-bottom: 1px solid var(--rule);
      }
      .content,
      .code-band,
      .metrics {
        width: calc(100% - 32px);
      }
    }
  `;
}
