import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,120}$/;
const MAX_FILE_PATH_LEN = 500;
const MAX_COMMAND_LEN = 1200;

function inferPluginRoot() {
  if (process.env.CURSOR_PLUGIN_ROOT && process.env.CURSOR_PLUGIN_ROOT.trim()) {
    return resolve(process.env.CURSOR_PLUGIN_ROOT);
  }
  if (process.env.CLAUDE_PLUGIN_ROOT && process.env.CLAUDE_PLUGIN_ROOT.trim()) {
    return resolve(process.env.CLAUDE_PLUGIN_ROOT);
  }
  const thisFile = fileURLToPath(import.meta.url);
  return resolve(dirname(thisFile), "..");
}

export const PLUGIN_ROOT = inferPluginRoot();
export const STATE_DIR = resolve(PLUGIN_ROOT, ".cursor", "hooks", "state");
export const STATE_PATH = resolve(STATE_DIR, "psters-ai-workflow.json");
export const TELEMETRY_PATH = resolve(STATE_DIR, "psters-ai-workflow-telemetry.jsonl");

export function safeParseJson(stdinText) {
  try {
    const parsed = JSON.parse(stdinText || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readStdin() {
  return new Promise((resolveInput) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolveInput(data));
  });
}

export function sanitizeSessionId(rawValue) {
  const value = String(rawValue || "global").trim();
  if (!value || !SESSION_ID_RE.test(value)) {
    return "global";
  }
  return value;
}

export function sanitizeFilePath(rawValue) {
  if (typeof rawValue !== "string") {
    return "";
  }
  const cleaned = rawValue.replace(/\0/g, "").trim().slice(0, MAX_FILE_PATH_LEN);
  if (!cleaned) {
    return "";
  }
  // Prevent obvious path traversal payload values from being persisted.
  if (cleaned.includes("..")) {
    return "";
  }
  return cleaned.replace(/\\/g, "/");
}

export function sanitizeCommand(rawValue) {
  if (typeof rawValue !== "string") {
    return "";
  }
  return rawValue.replace(/\0/g, "").trim().slice(0, MAX_COMMAND_LEN);
}

export function ensureStateDir() {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function loadJsonState(filePath, fallbackValue) {
  if (!existsSync(filePath)) {
    return fallbackValue;
  }
  try {
    const data = JSON.parse(readFileSync(filePath, "utf8"));
    return data && typeof data === "object" ? data : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function saveJsonState(filePath, value) {
  ensureStateDir();
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function telemetryEnabled() {
  return String(process.env.PSTERS_WORKFLOW_TELEMETRY_OPT_IN || "").toLowerCase() === "true";
}

export function logTelemetry(eventName, payload = {}) {
  if (!telemetryEnabled()) {
    return;
  }
  ensureStateDir();
  const event = {
    ts: new Date().toISOString(),
    event: eventName,
    payload
  };
  writeFileSync(TELEMETRY_PATH, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
}

