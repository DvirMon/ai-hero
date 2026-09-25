---
name: ship
description: "Take an implemented, committed change to a reviewable state and get it onto the default branch — branch/push/PR for repos that gate on review, or a direct push for repos that don't (per this repo's Ship mode flag). Reads state.json for the issue reference; ensures Closes #N reaches the tracker so the issue closes when CI (or the push itself) resolves it, then refreshes the workspace's own copy of issue state — issue-graph.md's node states and edges, and state.json's updatedAt — from one live tracker read. Use after /implement reports done and the developer has approved the commit."
disable-model-invocation: true
---

# Ship

`/implement` stops at an approved commit on the current branch. This skill takes it from there.
Which of two modes it runs depends on this repo's Ship mode flag (step 2):

- **PR-gated** (default): branch (if needed), push, open the PR that carries CI — the pipeline's
  actual test gate.
- **Direct push**: push straight to the default branch. No branch, no PR — CI (if this repo has
  it) runs after the fact instead of gating the push.

This skill never closes an issue itself. `Closes #N` reaching the tracker — via a merged PR body
in PR-gated mode, or via the pushed commit message in direct-push mode — is the mechanism; CI (or
the push itself) is the trigger. A skill that closes an issue before that has happened is
asserting a result it has no evidence for.

## 1. Preconditions

Check these in order, before touching git. Any failure stops here — say which one failed and
why. Do not push a partial run.

