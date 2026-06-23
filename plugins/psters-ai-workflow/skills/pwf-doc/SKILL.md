---
name: pwf-doc
description: >
  Documentation skill with multiple modes: lambda <repo>, lambdas, module <module>, feature <feature>, architecture, update, adr "<decision>", custom "<target>", infrastructure.
  Use when: user explicitly wants to generate or update technical documentation for a specific scope.
argument-hint: "lambda <repo> | lambdas | module <module> | feature <feature> | architecture | update | adr <decision> | custom <target> | infrastructure"
---

# Force Technical Documentation by Scope

**Note: The current year is 2026.**

Use this skill when you want explicit technical documentation output for a specific scope (module, feature, architecture, ADR, or global update).

**Work commands already update docs.** `/pwf-work`, `/pwf-work-plan`, `/pwf-work-light`, and `/pwf-work-tdd` update docs as part of their workflow. Use `/pwf-doc` for explicit, scope-targeted documentation beyond that flow.

**Anti-drift guidance:** Before creating new docs, check if a related doc already exists. Prefer updating or syncing the existing doc instead of creating duplicates.

The living documentation lives in:
- `docs/lambdas/` — Lambda and processor repos
- `docs/modules/` — NestJS backend modules (or equivalent)
- `docs/features/` — Angular frontend features (or equivalent)
- `docs/decisions/` — Architecture Decision Records (ADRs)
- `docs/architecture.md` — System-wide architecture overview

## Input

<doc_target> $ARGUMENTS </doc_target>

If empty, show available modes:
```
/pwf-doc lambda <repo-name>      Document a Lambda repo
/pwf-doc lambdas                 Document ALL Lambda repos in parallel
/pwf-doc module <module-name>    Document a backend module
/pwf-doc feature <feature-name>  Document a frontend feature
/pwf-doc architecture            Generate/update docs/architecture.md
/pwf-doc update                  Scan all docs for staleness and contradictions
/pwf-doc adr "<decision>"        Create an Architecture Decision Record
/pwf-doc custom "<target>"       Generate/update any doc from user-described scope
/pwf-doc infrastructure          Generate/update docs/infrastructure.md
```

## Agent invocation

When spawning docs agents via Agent tool, use collision-safe naming: `psters-ai-workflow:docs:<agent-name>`.

## Mode 1: lambda <repo-name>

1. Verify repo exists. If not, list available Lambda repos and ask user to pick.
2. Invoke `lambda-doc-writer` (`agents/docs/lambda-doc-writer.md`) via Agent tool, passing the repo path and any existing `docs/lambdas/<repo-name>.md`.
3. Write returned text to `docs/lambdas/<repo-name>.md`.

## Mode 2: lambdas

1. Discover Lambda repos (e.g. `*-lambda`, `*-processor`).
2. Spawn one `lambda-doc-writer` agent per Lambda repo **simultaneously**.
3. Write all docs to `docs/lambdas/<repo-name>.md`.
4. Update `docs/lambdas/README.md` with index table.

## Mode 3: module <module-name>

1. Verify module exists in `backend/src/<module-name>/` (or equivalent).
2. Invoke `backend-module-doc-writer` (`agents/docs/backend-module-doc-writer.md`) via Agent tool.
3. Write returned text to `docs/modules/<module-name>.md`.
4. Update `docs/modules/README.md`.

## Mode 4: feature <feature-name>

1. Verify feature exists in `frontend/src/app/features/<feature-name>/` (or equivalent).
2. Invoke `frontend-feature-doc-writer` (`agents/docs/frontend-feature-doc-writer.md`) via Agent tool.
3. Write to `docs/features/<feature-name>.md`.
4. Update `docs/features/README.md`.

## Mode 5: architecture

1. Read context from `docs/lambdas/`, `docs/modules/`, `docs/features/`, recent plans/brainstorms.
2. Spawn `architecture-doc-writer` (`agents/docs/architecture-doc-writer.md`) via Agent tool.
3. Write to `docs/architecture.md`.

## Mode 6: update

1. List all `.md` files in `docs/lambdas/`, `docs/modules/`, `docs/features/`, `docs/solutions/`, `docs/decisions/`, `docs/architecture.md`.
2. Spawn `doc-shepherd` for full scan (no specific diff, focus on contradiction detection).
3. Report what was updated and any contradictions found.

## Mode 7: adr "<decision>"

1. Gather context from related brainstorm/plan docs.
2. Spawn `adr-writer` (`agents/docs/adr-writer.md`) via Agent tool, passing decision summary and the `assets/adr-template.md` template.
3. Write to `docs/decisions/YYYY-MM-DD-<slugified-decision>.md`.
4. Update `docs/decisions/README.md`.

## Mode 8: custom "<target>"

1. Parse target doc path and intent (create vs update).
2. Anti-drift preflight: search for existing docs covering the same scope.
3. Gather source-of-truth context (exact file paths, current behavior, invariants).
4. Write or update the target doc.
5. Cross-doc sync check against related docs.

## Mode 9: infrastructure

1. Read context from `docs/architecture.md`, `docs/integrations.md`, `docs/environments.md`.
2. Spawn `infrastructure-doc-writer` (`agents/docs/infrastructure-doc-writer.md`) via Agent tool.
3. Write to `docs/infrastructure.md`.

## Next Recommended Commands

- `/pwf-doc-foundation all` to bootstrap or refresh the core project docs set
- `/pwf-doc-runbook <service-or-operation>` to add operational procedures
- `/pwf-analyze <related-plan-path>` after major doc updates
