---
name: audit-ticket
description: Audit one ticket end to end and bring it back in sync — the tracker (Jira or GitHub ticket + sub-tasks), the local workspace (docs/work/<slug>/ state.json, issue-graph, step files, progress.md, checkboxes, prd.md ACs, decisions.md) and the code on the branch. First migrates the workspace to the one-owner-per-fact layout (absorbs organize-ticket-docs), then checks tracker ↔ local alignment, then audits every step and acceptance criterion against the diff, and resolves every mismatch, gap and open item WITH the user, one question at a time — it never ends by printing a list. Use for "audit PROJ-123", "audit this ticket", "is the ticket in sync", "sync Jira with the plan", "what's really done on this ticket", "update the checkboxes/progress from the code", "organize / clean up the work folder", or before CR/QA hand-off, even when the user names only one of these.
model: sonnet
---

# Audit a ticket

Input: a ticket key, slug, or workspace path. Run from the repo root.

**Why this shape.** Scripts do everything mechanical (parse, diff, compare,
apply), so they cost no tokens. Haiku fetches the tracker. Sonnet auditors
judge code, several in parallel. This session (Sonnet) only judges across
sources and talks to the user. For a messy migration (nested `t*/`
workspaces, facts scattered across many files), suggest the user switch
to Opus with `/model` for that run: a wrong merge there is permanent. Read script output through `view.mjs`,
never as raw JSON, and never re-read a file an agent already summarized.

Decisions behind this skill: `references/design-decisions.md` (D1–D17).
Target layout and migration buckets: `references/layout.md`.

```bash
S=~/.claude/skills/audit-ticket/scripts
A=<workspace>/audit          # every artifact of this run lives here
```

## Rules that hold in every phase

