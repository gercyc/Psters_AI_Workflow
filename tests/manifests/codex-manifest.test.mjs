import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PLUGIN_ROOT = join(process.cwd(), "plugins", "psters-ai-workflow");

function readJson(...segments) {
  return JSON.parse(readFileSync(join(...segments), "utf8"));
}

const claude = readJson(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
const codex = readJson(PLUGIN_ROOT, ".codex-plugin", "plugin.json");

test("codex manifest stays in sync with the Claude Code manifest", () => {
  assert.equal(codex.name, claude.name);
  assert.equal(codex.version, claude.version);
});

test("codex manifest only references paths that exist inside the plugin", () => {
  const paths = [...codex.skills, codex.mcpServers, codex.hooks, codex.interface.logo];
  for (const relPath of paths) {
    assert.match(relPath, /^\.\//, `path must start with ./: ${relPath}`);
    assert.ok(existsSync(join(PLUGIN_ROOT, relPath)), `missing: ${relPath}`);
  }
});

test("codex manifest disables command migration (commands already exist as skills)", () => {
  assert.deepEqual(codex.commands, []);
  for (const file of readdirSync(join(PLUGIN_ROOT, "commands"))) {
    const skillName = file.replace(/\.md$/, "");
    assert.ok(existsSync(join(PLUGIN_ROOT, "skills", skillName, "SKILL.md")), `no skill for ${file}`);
  }
});

test("codex hooks route every configured hook through the dispatcher", () => {
  const hooks = readJson(PLUGIN_ROOT, codex.hooks);
  const config = readJson(PLUGIN_ROOT, "hooks", "config.json");
  const handlers = Object.values(hooks.hooks).flatMap((groups) => groups.flatMap((g) => g.hooks));
  const names = handlers.map((handler) => {
    const match = handler.command.match(/^node "\$\{PLUGIN_ROOT\}\/hooks\/dispatcher\.mjs" ([a-z0-9-]+) codex$/);
    assert.ok(match, `unexpected command: ${handler.command}`);
    return match[1];
  });
  assert.deepEqual(names.sort(), Object.keys(config.hooks).sort());
});

test("psters-agents bridge skill lists the real agent categories", () => {
  const skill = readFileSync(join(PLUGIN_ROOT, "codex", "skills", "psters-agents", "SKILL.md"), "utf8");
  for (const category of readdirSync(join(PLUGIN_ROOT, "agents"))) {
    assert.match(skill, new RegExp("`" + category + "`"), `category not documented: ${category}`);
  }
});
