---
name: audit-docs
description: Check whether documentation is still TRUE against the code — broken links, claims a fix "still needs doing" that already shipped, behavior the doc no longer describes correctly, status/date markers that do not match reality. TRUTH is the job — never rewrites for brevity (that is `concise-docs`, dispatched as the `doc-compressor` agent once fixes are applied) and never reshapes source comments to the JSDoc contract (that is `source-docs`). Reports findings per file and edits nothing unless asked to apply/fix. Default scope is the file(s) named; all docs only when explicitly asked. When given a capability/feature instead of a path, defers to the project's own capability-docs procedure if it documents one. When the scope is an episodic work folder (an `active/<slug>/` directory with a sibling `archive/`), also checks whether its tracked work shipped and, on request, dispatches `doc-archiver`. Use to audit docs, check whether documentation is stale or up to date, verify docs against code state, or archive finished work folders.
---

Verify a doc's claims against ground truth — the current code, and any other doc it references —
rather than trusting the doc's own account of itself. Report-only by default; apply fixes or
archive finished folders only on explicit request (steps 6 and 7). Verification always runs as
**parallel sub-agents** (step 4), never serially — that's what keeps this fast enough to run
routinely instead of just once.

## Process

### 1. Pin the scope

- User named specific file(s) → that's the scope, exactly.
- User named a **capability/feature** rather than a path ("audit the filtering docs", "audit
  grouping") → check whether the project documents a capability-docs procedure (look for a
  `docs/agents/capability-docs.md`, or a pointer to one from its `CLAUDE.md`). If it does,
  **follow that procedure** — this skill's steps 2–5 are its verification phase, but a
  capability audit also consolidates, tombstones and moves, which this skill does not do on its
  own. If the project documents no such procedure, treat the capability as a file-scope ask and
  confirm which files before proceeding.
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

- **Folder-completion claims** — when a target is itself an episodic work folder (an
  `active/<slug>/` directory sibling to an `archive/`), don't read the whole folder to form
  this claim. Completion is GitHub state, not a file: read the folder's epic issue list
  (`state.json`'s `units[].remoteRef`, or the nodes of `issue-graph.md`) and turn **each issue**
  into its own claim ("#105 is closed"). One claim per issue, not one per folder — this is
  what makes step 4's verification a `gh` call instead of a read. This is the one claim type
  in this skill you're hoping comes back true — every issue closed makes the folder an
  archive candidate, not a defect.

### 3. Track every claim as a todo

Before dispatching anything, write each extracted claim into your session's todo-list tool (e.g.
`TodoWrite`) as one item per claim, scoped to its file — not one vague item per doc. With more
than a handful of claims across one or more docs, this is the only reliable way to guarantee
every claim gets a verdict instead of the last few silently dropping off the end of a long
report, and it's what makes the final tally in step 5 trustworthy rather than a guess. Mark each
item in-progress when its verifying sub-agent is dispatched, and completed the moment its verdict
comes back. If no todo tool is available in this session, keep an equivalent explicit checklist
in your working notes instead of skipping the tracking step.

### 4. Verify in parallel

Dispatch `Explore` sub-agents to check claims against current state — never answer from the
doc's own text or from memory of an earlier read. One agent per target doc is the default split;
for "all docs" scope, batch related docs (e.g. one domain's doc set) per agent rather than one
agent per file. Always launch a batch's agents in a single message with multiple tool calls so
they run concurrently — never dispatch them one at a time in sequence.

Each agent's brief:

- The full text of its assigned doc(s), plus the list of claims (from the todo list) for that
  doc.
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
- For a folder-completion claim, one call per issue — never open the folder's source tree or
  history to answer this: `gh issue view <n> --json state,stateReason`. Closed as completed
  means its PR merged (the PR body's `Closes #N` closed it). A checkbox or status line in a
  workspace file is not evidence.
  Verdict per issue: **SHIPPED** (closed, completed), **IN PROGRESS** (open), or **CANNOT
  VERIFY** (closed as not planned, or `gh` unavailable). A folder is a **SHIPPED** folder only
  once every one of its issues verdicts SHIPPED.

As each agent returns, update the corresponding todo items to completed with their verdicts.

### 5. Aggregate and report

Per target file, list only the **STALE** findings (this is an audit for action, not a wall of
confirmations) as: what the doc says → what's actually true now → the specific line/section to
fix. End with a one-line tally per file: confirmed vs. stale vs. cannot-verify — read straight off
the completed todo list, not re-counted by hand.

Any folder-completion claim verdicted **SHIPPED** gets its own line instead, flagged as an
archive candidate: `<folderPath> → SHIPPED, candidate for archive/`. **IN PROGRESS** folders are
not findings — say nothing about them beyond the tally.

Do not edit or move anything in this step. Report and stop.

### 6. Apply, only if asked

If the user's request already said to fix/update/apply (not just audit), or they say so after
seeing the report, edit each STALE finding directly — minimal, targeted edits at the exact
sentence/link/status marker, not a rewrite of surrounding prose. Downstream files a finding
points at (e.g. a handoff doc the audited file links to) are **out of scope for editing** unless
the user names them too — flag what's stale there in the report, don't silently fix it.

Once the edits are in, dispatch the `doc-compressor` agent over the files you changed, passing
the file list. Fixing a stale claim tends to add words; this pass takes them back out. It loads
`concise-docs` for the policy and runs its preserved-content check, so a fix can't be silently
truncated. Skip it if you edited nothing.

### 7. Archive, only if asked — and only what verified SHIPPED

Moving a folder is a bigger action than editing a line, so it carries its own opt-in on top of
step 6's: only act on an archive candidate when the user's request said fix/update/apply/archive,
or they say so after seeing the report, **and** the report actually flagged that folder as a
candidate. Never move a folder as a side effect of an unrelated fix request, and never act on an
**IN PROGRESS** or **CANNOT VERIFY** folder.

Normally the repo's `issue-flow.yml` GitHub Action opens the archive PR itself when an epic's
last issue closes — check `gh pr list --search "<slug> archive"` first and point at that PR
instead of duplicating it. This step is the manual path for when the Action did not run.

The move goes through a branch and PR, never onto the default branch. Start
`chore/<slug>-archive` via the start-branch procedure (`/to-tasks`
`references/start-branch.md`), then dispatch the `doc-archiver` agent inside that worktree
(parallel, one per folder, in a single message, if there's more than one) with: the folder's
path, the project root, and the completion evidence step 4 already established (the closed
issues, quoted — the agent does not re-derive completeness, so hand it the verdict, not just
"it's done"). Commit the move (`🎨 chore(<domain>): archive <slug> workspace`, per
`atomic-commit`'s format), then hand off to `/ship` for the PR. The agent gate-checks
the move itself (e.g. a project may require every decision in the folder to be logged first
before it can move) and reports back moved-or-blocked; relay that verdict per folder rather than
assuming every dispatch succeeded.

## Recurrence

This skill runs once per invocation; it has no built-in schedule. To keep a doc under continuous
staleness watch, pair it with the `loop` skill (e.g. `/loop 1d audit-docs libs/foo/docs/bar.md`)
or the `schedule` skill for a cron-based recurring run — don't build polling into this skill
itself.
