import type { AppConfig } from "./config.js";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "content-encoding",
]);

const BILLING_FIELDS = [
  "prompt",
  "completion",
  "request",
  "image",
  "web_search",
  "internal_reasoning",
  "input_cache_read",
  "input_cache_write",
] as const;

interface OpenRouterErrorPayload {
  error?: {
    message?: string;
  };
  message?: string;
}

export interface OpenRouterModel {
  id: string;
  name?: string;
  pricing?: Record<string, string | number | undefined>;
  [key: string]: unknown;
}

interface ModelsApiPayload extends OpenRouterErrorPayload {
  data?: OpenRouterModel[];
}

interface ModelCache {
  models: OpenRouterModel[] | null;
  fetchedAt: string | null;
  expiresAt: number;
}

export interface FreeModelsResult {
  models: Array<OpenRouterModel & { is_free: true }>;
  fetchedAt: string | null;
  cacheHit: boolean;
  stale: boolean;
}

export class HttpError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function buildUpstreamHeaders(
  config: AppConfig,
  options: { includeJsonContentType?: boolean } = {},
): Headers {
  const headers = new Headers();

  if (config.openRouterApiKey) {
    headers.set("Authorization", `Bearer ${config.openRouterApiKey}`);
  }

  if (options.includeJsonContentType ?? true) {
    headers.set("Content-Type", "application/json");
  }

  if (config.siteUrl) {
    headers.set("HTTP-Referer", config.siteUrl);
  }

  if (config.appName) {
    headers.set("X-Title", config.appName);
  }

  return headers;
}

function sanitizeUpstreamHeaders(headers: Headers): Headers {
  const sanitized = new Headers();

  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      sanitized.set(key, value);
    }
  });

  return sanitized;
}

function getErrorMessage(payload: OpenRouterErrorPayload, status: number): string {
  return (
    payload.error?.message ??
    payload.message ??
    `OpenRouter request failed with status ${status}.`
  );
}

export function isZeroPrice(value: string | number | undefined): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed === 0;
}

export function isFreeModel(model: OpenRouterModel): boolean {
  if (!model.pricing) {
    return false;
  }

  return BILLING_FIELDS.every((field) => isZeroPrice(model.pricing?.[field]));
}

export function createOpenRouterClient(
  config: AppConfig,
  fetchImpl: typeof fetch = fetch,
) {
  const modelsEndpoint = new URL("models", `${config.openRouterBaseUrl}/`);
  const chatEndpoint = new URL("chat/completions", `${config.openRouterBaseUrl}/`);

  let modelCache: ModelCache = {
    models: null,
    fetchedAt: null,
    expiresAt: 0,
  };

  async function fetchModels(
    options: { forceRefresh?: boolean } = {},
  ): Promise<{
    models: OpenRouterModel[];
    fetchedAt: string | null;
    cacheHit: boolean;
    stale: boolean;
  }> {
    const now = Date.now();
    const shouldUseCache =
      !options.forceRefresh &&
      Array.isArray(modelCache.models) &&
      modelCache.expiresAt > now;

    if (shouldUseCache) {
      return {
        models: modelCache.models as OpenRouterModel[],
        fetchedAt: modelCache.fetchedAt,
        cacheHit: true,
        stale: false,
      };
    }

    try {
      const response = await fetchImpl(modelsEndpoint, {
        method: "GET",
        headers: buildUpstreamHeaders(config, { includeJsonContentType: false }),
        signal: AbortSignal.timeout(config.upstreamTimeoutMs),
      });

      const payload = (await response.json()) as ModelsApiPayload;

      if (!response.ok) {
        throw new HttpError(response.status, getErrorMessage(payload, response.status), payload);
      }

      const models = Array.isArray(payload.data) ? payload.data : [];
      modelCache = {
        models,
        fetchedAt: new Date().toISOString(),
        expiresAt: now + config.modelsCacheTtlMs,
      };

      return {
        models,
        fetchedAt: modelCache.fetchedAt,
        cacheHit: false,
        stale: false,
      };
    } catch (error) {
      if (Array.isArray(modelCache.models)) {
        return {
          models: modelCache.models,
          fetchedAt: modelCache.fetchedAt,
          cacheHit: true,
          stale: true,
        };
      }

      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(
        error instanceof DOMException && error.name === "TimeoutError" ? 504 : 502,
        "Failed to fetch OpenRouter models.",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async function listFreeModels(
    options: { forceRefresh?: boolean } = {},
  ): Promise<FreeModelsResult> {
    const result = await fetchModels(options);

    return {
      ...result,
      models: result.models
        .filter(isFreeModel)
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((model) => ({
          ...model,
          is_free: true as const,
        })),
    };
  }

  async function assertModelIsFree(modelId: string): Promise<void> {
    const freeModels = await listFreeModels();
    const matchedModel = freeModels.models.find((model) => model.id === modelId);

    if (!matchedModel) {
      throw new HttpError(
        400,
        `Model "${modelId}" is not currently a free OpenRouter model.`,
      );
    }
  }

  async function proxyChatCompletion(body: Record<string, unknown>): Promise<Response> {
    if (!config.openRouterApiKey) {
      throw new HttpError(
        500,
        "OPENROUTER_API_KEY is not configured on this proxy.",
      );
    }

    try {
      const upstreamResponse = await fetchImpl(chatEndpoint, {
        method: "POST",
        headers: buildUpstreamHeaders(config),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.upstreamTimeoutMs),
      });

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: sanitizeUpstreamHeaders(upstreamResponse.headers),
      });
    } catch (error) {
      throw new HttpError(
        error instanceof DOMException && error.name === "TimeoutError" ? 504 : 502,
        "Failed to reach OpenRouter chat completions.",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return {
    fetchModels,
    listFreeModels,
    assertModelIsFree,
    proxyChatCompletion,
  };
}
