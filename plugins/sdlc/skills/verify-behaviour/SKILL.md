---
name: verify-behaviour
description: "Test a reviewed branch's UI behaviour the way a front-end developer would by hand — every interaction state, then the full user flows — in a real browser (ego-browser, or Chrome), with evidence per check. Plans the minimal case set through sdlc:test-planner, fixes small failures as verify commits, records the result in verify.md beside review.md and publishes it as an Artifact. Use after /review, before /ship."
disable-model-invocation: true
---

# Verify behaviour

The stage between `/review` and `/ship`. It hands manual UI testing to the AI: open the dialog,
tick the checkbox and see the button go disabled, walk the full user flow — in the real app, in
a real browser, with one observed value per check. It is throwaway evidence for this change,
not a suite kept in CI.

- No Playwright, no saved test scripts, nothing kept in CI.
- Never starts, stops or restarts the dev server; never resets the database.
- The stage runs the browser itself — no runner subagent. Small fixes need the run's context.

## 1. Resolve

1. Read the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading
   it. `stages.verify-behaviour.skill: "none"` never reaches here — the stage is skipped. Load
   `stages.verify-behaviour.skills` per `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`.
2. **Settings** — `stages.verify-behaviour.browser` (default `ego-browser`), `.logins`, `.db`
   (absent = DB checks off); `devUrl` from the ticket's project. No project with `devUrl` →
   stop, point to `/sdlc:setup`.
3. **Repo facts** — `docs/agents/verify-behaviour.md`. Missing → stop, point to `/sdlc:setup`
   (a construction error: it fires on first run, every run).
4. **Branch** — run `${CLAUDE_PLUGIN_ROOT}/contracts/branch-guard.md`, including § Override.
5. **Tasks root** — as `/review` § 1.4 resolves it (`<workspaceRoot>/tasks/issue-<N>/`,
   `.pipeline/issue-<N>/` with no workspace, `.pipeline/<branch, / → ->/` with no issue).
6. **Clean tree.** `git status --porcelain` empty — the stage's fixes must be the only changes
   it commits. Leftovers → stop; they belong to `/implement`.

## 2. Plan

Dispatch `sdlc:test-planner` with:

- `workspaceRoot` — the ticket workspace, or `null`
- `issueBody` — the issue text, per the tracker files
- `changedFiles` — `git diff --name-only $(git merge-base origin/<default> HEAD)..HEAD`
- `repoFactsPath` — `docs/agents/verify-behaviour.md`
- `existingPlan`, `changedSince` — on a re-run only (§ Re-running); `null` otherwise

The stage writes the returned body to `<tasks root>/verify-plan.md`, in the format of
[`verify-plan-template.md`](references/verify-plan-template.md).

## 3. Approve

**First run** — show an approval table, one row per case:

| Case | From (quoted spec line) | Why | Stands for |
|---|---|---|---|

then the plan's `Not covered` list. The developer edits or drops cases; rewrite
`verify-plan.md` to match. Wait for approval before § 4.

**Re-run** — show only the new cases, same table. No new cases → no approval step.

## 4. Preflight

1. **Dev server.** `curl -s -o /dev/null -w '%{http_code}' <devUrl>` — `000` (nothing
   listening) → stop. Never start the server. Print `verify-plan.md` as a manual checklist,
   write `verify.md` with `Verdict: stopped — dev server not running`, then § 9.
2. **Preconditions.** List every check whose precondition is missing: a role with no
   `logins` entry, a credential the pointer cannot reach, a case marked `Blocked: <service>`,
   a `db:` line with `db` unset. Ask the developer once, for all of them. Whatever is not
   provided now is `blocked — test by hand`. The run never pauses mid-way to ask again.

## 5. Run

Drive the browser per [`browser.md`](references/browser.md). For each case, in plan order:
create its fixtures per the repo facts' test-data rules, sign in as its role, perform each step
as a user would, and resolve every check line under it:

- `ui:` — the ARIA state of the named control, as `role "name" [state]`, plus a screenshot.
- `net:` — the matching request: method, path, status and the named body field; `net: none`
  → no matching request was sent during the step.
- `db:` — only with `stages.verify-behaviour.db` set: run its `query` template with the line's
  `SELECT`. Read queries only; never a write.
- `console:` — the console messages during the step.

Evidence rule: one observed value per check line; a line with no observed value counts as
failed, never as passed.

A check that matches → `passed`. A check that does not → § 6.

## 6. Fix small / report big

**Small** = caused by code this branch changed; the fix stays in files the branch already
touches; no schema, API contract or spec change; a few lines; one commit; the check passes on
re-run.

A small failure: fix it and re-run that check. Passes → commit the fix per
`${CLAUDE_PLUGIN_ROOT}/contracts/commit.md` — type `fix`, issue = its ref per `commit.md`, stage
`verify`, staged by path, never `git add -A` — and record `fixed`. Still fails → it was not
small: `git restore` the files you edited (only yours) and treat it as big.

**Big** = everything else → `failed` with its evidence and a suggested fix, in `verify.md`
only. Never write `/to-tasks` files (step files, `progress.md`); the developer runs
`/implement` or fixes it by hand.

A check that contradicts the spec or its traced code path → `failed` with a spec question.
Never "fixed": changing code to match a wrong check is the failure this stage must not cause.

## 7. Clean up

Remove the test data each case created, per the repo facts' `## Cleanup` rules. What could not
be removed goes under `## Data left behind` in `verify.md`, with where it is. The dev database
is never left changed without the record saying so.

## 8. Record

Write `<tasks root>/verify.md` beside `review.md`, replacing any earlier one, in the format of
[`verify-record-template.md`](references/verify-record-template.md). Screenshots go under
`.pipeline/verify/<branch, / → ->/` and are never committed; `verify.md` points to them by
path. Text evidence goes inline.

When the tasks root is in the repo, commit `verify.md` alone per `commit.md`: type `docs`,
subject `record behaviour verify`, stage `verify`. Under the gitignored `.pipeline/` it is local
only.

Publish the record as an Artifact for the developer (`icon: "check"`): verdict, every check
with its status and evidence, the fix commits, blocked checks and data left behind. Re-runs
publish from the same file path so the URL stays. Put the URL in `verify.md`'s `Artifact:`
field before committing it.

## 9. Next

Name the next stage. The stage does not start it.

| Outcome | Next |
|---|---|
| every check `passed`, `fixed` or `blocked` | `/ship` |
| any `failed` | `/implement` (or fix by hand), then `/verify-behaviour` again |
| `stopped — <reason>` | fix the cause, `/verify-behaviour` again |

End with the pointer as the very last line:

```
Next: <stage> <issue-#-or-slug>
```

## Re-running

A re-run tests the current `HEAD` and reuses the approved `verify-plan.md`.

1. `changedSince` = `git diff --name-only <Verified head>..HEAD`. Dispatch the planner with
   `existingPlan` and `changedSince`; it keeps every approved case and adds cases only for
   code in `changedSince`. Approve the new ones (§ 3).
2. Run again every check whose case `Code` path is in `changedSince`, plus the new cases. Every
   other check keeps its result, evidence and `@<sha>`.
3. Write a fresh `verify.md` with `Verified head` = the new `HEAD`.

**Stale** = a commit in `<Verified head>..HEAD` that is neither listed under `Fix commits` nor
changes only `verify.md` — work landed after the verify. Judged by SHA and paths,
never by subject: the subject's shape depends on the repo's commit format. `/ship` shows a
stale record at its gate.
