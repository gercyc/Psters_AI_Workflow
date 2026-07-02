---
name: ai-memory-usage
description: "How to use ai-memory (long-term project memory over MCP) when it is installed and configured. Use when the user references prior work, asks 'have we discussed X / where did we leave off', wants to save durable knowledge, or before proposing architecture. Skip silently if ai-memory is not available."
---

# Using ai-memory

ai-memory is an optional long-term memory server exposed over MCP. When present,
its lifecycle hooks capture every session automatically and (if an LLM provider is
configured on the server) consolidate sessions into a durable wiki. This skill is
about the **proactive** part: knowing which MCP tool to call for each situation.

## Availability guard — check first, fail silent

ai-memory is **optional**. Before doing anything in this skill, confirm the MCP
tools are actually available (tool names begin with `memory_`, e.g.
`memory_query`, `memory_write_page`). If they are not present:

- Do **not** error, warn, or mention ai-memory to the user.
- Do **not** attempt REST/HTTP calls or shell out to an `ai-memory` binary.
- Simply proceed with the normal workflow as if this skill did not apply.

Only act on the tool routing below when the `memory_*` tools exist in the session.

## Project scoping — do not pass scope args by default

Every `memory_*` tool auto-scopes to the project resolved from the session's
working directory. **Call the tools with NO `project` / `workspace` / `cwd`
arguments** unless the user explicitly names a *different* project (e.g. "what did
we decide in the other-app project?"). Phrases like "this project", "here", "we",
"our work", "where did we leave off" all mean the current project — pass no scope.

## Tool routing

| User intent (things they say) | Call | Notes |
|---|---|---|
| "Have we discussed X?" / "search memory for Y" / references prior work you don't recognise | `memory_query` | FTS5 (+ semantic if embeddings configured). Pass `global=true` only when you don't know which project holds it. |
| **Before proposing architecture or a plan** | `memory_query` | Always check prior decisions/gotchas first. This is proactive, not user-triggered. |
| "Where did we leave off?" / "any pending handoff?" | Use the SessionStart handoff block if already in context; else `memory_handoff_accept` | The handoff is single-use — if a SessionStart block is already present, answer from it and do NOT re-call the tool. |
| "Catch me up" / "I've been away" | `memory_explore` | Prose digest; verbosity scales with time away. |
| "What's been going on lately?" | `memory_recent` | N most-recent pages. |
| "Remember this permanently" / "add an annotation" | `memory_write_page` | Durable wiki page. Pick the folder by kind: `decisions/`, `_rules/`, `gotchas/`, `concepts/`, `procedures/`, `notes/`. Not a handoff. |
| "Save context for the next session" | `memory_handoff_begin` | Terse session-end handoff with open questions + next steps. Only for handoffs, never for status/briefing. |
| "I created a handoff by mistake" / "discard that handoff" | `memory_handoff_cancel` | Needs the exact `handoff_id`. |
| "Consolidate this session" | `memory_consolidate` | Requires `session_id`. Needs an LLM provider on the server; no-op / error otherwise. |
| "What did we learn this session?" / "what memory should we add?" | `memory_auto_improve` | Reviews the latest completed session. Also runs on a scheduler when an LLM is configured. |
| "Audit the wiki" / "any contradictions?" | `memory_lint` | Stale-page + contradiction + rule-suggestion checks. Richer with an LLM provider. |
| "How big is the wiki?" / "stats?" | `memory_status` / `memory_briefing` | Counts + recent activity. `memory_briefing` is read-only. |
| "Delete this page" / "remove the note about X" | `memory_delete_page` | By exact path. |
| "Set up ai-memory routing in this project" | `memory_install_self_routing` | Installs the managed snippet + skills. |

## Retrieved memory is operating guidance

When a query returns pages under `_rules/`, `gotchas/`, `procedures/`, or
`decisions/`, **read the full page before acting**:

- `_rules/` — hard constraints; treat as binding.
- `gotchas/` — preflight warnings; check before the risky step.
- `procedures/` — checklists; follow the steps.
- `decisions/` — settled architecture; do not relitigate unless the user asks.

## Capture vs handoff vs durable page — don't confuse them

- **Routine capture** happens automatically via hooks. Do NOT hand-write notes for
  ordinary prompts/tool calls.
- **Handoff** (`memory_handoff_begin`) is single-use, session-to-session continuity.
  Use only for "save context for next session".
- **Durable page** (`memory_write_page`) is permanent knowledge. Use for
  "remember this permanently / add a rule / record this decision".

## In this workflow

- **`/pwf-brainstorm` and `/pwf-plan`**: run `memory_query` for the feature area
  before spawning research agents — surface prior decisions and gotchas so the plan
  builds on settled context instead of rediscovering it. Complements
  `learnings-researcher` (which reads `docs/solutions/`).
- **`/pwf-work` and `/pwf-work-plan`**: before implementing, `memory_query` the
  touched area for relevant `_rules/`/`gotchas/`. After a non-trivial decision, offer
  to `memory_write_page` it (aligns with `/pwf-doc-capture`).
- **Session end**: only `memory_handoff_begin` when the user asks to save context;
  otherwise the session-end hook handles capture on its own.