1. **`state.json` resolves.** Find it in the target ticket workspace
   (`<domain-path>/docs/work/<slug>/state.json`, per `/to-ticket`'s workspace-root rule). Read
   `slug` and `githubIssues`. If it doesn't exist or won't parse, stop.
2. **The working tree has at least one commit not on the remote.** `git status -sb` and
   `git log @{u}..HEAD --oneline` (or, if there's no upstream yet, `git log origin/<default>..HEAD
   --oneline`). Zero commits ahead means there's nothing to ship — stop.
3. **No step is mid-run.** Read `<workspaceRoot>/4-tasks/progress.md`. If any row reads
   `▶ in progress`, stop — `/implement` hasn't finished, or died mid-step. Do not ship a partial
   implementation.

## 2. Ship mode

Read the repo's `docs/agents/issue-tracker.md` for its "Ship mode" flag (set by `setup-skills`).
No file, or the flag missing/`no` → **PR-gated**, continue at step 3. Flag is `yes` → **direct
push**, skip to step 3'.

This is a repo-level setting, not a per-run choice — don't ask which mode to use each time
`/ship` runs; that's what the flag is for. If the flag is ambiguous or the file describes
something this skill doesn't recognize, stop and say so rather than guessing which mode applies.

## 3. Branch (PR-gated mode)

- If the current branch **is** the repo's default branch (`git symbolic-ref
  refs/remotes/origin/HEAD`, or ask if that fails), create one. Name it
  `<type>/<slug>` using `state.json`'s `slug`, and a `<type>` inferred from the change (`feat` for
  new capability, `fix` for a bug fix, etc.). If this repo has a branch-name validator (e.g. a
  `pre-push` hook, or a `tools/validate-branch-name.*` script — check before assuming one
  exists), match its pattern; otherwise use `<type>/<slug>` as-is.
  `git checkout -b <type>/<slug>`.
- If already on a **non-default branch that conforms to any validator this repo has**, stay on
  it — don't rename or recreate.
- If already on a non-default branch that does **not** conform, stop and say so; renaming a
  branch with existing pushed history is a judgment call for the developer, not this skill.

## 4. Push (PR-gated mode)

```bash
git push -u origin <branch>
```

If this repo has a `pre-push` hook validating the branch name, that's a control on the branch
name matching what this skill just built, not an obstacle to route around. If the push is rejected, fix the underlying cause (branch name, diverged remote) and
push again; don't force past the hook.

## 5. Open the PR — deduplicated (PR-gated mode)

Check for an existing PR on this branch **before** creating one:

```bash
gh pr list --head <branch> --json number,url
```

- **If one is open:** the push in step 4 already updated it. Report its URL and stop — do not
  run `gh pr create`, which would open a second PR for the same branch.
- **If none exists:** `gh pr create --title "..." --body "..."`.

## 6. PR body (PR-gated mode)

Must contain, for each issue this change completes:

```
Closes #<issue-number>
```

per this repo's `docs/agents/issue-tracker.md` — "Only `Closes`/`Fixes` closes an issue; a bare
`#101` links without closing." Pull the issue number(s) from `state.json`'s `githubIssues`.

Also include, as the evidence chain a reviewer needs:

- The spec path (`state.json`'s `specPath`)
- The step-file directory (`<workspaceRoot>/4-tasks/`)

Example body shape:

```markdown
## Summary
<1-3 bullets on what changed and why>

## Evidence
- Spec: <specPath>
- Steps: <workspaceRoot>/4-tasks/

Closes #<issue-number>
```

Go to step 7.

## 3'. Verify the closing keyword (direct-push mode)

Direct push has no PR body to carry `Closes #N` — the commit message is the only place it can
live, and GitHub/GitLab both honor a closing keyword on a direct push to the default branch, not
only on a merged PR/MR.

Check the commit(s) about to be pushed (`git log @{u}..HEAD` or `git log origin/<default>..HEAD`)
for `Closes #<issue-number>` (or `Fixes #<issue-number>`), for each issue in `state.json`'s
`githubIssues`. Missing → **stop and say so**. Do not amend or rewrite the commit message
yourself — that rewrites history the developer already made; ask them to add it and re-run.

## 4'. Push directly (direct-push mode)

Confirm the current branch **is** the repo's default branch (`git symbolic-ref
refs/remotes/origin/HEAD`, or ask if that fails). If it isn't, stop — direct-push mode ships
from the default branch, not a feature branch; if you're on a feature branch, this repo's flag
may be misconfigured for what you're trying to do, or the PR-gated flow is what you actually want
here.

```bash
git push origin <default-branch>
```

No branch is created, no PR is opened.

Go to step 7.

## 7. Refresh the local tracking files

The tracker is the source of truth for issue state; the workspace keeps a local copy of it
(`issue-graph.md`'s **State** column). The push is what makes that copy stale, so refreshing it
is part of shipping, not a follow-up someone remembers to do.

**Dispatch this step's writes to a writer agent — never edit the tracking files inline in the main
session.** Same shape as `/implement`'s `docs`/`chore` step routing: a tracker read plus
multi-file Markdown edits (`issue-graph.md`'s rows, edges, ASCII graph and Summary/Source
prose, `state.json`'s bump) generates tool-call noise this session doesn't need to hold, and the
dispatcher's own context should stay free for the report in step 8. Run the tracker read below
yourself, then spawn a `sonnet` writer (`Agent`, `subagent_type: "general-purpose"`,
`model: "sonnet"`) with the read's output, the workspace path, and step 7.1–7.3's rules below
— it shapes the graph from that data, and starts with no context, so the brief is
self-contained. Unlike `/implement`'s fire-and-continue default, **wait for its report before
step 8** — step 8's own text ("name which local files step 7 rewrote") depends on what the
writer actually wrote, so there is nothing left to do in this run until it returns. Shared
contract for every pipeline skill's file writes: `to-ticket/references/file-writes.md`.

**Read the state, never assert it.** For every issue in `state.json`'s `githubIssues`:

```bash
gh issue list --repo <owner/repo> --state all \
  --json number,title,state,closedAt \
  --jq '.[] | select(.number | IN(<n1>,<n2>,...))'
```

One read, right after the push. That is not polling — do not loop, wait, or re-read until a
number changes. Whatever the tracker reports at that moment is what gets written.

### 7.1 `issue-graph.md`

Path: `<workspaceRoot>/issue-graph.md`. **If it does not exist, skip 7.1** — `/to-issues` owns
creating it, and a ticket with no epic legitimately has no graph. Do not scaffold one here.

Update, in this order:

1. **The `State` cell of every row**, from the read above — `✅ CLOSED <MM-DD>` for a closed
   issue, `🟡 OPEN` for an open one. Every row, not only the shipped one: a closing keyword can
   close a sibling, and a read you already paid for is the cheapest correction there is.
2. **The shipped node's annotation.** Append the evidence this skill owns and the tracker does
   not — the PR URL in PR-gated mode, the short commit sha in direct-push mode. Shape:
   `✅ CLOSED 09-20 (94e8050)` or `🟣 IN REVIEW ([PR #42](<url>))`.
3. **Edges the closure cleared.** For each row that listed the shipped issue under
   `Depends on`, mark it cleared rather than deleting it — `#112 (cleared)` — and do the same
   in the ASCII graph (`✅ closed` under the node). The edge is history; a reader who sees it
   vanish cannot tell whether it was satisfied or was never real.
4. **The `Summary` bullets that named it** — most often **Current frontier**, which gains every
   issue whose last blocker just closed. Leave a bullet alone if the closure did not change it;
   this is a state refresh, not a rewrite of the reasoning.
5. **The `Source` line** — the provenance sentence records which date the states were pulled and
   what moved. Extend it, don't replace it.

An issue that is still `OPEN` after the push is written as `OPEN`. In PR-gated mode that is the
expected result (the PR has to merge first). In direct-push mode it usually means the tracker
has not processed the closing keyword yet — say so in the report and leave the row honest; the
next `/ship` or `/to-issues` run corrects it from the same live read.

### 7.2 `state.json`

Bump `updatedAt` to the current ISO 8601 timestamp. Write nothing else — per
`to-ticket/references/state-schema.md`'s validation routine, preserve every key this stage does
not own, and do not add a field for what shipped: `issue-graph.md` and the tracker already carry
that, and the schema's rule is that a field with no stated consumer does not go in.

### 7.3 These writes are not a gate

Step 7 runs **after** the push. A failure here — `gh` erroring, the graph file being in a shape
these edits do not match — is reported as an unfinished doc update, not as a failed ship. Never
revert, force-push, or re-push to "undo" a bookkeeping failure: the code is already on the
remote, and the correct recovery is to fix the file.

## 8. Report and stop

**PR-gated mode:** print the PR URL. State plainly that acceptance checks are **implemented, not
verified** — they stay that way until the PR's CI run passes. Do not poll CI status. Do not
merge. Do not enable or suggest auto-merge. Do not close anything — the issue closes on its own
once `close-linked-issue-on-ci-green.yml` (or this repo's equivalent) sees the merge with
`Closes #N` resolved.

Whether a failing CI run actually **blocks** merge is unverified in general — branch protection
may or may not be configured. Don't assert that red CI blocks anything; say only that the PR
carries the check, and CI's result is what determines whether the issue closes.

**Direct-push mode:** state plainly that the commit is now on the default branch, and CI (if
any) runs on it after the fact rather than gating it. For the issue, report what step 7's single
read actually returned — closed, or still open because the tracker has not processed the closing
keyword yet. Do not re-read to get a better answer, and do not assert a closure the read did not
show.

**Both modes:** name which local files step 7 rewrote (or which it skipped, and why), so the
developer knows the workspace copy matches the tracker as of this run.
