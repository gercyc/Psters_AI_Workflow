---
name: pwf-brainstorm
description: >
  Feature exploration and decision-making. Spawns 3 focused agents to research the feature,
  then resolves open questions through dialogue. Output is a concise decision document saved to
  docs/brainstorms/ — the base for /pwf-plan.
  Use when: user wants to explore a new feature, problem, or idea before planning.
argument-hint: "[feature idea or problem to explore]"
---

# Step 1 — Explore and Decide Feature Scope

**Note: The current year is 2026.**

Use this skill to transform an idea into concrete decisions (scope, architecture, constraints, and open questions) that become the direct input for `/pwf-plan`.

---

## Feature Description

<feature_description> $ARGUMENTS </feature_description>

If empty, ask: "What would you like to explore? Describe the feature, problem, or improvement."

---

## Phase 0: Quick Clarity Check

Read the feature description. If requirements are already complete and scope is clear, ask:
> "Requirements look clear. Proceed to `/pwf-plan` directly, or brainstorm first to surface integration impacts and architecture decisions?"

If the description is one vague sentence, ask one focused clarifying question before continuing. Otherwise proceed immediately.

---

## Phase 1: Context Loading

Before spawning agents, read these directly (no agent needed):

1. `docs/solutions/patterns/critical-patterns.md` — always if it exists
2. Recent `docs/brainstorms/` — check if there's an existing brainstorm for this topic
3. Recent `docs/plans/` — check if there's already a plan that touches this area

Consolidate: what already exists, what's been decided before.

---

## Phase 2: Research Agent Pack (Parallel)

Spawn the core research agents **simultaneously** using the Agent tool. Do not wait for one before starting the next. Pass the full feature description + context from Phase 1 to each.
Use collision-safe agent naming: `psters-ai-workflow:<category>:<agent-name>`.

### Core agent 1 — Codebase Research (`repo-research-analyst`)

> "Read and follow `agents/research/repo-research-analyst.md`. Map all existing code related to: `<feature_description>`. Return: exact file paths, entity names, service method names, API routes, DTOs, components, Lambda repos, and which rules apply."

### Core agent 2 — Integration & Impact Analysis (`integration-impact-analyst`)

> "Read and follow `agents/research/integration-impact-analyst.md`. Map every integration impact of: `<feature_description>`. Focus on: entity changes and migration needs, Lambda pipeline impact, breaking changes with severity."

### Core agent 3 — Product framing (`po-analyst`)

> "Read and follow `agents/research/po-analyst.md`. Analyze product goals, users, anti-goals, success metrics, and high-impact acceptance criteria for: `<feature_description>`."

### Conditional expansion pack (spawn all applicable in parallel)

- Always for non-trivial features:
  - `edge-case-hunter` (`agents/research/edge-case-hunter.md`)
  - `data-model-designer` (`agents/research/data-model-designer.md`)
  - `api-contract-designer` (`agents/research/api-contract-designer.md`)
- If user-facing UI/UX is relevant:
  - `ux-consistency-reviewer` (`agents/research/ux-consistency-reviewer.md`)
- If async/serverless/evented flow is relevant:
  - `lambda-pipeline-analyst` (`agents/research/lambda-pipeline-analyst.md`)
- If security/compliance boundaries are material:
  - `security-sentinel` (`agents/review/security-sentinel.md`)

**Wait for all agents to complete before proceeding to Phase 3.**

---

## Phase 3: Dialogue — Resolve Open Questions

Based on all agent findings, identify the **key open questions** — maximum 5 — that materially affect the architecture, data model, or integration approach.

Ask them **one at a time**, with **multiple choice answers** when possible. Continue until user says "proceed" or all critical questions are answered.

---

## Phase 4: Write the Decision Document

Write to `docs/brainstorms/<TIMESTAMP>-<topic>-brainstorm.md` (current time in `YYYYMMDDHHmmss`). Ensure `docs/brainstorms/` exists.

The document **must** contain:

1. **What We're Building** — plain-language description, 2-3 paragraphs max.
2. **Current State** — backend entities/services/routes, frontend components/routes, Lambda pipelines (with file paths).
3. **Architecture & Infrastructure** — where the logic lives, cloud services, data model overview, security approach.
4. **Integration Impact** — entity impact, Lambda pipeline impact, frontend impact, breaking changes.
5. **Key Decisions** — numbered list, each marked `✅ DECIDED:` or `⚠️ OPEN:`.
6. **Open Questions** — unresolved questions for `/pwf-plan` to resolve.
7. **Next Steps** — run `/pwf-plan`, areas needing deeper investigation, prerequisites.

---

## Phase 5: Post-Brainstorm

Present the user with:
1. **Top 3 decisions made**
2. **Top risks or open items**
3. **Recommendation:** Run `/pwf-plan <path-to-this-brainstorm>`

---

## Conventions

- Follow canonical policy in `rules/operational-guardrails.mdc`.
- Follow commit policy in `rules/commits.mdc`.
- Use optional project overrides in `docs/workflow/operational-overrides.md` when present.

## Next Recommended Commands

- `/pwf-plan <brainstorm-path>` to convert decisions into executable phases
- `/pwf-clarify <future-plan-path>` if open questions remain high-impact
- `/pwf-checklist <future-plan-path>` to quality-gate requirements before implementation
