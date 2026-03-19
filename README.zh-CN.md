# free-open-router

中文 | [English](README.md)

一个基于 **TypeScript + Hono + Zod** 的 OpenRouter 轻量代理服务，提供三个核心接口：

- 列出当前 OpenRouter 免费模型
- 访问 OpenRouter 自动路由的最强模型
- 访问指定的免费模型（带校验）

另外内置了一个浏览器测试页面（Playground），方便手动调试接口。

## 设计理念

- **动态模型发现** — 直接读 OpenRouter `/api/v1/models`，不维护静态模型清单
- **自动路由** — 使用 OpenRouter 官方 `openrouter/auto`，比手写模型优先级更可靠
- **薄代理层** — Zod 只做接口参数校验，不落库，保持代理层尽量轻薄
- **费用防护** — 在代理层先校验模型是否免费，避免用户误把收费模型打进来

## 环境要求

- Node.js 22+
- 一个可用的 `OPENROUTER_API_KEY`

## 快速开始

```bash
cp .env.example .env
# 编辑 .env，填入你的 OPENROUTER_API_KEY
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm start
```

服务默认监听 `http://localhost:3000`。

启动后可以直接打开测试页面：

```
http://localhost:3000/playground
```

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务端口 |
| `OPENROUTER_API_KEY` | - | OpenRouter API Key，chat 代理必填 |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter API 基础地址 |
| `APP_NAME` | `free-open-router` | 透传给 OpenRouter 的应用名 |
| `SITE_URL` | 空 | 透传给 OpenRouter 的站点地址 |
| `MODELS_CACHE_TTL_MS` | `300000` | 模型列表缓存毫秒数 |
| `UPSTREAM_TIMEOUT_MS` | `60000` | 上游超时毫秒数 |
| `CORS_ORIGIN` | `*` | CORS 允许来源 |

## API 接口

### `GET /v1/models/free`

返回当前免费模型列表。

可选查询参数：

- `refresh=1` — 强制刷新模型缓存

示例：

```bash
curl http://localhost:3000/v1/models/free
```

### `POST /v1/chat/completions/strongest`

固定将请求转发到 OpenRouter `openrouter/auto`，由 OpenRouter 自动选择当前最强/最合适模型。

请求体兼容 OpenAI / OpenRouter chat completions 格式，大多数参数会原样透传；其中 `model` 会被服务端覆盖成 `openrouter/auto`。

示例：

```bash
curl http://localhost:3000/v1/chat/completions/strongest \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "用中文介绍一下你自己" }
    ]
  }'
```

### `POST /v1/chat/completions/free`

访问指定免费模型。请求体必须包含 `model` 字段，服务会先校验它当前是否仍是免费模型，再转发到 OpenRouter。

示例：

```bash
curl http://localhost:3000/v1/chat/completions/free \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [
      { "role": "user", "content": "写一个 hello world" }
    ]
  }'
```

### 其他端点

| 端点 | 说明 |
| --- | --- |
| `GET /` | API 路由摘要 |
| `GET /healthz` | 健康检查 |
| `GET /playground` | 内置 Web UI 测试页面 |

## 注意事项

- `stream: true` 会直接透传 OpenRouter 的 SSE 流式响应
- 如果 OpenRouter 模型目录暂时不可用，但本地还有缓存，服务会退回到旧缓存
- 免费模型判断基于 OpenRouter 返回的 `pricing` 字段是否全为 `0`
- 当前版本不接数据库，所有状态都在进程内缓存

## 测试

```bash
npm test
```

## 许可证

MIT