- **Apply what the evidence settles; ask only what it doesn't** (D17,
  replaces D10). The user has no context of the work, so never ask them
  to confirm a fix the code and commits already back: tick the box, flip
  the status, fix the stale doc line, and log it in `applied.jsonl`. Ask
  only for real ambiguity (two readings, a process step code can't show),
  a conflict between sources, a delete of a file that is not provably
  dead, a tracker transition, or a scope/decision call. One question per
  `AskUserQuestion` call, with evidence and a recommended option first.
- **Name every item in plain words.** The user has not read the
  workspace files, so an AC number, a D-number, a step number or a
  `file:line` alone means nothing to them. Lead with what it is
  ("the trial-plan rule", "the alert position"); the label goes in
  brackets after. Same in questions, chat and the report.
- **Never end with a list of gaps.** Every open item becomes a question
  (Gate 3). The run ends only when each item is fixed, deferred to
  `decisions.md` `## Open`, or dropped, all by the user's choice.
- **Tracker writes: transitions only** (D9), each approved, picked by
  target status name via the repo's `docs/agents/*-tracker.md`. Never
  descriptions, labels, comments, or new sub-tasks. Any other tracker-side
  fix: tell the user exactly what to change, then re-snapshot.
- **Local writes**: one approved fix → one `apply-fix.mjs` call. It
  refuses if the file changed under it; then re-snapshot and re-ask.
  Writes the script cannot do (merges, new `decisions.md`, flattening
  `t*/`) go to one writer fork for the whole run (`Agent`,
  `subagent_type: "fork"`, named `audit-ticket-writer`; `SendMessage` it for
  later writes), with the exact final text in the brief.
- Never commit, stash, revert, or edit source code. Never build, serve,
  install, or run tests without the one approval in phase 4.

## Phase 0 — Resolve

1. `node $S/snapshot-local.mjs <input> --write` saves `$A/snapshot.json`
   and prints its path, which gives you `<workspace>`. Re-run the same
   command after every applied change. If the input matches more than one
   workspace, ask which.
2. Check `docs/agents/ticket-tracker.md` and `issue-tracker.md` exist (D7).
   Missing → stop and ask: this skill holds no tracker calls of its own.
3. Start the tracker fetch now, in the background, since phase 1 does not
   need it: `Agent` → `ticket-tracker-snapshot` with `ticketKey`,
   `repoRoot`, `outputPath: $A/tracker.json`.

## Phase 1 — Normalize (migrate to D6)

**Links.** Run `node <sdlc-plugin>/scripts/workspace-links.mjs <workspace> --check` (rules:
sdlc `contracts/workspace-links.md`). Each problem is a `fix` item. Applying `--write` is
evidence-backed (D17): run it, log it in `applied.jsonl`, re-snapshot. A broken link that
`--write` cannot fix (wrong target, missing relation) is one question. Old names
`1-decisions.md` / `2-spec.md` migrate by rename, links rewritten.

`node $S/view.mjs checks $A/snapshot.json --severity migrate`

**Epic layout (D18).** When the root has `t<N>-…/` slice folders, they are
accepted: never flatten them. Run phases 0-7 once for the root and once per
slice, passing the slice folder as `<input>` (its own snapshot, tracker
ticket, git evidence, verdicts). Run git evidence against the unit's own
worktree/branch from its `state.json`, not the current checkout. Migration
(this phase) applies at both levels. See `references/layout.md`.

Nothing listed → phase 2. Otherwise, per item, in this order (later
items depend on earlier ones): sub-workspaces → `state.json` → off-layout
files → missing `prd.md` / `decisions.md` → step `jira:` keys.

- For an off-layout file, read its banner and headings only
  (`rg -n '^#{1,3} ' --max-count 25 <file>`, first ~15 lines), pick its
  bucket from `references/layout.md`, and ask one question: the proposed
  action, the fact it moves and where, and the git-check result for a
  delete.
- A unique fact moves to its D6 owner before the source is deleted.
- `state.json` to v5: field owners and meaning in the sdlc
  `state-schema.md`. Map removed keys (`githubIssues` → `issue-graph.md`
  or `units[]`, `checklist` → progress) before deleting them.
- `jira:` per step: propose the key from the commit message, the step
  title, or the coverage table. Several steps may share one key. Ask when
  more than one key fits.

Re-run the snapshot after each applied change. Leave when no `migrate`
check remains, or when every remaining one was deferred by the user.

## Phase 2 — Evidence (parallel)

- `node $S/git-evidence.mjs $A/snapshot.json > $A/git.json` (runs while
  the tracker agent finishes). `--base <ref>` if the branch is not cut
  from the default branch.
- Wait for `$A/tracker.json`.

## Phase 3 — Align tracker ↔ local (Gate 1)

`node $S/align.mjs $A/snapshot.json $A/tracker.json > $A/align.json`
then `view.mjs findings $A/align.json --gate 1`.

The high level must match; local may hold more detail. Per finding, one
question:

| kind | Ask |
|---|---|
| `unmapped-remote` | map to which slice/step, or is it out of this branch's scope |
| `unmapped-local` | which sub-task owns it; or the user creates one on the tracker (D9) |
| `graph-missing` | none: rewrite `issue-graph.md` nodes and edges from the tracker (evidence-backed, D17) |
| `title` | same scope with more local detail (keep), or real divergence (which side is right) |
| `edges` | which dependency is true; tracker side → the user edits the links |
| `ac-missing-local` / `ac-local-only` | add to `prd.md` tagged `[KEY · MM-DD]`, or drop, or a local-only detail (keep, move to `spec.md`) |

A scope answer that is a decision → append to `decisions.md` (writer
fork). Also run the `fix` checks: `view.mjs checks … --severity fix`. They
are internal drift (status off the ladder, `depends_on` drift, State
column, supersede marks). Each is one question.

## Phase 4 — Code audit

1. Split the steps into groups of ≤4, keeping steps that share files
   together. Dispatch one `ticket-code-auditor` per group, all in one
   message (parallel). Brief each with `repoRoot`, `mergeBase`, its steps'
   file paths and `git.json` entries, its coverage rows, and
   `outputPath: $A/verdict-<group>.json`. Skip steps with `⏭`.
2. When they return: `node $S/view.mjs verdicts $A/verdict-*.json`.
3. **Signal 4 (D11).** Show `specsToRun` (from `view.mjs evidence`) and the
   one scoped command that runs them all (the repo's agent test command,
   e.g. `npm run test:agent -- <specs>`). Ask once. Yes → run it once,
   write the per-spec result to `$A/tests.txt`. No → every `code-done`
   becomes `partial (tests not run)`. Never `done`.

## Phase 5 — Reconcile (Gate 2)

A step is **done** only when its verdict is `code-done` and its specs
passed. From that, plus `view.mjs findings $A/align.json --gate 2`:

| Situation | Question (one each) |
|---|---|
| box `should` ≠ `checked` | none: one `apply-fix tick` per box with `should: true`/`false`. Never tick a whole step in bulk: a `should: null` box (commit, run, process) stays as is until the user settles it |
| step done, progress row not ✅ (or the reverse) | flip status → `apply-fix status` |
| `doc-stale` | update the step file or row to match the code (state the exact text) |
| `local-done-remote-open` and audit confirms done | transition the sub-task to <target status>? (D9) |
| `remote-done-local-open` | is the tracker wrong (reopen: the user does it) or local stale (flip)? |
| `partial` / `missing` / AC `unmet` | goes to Gate 3 |
| conflicting evidence (claim vs code, two files disagree) | which source wins, with both quoted |

## Phase 6 — Remaining work (Gate 3)

Everything still open: partial/missing steps, unmet ACs, deferred
migrations, `ticket-open`. Ask each: **do it now** (name the step and
hand it to the user's implement flow; this skill does not write code),
**defer** (append to `decisions.md` `## Open` with `blocked on …`),
or **drop** (a decision with its reason). No item is left unanswered.

## Phase 7 — Close

- Write `$A/report-<YYYY-MM-DD>.md`: fixes applied (from
  `applied.jsonl`), transitions done, decisions added, deferred items.
  Tables only.
- Workspace under `active/` with an `archive/` sibling, and everything
  done → offer `doc-archiver`. It runs only on a yes, on a
  `chore/<slug>-archive` branch.
- End with one line: counts plus the report path.
