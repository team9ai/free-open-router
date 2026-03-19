import assert from "node:assert/strict";
import test from "node:test";

import { extractParamSize, scoreModel } from "../src/openrouter.js";
import type { OpenRouterModel } from "../src/openrouter.js";

function makeModel(overrides: Partial<OpenRouterModel> & { id: string }): OpenRouterModel {
  return { ...overrides };
}

test("extractParamSize parses parameter count from model id", () => {
  assert.equal(extractParamSize(makeModel({ id: "nvidia/nemotron-3-super-120b-a12b:free" })), 120);
  assert.equal(extractParamSize(makeModel({ id: "meta-llama/llama-3.3-70b-instruct:free" })), 70);
});

test("extractParamSize falls back to model name", () => {
  assert.equal(
    extractParamSize(makeModel({ id: "vendor/mystery:free", name: "Mystery 405B" })),
    405,
  );
});

test("extractParamSize returns null when no size found", () => {
  assert.equal(extractParamSize(makeModel({ id: "openrouter/free" })), null);
});

test("scoreModel ranks larger and newer models higher", () => {
  const large = makeModel({
    id: "vendor/big-400b:free",
    created: 1770000000,
    context_length: 131072,
  });
  const small = makeModel({
    id: "vendor/tiny-3b:free",
    created: 1770000000,
    context_length: 131072,
  });
  const old = makeModel({
    id: "vendor/big-400b:free",
    created: 1680000000,
    context_length: 131072,
  });

  assert.ok(scoreModel(large) > scoreModel(small), "larger params should score higher");
  assert.ok(scoreModel(large) > scoreModel(old), "newer model should score higher");
});

test("scoreModel handles missing fields gracefully", () => {
  const minimal = makeModel({ id: "openrouter/free" });
  const score = scoreModel(minimal);
  assert.equal(typeof score, "number");
  assert.ok(Number.isFinite(score));
});
