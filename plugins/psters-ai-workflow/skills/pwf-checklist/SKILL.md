---
name: pwf-checklist
description: >
  Generate requirement-quality checklists (not implementation tests) for a target plan or feature in docs/plans/<plan>/checklists/.
  Use when: user wants to quality-gate requirements before implementation begins.
argument-hint: "[plan path] [optional: domains like api,ux,security,data,observability]"
---

# Generate Requirement Quality Checklists

Checklists here are "unit tests for requirements writing", not QA test cases for implementation behavior.

## Input

<checklist_input> $ARGUMENTS </checklist_input>

If empty, ask: "Which plan should I generate checklists for? (e.g. `docs/plans/20260312-feature-plan.md`)"

## Step 1: Resolve target and scope

1. Resolve target plan from input.
2. Parse requested domains; default: `api`, `ux`, `security`, `data`, `observability`.
3. Read target plan and any relevant docs.

## Step 2: Generate checklist items by quality dimension

For each domain, write checks that evaluate requirements quality:
- Completeness, Clarity, Consistency, Measurability, Scenario coverage, Edge-case coverage, Dependencies and assumptions

### Prohibited style
- Do NOT write implementation tests like "verify endpoint returns 200".
- Do NOT reference runtime clicks/assertions.

### Required style
- Ask whether requirements are clearly and fully specified.
- Use markers: `[Completeness]`, `[Clarity]`, `[Consistency]`, `[Coverage]`, `[Edge Case]`, `[Gap]`.

## Step 3: Write checklist files

Create folder: `docs/plans/<plan-slug>/checklists/`
Create one file per domain: `api.md`, `ux.md`, `security.md`, `data.md`, `observability.md`

Item format:
```markdown
- [ ] CHK001 Are error response requirements specified for all API failure classes? [Completeness]
```

If a checklist file already exists, append new items and continue CHK numbering.

## Next Recommended Commands

- `/pwf-analyze <same plan path>` to detect coverage and consistency gaps
- `/pwf-clarify <same plan path>` if major ambiguities remain
- `/pwf-work-plan <same plan path> Phase N` after checklist gaps are addressed
