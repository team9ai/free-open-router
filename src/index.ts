import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

try {
  process.loadEnvFile(".env");
} catch {
  // Ignore missing .env and fall back to the existing process environment.
}

const config = loadConfig();
const app = createApp(config);

const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`free-open-router listening on http://localhost:${info.port}`);
  },
);

// Prevent Render health-check "Connection reset by peer" errors.
(server as import("node:http").Server).keepAliveTimeout = 120_000;
(server as import("node:http").Server).headersTimeout = 120_000;
