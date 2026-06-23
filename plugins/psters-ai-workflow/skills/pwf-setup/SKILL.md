---
name: pwf-setup
description: >
  Initialize or repair the project workflow skeleton under docs/. Creates required folders,
  starter README files, .gitkeep markers for empty directories, operational override policy file,
  required foundation docs, and runbooks structure.
  Use when: user is starting a new project or needs to repair the docs workflow structure.
argument-hint: "[optional: setup notes]"
---

# Setup Project Workflow Skeleton

Use this skill to bootstrap (or repair) the baseline workflow structure in `docs/`.
This skill is intentionally deterministic: it creates missing structure without guessing architecture decisions.

## Goals

1. Ensure `docs/` exists and has a predictable workflow structure.
2. Create missing directories and keep them in git using `.gitkeep` when empty.
3. Ensure project-level operational override file exists: `docs/workflow/operational-overrides.md`
4. Ensure mandatory project baseline files exist:
   - `docs/infrastructure.md`
   - `docs/architecture.md`
   - `docs/integrations.md`
   - `docs/environments.md`
   - `docs/glossary.md`
5. Ensure runbooks structure exists: `docs/runbooks/` and `docs/runbooks/README.md`
6. Avoid destructive edits:
   - Never delete existing docs.
   - Never overwrite non-empty existing files unless explicitly requested.

## Important path boundary

Follow the canonical boundary rule: `rules/docs-scope-boundary.mdc`

## Required skeleton

Create these directories if missing:
- `docs/`, `docs/brainstorms/`, `docs/plans/`, `docs/work-plans/`, `docs/solutions/`, `docs/solutions/patterns/`
- `docs/workflow/`, `docs/runbooks/`, `docs/modules/`, `docs/features/`, `docs/lambdas/`, `docs/decisions/`

For each empty directory above, create `.gitkeep`.

Required files (create if missing):
- `docs/README.md` (index with links to core sections)
- `docs/workflow/operational-overrides.md` (project policy override file)
- `docs/infrastructure.md`, `docs/architecture.md`, `docs/integrations.md`, `docs/environments.md`, `docs/glossary.md`
- `docs/runbooks/README.md`
- `docs/modules/README.md`, `docs/features/README.md`, `docs/lambdas/README.md`, `docs/decisions/README.md`

## File content policy

When creating missing files:
- Keep content concise and operational.
- Do not add placeholders like "TODO fill later" without concrete guidance.
- Use stable section headings so future commands can append/update safely.

## Verification

At the end, report:
- directories created, `.gitkeep` files created, files created, files skipped (already existed).

## Next Recommended Commands

- `/pwf-doc-foundation all` to populate core project documentation baseline
- `/pwf-doc-runbook <service-or-operation>` to start documenting operations
- `/pwf-brainstorm` to start discovery for a new feature
- `/pwf-plan` to build an execution-ready plan
