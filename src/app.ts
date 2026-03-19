import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { StatusCode } from "hono/utils/http-status";
import { z } from "zod";

import type { AppConfig } from "./config.js";
import { createOpenRouterClient, HttpError } from "./openrouter.js";
import { renderPlaygroundHtml } from "./playground.js";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const refreshQuerySchema = z
  .object({
    refresh: z.string().optional(),
  })
  .passthrough();

const chatMessageSchema = z.object({
  role: z.string().min(1),
  content: z.unknown(),
});

const strongestCompletionSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1),
    model: z.string().optional(),
  })
  .passthrough();

const freeCompletionSchema = z
  .object({
    model: z.string().min(1),
    messages: z.array(chatMessageSchema).min(1),
  })
  .passthrough();

async function readJsonBody(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function validateWithSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new HttpError(400, "Request validation failed.", result.error.flatten());
  }

  return result.data;
}

function createRouteSummary(config: AppConfig) {
  return {
    name: "free-open-router",
    runtime: "hono",
    validation: "zod",
    openrouter_base_url: config.openRouterBaseUrl,
    endpoints: {
      health: "GET /healthz",
      playground: "GET /playground",
      skill: "GET /SKILL.md",
      free_models: "GET /v1/models/free",
      strongest_chat: "POST /v1/chat/completions/strongest",
      free_chat: "POST /v1/chat/completions/free",
    },
  };
}

export function createApp(config: AppConfig, fetchImpl: typeof fetch = fetch) {
  const app = new Hono();
  const client = createOpenRouterClient(config, fetchImpl);

  app.use("*", cors({ origin: config.corsOrigin }));

  app.get("/", (c) => c.json(createRouteSummary(config)));

  app.get("/SKILL.md", (c) => {
    const content = readFileSync(join(projectRoot, "SKILL.md"), "utf-8");
    return c.text(content, 200, {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    });
  });

  app.get("/playground", (c) =>
    c.html(renderPlaygroundHtml(config), 200, {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    }),
  );

  app.get("/healthz", (c) =>
    c.json({
      ok: true,
      service: "free-open-router",
    }),
  );

  app.get("/v1/models/free", async (c) => {
    const query = validateWithSchema(refreshQuerySchema, c.req.query());
    const forceRefresh = query.refresh === "1" || query.refresh === "true";
    const result = await client.listFreeModels({ forceRefresh });

    return c.json({
      object: "list",
      data: result.models,
      meta: {
        count: result.models.length,
        fetched_at: result.fetchedAt,
        cache_hit: result.cacheHit,
        stale: result.stale,
      },
    });
  });

  app.post("/v1/chat/completions/strongest", async (c) => {
    const body = validateWithSchema(
      strongestCompletionSchema,
      await readJsonBody(c),
    ) as Record<string, unknown> & { models?: unknown; model?: unknown };
    const { models: _ignoredModels, model: _ignoredModel, ...rest } = body;

    const freeModels = await client.listFreeModels();
    if (freeModels.models.length === 0) {
      throw new HttpError(503, "No free models are currently available.");
    }

    const freeModelIds = freeModels.models.map((m) => m.id);

    return client.proxyChatCompletion({
      ...rest,
      models: freeModelIds,
    });
  });

  app.post("/v1/chat/completions/free", async (c) => {
    const body = validateWithSchema(
      freeCompletionSchema,
      await readJsonBody(c),
    ) as Record<string, unknown> & { model: string };
    const model = body.model.trim();

    await client.assertModelIsFree(model);

    return client.proxyChatCompletion({
      ...body,
      model,
    });
  });

  app.notFound((c) =>
    c.json(
      {
        error: {
          message: `Route ${c.req.method} ${c.req.path} not found.`,
        },
      },
      404,
    ),
  );

  app.onError((error, c) => {
    if (error instanceof HttpError) {
      return c.newResponse(
        JSON.stringify({
          error: {
            message: error.message,
            details: error.details,
          },
        }),
        error.statusCode as StatusCode,
        {
          "content-type": "application/json; charset=utf-8",
        },
      );
    }

    console.error(error);
    return c.json(
      {
        error: {
          message: "Internal server error.",
        },
      },
      500,
    );
  });

  return app;
}
