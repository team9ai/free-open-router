# free-open-router Skill

You have access to a **free-open-router** proxy service that provides free access to OpenRouter AI models. Use this skill to make AI chat completions through the proxy.

## Base URL

```
http://localhost:3000
```

> The port may vary. If port 3000 doesn't work, check if the service is running on a different port.

## Available Endpoints

### 1. Health Check

**`GET /healthz`**

Verify the service is running before making requests.

```bash
curl http://localhost:3000/healthz
```

Response:
```json
{ "ok": true, "service": "free-open-router" }
```

### 2. List Free Models

**`GET /v1/models/free`**

Get all currently available free models. Always check this first to know which models you can use.

```bash
curl http://localhost:3000/v1/models/free
```

Query parameters:
- `refresh=1` — Force refresh the model cache (use sparingly)

Response:
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
  "meta": {
    "count": 5,
    "fetched_at": "2024-03-19T10:30:45.123Z",
    "cache_hit": true,
    "stale": false
  }
}
```

### 3. Chat with a Free Model

**`POST /v1/chat/completions/free`**

Send a chat completion request using a specific free model. The model must be in the free models list.

```bash
curl -X POST http://localhost:3000/v1/chat/completions/free \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [
      { "role": "user", "content": "Hello, how are you?" }
    ]
  }'
```

Required fields:
- `model` (string) — Must be a free model ID from `/v1/models/free`
- `messages` (array) — At least one message with `role` and `content`

Optional fields (passed through to OpenRouter):
- `temperature` (number) — Sampling temperature (0-2)
- `top_p` (number) — Nucleus sampling parameter
- `max_tokens` (number) — Maximum tokens to generate
- `stream` (boolean) — Enable streaming responses
- Any other OpenRouter-compatible parameter

### 4. Chat with the Strongest Free Model

**`POST /v1/chat/completions/strongest`**

Automatically selects the strongest free model based on a scoring system (recency 50%, parameter size 35%, context length 15%) and sends all ranked free models to OpenRouter. This endpoint ignores any `model` field you provide. **All models used are guaranteed free.**

```bash
curl -X POST http://localhost:3000/v1/chat/completions/strongest \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Explain quantum computing" }
    ]
  }'
```

Required fields:
- `messages` (array) — At least one message with `role` and `content`

> **Note:** This endpoint only uses free models. Models are ranked by release date, parameter count, and context window size.

### 5. Interactive Playground

**`GET /playground`**

Open in a browser to test the API interactively with a built-in UI.

## Usage Workflow

Follow this workflow when using the proxy:

1. **Check health** — `GET /healthz` to confirm the service is up
2. **List free models** — `GET /v1/models/free` to see available models
3. **Pick a model** — Choose a model ID from the list (e.g., `deepseek/deepseek-chat-v3-0324:free`)
4. **Send request** — `POST /v1/chat/completions/free` with your chosen model and messages

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Invalid request or model not free | Check model ID and request body |
| 404 | Endpoint not found | Check the URL path |
| 500 | Server error or missing API key | Service configuration issue |

Error response format:
```json
{
  "error": {
    "message": "Model xyz is not currently a free OpenRouter model.",
    "details": null
  }
}
```

## Streaming Responses

Set `"stream": true` in the request body to receive Server-Sent Events (SSE):

```bash
curl -X POST http://localhost:3000/v1/chat/completions/free \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [{ "role": "user", "content": "Tell me a story" }],
    "stream": true
  }'
```

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

## Tips

- Free model IDs typically end with `:free` suffix
- The model list is cached for 1 hour; use `refresh=1` only when needed
- All requests support CORS, so you can call from browser-based apps
- The proxy transparently forwards responses from OpenRouter, including token usage metadata
