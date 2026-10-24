---
name: sync-guidelines
description: Mirror general (non-project-specific) code-generation guidelines — CLAUDE.md, rules, skills, agents, and installed plugin skills — from ~/.claude (and ~/.cursor) into the ai-coding-guidelines GitHub repo. Manual trigger only. Use when the user says "sync guidelines", "/sync-guidelines", or asks to update the guideline mirror repo.
---

# sync-guidelines

> **Core files are symlinked, pull is automatic, push is manual.**
> `~/.claude/{CLAUDE.md,RTK.md,rules,skills,agents,conventions}` are symlinks into
> the clone's `claude-code/`, so edits are live. The clone can live anywhere; scripts find it
> from their own location (override: `$GUIDELINES_REPO`). Push when you choose:
> `bash scripts/push.sh ["message"]` from the clone (commit + rebase + push to `master`). Other machines run `scripts/pull.sh` from a `SessionStart` hook (no polling).
> New machine: clone the repo, `bash scripts/link.sh` (`--adopt` pushes local content up first),
> add the same `SessionStart` hook.
> The steps below now only cover `sync.sh`'s mirror-only extras (plugins, project-level skills
> under `claude-code/project/`, Cursor) and port drift; the PR flow in steps 1–6 applies to those.

Mirrors general, non-project-specific coding guidance from local AI harness configs into
the clone `~/.claude/skills` links into (GitHub: `DvirMon/ai-coding-guidelines`, private), then commits
on a `chore/sync-<date>` branch and opens a PR. Never commits or pushes on `master`.

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
- `~/.claude/plugins/marketplaces/*/{skills,agents,commands,docs}` → `claude-code/plugins/<marketplace>/`,
  except `ai-coding-guidelines` — that marketplace *is* this repo; its plugins live in `plugins/`.
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

1. Start from a fresh default branch, so the sync branch has no stale base:
   ```bash
   cd -P ~/.claude/skills/../..   # the clone ~/.claude links into
   git switch master
   git pull --ff-only
   ```
   Dirty tree here → stop and report; don't carry unknown changes into the sync.
2. Run the sync script:
   ```bash
   bash ~/.claude/skills/sync-guidelines/sync.sh
   ```
3. `git status` — review the diff. If nothing changed, stop (no empty commits, no branch).
4. Move the changes onto a branch (the working tree carries over):
   ```bash
   git switch -c chore/sync-$(date +%Y-%m-%d)
   ```
   Same-day re-run → suffix `-2`, `-3`.
5. `git add -A`, then commit per `atomic-commit`'s format (e.g.
   `🎨 chore(sync): update rules/, add new ds-* skills`, `Refs: none`).
6. **Ask the user before pushing** — it updates a shared remote; confirm each time unless the
   user has said to always push automatically. Then:
   ```bash
   git push -u origin HEAD
   gh pr create --fill
   gh pr merge --auto --rebase
   ```
   Report the PR URL. The next run's step 1 fast-forwards `master` once it merged; delete the
   merged local branch then (`git branch -D chore/sync-<date>` — rebase-merge changes SHAs, so
   `-d` refuses; confirm the PR is `MERGED` first).

## Notes

- The script is idempotent — safe to re-run any time.
- `sync.sh` mirrors both harnesses into the repo but never between them. Drift in either
  direction is reported by `port-drift.sh` (step 0) and closed by hand — see that script's
  header for why a verbatim copy is wrong.
- Two Claude skills are deliberately not ported: `permission-update` (targets Claude Code's
  `settings.json` allow-rules) and this skill (Cursor has its own sibling version).
- Do not add new source paths to `sync.sh` without checking they don't contain secrets or
  project-specific content first.
