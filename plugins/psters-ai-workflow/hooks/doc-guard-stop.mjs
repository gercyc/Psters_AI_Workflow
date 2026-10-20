import {
  STATE_PATH,
  emitFollowup,
  loadJsonState,
  logTelemetry,
  normalizeHookPayload,
  readStdin,
  safeParseJson,
  sanitizeSessionId,
  saveJsonState
} from "./shared.mjs";

async function main() {
  const payload = normalizeHookPayload(safeParseJson(await readStdin()));
  const sessionId = sanitizeSessionId(payload.session_id || payload.conversation_id || "global");
  const state = loadJsonState(STATE_PATH, { version: 1, sessions: {} });
  const session = state.sessions[sessionId] || state.sessions.global;

  if (!session) {
    process.stdout.write("{}");
    return;
  }

  const needsDocsReminder = session.codeEdits > 0 && session.docEdits === 0;

  delete state.sessions[sessionId];
  state.updatedAt = Date.now();
  saveJsonState(STATE_PATH, state);
  logTelemetry("stop", {
    sessionId,
    needsDocsReminder
  });

  if (needsDocsReminder) {
    emitFollowup(
      "Documentation guard: code was edited but no docs were updated in this session. Run `/pwf-doc update` to refresh canonical docs. If baseline project docs are stale, run `/pwf-doc-foundation all`. If operational procedures changed, run `/pwf-doc-runbook <service-or-operation>`. If docs need lifecycle reconciliation, run `/pwf-doc-refresh`. If you solved a non-trivial issue or pattern, run `/pwf-doc-capture`."
    );
    return;
  }

  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
});
