#!/usr/bin/env node
/**
 * Bump the psters-ai-workflow plugin version.
 *
 * Keeps the version in sync across BOTH manifests that Claude Code reads:
 *   - plugins/psters-ai-workflow/.claude-plugin/plugin.json  (the plugin manifest)
 *   - .claude-plugin/marketplace.json                        (the git marketplace entry)
 *
 * If these diverge, `/plugin update` can fail to detect a new release, so this
 * script is the single source of truth for bumping.
 *
 * Usage (run from anywhere in the repo):
 *   node plugins/psters-ai-workflow/scripts/bump-version.mjs patch   # 1.0.2 -> 1.0.3 (default)
 *   node plugins/psters-ai-workflow/scripts/bump-version.mjs minor   # 1.0.2 -> 1.1.0
 *   node plugins/psters-ai-workflow/scripts/bump-version.mjs major   # 1.0.2 -> 2.0.0
 *   node plugins/psters-ai-workflow/scripts/bump-version.mjs 1.4.0   # set an explicit version
 *   node plugins/psters-ai-workflow/scripts/bump-version.mjs --dry-run minor
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const PLUGIN_NAME = 'psters-ai-workflow';
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const RELEASE_TYPES = new Set(['major', 'minor', 'patch']);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pluginRoot = resolve(__dirname, '..');
const repoRoot = resolve(pluginRoot, '..', '..');

const pluginManifestPath = resolve(pluginRoot, '.claude-plugin', 'plugin.json');
const marketplacePath = resolve(repoRoot, '.claude-plugin', 'marketplace.json');

function parseArgs(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positional = args.filter((a) => a !== '--dry-run');
  const bump = positional[0] ?? 'patch';
  return { bump, dryRun };
}

function nextVersion(current, bump) {
  if (SEMVER.test(bump)) return bump; // explicit version supplied
  if (!RELEASE_TYPES.has(bump)) {
    throw new Error(
      `Invalid bump "${bump}". Use one of: major, minor, patch, or an explicit x.y.z version.`,
    );
  }
  const match = SEMVER.exec(current);
  if (!match) {
    throw new Error(`Current version "${current}" is not valid semver (x.y.z).`);
  }
  let [major, minor, patch] = match.slice(1).map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

/**
 * Rewrite only the `version` string in place, preserving formatting/ordering.
 * We edit textually (not via JSON.stringify) so the file diff stays minimal.
 */
async function setVersionInFile(path, from, to) {
  const raw = await readFile(path, 'utf8');
  const needle = `"version": "${from}"`;
  if (!raw.includes(needle)) {
    throw new Error(`Could not find ${needle} in ${path}. Aborting to avoid a partial bump.`);
  }
  const updated = raw.replace(needle, `"version": "${to}"`);
  await writeFile(path, updated);
}

async function main() {
  const { bump, dryRun } = parseArgs(process.argv);

  const pluginManifest = await readJson(pluginManifestPath);
  const marketplace = await readJson(marketplacePath);

  const current = pluginManifest.version;
  const marketplaceEntry = (marketplace.plugins ?? []).find((p) => p.name === PLUGIN_NAME);
  if (!marketplaceEntry) {
    throw new Error(`Plugin "${PLUGIN_NAME}" not found in ${marketplacePath}.`);
  }

  // Guard: the two manifests must already agree before we bump.
  if (marketplaceEntry.version !== current) {
    throw new Error(
      `Version mismatch before bump: plugin.json=${current} but marketplace.json=${marketplaceEntry.version}. ` +
        `Reconcile them first.`,
    );
  }

  const target = nextVersion(current, bump);
  if (target === current) {
    console.log(`Version already ${current}; nothing to do.`);
    return;
  }

  console.log(`${PLUGIN_NAME}: ${current} -> ${target}${dryRun ? '  (dry run)' : ''}`);

  if (dryRun) {
    console.log('  would update:');
    console.log(`    - ${pluginManifestPath}`);
    console.log(`    - ${marketplacePath}`);
    return;
  }

  await setVersionInFile(pluginManifestPath, current, target);
  await setVersionInFile(marketplacePath, current, target);

  console.log('  updated plugin.json and marketplace.json');
  console.log('');
  console.log('Next steps:');
  console.log(`  git add plugins/${PLUGIN_NAME}/.claude-plugin/plugin.json .claude-plugin/marketplace.json`);
  console.log(`  git commit -m "chore(release): v${target}"`);
  console.log('  # open a PR, merge, then in Claude Code: /plugin update ' + PLUGIN_NAME);
}

main().catch((err) => {
  console.error(`bump-version failed: ${err.message}`);
  process.exit(1);
});
