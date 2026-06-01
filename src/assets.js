export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title desc">
  <title id="title">Chart Renderer favicon</title>
  <desc id="desc">A compact CR mark with a chart line on a blueprint grid.</desc>
  <rect width="64" height="64" rx="14" fill="#111827"/>
  <path d="M14 14h36M14 26h36M14 38h36M14 50h36M14 14v36M26 14v36M38 14v36M50 14v36" stroke="#344054" stroke-width="1"/>
  <path d="M15 43l9-10 8 5 8-15 10 7" fill="none" stroke="#34d399" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17 20c0-4 3-7 8-7h8v6h-8c-2 0-3 1-3 3v20c0 2 1 3 3 3h8v6h-8c-5 0-8-3-8-7V20z" fill="#ffffff"/>
  <path d="M36 13h8c5 0 8 3 8 8 0 4-2 6-5 7l7 23h-7l-6-21h-1v21h-6V13h2zm4 6v9h4c2 0 3-2 3-5 0-2-1-4-3-4h-4z" fill="#e8f1ff"/>
</svg>`;

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 184" role="img" aria-labelledby="title desc">
  <title id="title">chart-renderer logo</title>
  <desc id="desc">A CR monogram beside the chart-renderer wordmark.</desc>
  <defs>
    <linearGradient id="mark-bg" x1="8" y1="10" x2="148" y2="150" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#263244"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#175cd3" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="720" height="184" rx="28" fill="#f7f9fc"/>
  <g opacity="0.9">
    <path d="M16 32h688M16 64h688M16 96h688M16 128h688M16 160h688M32 16v152M64 16v152M96 16v152M128 16v152M160 16v152M192 16v152M224 16v152M256 16v152M288 16v152M320 16v152M352 16v152M384 16v152M416 16v152M448 16v152M480 16v152M512 16v152M544 16v152M576 16v152M608 16v152M640 16v152M672 16v152" stroke="#d8e4f2" stroke-width="1"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="34" y="28" width="128" height="128" rx="26" fill="url(#mark-bg)"/>
    <path d="M54 58c0-12 9-21 23-21h25v16H78c-6 0-9 4-9 10v58c0 6 3 10 9 10h24v16H77c-14 0-23-9-23-21V58z" fill="#ffffff"/>
    <path d="M107 37h24c15 0 24 9 24 23 0 11-5 18-14 21l18 66h-18l-16-61h-3v61h-15V37zm15 16v24h10c5 0 8-5 8-13 0-7-3-11-8-11h-10z" fill="#e8f1ff"/>
    <path d="M58 124l20-23 17 12 16-32 27 18" fill="none" stroke="#34d399" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g>
    <text x="192" y="82" fill="#111827" font-family="Avenir Next, Aptos, Segoe UI, sans-serif" font-size="44" font-weight="800" letter-spacing="0">chart-renderer</text>
    <text x="194" y="118" fill="#667085" font-family="IBM Plex Mono, SFMono-Regular, Consolas, monospace" font-size="16" font-weight="700" letter-spacing="1">SERVERLESS CHART ARTIFACTS</text>
    <path d="M194 140h118l20-20 28 12 28-34 30 42h118" fill="none" stroke="#175cd3" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="194" cy="140" r="5" fill="#175cd3"/>
    <circle cx="312" cy="140" r="5" fill="#175cd3"/>
    <circle cx="332" cy="120" r="5" fill="#34d399"/>
    <circle cx="360" cy="132" r="5" fill="#34d399"/>
    <circle cx="388" cy="98" r="5" fill="#34d399"/>
    <circle cx="418" cy="140" r="5" fill="#175cd3"/>
    <circle cx="536" cy="140" r="5" fill="#175cd3"/>
  </g>
</svg>`;
