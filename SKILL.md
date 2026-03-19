---
name: free-open-router
description: |
  Proxy service providing free access to OpenRouter AI models. Supports listing free models,
  chatting with a specific free model, and auto-routing to the strongest free model.
  Use when making AI chat completions, listing available free models, or testing OpenRouter
  endpoints without cost.
compatibility: Requires a running free-open-router service (default https://free-open-router.onrender.com)
---

# free-open-router

A lightweight OpenRouter proxy that exposes only free models. The base URL defaults to `https://free-open-router.onrender.com` (port may vary).

## Workflow

1. **Check health** — `GET /api/healthz` confirms the service is running
2. **List free models** — `GET /api/v1/models/free` returns available models
3. **Pick a model** — select a model ID (e.g., `deepseek/deepseek-chat-v3-0324:free`)
4. **Send request** — `POST /api/v1/chat/completions/free` with the chosen model and messages

For quick use without choosing a model, `POST /api/v1/chat/completions/strongest` auto-selects the best free model.

## Endpoints

### GET /api/healthz

Returns service health status.

```json
{ "ok": true, "service": "free-open-router" }
```

### GET /api/v1/models/free

Returns all currently available free models. Append `?refresh=1` to force a cache refresh.

```json
{
  "object": "list",
  "data": [
    {
      "id": "deepseek/deepseek-chat-v3-0324:free",
      "name": "DeepSeek Chat V3",
      "pricing": { "prompt": "0", "completion": "0" },
      "is_free": true
    }
  ],
  "meta": { "count": 5, "cache_hit": true, "stale": false }
}
```

### POST /api/v1/chat/completions/free

Sends a chat completion request using a specific free model. The proxy validates the model is free before forwarding.

```bash
curl -X POST https://free-open-router.onrender.com/api/v1/chat/completions/free \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [{ "role": "user", "content": "Hello" }]
  }'
```

| Field | Required | Description |
|-------|----------|-------------|
| `model` | Yes | A free model ID from `/api/v1/models/free` |
| `messages` | Yes | Array of `{ role, content }` objects (min 1) |
| `temperature` | No | Sampling temperature (0–2) |
| `top_p` | No | Nucleus sampling parameter |
| `max_tokens` | No | Maximum tokens to generate |
| `stream` | No | Set `true` for SSE streaming |

Any other OpenRouter-compatible field is passed through.

### POST /api/v1/chat/completions/strongest

Auto-selects the strongest free model based on a scoring system (recency 50%, parameter size 35%, context length 15%). Any `model` field in the request body is ignored. All models used are guaranteed free.

```bash
curl -X POST https://free-open-router.onrender.com/api/v1/chat/completions/strongest \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{ "role": "user", "content": "Explain quantum computing" }]
  }'
```

Only `messages` (array, min 1) is required. Other fields follow the same schema as the free endpoint above.

### GET /

Opens a browser-based playground UI for interactive testing.

## Multi-turn Conversations

Include conversation history in the `messages` array:

```json
{
  "model": "deepseek/deepseek-chat-v3-0324:free",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is Python?" },
    { "role": "assistant", "content": "Python is a programming language..." },
    { "role": "user", "content": "Show me a hello world example." }
  ]
}
```

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Invalid request or model not free | Check model ID and request body |
| 404 | Endpoint not found | Verify the URL path |
| 500 | Server error or missing API key | Check service configuration |

Error response format:

```json
{
  "error": {
    "message": "Model xyz is not currently a free OpenRouter model.",
    "details": null
  }
}
```

## Tips

- Free model IDs typically end with `:free`
- The model list is cached for 1 hour; use `?refresh=1` only when needed
- All endpoints support CORS
- Responses are transparently forwarded from OpenRouter, including token usage metadata
