---
name: sync-guidelines
portedFrom: independent
description: Mirror general (non-project-specific) guidelines — rules and skills — from ~/.cursor (and ~/.claude) into the ai-coding-guidelines GitHub repo, and report what your Cursor-side edits still owe the Claude Code side. Manual trigger only. Use when the user says "sync guidelines" or asks to update the guideline mirror repo.
---

# sync-guidelines (Cursor side)

Two jobs, in this order:

1. **Mirror** both harnesses into `~/repos/ai-coding-guidelines` (GitHub: `DvirMon/ai-coding-guidelines`, private), then commit and push.
2. **Report drift** between `~/.cursor` and `~/.claude`, in both directions — because the mirror copies each harness into the repo but never between them.

The Claude Code side has its own copy of this skill. Either side can run either job; the scripts are identical and the mirror is direction-agnostic.

**Scope — general guidance only.** Never sync per-project rules, project memory, session history, or credentials. Only:

- `~/.cursor/rules/` → `cursor/rules/`
- `~/.cursor/skills/` → `cursor/skills/`
- `~/.claude/` rules, skills, agents, conventions, plugin docs → `claude-code/` (the script handles this; it runs the same from here)

Never syncs `~/.cursor/skills-cursor/` — that's Cursor's own built-in skill bundle, ships with every Cursor install, not authored by you.

## Steps

0. Check drift both ways:
   ```bash
   bash ~/.cursor/skills/sync-guidelines/port-drift.sh
   ```
   Report the buckets and stop there. **Porting is editorial, not a copy** — see "Why it never copies" below. The script never overwrites; `--apply` only copies files that are new on one side and contain no harness-specific text.

   Your edits here land in the **back-port needed** bucket: a Cursor file changed, and the Claude original hasn't caught up. Working that bucket means writing the change into `~/.claude` in Claude's own idiom (sequential passes become agent dispatch, `.mdc` links become `.md`, generic "build command" becomes the project's real toolchain), then `--stamp <name>`.

1. Mirror into the repo:
   ```bash
   bash ~/.cursor/skills/sync-guidelines/sync.sh
   ```
2. `cd ~/repos/ai-coding-guidelines && git status` — review the diff before committing. If nothing changed, stop (no empty commits).
3. `git add -A`
4. Commit with a message summarizing what changed (e.g. "sync: update rules/, add new ds-* skills").
5. **Ask the user before `git push`** — pushing updates a shared/remote repo, confirm each time unless the user has said to always push automatically.

## Why it never copies

A Cursor file and its Claude counterpart differ **on purpose**:

| Claude | Cursor |
|---|---|
| dispatch parallel sub-agents | run the passes sequentially, one finishing before the next |
| `[file-organization.md](file-organization.md)` | `` `file-organization.mdc` `` |
| `nx build`, `ng serve`, `vitest` | "build commands", "dev-server commands", "test runs" |
| `AskUserQuestion` tool | ask conversationally, in one batch |
| rule frontmatter: none (always loaded) | `description` + `globs`/`alwaysApply` |

Copying either way destroys that. So each ported file records two hashes in its frontmatter:

```
portedFrom: <sha of the Claude source, at last port>
portedSelf: <sha of this file's own body, at last port>
```

Four states follow: both match (clean), `portedFrom` differs (Claude moved on → forward-port), `portedSelf` differs (you edited Cursor → back-port), both differ (merge by hand, then restamp).

A rule that was deliberately renamed on the way over also records `portedFromFile: <claude-rule-name>`, so the pair is still tracked.

## Notes

- The scripts are idempotent — safe to re-run any time.
- After hand-porting a file in either direction, run `port-drift.sh --stamp <name>` or it reports as drifted forever.
- Two Claude skills are **deliberately not ported**: `permission-update` (targets Claude Code's `settings.json` allow-rules) and the Claude-side `sync-guidelines` (the mirror tool itself — this file is Cursor's own version, not a port of it).
- Do not add new source paths to `sync.sh` without checking they don't contain secrets or project-specific content first.
