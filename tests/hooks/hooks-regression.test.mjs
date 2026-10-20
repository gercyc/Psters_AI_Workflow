import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = process.cwd();
const HOOKS_DIR = join(REPO_ROOT, "plugins", "psters-ai-workflow", "hooks");

function runHook(scriptName, payload, envOverrides = {}) {
  return spawnSync("node", [join(HOOKS_DIR, scriptName)], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: {
      ...process.env,
      ...envOverrides
    }
  });
}

test("track-edit stores per-session state with safe file path handling", () => {
  const pluginRoot = mkdtempSync(join(tmpdir(), "psters-hook-track-"));
  try {
    const result = runHook(
      "track-edit.mjs",
      {
        session_id: "session-1",
        file_path: "docs/architecture.md"
      },
      { CURSOR_PLUGIN_ROOT: pluginRoot }
    );
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "{}");

    const statePath = join(pluginRoot, ".cursor", "hooks", "state", "psters-ai-workflow.json");
    const saved = JSON.parse(readFileSync(statePath, "utf8"));
    assert.equal(saved.sessions["session-1"].docEdits, 1);
    assert.equal(saved.sessions["session-1"].codeEdits, 0);

    // Path traversal payload should be sanitized.
    const traversal = runHook(
      "track-edit.mjs",
      {
        session_id: "session-1",
        file_path: "../outside.md"
      },
      { CURSOR_PLUGIN_ROOT: pluginRoot }
    );
    assert.equal(traversal.status, 0);
    const savedAfter = JSON.parse(readFileSync(statePath, "utf8"));
    assert.equal(savedAfter.sessions["session-1"].touched.includes("../outside.md"), false);
  } finally {
    rmSync(pluginRoot, { recursive: true, force: true });
  }
});

test("doc-guard-stop emits follow-up message only when docs were skipped", () => {
  const pluginRoot = mkdtempSync(join(tmpdir(), "psters-hook-stop-"));
  try {
    runHook(
      "track-edit.mjs",
      { session_id: "session-2", file_path: "backend/src/app.ts" },
      { CURSOR_PLUGIN_ROOT: pluginRoot }
    );

    const stopResult = runHook(
      "doc-guard-stop.mjs",
      { session_id: "session-2" },
      { CURSOR_PLUGIN_ROOT: pluginRoot }
    );
    assert.equal(stopResult.status, 0);
    const output = JSON.parse(stopResult.stdout);
    assert.match(output.followup_message, /Documentation guard/);
  } finally {
    rmSync(pluginRoot, { recursive: true, force: true });
  }
});

test("commit-convention-reminder warns when ticket prefix is missing", () => {
  const missing = runHook("commit-convention-reminder.mjs", {
    command: 'git commit -m "fix: update hooks"'
  });
  assert.equal(missing.status, 0);
  assert.match(missing.stderr, /Commit reminder/);

  const withTicket = runHook("commit-convention-reminder.mjs", {
    command: 'git commit -m "[TICKET-1234] 🐛 fix(hooks): enforce guardrails"'
  });
  assert.equal(withTicket.status, 0);
  assert.equal(withTicket.stderr.trim(), "");
});

test("migration-atomic-reminder warns on typeorm generate command", () => {
  const result = runHook("migration-atomic-reminder.mjs", {
    command: "npm run typeorm:generate -- src/database/migrations/NewMigration"
  });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /TypeORM atomic chain reminder/);
});

test("telemetry writes events only when opt-in is enabled", () => {
  const pluginRoot = mkdtempSync(join(tmpdir(), "psters-hook-telemetry-"));
  try {
    runHook(
      "track-edit.mjs",
      { session_id: "session-telemetry", file_path: "docs/test.md" },
      {
        CURSOR_PLUGIN_ROOT: pluginRoot,
        PSTERS_WORKFLOW_TELEMETRY_OPT_IN: "true"
      }
    );
    const telemetryPath = join(
      pluginRoot,
      ".cursor",
      "hooks",
      "state",
      "psters-ai-workflow-telemetry.jsonl"
    );
    const telemetry = readFileSync(telemetryPath, "utf8");
    assert.match(telemetry, /afterFileEdit/);
  } finally {
    rmSync(pluginRoot, { recursive: true, force: true });
  }
});


test("commit-convention-reminder ignores shell commands that are not git commit", () => {
  const result = runHook("commit-convention-reminder.mjs", { command: "npm test" });
  assert.equal(result.status, 0);
  assert.equal(result.stderr.trim(), "");
  assert.equal(result.stdout.trim(), "{}");
});

test("hooks read Claude Code tool_input payloads", () => {
  const result = runHook("commit-convention-reminder.mjs", {
    session_id: "claude-session",
    tool_name: "Bash",
    tool_input: { command: 'git commit -m "fix: x"' }
  });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /Commit reminder/);
});

