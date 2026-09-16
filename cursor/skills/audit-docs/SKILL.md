---
name: audit-docs
description: Audit documentation file(s) against the current code and any cross-referenced docs to find stale content — broken links, claims a fix "still needs doing" that already shipped, code behavior the doc no longer describes correctly, status/date markers that don't match reality. Default scope is the file(s) the user names; audit every doc in the project only when the user explicitly asks for "all docs"/"all documentation". Reports findings per file and does not edit unless the user asks to apply/fix. Use when the user wants to "audit docs", check if documentation is stale or up to date, or verify docs against code state.
portedFrom: ab01c5b6d66f
portedSelf: 22d34e7baf7a
---

Verify a doc's claims against ground truth — the current code, and any other doc it references —
rather than trusting the doc's own account of itself. Report-only by default; apply fixes only on
explicit request (see step 6). Verification is a checklist walked claim by claim (step 4) — the
tracking is what keeps every claim getting a verdict, however many there are.

## Process

### 1. Pin the scope

- User named specific file(s) → that's the scope, exactly.
- User said "all docs" / "all documentation" / similar, explicitly → scope is every doc file in
  the project (or the directory they named). Find the project's own doc convention first — check
  its `CLAUDE.md`/`AGENT.md` for a documented docs-structure table (e.g. numbered doc streams,
  `docs/adr/`, per-domain `docs/` folders) and glob accordingly, rather than a blind
  `**/*.md`. If there's no documented structure, glob `**/*.md` under the project's doc roots and
  exclude `node_modules`, `dist`, vendored/third-party trees.
- Anything else ("review the docs" with no scope word) — ask which file(s), per
  `ask-dont-search-on-ambiguity`. Don't guess "all docs" from a vague ask.

### 2. Extract what each target doc claims

Read each target file fully first (not a partial read — staleness hides in sections you'd
otherwise skip). For each, pull out two kinds of claims:

- **Cross-doc references** — markdown links to other files, and prose mentions of other docs by
  name/path (e.g. "see `5-gaps.md`", "per ADR-0004"). Note what the doc *says* about the
  referenced doc's content or status ("still open", "resolved", "shipped X"), not just that it's
  linked.
- **Code claims** — anything asserting a fact about the current codebase: a function/file name in
  backticks, an inline code snippet, "implemented"/"shipped"/"still a gap"/"TODO"/"not yet
  wired", a specific behavior described as current. Note the exact claim, not just the symbol
  name — "`captureEdit` always overwrites" and "`captureEdit` exists" are different claims to
  verify.

Skip claims that are pure opinion/rationale ("we chose X because Y") — nothing to verify against
ground truth there.

### 3. Track every claim as a todo

Before verifying anything, write each extracted claim into your session's todo-list tool (e.g.
`TodoWrite`) as one item per claim, scoped to its file — not one vague item per doc. With more
than a handful of claims across one or more docs, this is the only reliable way to guarantee
every claim gets a verdict instead of the last few silently dropping off the end of a long
report, and it's what makes the final tally in step 5 trustworthy rather than a guess. Mark each
item in-progress when you start verifying it, and completed the moment its verdict is settled. If
no todo tool is available in this session, keep an equivalent explicit checklist in your working
notes instead of skipping the tracking step.

### 4. Verify claim by claim

Check every claim against current state by opening the current file — never answer from the doc's
own text or from memory of an earlier read. Work one target doc at a time, finishing its claim
list before starting the next, so a partial run still leaves whole docs decided rather than every
doc half-checked.

For each claim:

- Re-read the surrounding passage in the doc, so the claim is judged in context.
- For cross-doc claims: read the referenced file's **current** content (and, if the repo is a
  git working tree, check `git status`/`git diff` for that file — a claim can be stale against an
  uncommitted change too, not just the last commit) and say whether the claim about it still
  holds.
- For code claims: locate the actual current source (grep for the symbol/file named; don't trust
  the doc's path if grep disagrees) and say whether the claim matches. Check working-tree diffs
  here too, not just `HEAD`.
- Verdict per claim: **STALE** (doc says X, current state is Y — quote both), **CONFIRMED**
  (still matches), or **CANNOT VERIFY** (claim isn't checkable — e.g. references something
  external, or a symbol that no longer exists anywhere to compare against).

Update each todo item to completed with its verdict as you settle it.

### 5. Aggregate and report

Per target file, list only the **STALE** findings (this is an audit for action, not a wall of
confirmations) as: what the doc says → what's actually true now → the specific line/section to
fix. End with a one-line tally per file: confirmed vs. stale vs. cannot-verify — read straight off
the completed todo list, not re-counted by hand.

Do not edit anything in this step. Report and stop.

### 6. Apply, only if asked

If the user's request already said to fix/update/apply (not just audit), or they say so after
seeing the report, edit each STALE finding directly — minimal, targeted edits at the exact
sentence/link/status marker, not a rewrite of surrounding prose. Downstream files a finding
points at (e.g. a handoff doc the audited file links to) are **out of scope for editing** unless
the user names them too — flag what's stale there in the report, don't silently fix it.

## Recurrence

This skill runs once per invocation; it has no built-in schedule. To keep a doc under continuous
staleness watch, re-run it against that file on whatever cadence the project uses — don't build
polling into this skill itself.
