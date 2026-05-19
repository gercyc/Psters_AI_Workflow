---
name: pwf-commit-changes
description: >
  Commit uncommitted changes across all workspace repos, tagging commits with ticket numbers from pasted issue text.
  Spawns one parallel subagent per repo — each analyzes every changed file, groups them by ticket, and makes multiple focused commits independently.
  Use when: user wants to commit work with organized, ticket-tagged commits.
argument-hint: "[paste issue(s) with TICKET-XXX and metadata, or list TICKET-XXX]"
---

# Step 5 — Create Structured Commits

Use this skill to produce high-quality, ticket-aware commits after review, including multi-repo parallel commit organization when needed.

Each repo gets its own subagent that:
1. Inspects every changed file individually
2. Groups files by which ticket they relate to
3. Makes **multiple focused commits** — one per ticket group (plus separate commits for unrelated changes)

All repos run **in parallel**.

## Input

<commit_changes_input> $ARGUMENTS </commit_changes_input>

If empty, ask:
> "Paste the issue(s) or list the ticket number(s) (e.g. TICKET-727, TICKET-726), then I'll commit all uncommitted changes with organized, per-ticket commits."

---

## Phase 1 — Parse Tickets

Extract every ticket identifier and its short title from the pasted text:
- Look for `Identifier: TICKET-XXX` lines; the title is the `# Heading` above it.
- Build a list: `[{ id: "TICKET-727", title: "Move the BACK TO TABLE button to the right side" }, ...]`
- If no ticket is found, subagents will still commit with descriptive subjects but no `[TICKET-XXX]` prefix.

---

## Phase 2 — Discover Repos With Changes

For each **workspace path** (backend, frontend, `*-lambda`, etc.):
1. Run: `git -C <path> status --short`
2. Skip if not a git repo (exit code ≠ 0) or output is empty.
3. Record repos with uncommitted changes.

> Do NOT collect diffs here. Each subagent fetches its own per-file diffs.

---

## Phase 3 — Spawn One Subagent Per Repo (All in Parallel)

> Read `skills/commit-changes-repo-worker/SKILL.md` before spawning subagents.

For each repo with uncommitted changes, invoke **one agent** using the Agent tool. All invocations run **simultaneously**.

Prompt template per repo:
```
You are a focused git commit worker for a single repository.
Read the skill at skills/commit-changes-repo-worker/SKILL.md for full instructions.

REPO_PATH: {REPO_PATH}
REPO_NAME: {REPO_NAME}
TICKET_LIST: {TICKET_LIST}

Follow the commit-changes-repo-worker skill exactly:
1. Discover changed files with `git -C {REPO_PATH} status --short`
2. Fetch per-file diffs and classify each file to the most relevant ticket
3. Group files by ticket
4. Make one focused commit per group (stage specific files only — never git add -A)
5. Return the JSON report with the `commits` array
```

---

## Phase 4 — Summarize

Parse each subagent's JSON response. Print one row per commit:

| Repo | Ticket | Commit message | Files | Result |
|------|--------|----------------|-------|--------|
| frontend | TICKET-727 | `[TICKET-727] fix(tasks): move back-to-table btn to right` | 2 files | ✅ |

Then show: "X repos committed, Y commits total. All commits are local only — push each repo when ready."

---

## Commit Rules (rules/commits.mdc — always enforced)

- **Format**: `[TICKET-XXXX] <type>(<scope>): <subject>`
- **English only** — subject and all commit text in English.
- **Imperative mood** — "add", "fix", "remove" (not "added"/"adds").
- **Subject ≤ 50 chars** (not counting `[TICKET-XXXX]` prefix and type).
- **No emojis** — never include emojis in commit messages.
- **No branches, no push** — targeted `git add <files>` + `git commit` on current branch only.
- **No bulk staging** — never `git add -A`.

## Next Recommended Commands

- `/pwf-review` if commits should be preceded by a final risk check
- `/pwf-aws-lambda-deploy` if Lambda code was committed and is ready to deploy
