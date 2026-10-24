---
name: review
description: "Review a finished feature branch through the repo's configured reviewer (stages.review.reviewer, default code-review:review), commit the reviewer's fixes as review commits, record the outcome in review.md next to progress.md, and name the next stage. Use after /implementation reports done, before /ship."
disable-model-invocation: true
---

# Review

The stage between `/implementation` and `/ship`. It owns the pipeline side of a review — which reviewer
runs, what gets committed, what is recorded, what comes next. The reviewer owns the review
itself, per `${CLAUDE_PLUGIN_ROOT}/contracts/review-stage.md`, and knows nothing about the
pipeline.

## 1. Resolve

1. Read the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading
   it. `stages.review.skill: "none"` never reaches here — the stage is skipped. Load
   `stages.review.skills` per `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`.
2. **Reviewer** = `stages.review.reviewer`, default `code-review:review`. Not installed →
   stop, name the key and the skill (a construction error, per the contract).
3. **Branch** — run `${CLAUDE_PLUGIN_ROOT}/contracts/branch-guard.md`.
4. **Tasks root** — as `/implementation` resolves it (`<workspaceRoot>/tasks/issue-<N>/`, or
   `.pipeline/issue-<N>/` with no workspace). A planning or no-issue branch has none: use
   `.pipeline/<branch, / → ->/`.
5. **Clean tree.** `git status --porcelain` empty — the reviewer's edits must be the only
   changes the stage commits. Leftovers → stop; they belong to `/implementation`.

## 2. Run the reviewer

```bash
git fetch origin
base=$(git merge-base origin/<default> HEAD)
```

Invoke the reviewer skill with `$base` as its only argument (planning branch: `files:` with the
paths the branch changed). Record `HEAD` now as `reviewedHead`.

## 3. Commit the fixes

Anything the reviewer changed is a review fix. Commit it as one or more atomic commits, never
folded into a step's commit, never `--amend`:

commit each per `${CLAUDE_PLUGIN_ROOT}/contracts/commit.md` with type `fix`, `ref` or `docs`,
issue = its ref per `commit.md` (none on a branch with no issue) and stage `review`. Stage by path, never
`git add -A`.

A decision made while fixing goes to the decisions file, phase `review`
(`${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md`), through the same writer `/implementation` uses.

## 4. Record

Write `<tasks root>/review.md` (replace any earlier one — only the latest review counts):

```markdown
# Review — <branch>

- Reviewer: <skill>
- Base: <base sha>
- Reviewed head: <reviewedHead sha>
- Fix commits: <sha subject, one per line | none>
- Verdict: blocking: N | no blocking findings | failed — <reason>

## Still blocking

<the contract's per-finding lines, verbatim | none>
```

It sits beside `progress.md`. When the tasks root is in the repo, commit it alone per
`commit.md`: type `docs`, subject `record review`, stage `review`; under the gitignored
`.pipeline/` it is local only.
`state.json` does not record reviews: the record belongs to one unit's branch, like
`progress.md`, and must exist without a workspace too.

Report the reviewer's full output to the user, then the record's path.

## 5. Next

Name the next stage. The stage does not start it.

| Outcome | Next |
|---|---|
| `no blocking findings` | `/ship` |
| blocking, all `fix-side: code` or impact findings | fix them (`/implementation` or by hand, as new commits), then `/review` again |
| blocking `fix-side: docs` on a decision record, or a finding that changes a decided design | `/grill-with-docs` to revisit the decision |
| `failed` | fix the cause, `/review` again — or `/ship`, where the gate shows the failure |

End with the pointer as the very last line:

```
Next: <stage> <issue-#-or-slug>
```

## Re-running

Idempotent per branch: each run reviews from the merge-base to the current `HEAD` and replaces
`review.md`. **Stale** = a commit in `<Reviewed head>..HEAD` that is neither listed under
`Fix commits` nor changes only `review.md` — work landed after the review. Judged by SHA and
paths, never by subject: the subject's shape depends on the repo's commit format. `/ship`
shows a stale review at its gate.
