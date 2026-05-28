# Standalone Readiness

本文档用于检查 `chart-renderer` 作为独立项目迁出时，哪些配置、文档和运行入口已经在服务目录内闭环，哪些内容仍属于上游调用方。

当前仓库内目录：`services/chart-renderer`

独立迁出后的项目根目录可以直接使用该目录内容。

## 已迁入服务目录

运行配置：

- `.env`
- `.env.example`

配置项：

| 变量 | 归属 | 说明 |
| --- | --- | --- |
| `CHART_RENDERER_HOST` | renderer | HTTP bind host。 |
| `CHART_RENDERER_PORT` | renderer | HTTP bind port。 |
| `CHART_RENDERER_MAX_BODY_BYTES` | renderer | `POST /render` 最大 JSON body 字节数。 |

运行入口：

- `package.json`
- `package-lock.json`
- `src/server.js`
- `src/smoke.js`
- `Dockerfile`
- `docker-compose.yml`

服务文档：

- `README.md`
- `docs/README.md`
- `docs/implementation-plan.md`
- `docs/standalone-readiness.md`

## 不应迁入 renderer 的配置

以下配置属于上游 Chart API 服务，不属于 renderer：

| 配置 | 原因 |
| --- | --- |
| `GPT_VIS_SSR_ENDPOINT` | 上游调用 renderer 的 endpoint。renderer 自己不调用自己。 |
| `CHART_RENDER_PROVIDER` | provider 选择属于上游 API 编排逻辑。 |
| `ANTV_GPT_VIS_ENDPOINT` | AntV Studio fallback 属于上游 provider adapter。 |
| `CHART_PROVIDER_FALLBACK_ENABLED` | fallback 策略属于上游 provider router。 |
| `CHART_GENERATION_ENABLED` | 图表生成总开关属于上游 API。 |
| `CHART_GENERATION_TIMEOUT_SECONDS` | 上游调用 provider 的超时。 |
| `CHART_GENERATION_MAX_DATA_ROWS` | 上游 payload 校验限制。 |
| `CHART_ASSET_STORAGE_DIR` | 图片缓存由上游 API 负责。 |
| `CHART_ASSET_BASE_URL` | 静态 URL 或对象存储 URL 由上游 API 负责。 |
| `CHART_LLM_*` | payload builder LLM 属于上游 API，不属于 renderer。 |

## 当前仍与仓库集成相关的文件

外层仓库的 `docker-compose.yml` 会通过 `env_file: ./services/chart-renderer/.env` 启动本服务。这是当前 monorepo 集成方式，不是 renderer 独立运行的必要条件。

独立项目迁出后，只需要保留服务目录内的 `docker-compose.yml`。

## 独立运行检查

在 `services/chart-renderer` 目录中执行：

```bash
npm ci
npm run smoke
npm run audit
npm run start:env
```

或使用独立 compose：

```bash
docker compose up --build
```

检查 API：

```bash
curl -s http://127.0.0.1:8787/health
```

```bash
curl -s -X POST http://127.0.0.1:8787/render \
  -H "Content-Type: application/json" \
  -H "Accept: image/png" \
  -d '{"type":"line","width":900,"height":520,"data":[{"time":"2026-05-01","value":1.12},{"time":"2026-05-02","value":1.18}],"title":"Smoke test"}' \
  -o /tmp/chart-renderer-smoke.png
```

## 待迁出时确认

- 如果独立项目目录名最终定为 `chart-render`，需要同步更新文档中的 `services/chart-renderer` 路径描述。
- 如果容器名需要遵循目标部署平台规范，更新 `docker-compose.yml` 中的 `container_name`。
- 如果要公网暴露，需要在上游网关或本服务前增加鉴权、限流和请求大小限制。

