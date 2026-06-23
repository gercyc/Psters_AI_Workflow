---
name: pwf-review
description: >
  Multi-agent code review. Runs contextual review agents based on what was changed.
  Use when: user wants a structured review after implementation, before merge.
argument-hint: "[PR number, branch name, or path]"
---

# Step 4 — Review and Validate Changes

Use this skill to run a structured multi-agent review after implementation, then fix findings and re-run until the change is ready.
Apply `skills/using-psters-workflow/SKILL.md` at start.

## Target

<review_target> $ARGUMENTS </review_target>

Determine: PR (number/URL), branch name, or current branch. Fetch diff and file list:
- PR: `gh pr view <number>` + `gh pr diff <number>`
- Branch: `git diff main...<branch> --name-only` + `git diff main...<branch>`

## Protected Artifacts

Never recommend deleting or ignoring `docs/plans/*.md` or `docs/solutions/*.md`. Discard any agent finding that suggests removing these.

## Run Review Agents

First inspect which repos/files were changed. Then spawn all applicable review agents **in parallel** using the Agent tool. For each, tell the subagent to read its agent file and review the provided diff + file list.
Use collision-safe agent naming: `psters-ai-workflow:<category>:<agent-name>`.

Use the canonical mapping in `assets/review-agent-selection-mapping.md` to choose agents based on changed scope.
Always include the baseline reviewers from the mapping.
If reviewer feedback comments are provided as input, also run `pr-comment-resolver` (`agents/workflow/pr-comment-resolver.md`).
If major TypeScript/JS changes are present, include the `lint` reviewer agent (`agents/workflow/lint.md`).

Each Agent tool call must include the full diff content and changed file list in the prompt.

## Synthesize

Merge findings; remove duplicates; prioritize by severity (critical → warning → informational). Present:
1. **Summary** — what changed and scope
2. **Critical issues** — must fix before merge
3. **Recommendations** — should fix
4. **Informational** — optional improvements

Use `skills/requesting-code-review/code-reviewer.md` as the default output template.

## Next Recommended Commands

- `/pwf-work` or `/pwf-work-plan` to resolve critical findings
- `/pwf-commit-changes` once critical findings are resolved
- `/pwf-doc-capture` if review uncovered a reusable lesson/pattern
