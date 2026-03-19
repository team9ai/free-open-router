# free-open-router

**[Live Playground](https://free-open-router.onrender.com/playground)**

A lightweight OpenRouter proxy service built with **TypeScript + Hono + Zod**, providing three core endpoints:

- List currently free models on OpenRouter
- Access the strongest model via OpenRouter auto-routing
- Access a specified free model with validation

Includes a built-in browser playground for manual API testing.

## Design Philosophy

- **Dynamic model discovery** — reads from OpenRouter `/api/v1/models` instead of maintaining a static model list
- **Auto-routing** — uses OpenRouter's official `openrouter/auto` rather than hand-picking "the best" model
- **Thin proxy** — Zod handles input validation only; no database, all state lives in process memory
- **Cost guard** — validates that a model is actually free before forwarding, preventing accidental paid usage

## Requirements

- Node.js 22+
- A valid `OPENROUTER_API_KEY`

## Quick Start

```bash
cp .env.example .env
# Edit .env and fill in your OPENROUTER_API_KEY
npm install
npm run dev
```

Production build:

```bash
npm run build
npm start
```

The service listens on `http://localhost:3000` by default.

Open the playground at:

```
http://localhost:3000/playground
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Server port |
| `OPENROUTER_API_KEY` | - | OpenRouter API Key (required for chat endpoints) |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `APP_NAME` | `free-open-router` | App name passed to OpenRouter |
| `SITE_URL` | _(empty)_ | Site URL passed to OpenRouter |
| `MODELS_CACHE_TTL_MS` | `300000` | Model list cache TTL in milliseconds |
| `UPSTREAM_TIMEOUT_MS` | `60000` | Upstream request timeout in milliseconds |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |

## API

### `GET /v1/models/free`

Returns the current list of free models.

Optional query parameter:

- `refresh=1` — force refresh the model cache

Example:

```bash
curl http://localhost:3000/v1/models/free
```

### `POST /v1/chat/completions/strongest`

Forwards requests to OpenRouter's `openrouter/auto`, which automatically selects the strongest/most suitable model.

The request body is compatible with OpenAI / OpenRouter chat completions format. Most parameters are passed through as-is; the `model` field is overridden to `openrouter/auto` on the server side.

Example:

```bash
curl http://localhost:3000/v1/chat/completions/strongest \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Introduce yourself" }
    ]
  }'
```

### `POST /v1/chat/completions/free`

Access a specified free model. The request body must include a `model` field. The service validates that the model is currently free before forwarding to OpenRouter.

Example:

```bash
curl http://localhost:3000/v1/chat/completions/free \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [
      { "role": "user", "content": "Write a hello world" }
    ]
  }'
```

### Other Endpoints

| Endpoint | Description |
| --- | --- |
| `GET /` | API route summary |
| `GET /healthz` | Health check |
| `GET /playground` | Built-in Web UI for testing |

## Notes

- `stream: true` transparently proxies OpenRouter's SSE streaming response
- If OpenRouter's model directory is temporarily unavailable but a local cache exists, the service falls back to the stale cache
- Free model detection is based on whether all `pricing` fields returned by OpenRouter are `0`
- No database is used; all state is cached in-process

## Test

```bash
npm test
```

## License

MIT
