# Legacy Node SSR

This directory contains the historical CHART-001 Node.js PNG SSR implementation.

It is intentionally isolated from the active Cloudflare Worker path:

- The root `package.json` no longer installs `canvas` or `@antv/gpt-vis-ssr`.
- The root npm scripts no longer start this service.
- The root Worker bundle does not import these files.
- `Dockerfile`, `.dockerignore`, and `docker-compose.yml` are archived here for reference only.

The current product contract is CHART-002:

- Worker returns `config`, `svg`, or `html`.
- Worker rejects server-side `png` with `422 unsupported_response_format`.
- Browser `/viewer` handles PNG download client-side.

To revive this legacy service, create a separate package boundary here and add its native dependencies locally. Do not re-add `canvas` or `@antv/gpt-vis-ssr` to the root package unless the product direction explicitly changes back to Node SSR.
