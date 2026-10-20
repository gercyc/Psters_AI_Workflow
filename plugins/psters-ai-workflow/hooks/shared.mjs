import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
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

// Hook clients send different payload shapes:
//   - Cursor:         flat fields (command, file_path, conversation_id)
//   - Claude Code:    session_id + tool_name + tool_input { command, file_path }
//   - Codex:          Claude Code shape; apply_patch sends the patch in tool_input.command
//   - GitHub Copilot: sessionId + toolName + toolArgs { command, path } (object or JSON string)
// Flatten them into the Cursor-style shape the inner hooks already read.
function parseToolArgs(rawValue) {
  if (rawValue && typeof rawValue === "object") {
    return rawValue;
  }
  if (typeof rawValue === "string") {
    return safeParseJson(rawValue);
  }
  return {};
}

function toProjectRelative(filePath, cwd) {
  if (typeof filePath !== "string" || typeof cwd !== "string" || !isAbsolute(filePath)) {
    return filePath;
  }
  const rel = relative(cwd, filePath);
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : filePath;
}

// Codex shell calls may send the command as an argv array.
function commandToString(rawValue) {
  return Array.isArray(rawValue) ? rawValue.join(" ") : rawValue;
}

// Codex edits files through `apply_patch`, sending the patch text in
// tool_input.command; one patch can touch several files.
// `Move to:` renames the preceding `Update File:`, so it replaces that path.
const PATCH_FILE_RE = /^\*\*\* (Add File|Update File|Delete File|Move to): (.+)$/gm;

function patchFilePaths(toolName, command) {
  if (toolName !== "apply_patch" || typeof command !== "string") {
    return [];
  }
  const paths = [];
  for (const [, action, rawPath] of command.matchAll(PATCH_FILE_RE)) {
    if (action === "Move to" && paths.length > 0) {
      paths.pop();
    }
    paths.push(rawPath.trim());
  }
  return [...new Set(paths)];
}

export function normalizeHookPayload(payload) {
  const toolArgs = parseToolArgs(payload.tool_input ?? payload.toolArgs);
  const toolName = payload.tool_name ?? payload.toolName;
  const command = commandToString(payload.command ?? toolArgs.command);
  const filePaths = (payload.file_paths ?? patchFilePaths(toolName, command)).map((filePath) =>
    toProjectRelative(filePath, payload.cwd)
  );
  const filePath =
    payload.file_path ?? toolArgs.file_path ?? toolArgs.path ?? payload.path ?? filePaths[0];
  return {
    ...toolArgs,
    ...payload,
    session_id: payload.session_id ?? payload.sessionId ?? payload.conversation_id,
    tool_name: toolName,
    command,
    file_path: toProjectRelative(filePath, payload.cwd),
    file_paths: filePaths
  };
}

export function hookClient() {
  return process.env.PSTERS_HOOK_CLIENT || "claude";
}

// Tool-level reminder, delivered where each client shows it to the model:
//   - Copilot: postToolUse `additionalContext`
//   - Codex:   `hookSpecificOutput.additionalContext` (PreToolUse / PostToolUse)
//   - Claude Code / Cursor: stderr nudge
export function emitReminder(message, hookEventName = "PostToolUse") {
  const client = hookClient();
  if (client === "copilot") {
    process.stdout.write(JSON.stringify({ additionalContext: message }));
    return;
  }
  if (client === "codex") {
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: message } })
    );
    return;
  }
  console.error(message);
  process.stdout.write("{}");
}

// End-of-turn follow-up. Cursor's `followup_message` maps to the Copilot
// agentStop / Codex Stop `decision: "block"`, which sends `reason` back to
// the agent as a new prompt.
export function emitFollowup(message) {
  const client = hookClient();
  const output =
    client === "copilot" || client === "codex"
      ? { decision: "block", reason: message }
      : { followup_message: message };
  process.stdout.write(JSON.stringify(output));
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

