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
└── assets/                   # Templates and supporting files
```

## Key Conventions

- Commands follow `rules/operational-guardrails.mdc`.
- Commits follow `rules/commits.mdc` format: `[TICKET-XXXX] type(scope): subject`.
- All work commands update docs as part of their workflow.
- Research agents are always spawned in parallel via the Agent tool.
- No bulk `git add -A` — always stage specific files per commit group.
