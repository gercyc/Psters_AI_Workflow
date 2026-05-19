import { logTelemetry, readStdin, safeParseJson, sanitizeCommand } from "./shared.mjs";

async function main() {
  const payload = safeParseJson(await readStdin());
  const command = sanitizeCommand(payload.command || "");

  if (!command) {
    process.stdout.write("{}");
    return;
  }

  const hasTicketPrefix = /\[TICKET-[A-Za-z0-9_-]+\]/.test(command);
  if (!hasTicketPrefix) {
    console.error(
      "[psters-ai-workflow hook] Commit reminder: prefer `[TICKET-XXXX] <type>(<scope>): <subject>`; use `/pwf-commit-changes` for structured commits."
    );
  }
  logTelemetry("beforeShellExecution.git-commit", {
    hasTicketPrefix
  });

  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
});
