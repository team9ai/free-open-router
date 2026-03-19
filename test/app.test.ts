import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config.js";

function createMockConfig(): AppConfig {
  return {
    port: 3000,
    openRouterApiKey: "test-key",
    openRouterBaseUrl: "https://openrouter.ai/api/v1",
    appName: "free-open-router-test",
    siteUrl: "http://localhost:3000",
    modelsCacheTtlMs: 30_000,
    upstreamTimeoutMs: 10_000,
    corsOrigin: "*",
  };
}

function createMockFetch() {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];

  const mockFetch: typeof fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    calls.push({ url, init });

    if (url.endsWith("/models")) {
      return Response.json({
        data: [
          {
            id: "deepseek/deepseek-chat-v3-0324:free",
            name: "DeepSeek Chat Free",
            pricing: {
              prompt: "0",
              completion: "0",
              request: "0",
              image: "0",
              web_search: "0",
              internal_reasoning: "0",
              input_cache_read: "0",
              input_cache_write: "0",
            },
          },
          {
            id: "openai/gpt-5.1",
            name: "GPT-5.1",
            pricing: {
              prompt: "0.000001",
              completion: "0.000002",
              request: "0",
              image: "0",
              web_search: "0",
              internal_reasoning: "0",
              input_cache_read: "0",
              input_cache_write: "0",
            },
          },
        ],
      });
    }

    if (url.endsWith("/chat/completions")) {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        model?: string;
      };

      return Response.json({
        id: "chatcmpl-mock",
        object: "chat.completion",
        model: body.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "ok",
            },
            finish_reason: "stop",
          },
        ],
      });
    }

    return new Response("Not Found", { status: 404 });
  };

  return { calls, mockFetch };
}

test("GET /v1/models/free only returns free models", async () => {
  const { mockFetch } = createMockFetch();
  const app = createApp(createMockConfig(), mockFetch);

  const response = await app.request("http://localhost/v1/models/free");
  const payload = (await response.json()) as {
    data: Array<{ id: string; is_free: boolean }>;
    meta: { count: number };
  };

  assert.equal(response.status, 200);
  assert.equal(payload.meta.count, 1);
  assert.equal(payload.data[0]?.id, "deepseek/deepseek-chat-v3-0324:free");
  assert.equal(payload.data[0]?.is_free, true);
});

test("GET /playground returns the built-in test UI", async () => {
  const { mockFetch } = createMockFetch();
  const app = createApp(createMockConfig(), mockFetch);

  const response = await app.request("http://localhost/playground");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/i);
  assert.match(html, /free-open-router playground/i);
  assert.match(html, /\/v1\/chat\/completions\/strongest/i);
});

test("POST /v1/chat/completions/strongest forces openrouter auto routing", async () => {
  const { calls, mockFetch } = createMockFetch();
  const app = createApp(createMockConfig(), mockFetch);

  const response = await app.request("http://localhost/v1/chat/completions/strongest", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "should/be-ignored",
      messages: [{ role: "user", content: "hello" }],
    }),
  });
  const payload = (await response.json()) as { model: string };
  const upstreamChatCall = calls.find((call) => call.url.endsWith("/chat/completions"));
  const upstreamBody = JSON.parse(String(upstreamChatCall?.init?.body ?? "{}")) as {
    model?: string;
  };

  assert.equal(response.status, 200);
  assert.equal(payload.model, "openrouter/auto");
  assert.equal(upstreamBody.model, "openrouter/auto");
});

test("POST /v1/chat/completions/free rejects non-free models", async () => {
  const { mockFetch } = createMockFetch();
  const app = createApp(createMockConfig(), mockFetch);

  const response = await app.request("http://localhost/v1/chat/completions/free", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.1",
      messages: [{ role: "user", content: "hello" }],
    }),
  });
  const payload = (await response.json()) as { error: { message: string } };

  assert.equal(response.status, 400);
  assert.match(payload.error.message, /not currently a free OpenRouter model/i);
});

test("POST /v1/chat/completions/free proxies allowed free models", async () => {
  const { mockFetch } = createMockFetch();
  const app = createApp(createMockConfig(), mockFetch);

  const response = await app.request("http://localhost/v1/chat/completions/free", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [{ role: "user", content: "hello" }],
    }),
  });
  const payload = (await response.json()) as { model: string };

  assert.equal(response.status, 200);
  assert.equal(payload.model, "deepseek/deepseek-chat-v3-0324:free");
});
