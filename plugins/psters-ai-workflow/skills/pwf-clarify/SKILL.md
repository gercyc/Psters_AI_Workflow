---
name: pwf-clarify
description: >
  Ask up to 5 high-impact clarification questions for a plan/feature scope, then write a clarifications artifact in docs/plans/.
  Use when: user has a plan or feature that has ambiguities that would materially affect implementation.
argument-hint: "[plan path in docs/plans/ OR short feature context]"
---

# Clarify Requirements Before Planning/Execution

Use this skill to reduce ambiguity before `/pwf-plan` finalization or before `/pwf-work-plan` execution.

## Input

<clarify_input> $ARGUMENTS </clarify_input>

If empty, ask: "Which plan should I clarify? (e.g. `docs/plans/20260312-feature-plan.md`)"

## Step 1: Load context

1. Identify target plan (direct path or keyword match in `docs/plans/`).
2. Read target plan fully.
3. Read related docs: `docs/modules/<module>.md`, `docs/features/<feature>.md`, `docs/lambdas/<repo>.md`, `docs/solutions/patterns/critical-patterns.md`.

## Step 2: Ambiguity scan (taxonomy)

Scan and classify each category as `Clear | Partial | Missing`:
1. Functional scope and success criteria
2. Domain/data model and lifecycle transitions
3. UX/interaction flows (empty/error/loading states)
4. NFRs (security, performance, reliability, observability)
5. Integration boundaries and failure modes
6. Edge cases and conflict/concurrency handling
7. Terminology consistency
8. Completion signals (objective done criteria)

## Step 3: Ask targeted questions

Ask up to **5 questions total**, **one at a time**, prioritizing highest impact.
- Prefer multiple choice (2-5 options).
- Provide a recommended option and 1-2 line reasoning.
- Skip low-impact questions that do not change implementation.

Stop early when: critical ambiguities are resolved, user says "done"/"proceed", or question limit is reached.

## Step 4: Write clarifications artifact

Write/update: `docs/plans/<plan-slug>.clarifications.md`

```markdown
# Clarifications — <Plan Title>

## Source Plan
- `docs/plans/<plan-file>.md`

## Session YYYY-MM-DD
- Q: ...
  - Recommendation: ...
  - Final Answer: ...
  - Impact on Plan: ...

## Coverage Summary
| Category | Status | Notes |
|----------|--------|-------|
```

If file exists, append new session section.

## Step 5: Update plan references

Add/update `## Clarifications` section in the plan with link and key resolved decisions.
If clarified answer changes a task, update the relevant section directly.

## Next Recommended Commands

- `/pwf-checklist <same plan path>` to validate requirement quality
- `/pwf-analyze <same plan path>` for cross-artifact consistency
- `/pwf-work-plan <same plan path> Phase N` when ready to execute
