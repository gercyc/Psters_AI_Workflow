---
name: pwf-work-plan
description: >
  Execute a plan phase from docs/plans/. Reads existing docs first, executes tasks directly from the plan,
  builds, then updates documentation. No intermediate planning. No tests.
  Use when: user has a plan in docs/plans/ and wants to execute one phase.
argument-hint: "[path to plan file] [optional: Phase N]"
---

# Step 3 — Execute One Planned Phase

Use this skill to execute one phase from `docs/plans/` with full discipline: read docs first, implement, build, and update docs.
Apply `skills/using-psters-workflow/SKILL.md` at start.

## ⛔ MANDATORY WORKFLOW — NEVER SKIP ANY STEP

Execute steps 1 through 5 IN ORDER. Do NOT jump to implementation.
First action must be reading the plan file (Step 1), NOT editing code.

---

## Input

<plan_input> $ARGUMENTS </plan_input>

If empty or not pointing to a plan file, ask: "Which plan file? (e.g. `docs/plans/20260312-feat-xyz-plan.md`)"

---

## Step 1: Load Context (BLOCKING)

1. **Read the plan file** fully. Validate task format: `- [ ] T### [P?] [USx?] Description with file path`.

2. **Identify the target phase** — first ⬜ Pending phase, or the one specified by the user.

3. **Load docs baseline via skill (REQUIRED):**
   - Apply `skills/docs-baseline-loading/SKILL.md`.
   - Read phase-specific docs: `docs/solutions/patterns/critical-patterns.md`, `docs/modules/<module>.md`, `docs/features/<feature>.md`, `docs/lambdas/<repo>.md`.

4. **Present summary to user:** Phase name, objective, task count. Get confirmation to proceed.

5. **Ticket number:** Ask once if not in plan frontmatter: "Do you have a ticket number (TICKET-XXXX)?"

6. **Create task list** from the plan phase task IDs (T001, T002...) in dependency order. Preserve `[P]` markers as parallel opportunities.

### Definition of Ready (BLOCKING before Step 2):

1. Critical ambiguities resolved.
2. Tasks have IDs + file paths and executable scope.
3. Acceptance criteria are measurable.
4. Main risks/dependencies are explicit.
5. Required docs/pattern references were loaded.

---

## Step 2: Execute

For each task: mark in progress → read referenced files → implement → mark completed.

If task is bug/debug oriented, follow `skills/systematic-debugging/SKILL.md` first.
If TDD was explicitly requested, apply `skills/test-driven-development/SKILL.md`.

### ⚠️ TypeORM Migration Atomic Chain (when applicable)
Follow `rules/operational-guardrails.mdc` (generate -> drift-check -> local run). Blocking.

### After all tasks:
1. **Build** — `npm run build` in every affected repo. Fix ALL errors before continuing.
2. **Update plan file:**
   - Mark phase as `✅ Completed` in the Implementation Plan table.
   - In `## ✅ Master Checklist`, mark each completed task: `- [ ]` → `- [x]`.

---

## Step 3: Quality Review

**Only run if 5+ files changed or multiple repos touched.** Otherwise skip.

Spawn review agents **in parallel** using the Agent tool.
Use canonical mapping in `assets/review-agent-selection-mapping.md`.
Address **critical** findings before finishing.

---

## Step 4: Documentation Maintenance (MANDATORY — never skip)

Apply `skills/docs-maintenance-after-work/SKILL.md`:
- always run `doc-shepherd`,
- run `plan-sync` for plan/work-plan synchronization,
- run specialized doc writers conditionally,
- run `pattern-extractor` when applicable.

---

## Step 5: Finish

Summarize: what was implemented, files changed, any deferred items.

### Verification Evidence (MANDATORY)
Apply `skills/verification-before-completion/SKILL.md`.

Suggest next steps:
- **Next phase** → `/pwf-work-plan [same plan path] Phase N+1`
- **Commit** with ticket number
- **`/pwf-review`** for full PR review
- **`/pwf-doc-capture`** if a non-trivial bug was fixed
- **`/pwf-aws-lambda-deploy`** reminder if Lambda repos were touched

---

## Conventions

- Follow canonical policy in `rules/operational-guardrails.mdc`.
- Follow commit policy in `rules/commits.mdc`.
