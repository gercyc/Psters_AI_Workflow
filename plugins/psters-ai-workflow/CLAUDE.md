# Psters AI Workflow — Claude Code Plugin

This plugin provides a structured AI development workflow for Claude Code with 20 slash commands covering the full development lifecycle: brainstorming, planning, execution, review, documentation, and deployment.

## Installation

Copy the plugin to your project's `.claude/` folder or reference it from your Claude Code settings:

```bash
# Option 1: Copy to your project workspace
cp -r plugins/psters-ai-workflow/.claude-plugin/. .claude/plugins/psters-ai-workflow/

# Option 2: Use the install script
node plugins/psters-ai-workflow/scripts/install-claude.mjs
```

## Releasing / Updating

This repo is a **git marketplace** (`.claude-plugin/marketplace.json` at the repo root), so
Claude Code installs and updates the plugin directly from GitHub:

```
/plugin marketplace add gercyc/Psters_AI_Workflow
/plugin install psters-ai-workflow@psters-marketplace
/plugin update psters-ai-workflow          # after a new release is merged to main
```

`/plugin update` only detects a new release when the **version changes**, and the version
must stay in sync across all manifests:

- `plugins/psters-ai-workflow/.claude-plugin/plugin.json` (Claude Code plugin manifest)
- `plugins/psters-ai-workflow/.github/plugin/plugin.json` (GitHub Copilot plugin manifest — see `COPILOT_README.md`)
- `.claude-plugin/marketplace.json` (marketplace entry, read by both Claude Code and Copilot)

When adding or removing an agent, update the `agents` list in **both** plugin manifests
(`tests/manifests/copilot-manifest.test.mjs` fails if they diverge).

**Always bump via the script** — it updates all three files together and refuses to run if they
have drifted apart:

```bash
node plugins/psters-ai-workflow/scripts/bump-version.mjs patch   # 1.0.x -> 1.0.(x+1)
node plugins/psters-ai-workflow/scripts/bump-version.mjs minor   # new skill/command/feature
node plugins/psters-ai-workflow/scripts/bump-version.mjs major   # breaking change
node plugins/psters-ai-workflow/scripts/bump-version.mjs --dry-run minor   # preview only
```

Release flow: bump → commit `chore(release): vX.Y.Z` → PR → merge to `main` → `/plugin update`.
Rule of thumb: **any merge that adds/changes a skill, command, agent, or hook needs a version
bump**, or installed copies won't see it.

## Available Commands

| Command | Purpose |
|---------|---------|
| `/pwf-help` | Explain all commands and workflow path |
| `/pwf-setup` | Initialize or repair docs workflow structure |
| `/pwf-setup-workspace` | Create multi-root `*_Repos` + `*_Workspace` layout |
| `/pwf-brainstorm` | Explore idea, scope, and architecture options |
| `/pwf-plan` | Convert context into executable phases/tasks |
| `/pwf-clarify` | Resolve ambiguity before execution (optional) |
| `/pwf-checklist` | Generate requirement quality gates (optional) |
| `/pwf-analyze` | Run read-only consistency analysis (optional) |
| `/pwf-work-plan` | Execute one planned phase |
| `/pwf-work` | Direct focused implementation outside a formal plan |
| `/pwf-work-light` | Fast path for trivial/local changes |
| `/pwf-work-tdd` | Tests-first execution when explicitly requested |
| `/pwf-review` | Multi-agent review pass |
| `/pwf-doc` | Force canonical technical documentation updates |
| `/pwf-doc-foundation` | Create/refresh core project docs baseline |
| `/pwf-doc-runbook` | Create/refresh operational runbooks |
| `/pwf-doc-capture` | Register reusable learnings and patterns |
| `/pwf-doc-refresh` | Curate/refresh `docs/solutions/` lifecycle |
| `/pwf-commit-changes` | Create structured, ticket-aware commits |
| `/pwf-aws-lambda-deploy` | Deploy Lambda changes with guarded script flow |

## Default Workflow

```
/pwf-brainstorm → /pwf-plan → /pwf-work-plan (repeat per phase) → /pwf-review → /pwf-commit-changes
```

## Plugin Structure

```
plugins/psters-ai-workflow/
├── .claude-plugin/
│   └── plugin.json          # Claude Code plugin manifest
├── skills/
│   ├── pwf-*/SKILL.md        # One skill per /pwf-* command (20 skills)
│   └── ...                   # Shared reusable skills
├── agents/
│   ├── research/             # Research subagents
│   ├── review/               # Review subagents
│   ├── docs/                 # Documentation subagents
│   └── workflow/             # Workflow subagents
├── commands/
│   └── pwf-*.md              # Original command definitions
├── rules/
│   └── *.mdc                 # Operational guardrails
├── hooks/
│   ├── hooks.claude.json     # Claude Code hook configuration
│   └── *.mjs                 # Hook scripts
├── scripts/
│   └── bump-version.mjs      # Sync version across plugin.json + marketplace.json
└── assets/                   # Templates and supporting files
```

## Configuring the Model Used by Agents

All subagents shipped by this plugin (`agents/**/*.md`) ship **without** a `model` field in
their frontmatter, so each one falls back to Claude Code's default resolution order:

```
env var (CLAUDE_CODE_SUBAGENT_MODEL) → per-invocation param → frontmatter → session model
```

Because none of the 44 agents pin a model in frontmatter, the session model is used by default —
same as before. To make every agent in this plugin use a different model without editing any
file, set the official Claude Code environment variable before starting a session:

```bash
export CLAUDE_CODE_SUBAGENT_MODEL="opus"      # or "sonnet", "haiku", or a full model ID
```

```powershell
$env:CLAUDE_CODE_SUBAGENT_MODEL = "opus"
```

Notes:

- This switches **all** agents in the session at once (not just this plugin's) — Claude Code has
  no native per-agent or per-plugin model mapping today.
- Prefer the short aliases `opus` / `sonnet` / `haiku` or a full model ID (e.g.
  `claude-opus-5`); some abbreviated names have had resolution issues on older CLI versions.
- If you need different models for different agent categories (e.g. `review/` on Opus,
  `research/` on Haiku), the only way today is to add an explicit `model:` field back into the
  specific agent files you want pinned — this plugin intentionally leaves them unset so the env
  var can do the job for the common case.

## Key Conventions

- Commands follow `rules/operational-guardrails.mdc`.
- Commits follow `rules/commits.mdc` format: `[TICKET-XXXX] type(scope): subject`.
- All work commands update docs as part of their workflow.
- Research agents are always spawned in parallel via the Agent tool.
- No bulk `git add -A` — always stage specific files per commit group.
