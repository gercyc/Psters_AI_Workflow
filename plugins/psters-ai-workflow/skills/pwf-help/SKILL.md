---
name: pwf-help
description: >
  Explain all available Psters Workflow commands and the recommended end-to-end flow.
  Read-only guidance skill for onboarding and quick orientation.
  Use when: user asks what commands exist, how to start, or needs workflow orientation.
argument-hint: "[optional: focus area like planning, execution, docs, or review]"
---

# Psters Workflow Command Guide

Use this skill to explain the workflow to the user in a simple, practical way.
This is a read-only guidance skill: it should not edit files, run deployments, or create commits.

## What to explain first

1. The workflow intent:
   - predictable execution,
   - docs-first context,
   - explicit user control over quality gates.
2. The default flow:
   - `/pwf-brainstorm` -> `/pwf-plan` -> `/pwf-work-plan`
3. Optional quality gates:
   - `/pwf-clarify`, `/pwf-checklist`, `/pwf-analyze`, `/pwf-review`
4. Documentation and learnings commands:
   - `/pwf-doc`, `/pwf-doc-foundation`, `/pwf-doc-runbook`, `/pwf-doc-capture`, `/pwf-doc-refresh`
5. Closing and delivery commands:
   - `/pwf-commit-changes`, `/pwf-aws-lambda-deploy` (when relevant)
6. Workspace bootstrap command (when starting from scratch):
   - `/pwf-setup-workspace`

## Command quick map

- `/pwf-help` — explain all commands and workflow path
- `/pwf-setup` — initialize or repair docs workflow structure
- `/pwf-setup-workspace` — create recommended multi-root `*_Repos` + `*_Workspace` layout
- `/pwf-brainstorm` — explore idea, scope, and architecture options
- `/pwf-plan` — convert context into executable phases/tasks
- `/pwf-clarify` — resolve ambiguity before execution (optional)
- `/pwf-checklist` — generate requirement quality gates (optional)
- `/pwf-analyze` — run read-only consistency analysis (optional)
- `/pwf-work-plan` — execute one planned phase
- `/pwf-work` — execute direct focused implementation outside a formal plan
- `/pwf-work-light` — fast path for trivial/local changes
- `/pwf-work-tdd` — tests-first execution when explicitly requested
- `/pwf-review` — heavy multi-agent review pass
- `/pwf-doc` — force canonical technical documentation updates
- `/pwf-doc-foundation` — create/refresh core project docs baseline
- `/pwf-doc-runbook` — create/refresh operational runbooks
- `/pwf-doc-capture` — register reusable learnings and patterns
- `/pwf-doc-refresh` — curate/refresh `docs/solutions/` lifecycle
- `/pwf-commit-changes` — create structured, ticket-aware commits
- `/pwf-aws-lambda-deploy` — deploy Lambda changes with guarded script flow

## Talking points

When answering, tailor depth to user need:

- New user: explain the default path and when to pick `/pwf-work` vs `/pwf-work-plan`.
- Advanced user: highlight optional gates and command trade-offs.
- Fast question: provide a short command chooser and one-line recommendations.

Always use prefixed command names (`/pwf-*`) when presenting examples.

## Internal components (who uses who)

- `commands/` — user entry points (`/pwf-*`). They orchestrate the workflow.
- `rules/` — guardrails applied during execution (naming, migrations, docs policy, safety).
- `hooks/` — automatic reminders around lifecycle events.
- `skills/` — reusable procedural playbooks invoked by commands.
- `agents/` — specialized subagents for focused work (research, review, docs, workflow sync).

Execution model: `command` -> applies `rules` -> may call `skills` -> may spawn `agents` -> `hooks` enforce reminders.

## Next Recommended Commands

- `/pwf-brainstorm` to start feature discovery
- `/pwf-plan` to create an implementation plan
- `/pwf-work-plan` to execute phase by phase
- `/pwf-work` for focused direct changes
- `/pwf-setup-workspace` when bootstrapping a new multi-root project
