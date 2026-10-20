import {
  emitReminder,
  logTelemetry,
  normalizeHookPayload,
  readStdin,
  safeParseJson,
  sanitizeCommand
} from "./shared.mjs";

// Allows global options before the subcommand (`git -C dir`, `git -c k=v`) and
// rejects plumbing commands like `git commit-tree` / `git commit-graph`.
const GIT_COMMIT_RE = /\bgit\b(?:\s+(?:-[Cc]\s+\S+|--?\S+))*\s+commit(?![\w-])/;

async function main() {
  const payload = normalizeHookPayload(safeParseJson(await readStdin()));
  const command = sanitizeCommand(payload.command || "");

  if (!command || !GIT_COMMIT_RE.test(command)) {
    process.stdout.write("{}");
    return;
  }

  const hasTicketPrefix = /\[TICKET-[A-Za-z0-9_-]+\]/.test(command);
  logTelemetry("beforeShellExecution.git-commit", {
    hasTicketPrefix
  });

  if (!hasTicketPrefix) {
    emitReminder(
      "[psters-ai-workflow hook] Commit reminder: prefer `[TICKET-XXXX] <type>(<scope>): <subject>`; use `/pwf-commit-changes` for structured commits."
    );
    return;
  }

  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
});
