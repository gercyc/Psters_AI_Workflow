#!/usr/bin/env node
/**
 * Install psters-ai-workflow as a Claude Code plugin.
 * Copies commands to .claude/commands/ in the current working directory.
 */

import { cp, mkdir, readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pluginRoot = resolve(__dirname, '..');
const targetRoot = process.cwd();

const commandsSource = join(pluginRoot, 'commands');
const commandsTarget = join(targetRoot, '.claude', 'commands');

async function main() {
  console.log(`Installing psters-ai-workflow to ${targetRoot}/.claude/`);

  // Create .claude/commands/ if it doesn't exist
  await mkdir(commandsTarget, { recursive: true });

  // Copy each pwf-*.md command file
  const files = await readdir(commandsSource);
  const pwfFiles = files.filter(f => f.startsWith('pwf-') && f.endsWith('.md'));

  for (const file of pwfFiles) {
    const src = join(commandsSource, file);
    const dst = join(commandsTarget, file);
    await cp(src, dst);
    console.log(`  ✓ Copied ${file}`);
  }

  console.log(`\nInstalled ${pwfFiles.length} commands to ${commandsTarget}`);
  console.log('\nUsage: type /pwf-help in Claude Code to get started.');
}

main().catch(err => {
  console.error('Installation failed:', err.message);
  process.exit(1);
});
