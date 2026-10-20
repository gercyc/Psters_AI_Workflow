import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PLUGIN_ROOT = join(process.cwd(), "plugins", "psters-ai-workflow");

function readJson(...segments) {
  return JSON.parse(readFileSync(join(...segments), "utf8"));
}

const claude = readJson(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
const copilot = readJson(PLUGIN_ROOT, ".github", "plugin", "plugin.json");

test("copilot manifest stays in sync with the Claude Code manifest", () => {
  assert.equal(copilot.name, claude.name);
  assert.equal(copilot.version, claude.version);
  assert.deepEqual(
    copilot.agents,
    claude.agents.map((agent) => agent.replace(/^\.\//, ""))
  );
});

test("copilot manifest only references files that exist", () => {
  for (const agent of copilot.agents) {
    assert.ok(existsSync(join(PLUGIN_ROOT, agent)), `missing agent: ${agent}`);
  }
  assert.ok(existsSync(join(PLUGIN_ROOT, copilot.skills)));
  assert.ok(existsSync(join(PLUGIN_ROOT, copilot.mcpServers)));
});

test("copilot hooks use camelCase events and route through the dispatcher", () => {
  const hooks = readJson(PLUGIN_ROOT, copilot.hooks);
  assert.equal(hooks.version, 1);
  const config = readJson(PLUGIN_ROOT, "hooks", "config.json");
  const registered = Object.values(hooks.hooks).flat();

  for (const entry of registered) {
    assert.match(entry.command, /dispatcher\.mjs/);
    assert.equal(entry.env.PSTERS_HOOK_CLIENT, "copilot");
  }
  assert.deepEqual(
    registered.map((entry) => entry.env.PSTERS_HOOK_NAME).sort(),
    Object.keys(config.hooks).sort()
  );
});
