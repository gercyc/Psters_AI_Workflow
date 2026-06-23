// psters-ai-workflow hook dispatcher.
//
// Single entry point registered in hooks.claude.json. Receives the Claude
// Code hook payload via stdin, routes to the right inner hook based on the
// PSTERS_HOOK_NAME env var (set by hooks.claude.json per matcher), and
// respects the per-hook enable/disable toggle in config.json.
//
// Why a dispatcher?
//   - One JSON entry per matcher, so the plugin can never accidentally
//     register the same hook twice (which is what produced 2 Stop hooks +
//     MODULE_NOT_FOUND errors in older versions).
//   - The user can disable individual hooks from config.json without editing
//     hooks.claude.json.
//   - Falls back to a no-op (empty JSON) for disabled/unknown hooks, so
//     the Claude Code runtime never sees a non-zero exit code.

import { fork } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { readStdin } from "./shared.mjs";

const HOOKS_DIR = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(HOOKS_DIR, "config.json");

function loadConfig() {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { hooks: {} };
  } catch {
    return { hooks: {} };
  }
}

function isEnabled(hookName, config) {
  const entry = config.hooks && config.hooks[hookName];
  if (!entry || typeof entry !== "object") {
    return true; // unknown hooks default to enabled
  }
  return entry.enabled !== false;
}

async function runInnerHook(hookName, stdinPayload) {
  return new Promise((resolveRun) => {
    const target = resolve(HOOKS_DIR, `${hookName}.mjs`);
    const child = fork(target, [], {
      stdio: ["pipe", "inherit", "inherit", "ipc"]
    });
    child.stdin.write(stdinPayload);
    child.stdin.end();
    child.on("exit", (code) => resolveRun(code ?? 0));
    child.on("error", () => resolveRun(0));
  });
}

async function main() {
  const hookName = process.env.PSTERS_HOOK_NAME;
  if (!hookName) {
    process.stdout.write("{}");
    return;
  }
  const config = loadConfig();
  if (!isEnabled(hookName, config)) {
    process.stdout.write("{}");
    return;
  }
  const stdinPayload = await readStdin().catch(() => "");
  // Inner hook emits its own JSON to stdout (via inherit). No need to
  // re-emit {} here — that would produce duplicate payloads.
  await runInnerHook(hookName, stdinPayload);
}

main().catch(() => {
  process.stdout.write("{}");
});
