---
name: pwf-setup-workspace
description: >
  Create or repair the recommended multi-root project layout with separate *_Repos and *_Workspace
  folders, plus a .code-workspace file that Cursor/VS Code can open directly.
  Use when: user is setting up a new multi-root project workspace from scratch.
argument-hint: "[project-name] [optional: base path, frontend repo name, backend repo name]"
---

# Setup Multi-Root Project Workspace

Use this skill to create the recommended structure:
- `<ProjectName>_Repos/` for code repositories (frontend and backend),
- `<ProjectName>_Workspace/` for docs, `.cursor`, `.claude`, and workspace-level assets,
- `<ProjectName>.code-workspace` for a multi-root editor workspace.

## Input

<workspace_setup_input> $ARGUMENTS </workspace_setup_input>

If input is missing required fields, ask:
1. Project name (example: `BDTX`)
2. Base path where folders should be created (example: `/home/user/Repos`)
3. Frontend repo folder name (default: `frontend`)
4. Backend repo folder name (default: `backend`)
5. Optional: existing repo paths to link instead of creating new empty folders

## Rules

1. Non-destructive by default: do not delete folders, do not move existing repos without explicit confirmation.
2. If target folder exists, reuse it and report as "already existed".
3. Always generate/update a workspace file in `<ProjectName>_Workspace/`.
4. Keep paths explicit in the final report.

## Target structure

Create or ensure:
- `<base>/<ProjectName>_Repos/`
- `<base>/<ProjectName>_Repos/<frontend-repo>/`
- `<base>/<ProjectName>_Repos/<backend-repo>/`
- `<base>/<ProjectName>_Workspace/`
- `<base>/<ProjectName>_Workspace/docs/`
- `<base>/<ProjectName>_Workspace/.cursor/`
- `<base>/<ProjectName>_Workspace/.claude/` (if the user uses Claude Code)
- `<base>/<ProjectName>_Workspace/<ProjectName>.code-workspace`

## Workspace file requirements

Write a valid JSON `.code-workspace` file:

```json
{
  "folders": [
    { "name": "Workspace", "path": "." },
    { "name": "Frontend", "path": "../<ProjectName>_Repos/<frontend-repo>" },
    { "name": "Backend", "path": "../<ProjectName>_Repos/<backend-repo>" }
  ]
}
```

## After creating the structure

1. Recommend opening `<ProjectName>.code-workspace` in Cursor/VS Code.
2. Then run `/pwf-setup` from the workspace root to initialize/repair docs skeleton.
3. If existing project migration, ask whether to keep repos in place or move/copy them.

## Next Recommended Commands

- Open `<ProjectName>.code-workspace` in Cursor or VS Code
- `/pwf-setup` to initialize docs structure in workspace root
- `/pwf-doc-foundation all` to build baseline documentation
- `/pwf-help` to choose the next execution path
