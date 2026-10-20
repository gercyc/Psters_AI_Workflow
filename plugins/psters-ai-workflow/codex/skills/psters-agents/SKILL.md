---
name: psters-agents
description: Use in Codex whenever a psters-ai-workflow skill (pwf-plan, pwf-brainstorm, pwf-review, pwf-work, pwf-doc, and others) says to spawn, invoke, or run a named agent such as repo-research-analyst, security-sentinel, or doc-shepherd, or references `psters-ai-workflow:<category>:<agent-name>`. Explains how to run those agents with Codex subagents.
---

# Running Psters Workflow Agents in Codex

The workflow skills were written for clients that register named agents (Claude Code, GitHub Copilot). Codex plugins do not register agents, so the agent definitions ship as plain Markdown files inside this plugin. Use this procedure to run them.

## Locate the agent definition

The plugin root is three directories above this file (`codex/skills/psters-agents/SKILL.md`). Agent definitions live at:

```
<plugin-root>/agents/<category>/<agent-name>.md
```

Categories: `design`, `docs`, `research`, `review`, `workflow`.

A reference like `psters-ai-workflow:research:repo-research-analyst` maps to `agents/research/repo-research-analyst.md`. When only the name is given, search `agents/*/<agent-name>.md`.

## Run the agent

1. Read the agent file. Skip the YAML frontmatter; the body is the agent's instructions.
2. Spawn a Codex subagent whose prompt is:
   - the agent file body, then
   - the task-specific context the calling skill asked you to pass (scope, paths, diff, plan file, and so on).
3. When the calling skill says to spawn several agents in parallel, spawn them in parallel.
4. Use each agent's output exactly as the calling skill describes (merge, synthesize, or write to disk).

## Fallback

If subagents are unavailable in the current session, run each agent's instructions yourself, sequentially, keeping each agent's output separate before merging. Tell the user that the agents ran inline instead of in parallel.

## Rules

- Do not invent agents. If the named file does not exist, say so and continue with the rest of the workflow.
- Keep the calling skill in charge. It decides which agents run, in what order, and what happens with their output.
