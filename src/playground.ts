import type { AppConfig } from "./config.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPlaygroundHtml(config: AppConfig): string {
  const defaultStrongestPayload = JSON.stringify(
    {
      temperature: 0.7,
    },
    null,
    2,
  );
  const defaultFreePayload = JSON.stringify(
    {
      temperature: 0.7,
    },
    null,
    2,
  );
  const baseUrl = config.siteUrl || `http://localhost:${config.port}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>free-open-router playground</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --bg-2: #eaf0f8;
        --panel: rgba(255, 255, 255, 0.92);
        --panel-2: rgba(250, 252, 255, 0.96);
        --input: #f8fbff;
        --result: #0d1526;
        --border: rgba(100, 124, 170, 0.16);
        --border-strong: rgba(89, 192, 255, 0.34);
        --text: #162033;
        --muted: #62708c;
        --accent: #50c2ff;
        --accent-2: #8a7dff;
        --accent-soft: rgba(80, 194, 255, 0.12);
        --success: #1e9f68;
        --danger: #d54b4b;
        --shadow: 0 18px 48px rgba(24, 39, 75, 0.12);
        --mono: "IBM Plex Mono", "SFMono-Regular", "Menlo", "Consolas", monospace;
        --sans: "Avenir Next", "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: var(--sans);
        color: var(--text);
        overflow-x: hidden;
        background:
          radial-gradient(circle at top left, rgba(80, 194, 255, 0.12), transparent 24%),
          radial-gradient(circle at top right, rgba(138, 125, 255, 0.1), transparent 26%),
          linear-gradient(180deg, #fbfdff 0%, var(--bg) 46%, #edf2f8 100%);
      }

      .page {
        width: 100%;
        padding: 18px 0 40px;
      }

      .page-inner {
        width: min(960px, calc(100vw - 20px));
        max-width: 960px;
        margin: 0 auto;
        overflow-x: hidden;
      }

      .page-inner > *,
      .intro,
      .stack,
      .panel-grid,
      .panel,
      .hero,
      .stats {
        width: 100%;
        max-width: 100%;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 16px 18px;
        border: 1px solid var(--border);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(14px);
        box-shadow: var(--shadow);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .brand-mark {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, rgba(80, 194, 255, 0.18), rgba(138, 125, 255, 0.12));
        border: 1px solid rgba(80, 194, 255, 0.24);
        color: var(--accent);
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .brand-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
      }

      .brand-subtitle {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
      }

      .nav {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .nav a {
        color: var(--text);
        text-decoration: none;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.78);
        padding: 9px 12px;
        border-radius: 999px;
        font-size: 13px;
      }

      .nav code {
        color: var(--accent);
        font-family: var(--mono);
      }

      .intro {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 16px;
      }

      .hero,
      .stats {
        border: 1px solid var(--border);
        border-radius: 26px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 251, 255, 0.98));
        box-shadow: var(--shadow);
      }

      .hero {
        padding: 26px;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(80, 194, 255, 0.2);
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      h1 {
        margin: 18px 0 12px;
        font-size: clamp(38px, 5vw, 68px);
        line-height: 0.94;
        letter-spacing: -0.06em;
      }

      .lede {
        margin: 0;
        max-width: 960px;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.75;
      }

      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }

      .meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.78);
        font-size: 13px;
      }

      .meta-chip code {
        color: var(--accent);
        font-family: var(--mono);
      }

      .stats {
        padding: 16px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .stat {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.78);
      }

      .stat-label {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .stat-value {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.04em;
        word-break: break-all;
      }

      .stat-copy {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.6;
      }

      .stack {
        display: grid;
        gap: 16px;
        margin-top: 16px;
      }

      .panel-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .panel {
        padding: 22px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: var(--panel);
        box-shadow: var(--shadow);
      }

      .panel-head {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }

      .route {
        display: inline-flex;
        margin-bottom: 10px;
        padding: 7px 10px;
        border-radius: 999px;
        background: rgba(138, 125, 255, 0.12);
        color: #5f57bf;
        font-family: var(--mono);
        font-size: 12px;
      }

      .panel h2 {
        margin: 0;
        font-size: 24px;
        letter-spacing: -0.03em;
      }

      .hint {
        margin: 0 0 14px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.7;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        width: 100%;
      }

      button {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        border-radius: 14px;
        min-width: 132px;
        min-height: 44px;
        padding: 11px 16px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        color: #ffffff;
        background: linear-gradient(135deg, var(--accent) 0%, #79d6ff 100%);
        box-shadow: 0 10px 28px rgba(80, 194, 255, 0.18);
        transition: transform 120ms ease, opacity 120ms ease, box-shadow 120ms ease, background 120ms ease;
      }

      button.secondary,
      .copy-button {
        color: var(--text);
        background: rgba(255, 255, 255, 0.78);
        border-color: rgba(100, 124, 170, 0.16);
        box-shadow: none;
      }

      .copy-button {
        min-width: auto;
        min-height: auto;
        padding: 7px 10px;
      }

      button:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      button:disabled {
        opacity: 0.55;
        cursor: progress;
      }

      .status {
        min-height: 22px;
        margin: 0 0 12px;
        color: var(--muted);
        font-size: 13px;
      }

      .status.ok {
        color: var(--success);
      }

      .status.error {
        color: var(--danger);
      }

      .placeholder {
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px dashed rgba(80, 194, 255, 0.22);
        background: rgba(80, 194, 255, 0.05);
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }

      .field {
        margin-bottom: 14px;
      }

      .field-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 12px 14px;
        font: inherit;
        color: var(--text);
        background: var(--input);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: none;
        border-color: var(--border-strong);
        box-shadow: 0 0 0 3px rgba(80, 194, 255, 0.1);
      }

      textarea,
      pre,
      code {
        font-family: var(--mono);
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }

      .result {
        margin-top: 14px;
        width: 100%;
        max-height: 460px;
        display: flex;
        flex-direction: column;
        border-radius: 20px;
        border: 1px solid rgba(80, 194, 255, 0.18);
        background: var(--result);
        overflow: hidden;
      }

      .result-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        color: rgba(238, 244, 255, 0.66);
        font-size: 12px;
      }

      .result-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .copy-button {
        font-size: 12px;
      }

      pre {
        margin: 0;
        padding: 16px;
        min-height: 220px;
        max-height: 400px;
        flex: 1 1 auto;
        overflow: auto;
        font-size: 12px;
        line-height: 1.65;
        white-space: pre-wrap;
        word-break: break-all;
        color: #e8edf6;
      }

      .note {
        padding: 18px 20px;
        border-radius: 22px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.76);
        color: var(--muted);
        font-size: 14px;
        line-height: 1.7;
      }

      @media (max-width: 980px) {
        .panel-grid,
        .field-row,
        .stats {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .page {
          padding: 10px 0 28px;
        }

        .page-inner {
          width: calc(100vw - 16px);
          max-width: 960px;
        }

        .header {
          flex-direction: column;
          align-items: flex-start;
        }

        h1 {
          font-size: clamp(34px, 12vw, 54px);
        }

        .hero,
        .panel {
          padding: 16px;
          border-radius: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <main class="page-inner">
      <header class="header">
        <div class="brand">
          <div class="brand-mark">OR</div>
          <div>
            <p class="brand-title">free-open-router</p>
            <p class="brand-subtitle">OpenRouter-style proxy playground</p>
          </div>
        </div>
        <nav class="nav">
          <a href="/">API <code>/</code></a>
          <a href="/healthz">Health <code>/healthz</code></a>
          <a href="/playground">Playground <code>/playground</code></a>
        </nav>
      </header>

      <section class="intro">
        <section class="hero">
          <div class="eyebrow">Proxy Testing Surface</div>
          <h1>Free models, unified API, ready to go.</h1>
          <p class="lede">
            This playground covers three core tests: free model catalog, strongest auto-routing, and specific free model chat. Responses are shown as raw JSON for quick proxy verification.
          </p>
          <div class="hero-meta">
            <div class="meta-chip">Base URL <code>${escapeHtml(baseUrl)}</code></div>
            <div class="meta-chip">Free Models <code>GET /v1/models/free</code></div>
            <div class="meta-chip">Strongest <code>POST /v1/chat/completions/strongest</code></div>
          </div>
        </section>

        <aside class="stats">
          <div class="stat">
            <p class="stat-label">Current Origin</p>
            <p class="stat-value">${escapeHtml(baseUrl)}</p>
            <p class="stat-copy">The proxy service address used by this playground.</p>
          </div>
          <div class="stat">
            <p class="stat-label">Focus</p>
            <p class="stat-value">Raw JSON</p>
            <p class="stat-copy">No post-processing — compare upstream and proxy behavior directly.</p>
          </div>
          <div class="stat">
            <p class="stat-label">Routes</p>
            <p class="stat-value">3</p>
            <p class="stat-copy">Model catalog, auto-routing, and free model chat.</p>
          </div>
        </aside>
      </section>

      <section class="stack">
        <article class="panel">
          <div class="panel-head">
            <div>
              <div class="route">GET /v1/models/free</div>
              <h2>Free Model List</h2>
            </div>
            <div class="toolbar">
              <button id="load-models" type="button">Load Free Models</button>
              <button id="refresh-models" type="button" class="secondary">Force Refresh</button>
            </div>
          </div>
          <p class="hint">Displays the raw JSON response from the proxy and syncs free models to the dropdown below.</p>
          <p id="models-status" class="status"></p>
          <div id=”models-list” class=”placeholder”>Click “Load Free Models” to see a summary here. Full JSON is shown in the result area below.</div>
          <div class="result">
            <div class="result-header">
              <span>Raw Response</span>
              <div class="result-actions">
                <button id="copy-models" type="button" class="copy-button">Copy</button>
                <span id="models-meta">Waiting</span>
              </div>
            </div>
            <pre id="models-output"></pre>
          </div>
        </article>

        <section class="panel-grid">
          <article class="panel">
            <div class="panel-head">
              <div>
                <div class="route">POST /v1/chat/completions/strongest</div>
                <h2>Strongest Auto-Routing</h2>
              </div>
              <button id="send-strongest" type="button">Send Request</button>
            </div>
            <p class="hint">The server routes to <code>openrouter/auto</code> — useful for testing the strongest auto-fallback layer.</p>
            <div class="field">
              <label for="strongest-prompt">User Prompt</label>
              <textarea id="strongest-prompt">Summarize the purpose of this proxy service.</textarea>
            </div>
            <div class="field">
              <label for="strongest-extra">Extra JSON</label>
              <textarea id="strongest-extra">${escapeHtml(defaultStrongestPayload)}</textarea>
            </div>
            <p id="strongest-status" class="status"></p>
            <div class="result">
              <div class="result-header">
                <span>Raw Response</span>
                <div class="result-actions">
                  <button id="copy-strongest" type="button" class="copy-button">Copy</button>
                  <span id="strongest-meta">Waiting</span>
                </div>
              </div>
              <pre id="strongest-output"></pre>
            </div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <div class="route">POST /v1/chat/completions/free</div>
                <h2>Free Model Chat</h2>
              </div>
              <button id="send-free" type="button">Send Request</button>
            </div>
            <p class="hint">Select a loaded free model or manually override the model name. The proxy validates it is still free before forwarding.</p>
            <div class="field-row">
              <div class="field">
                <label for="free-model-select">Free Model</label>
                <select id="free-model-select">
                  <option value="">Load free models first</option>
                </select>
              </div>
              <div class="field">
                <label for="free-model-manual">Manual Override</label>
                <input id="free-model-manual" placeholder="e.g. deepseek/deepseek-chat-v3-0324:free" />
              </div>
            </div>
            <div class="field">
              <label for="free-prompt">User Prompt</label>
              <textarea id="free-prompt">Write a Node.js hello world and explain each line.</textarea>
            </div>
            <div class="field">
              <label for="free-extra">Extra JSON</label>
              <textarea id="free-extra">${escapeHtml(defaultFreePayload)}</textarea>
            </div>
            <p id="free-status" class="status"></p>
            <div class="result">
              <div class="result-header">
                <span>Raw Response</span>
                <div class="result-actions">
                  <button id="copy-free" type="button" class="copy-button">Copy</button>
                  <span id="free-meta">Waiting</span>
                </div>
              </div>
              <pre id="free-output"></pre>
            </div>
          </article>
        </section>

        <div class="note">
          If strongest or free chat returns 401, 402, or 429, it's usually not a page issue — check your upstream OpenRouter key, quota, rate limits, or model availability.
        </div>
      </section>

      <script>
        const state = {
          freeModels: [],
        };

        const els = {
          loadModels: document.getElementById("load-models"),
          refreshModels: document.getElementById("refresh-models"),
          modelsStatus: document.getElementById("models-status"),
          modelsOutput: document.getElementById("models-output"),
          modelsMeta: document.getElementById("models-meta"),
          copyModels: document.getElementById("copy-models"),
          modelsList: document.getElementById("models-list"),
          strongestPrompt: document.getElementById("strongest-prompt"),
          strongestExtra: document.getElementById("strongest-extra"),
          strongestStatus: document.getElementById("strongest-status"),
          strongestOutput: document.getElementById("strongest-output"),
          strongestMeta: document.getElementById("strongest-meta"),
          copyStrongest: document.getElementById("copy-strongest"),
          sendStrongest: document.getElementById("send-strongest"),
          freeModelSelect: document.getElementById("free-model-select"),
          freeModelManual: document.getElementById("free-model-manual"),
          freePrompt: document.getElementById("free-prompt"),
          freeExtra: document.getElementById("free-extra"),
          freeStatus: document.getElementById("free-status"),
          freeOutput: document.getElementById("free-output"),
          freeMeta: document.getElementById("free-meta"),
          copyFree: document.getElementById("copy-free"),
          sendFree: document.getElementById("send-free"),
        };

        function setStatus(element, text, type) {
          element.textContent = text;
          element.className = "status" + (type ? " " + type : "");
        }

        function pretty(value) {
          if (typeof value === "string") {
            return value;
          }
          return JSON.stringify(value, null, 2);
        }

        async function copyResult(preElement, buttonElement) {
          const text = preElement.textContent || "";

          if (!text.trim()) {
            return;
          }

          const originalLabel = buttonElement.textContent;

          try {
            await navigator.clipboard.writeText(text);
            buttonElement.textContent = "Copied";
            window.setTimeout(() => {
              buttonElement.textContent = originalLabel;
            }, 1200);
          } catch {
            buttonElement.textContent = "Failed";
            window.setTimeout(() => {
              buttonElement.textContent = originalLabel;
            }, 1200);
          }
        }

        function parseExtraJson(textarea, statusElement) {
          const raw = textarea.value.trim();

          if (!raw) {
            return {};
          }

          try {
            const parsed = JSON.parse(raw);
            if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
              throw new Error("Extra JSON must be an object");
            }
            return parsed;
          } catch (error) {
            setStatus(statusElement, error.message || "Failed to parse Extra JSON", "error");
            throw error;
          }
        }

        async function requestJson(url, options) {
          const response = await fetch(url, options);
          const text = await response.text();
          let payload;

          try {
            payload = text ? JSON.parse(text) : null;
          } catch {
            payload = text;
          }

          return {
            ok: response.ok,
            status: response.status,
            payload,
          };
        }

        function renderModelsSummary(models) {
          if (!models.length) {
            els.modelsList.textContent = "No free models found. Check your API key permissions, upstream status, or filter results.";
            return;
          }

          els.modelsList.textContent = "Fetched " + models.length + " free models. See full content in Raw Response below.";
        }

        function renderModelSelect(models) {
          els.freeModelSelect.innerHTML = "";

          if (!models.length) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Load free models first";
            els.freeModelSelect.appendChild(option);
            return;
          }

          models.forEach((model, index) => {
            const option = document.createElement("option");
            option.value = String(model.id || "");
            option.textContent = String(model.id || "");
            option.selected = index === 0;
            els.freeModelSelect.appendChild(option);
          });
        }

        async function loadModels(forceRefresh) {
          els.loadModels.disabled = true;
          els.refreshModels.disabled = true;
          setStatus(els.modelsStatus, forceRefresh ? "Refreshing model list..." : "Loading model list...", "");
          els.modelsMeta.textContent = "Loading";

          try {
            const query = forceRefresh ? "?refresh=1" : "";
            const result = await requestJson("/v1/models/free" + query);
            els.modelsOutput.textContent = pretty(result.payload);
            els.modelsMeta.textContent = "HTTP " + result.status;

            if (!result.ok) {
              renderModelsSummary([]);
              renderModelSelect([]);
              setStatus(els.modelsStatus, "Failed to load. See response below.", "error");
              return;
            }

            state.freeModels = Array.isArray(result.payload?.data) ? result.payload.data : [];
            renderModelsSummary(state.freeModels);
            renderModelSelect(state.freeModels);
            const count = result.payload?.meta?.count ?? state.freeModels.length;
            setStatus(els.modelsStatus, "Loaded " + count + " free models.", "ok");
          } catch (error) {
            renderModelsSummary([]);
            renderModelSelect([]);
            els.modelsOutput.textContent = String(error);
            els.modelsMeta.textContent = "Failed";
            setStatus(els.modelsStatus, "Request error. Check service logs.", "error");
          } finally {
            els.loadModels.disabled = false;
            els.refreshModels.disabled = false;
          }
        }

        async function sendStrongest() {
          els.sendStrongest.disabled = true;
          setStatus(els.strongestStatus, "Requesting strongest chat...", "");
          els.strongestMeta.textContent = "Loading";

          try {
            const extra = parseExtraJson(els.strongestExtra, els.strongestStatus);
            const body = {
              ...extra,
              messages: [
                {
                  role: "user",
                  content: els.strongestPrompt.value.trim(),
                },
              ],
            };

            const result = await requestJson("/v1/chat/completions/strongest", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            });

            els.strongestOutput.textContent = pretty(result.payload);
            els.strongestMeta.textContent = "HTTP " + result.status;
            setStatus(
              els.strongestStatus,
              result.ok ? "Strongest chat request succeeded." : "Strongest chat request failed.",
              result.ok ? "ok" : "error",
            );
          } catch (error) {
            els.strongestOutput.textContent = String(error);
            els.strongestMeta.textContent = "Failed";
            setStatus(els.strongestStatus, "Request error. Check input JSON or service logs.", "error");
          } finally {
            els.sendStrongest.disabled = false;
          }
        }

        async function sendFree() {
          els.sendFree.disabled = true;
          setStatus(els.freeStatus, "Requesting free model chat...", "");
          els.freeMeta.textContent = "Loading";

          try {
            const extra = parseExtraJson(els.freeExtra, els.freeStatus);
            const manualModel = els.freeModelManual.value.trim();
            const selectedModel = els.freeModelSelect.value.trim();
            const model = manualModel || selectedModel;

            if (!model) {
              setStatus(els.freeStatus, "Please select or enter a free model first.", "error");
              return;
            }

            const body = {
              ...extra,
              model,
              messages: [
                {
                  role: "user",
                  content: els.freePrompt.value.trim(),
                },
              ],
            };

            const result = await requestJson("/v1/chat/completions/free", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            });

            els.freeOutput.textContent = pretty(result.payload);
            els.freeMeta.textContent = "HTTP " + result.status;
            setStatus(
              els.freeStatus,
              result.ok ? "Free model chat request succeeded." : "Free model chat request failed.",
              result.ok ? "ok" : "error",
            );
          } catch (error) {
            els.freeOutput.textContent = String(error);
            els.freeMeta.textContent = "Failed";
            setStatus(els.freeStatus, "Request error. Check input JSON or service logs.", "error");
          } finally {
            els.sendFree.disabled = false;
          }
        }

        els.loadModels.addEventListener("click", () => loadModels(false));
        els.refreshModels.addEventListener("click", () => loadModels(true));
        els.sendStrongest.addEventListener("click", sendStrongest);
        els.sendFree.addEventListener("click", sendFree);
        els.copyModels.addEventListener("click", () => copyResult(els.modelsOutput, els.copyModels));
        els.copyStrongest.addEventListener("click", () => copyResult(els.strongestOutput, els.copyStrongest));
        els.copyFree.addEventListener("click", () => copyResult(els.freeOutput, els.copyFree));

        loadModels(false);
      </script>
      </main>
    </div>
  </body>
</html>`;
}
