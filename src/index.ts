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

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`free-open-router listening on http://localhost:${info.port}`);
  },
);
