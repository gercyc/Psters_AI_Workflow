import {
  emitReminder,
  logTelemetry,
  normalizeHookPayload,
  readStdin,
  safeParseJson,
  sanitizeCommand
} from "./shared.mjs";

async function main() {
  const payload = normalizeHookPayload(safeParseJson(await readStdin()));
  const command = sanitizeCommand(payload.command || "");

  const isGenerate = command.includes("typeorm:generate");
  logTelemetry("afterShellExecution.typeorm-generate", {
    isGenerate
  });

  if (isGenerate) {
    emitReminder(
      "[psters-ai-workflow hook] TypeORM atomic chain reminder: generate -> drift-check -> run locally immediately."
    );
    return;
  }

  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
});