function runDispatcher(hookName, payload, envOverrides = {}) {
  return runHook("dispatcher.mjs", payload, {
    PSTERS_HOOK_NAME: hookName,
    PSTERS_HOOK_CLIENT: "copilot",
    ...envOverrides
  });
}

test("copilot: shell reminders are returned as additionalContext", () => {
  const result = runDispatcher(
    "commit-convention-reminder",
    {
      sessionId: "copilot-1",
      cwd: "/repo",
      toolName: "powershell",
      toolArgs: { command: 'git commit -m "fix: x"' }
    },
    { PSTERS_TOOL_MATCH: "^(bash|powershell)$" }
  );
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.match(output.additionalContext, /Commit reminder/);
});

test("copilot: toolArgs sent as a JSON string are parsed", () => {
  const result = runDispatcher(
    "migration-atomic-reminder",
    {
      sessionId: "copilot-2",
      toolName: "bash",
      toolArgs: JSON.stringify({ command: "npm run typeorm:generate -- src/migrations/X" })
    },
    { PSTERS_TOOL_MATCH: "^(bash|powershell)$" }
  );
  assert.equal(result.status, 0);
  assert.match(JSON.parse(result.stdout).additionalContext, /TypeORM atomic chain reminder/);
});

test("copilot: dispatcher skips tools that do not match PSTERS_TOOL_MATCH", () => {
  const pluginRoot = mkdtempSync(join(tmpdir(), "psters-hook-filter-"));
  try {
    const result = runDispatcher(
      "track-edit",
      { sessionId: "copilot-3", toolName: "view", toolArgs: { path: "src/a.ts" } },
      { PSTERS_TOOL_MATCH: "^(edit|create)$", CURSOR_PLUGIN_ROOT: pluginRoot }
    );
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "{}");
    const statePath = join(pluginRoot, ".cursor", "hooks", "state", "psters-ai-workflow.json");
    assert.throws(() => readFileSync(statePath, "utf8"));
  } finally {
    rmSync(pluginRoot, { recursive: true, force: true });
  }
});

test("copilot: edits are tracked with cwd-relative paths and agentStop blocks once", () => {
  const pluginRoot = mkdtempSync(join(tmpdir(), "psters-hook-copilot-"));
  const cwd = join(tmpdir(), "copilot-project");
  const env = { CURSOR_PLUGIN_ROOT: pluginRoot };
  try {
    const edit = runDispatcher(
      "track-edit",
      {
        sessionId: "copilot-4",
        cwd,
        toolName: "create",
        toolArgs: { path: join(cwd, "src", "app.ts"), file_text: "x" }
      },
      { ...env, PSTERS_TOOL_MATCH: "^(edit|create)$" }
    );
    assert.equal(edit.status, 0);

    const statePath = join(pluginRoot, ".cursor", "hooks", "state", "psters-ai-workflow.json");
    const saved = JSON.parse(readFileSync(statePath, "utf8"));
    assert.deepEqual(saved.sessions["copilot-4"].touched, ["src/app.ts"]);
    assert.equal(saved.sessions["copilot-4"].codeEdits, 1);

    const stop = runDispatcher("doc-guard-stop", { sessionId: "copilot-4", cwd }, env);
    assert.equal(stop.status, 0);
    const output = JSON.parse(stop.stdout);
    assert.equal(output.decision, "block");
    assert.match(output.reason, /Documentation guard/);

    const secondStop = runDispatcher("doc-guard-stop", { sessionId: "copilot-4", cwd }, env);
    assert.equal(secondStop.stdout.trim(), "{}");
  } finally {
    rmSync(pluginRoot, { recursive: true, force: true });
  }
});

test("commit-convention-reminder handles git global options and skips plumbing commands", () => {
  for (const command of ['git -C repo commit -m "x"', 'git -c user.name=x commit -m "x"']) {
    assert.match(runHook("commit-convention-reminder.mjs", { command }).stderr, /Commit reminder/, command);
  }
  for (const command of ["git commit-tree abc", "git commit-graph write"]) {
    assert.equal(runHook("commit-convention-reminder.mjs", { command }).stderr.trim(), "", command);
  }
});

test("claude: absolute tool_input.file_path is stored relative to cwd", () => {
  const pluginRoot = mkdtempSync(join(tmpdir(), "psters-hook-claude-"));
  const cwd = join(tmpdir(), "claude-project");
  try {
    runHook(
      "track-edit.mjs",
      {
        session_id: "claude-abs",
        cwd,
        tool_name: "Write",
        tool_input: { file_path: join(cwd, "docs", "guide.md") }
      },
      { CURSOR_PLUGIN_ROOT: pluginRoot }
    );
    const statePath = join(pluginRoot, ".cursor", "hooks", "state", "psters-ai-workflow.json");
    const session = JSON.parse(readFileSync(statePath, "utf8")).sessions["claude-abs"];
    assert.deepEqual(session.touched, ["docs/guide.md"]);
    assert.equal(session.docEdits, 1);
  } finally {
    rmSync(pluginRoot, { recursive: true, force: true });
  }
});
