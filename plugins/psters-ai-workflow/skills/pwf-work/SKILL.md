---
name: pwf-work
description: >
  Execute free-form work. Reads existing docs, researches context, derives concrete tasks,
  implements, builds, and updates documentation. For plan-driven work use /pwf-work-plan.
  Use when: user wants to implement a feature, fix a bug, or make changes outside a formal plan.
argument-hint: "[description of what to do, e.g. fix X, improve Y, add Z]"
---

# Execute Unplanned Work (Fast Path)

Use this skill for small fixes, minor adjustments, and focused tasks outside formal plans.
For phase execution from `docs/plans/`, use `/pwf-work-plan`.
Apply `skills/using-psters-workflow/SKILL.md` at start.

## ⛔ MANDATORY WORKFLOW — NEVER SKIP ANY STEP

Execute steps 1 through 6 IN ORDER. Do NOT jump to implementation.
First action must be reading documentation (Step 1), NOT editing code.

---

## Input

<work_description> $ARGUMENTS </work_description>

If empty, ask: "What would you like me to work on?"

---

## Step 1: Research (BLOCKING — must complete before any code changes)

**First tool calls MUST be Read calls to load documentation. Do NOT start implementing.**

1. If description is vague, ask one or two clarifying questions first.

2. **Classify scope (trivial vs non-trivial):**
   - Trivial: <=2 files, no entities/migrations/endpoints/auth model changes.
   - If trivial: read only `docs/solutions/patterns/critical-patterns.md` and directly relevant doc, skip research-agent spawning.
   - If non-trivial: follow full workflow below.

3. **Load docs baseline via skill (REQUIRED):**
   - Apply `skills/docs-baseline-loading/SKILL.md`.
   - Read scope-specific docs: `docs/modules/<module>.md`, `docs/features/<feature>.md`, `docs/lambdas/<repo>.md`.
   - Search `docs/solutions/` by feature keywords for known gotchas.

4. **Check existing context:**
   - `docs/brainstorms/` — recent brainstorm for this feature?
   - `docs/plans/` — existing plan? If yes, suggest `/pwf-work-plan` instead.

5. **Spawn research agents (REQUIRED for non-trivial scope — use Agent tool, simultaneously):**
   - **repo-research-analyst** (`agents/research/repo-research-analyst.md`)
   - **learnings-researcher** (`agents/research/learnings-researcher.md`)

6. **Conditional research (spawn in parallel if applicable):**
   - Entity changes → **migration-impact-planner**
   - Multi-step or UI flows → **spec-flow-analyzer**
   - Security, payments, new tech → **best-practices-researcher**, **framework-docs-researcher**

7. **Present research summary to user** before implementing:
   - Files that will change
   - Relevant patterns/rules found
   - Gotchas from `docs/solutions/`
   - Ask: "Do you have a ticket number (TICKET-XXXX) for commit messages?"

---

## Step 2: Task List

1. Derive a concrete, dependency-ordered task list.
   - Each task: **bold name + file path + sub-bullets** with method names, fields, classes.
2. **Self-validate:** Does every task have a file path and specific method/field names?
3. **Debug route:** If bug fix, apply `skills/systematic-debugging/SKILL.md` first.

### Built-in capabilities:
- **Operational policy:** `rules/operational-guardrails.mdc`
- **Project overrides (optional):** `docs/workflow/operational-overrides.md`
- **Context7:** Use the Context7 MCP before implementing with external libraries.

---

## Step 3: Execute

For each task: mark in progress → read referenced files → implement → mark completed.

### ⚠️ TypeORM Migration Atomic Chain (when applicable)
Follow the migration chain in `rules/operational-guardrails.mdc` (generate -> drift-check -> local run). Blocking — do not continue until the chain succeeds.

After all tasks: **Build** — `npm run build` in every affected repo. Fix ALL errors.

---

## Step 4: Quality Review

**Only run if 5+ files changed or multiple repos touched.** Otherwise skip to Step 5.

Spawn review agents **in parallel** using the Agent tool.
Use canonical mapping in `assets/review-agent-selection-mapping.md`.
Address **critical** findings only.

---

## Step 5: Documentation Maintenance (MANDATORY — never skip)

Apply `skills/docs-maintenance-after-work/SKILL.md` and execute its full flow:
- always run `doc-shepherd`,
- run `plan-sync` when plan context exists,
- run specialized doc writers conditionally,
- run `pattern-extractor` when applicable.

---

## Step 6: Finish

Summarize: what was implemented, files changed, any caveats.

### Verification Evidence (MANDATORY before completion claims)
Apply `skills/verification-before-completion/SKILL.md` and use the evidence format from `rules/operational-guardrails.mdc`.

Suggest: commit with ticket number, `/pwf-review`, `/pwf-doc-capture` for non-trivial bug fixes.

---

## Conventions

- Follow canonical policy in `rules/operational-guardrails.mdc`.
- Follow commit policy in `rules/commits.mdc`.

## Next Recommended Commands

- `/pwf-work-light` for future trivial/local-only changes
- `/pwf-review` for a full multi-agent review pass
- `/pwf-commit-changes` after review approval
- `/pwf-doc-capture` when a reusable fix/pattern emerged
- `/pwf-aws-lambda-deploy` when Lambda repos were changed
