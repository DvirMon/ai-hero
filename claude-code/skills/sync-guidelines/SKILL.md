---
name: sync-guidelines
description: Mirror general (non-project-specific) code-generation guidelines — CLAUDE.md, rules, skills, agents, and installed plugin skills — from ~/.claude (and ~/.cursor) into the ai-coding-guidelines GitHub repo. Manual trigger only. Use when the user says "sync guidelines", "/sync-guidelines", or asks to update the guideline mirror repo.
---

# sync-guidelines

Mirrors general, non-project-specific coding guidance from local AI harness configs into
`~/repos/ai-coding-guidelines` (GitHub: `DvirMon/ai-coding-guidelines`, private), then commits
and pushes.

**Scope — general guidance only.** Never sync per-project CLAUDE.md files, project memory,
session history, or credentials (mcp.json, settings.json with tokens). Only:

- `~/.claude/CLAUDE.md`, `~/.claude/RTK.md` → `claude-code/`
- `~/.claude/rules/` → `claude-code/rules/`
- `~/.claude/skills/` (symlinks dereferenced) → `claude-code/skills/`
- `~/.claude/agents/` → `claude-code/agents/`
- `~/git/*/.claude/{skills,agents}/` (repo-level) → merged into `claude-code/skills/` and
  `claude-code/agents/`, no delete. Covers skills/agents kept at project level on purpose (e.g.
  org's `ds-*` — scoped there so they don't leak into unrelated projects' context) but still
  meant to be preserved in this mirror. Repo-level `rules/`, `hooks/`, `settings*.json` are not
  synced — rules there are usually project-scoped dupes of global rules, and settings/hooks can
  carry project-specific or credential content.
- `~/.claude/conventions/` (opt-in / project-dependent — NOT auto-loaded like `rules/` is) → `claude-code/conventions/`
- `~/.claude/plugins/marketplaces/*/{skills,agents,commands,docs}` → `claude-code/plugins/<marketplace>/`
  (excludes `.git`, `dist`, `node_modules`, `bin`, `tests`, `benchmarks`, `evals`, `src`,
  `.github`, `.changeset`, `.codex`, `.out-of-scope` — those are the plugin's own source/build
  tree, not guideline docs, and already live upstream)
- `~/.cursor/skills/` (own ported skills) → `cursor/skills/`
- `~/.cursor/rules/` (if present) → `cursor/rules/`

Never syncs `~/.cursor/skills-cursor/` — that's Cursor's own built-in skill bundle, ships with
every Cursor install, not authored by you.

## Steps

0. Check drift both ways — the mirror copies each harness into the repo but never between
   them:
   ```bash
   bash ~/.claude/skills/sync-guidelines/port-drift.sh
   ```
   Report the buckets and stop there. **Porting is editorial, not a copy** — a Cursor file
   differs from its Claude original on purpose: sub-agent dispatch becomes sequential passes
   (Cursor has no Agent tool), cross-links go `.md` -> `.mdc`, toolchain names are generalised.
   The script never overwrites; `--apply` only copies files that are new on one side and carry
   no harness-specific text.

   Each ported file records two hashes in its frontmatter — `portedFrom` (the Claude source at
   last port) and `portedSelf` (its own body at last port) — so drift is reported per direction:
   **forward-port** (Claude moved on), **back-port** (Cursor was edited), or **both sides**
   (merge by hand). A sibling written independently for each harness declares
   `portedFrom: independent` and is not tracked as a pair. After any hand-port:
   `port-drift.sh --stamp <name>`.

   Cursor has its own copy of this skill (`~/.cursor/skills/sync-guidelines/`) — an independent
   sibling, not a port. Either side can run either job.

1. Run the sync script:
   ```bash
   bash ~/.claude/skills/sync-guidelines/sync.sh
   ```
2. `cd ~/repos/ai-coding-guidelines && git status` — review the diff before committing. If
   nothing changed, stop (no empty commits).
3. `git add -A`
4. Commit with a message summarizing what changed (e.g. "sync: update rules/, add new ds-* skills").
5. **Ask the user before `git push`** — pushing updates a shared/remote repo, confirm each time
   unless the user has said to always push automatically.

## Notes

- The script is idempotent — safe to re-run any time.
- `sync.sh` mirrors both harnesses into the repo but never between them. Drift in either
  direction is reported by `port-drift.sh` (step 0) and closed by hand — see that script's
  header for why a verbatim copy is wrong.
- Two Claude skills are deliberately not ported: `permission-update` (targets Claude Code's
  `settings.json` allow-rules) and this skill (Cursor has its own sibling version).
- Do not add new source paths to `sync.sh` without checking they don't contain secrets or
  project-specific content first.
