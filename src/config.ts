export interface AppConfig {
  port: number;
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  appName: string;
  siteUrl: string;
  modelsCacheTtlMs: number;
  upstreamTimeoutMs: number;
  corsOrigin: string;
}

const DEFAULT_PORT = 3000;
const DEFAULT_MODELS_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_UPSTREAM_TIMEOUT_MS = 60 * 1000;

function parsePositiveNumber(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: parsePositiveNumber(env.PORT, DEFAULT_PORT),
    openRouterApiKey: env.OPENROUTER_API_KEY?.trim() ?? "",
    openRouterBaseUrl:
      env.OPENROUTER_BASE_URL?.trim() ?? "https://openrouter.ai/api/v1",
    appName: env.APP_NAME?.trim() ?? "free-open-router",
    siteUrl: env.SITE_URL?.trim() ?? "",
    modelsCacheTtlMs: parsePositiveNumber(
      env.MODELS_CACHE_TTL_MS,
      DEFAULT_MODELS_CACHE_TTL_MS,
    ),
    upstreamTimeoutMs: parsePositiveNumber(
      env.UPSTREAM_TIMEOUT_MS,
      DEFAULT_UPSTREAM_TIMEOUT_MS,
    ),
    corsOrigin: env.CORS_ORIGIN?.trim() ?? "*",
  };
}
