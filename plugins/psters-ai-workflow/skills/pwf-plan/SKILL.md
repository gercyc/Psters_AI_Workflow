---
name: pwf-plan
description: >
  Create a detailed, execution-ready implementation plan. Thorough research and review agents
  ensure each phase can be executed directly by /pwf-work-plan without additional planning.
  Saves to docs/plans/. Use when: user has a feature description or brainstorm and needs an executable plan.
argument-hint: "[feature description, bug report, or path to brainstorm doc]"
---

# Step 2 — Build an Execution Plan

**Note: The current year is 2026.**

Use this skill to convert the feature context (or brainstorm) into a phased, execution-ready plan in `docs/plans/` that `/pwf-work-plan` can run directly.

When ambiguity materially impacts architecture/scope, run `/pwf-clarify` before finalizing the plan.
Apply `skills/using-psters-workflow/SKILL.md` at start.

---

## ⚠️ Subagent Invocation (REQUIRED)

All agents must be invoked via the Agent tool. Do not simulate or inline the agent's work.
Use collision-safe agent naming: `psters-ai-workflow:research:<agent-name>`, `psters-ai-workflow:review:<agent-name>`.

| Agent | File path |
|-------|-----------|
| repo-research-analyst | `agents/research/repo-research-analyst.md` |
| learnings-researcher | `agents/research/learnings-researcher.md` |
| spec-flow-analyzer | `agents/workflow/spec-flow-analyzer.md` |
| migration-impact-planner | `agents/research/migration-impact-planner.md` |
| architecture-strategist | `agents/review/architecture-strategist.md` |
| security-sentinel | `agents/review/security-sentinel.md` |
| performance-oracle | `agents/review/performance-oracle.md` |
| best-practices-researcher | `agents/research/best-practices-researcher.md` |
| framework-docs-researcher | `agents/research/framework-docs-researcher.md` |
| plan-document-reviewer | `agents/workflow/plan-document-reviewer.md` |

---

## 0. Input

<feature_description> $ARGUMENTS </feature_description>

If empty, ask: "What would you like to plan? Describe the feature, bug fix, or improvement."

**Brainstorm check:** Search `docs/brainstorms/` for a matching brainstorm. If found, read it fully.

**Preset support (optional):** If input contains `preset:<name>`, load `presets/presets.json` and adapt planning emphasis. Quality profiles: `strict`, `balanced`, `fast`.

---

## 1. Research

### Round 1 — Always (spawn all in parallel):

- **repo-research-analyst** — maps file paths, services, DTOs, entities, rules, existing enums, migration state
- **learnings-researcher** — surfaces relevant solutions from `docs/solutions/`
- **spec-flow-analyzer** — finds missing flows, edge cases, error states; produces Given/When/Then acceptance criteria

### Round 2 — Conditional (spawn applicable in parallel):

- **migration-impact-planner** — spawn if entity changes detected
- **best-practices-researcher** — spawn if feature involves security, payments, or new third-party integrations
- **framework-docs-researcher** — spawn if feature requires unfamiliar framework patterns
- **git-history-analyzer** — spawn for legacy/refactor work

### Round 3 — Review (spawn applicable in parallel):

- **architecture-strategist** — always: structural approach, module boundaries, dependency direction
- **security-sentinel** — only if auth, secrets, permissions, encryption, or file upload involved
- **performance-oracle** — only if DB-heavy (new queries, pagination, indexes, N+1 risks)

---

## 2. Scope & Concretization

- **Copying features:** enumerate "copy these files, strip A/B/C, keep D".
- **5+ requirements:** group by layer (backend/frontend), assign to phases. No phase with 10+ unrelated items.
- **Inline editing:** list editable fields/sections, document UX pattern.
- **Different API:** document response shape mapping.

---

## 3. Phase Assessment

Use **phases** when: multi-layer (DB + API + frontend), 4+ files, clear dependency chain.
Otherwise use **flat tasks** (single numbered list under `## Implementation`).

---

## 4. Write Plan

Write to `docs/plans/<TIMESTAMP>-<name>-plan.md` (`TIMESTAMP` = current time in `YYYYMMDDHHmmss`).

### YAML frontmatter:

```yaml
---
title: "<Plan Title>"
type: enhancement | bug | refactor
status: active
date: YYYY-MM-DD
phased: true | false
---
```

### Required sections:

1. **Overview** — Problem/Motivation, what we're building, who it's for
2. **Scope / Work Breakdown** — (if applicable) Groups of requirements mapped to phases
3. **Proposed Solution** — Architecture, data model, key design decisions
4. **Technical Considerations** — Project rules, patterns, security notes, migration safety
5. **Acceptance Criteria** — Given/When/Then covering happy path, all roles, and error states
6. **Implementation Plan** — Phases or flat tasks
7. **Master Checklist** — Every task as a checkbox
8. **Clarifications** — Link to clarifications artifact when relevant

### Phase format:

```
### Phase N: [Name]

**Status**: ⬜ Pending
**Objective**: [One sentence]
**Dependencies**: [Phase N-1 or None]

**Tasks**:
- [ ] T001 [US1] Create DTO in `path/to/file.ts`
  - Add `name: string`, `status: ProjectStatus`
- [ ] T002 [P] [US1] Add mapper in `path/to/mapper.ts`

**After completing this phase**:
1. Build — `npm run build` in affected repos; fix all errors.
2. Mark Phase N as `✅ Completed` in the table.
```

---

## 5. Task Quality Rules

Every task MUST have: exact file path, concrete sub-bullets with method signatures and field names.
Every task MUST NOT have: vague descriptions, multiple unrelated concerns, missing IDs or file paths.

**Migration tasks:** must explicitly state "Generate migration → drift-check → run locally IMMEDIATELY."

**Self-validation:** After writing, review every task: "Could an AI execute this task by reading only this plan and the referenced files?" If no, rewrite it.

---

## 6. Plan Review Loop (MANDATORY)

1. Spawn `plan-document-reviewer` with the generated plan path.
2. Apply only `CRITICAL`/`HIGH` fixes immediately.
3. Re-run reviewer. Stop when approved or after 3 iterations.
4. If not approved after 3 iterations, present open blockers and ask user for direction.

---

## 7. Post-Generation

Present: plan summary, phase count, task count. Offer next options.

## Conventions

- Follow canonical policy in `rules/operational-guardrails.mdc`.
- Follow commit policy in `rules/commits.mdc`.

## Next Recommended Commands

- `/pwf-clarify <new-plan-path>` when open ambiguities exist
- `/pwf-checklist <new-plan-path>` before execution
- `/pwf-analyze <new-plan-path>` before execution
- `/pwf-work-plan <new-plan-path> Phase 1` to start implementation
