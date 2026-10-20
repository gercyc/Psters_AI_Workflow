import {
  STATE_PATH,
  loadJsonState,
  logTelemetry,
  normalizeHookPayload,
  readStdin,
  safeParseJson,
  sanitizeFilePath,
  sanitizeSessionId,
  saveJsonState
} from "./shared.mjs";

function pickFilePath(payload) {
  return sanitizeFilePath(
    payload.file_path ||
    payload.path ||
    payload.relative_path ||
    payload.filePath ||
    payload.file ||
    ""
  );
}

// A Codex apply_patch can touch several files; other clients send one.
// An edit with no recognizable path still counts once, as before.
function pickFilePaths(payload) {
  const fromPatch = (payload.file_paths || []).map(sanitizeFilePath).filter(Boolean);
  return fromPatch.length > 0 ? fromPatch : [pickFilePath(payload)];
}

function isDocPath(filePath) {
  if (!filePath) {
    return false;
  }
  const normalized = String(filePath).replace(/\\/g, "/");
  return (
    normalized.startsWith("docs/") ||
    normalized.endsWith(".md") ||
    normalized.endsWith(".mdx") ||
    normalized.endsWith("/README.md")
  );
}

async function main() {
  const stdin = await readStdin();
  const payload = normalizeHookPayload(safeParseJson(stdin));
  const sessionId = sanitizeSessionId(payload.session_id || payload.conversation_id || "global");
  const filePaths = pickFilePaths(payload);

  const state = loadJsonState(STATE_PATH, { version: 1, sessions: {} });
  if (!state.sessions[sessionId]) {
    state.sessions[sessionId] = { codeEdits: 0, docEdits: 0, touched: [] };
  }

  const session = state.sessions[sessionId];
  for (const filePath of filePaths) {
    if (isDocPath(filePath)) {
      session.docEdits += 1;
    } else {
      session.codeEdits += 1;
    }
    if (filePath && !session.touched.includes(filePath)) {
      session.touched.push(filePath);
      session.touched = session.touched.slice(-20);
    }
    logTelemetry("afterFileEdit", {
      sessionId,
      isDoc: isDocPath(filePath),
      filePath
    });
  }

  state.updatedAt = Date.now();
  saveJsonState(STATE_PATH, state);

  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
});
