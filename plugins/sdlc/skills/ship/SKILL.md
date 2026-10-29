---
name: ship
description: "Take a finished feature branch to an open, auto-merging PR — show the commit story for approval, rebase onto origin/main, push (force-with-lease after a rebase), open or reuse the PR/MR (gh or glab, from git remote) with an emoji-conventional title and the closing line from the repo's issue-tracker.md, record it in state.json units[].pr, then enable auto-merge (rebase). Handles issue branches (<type>/<N>-<slug>) and epic planning branches (docs/<epic-slug>). Never pushes to main, never merges manually. Use after /review, or after /to-issues on a planning branch."
disable-model-invocation: true
---

# Ship

One issue = one branch = one PR. `/implement` leaves a feature branch with one commit per step;
`/review` adds its fix commits and `review.md`.
This skill turns that branch into a PR that GitHub merges on its own once required checks pass.

There is one mode. No push to the default branch, ever — the Claude hook, the repo's git hooks
and the `main` ruleset all block it; this skill never tries.

This skill never merges and never closes an issue. The closing line in the PR body (per the
repo's `docs/agents/issue-tracker.md` `## Issue references` — `Closes #N` on GitHub/GitLab; on
Jira no keyword, the ticket closes by transition) plus a rebase-merge is the mechanism;
auto-merge on green CI is the trigger. A skill that merges or closes
before that has happened is asserting a result it has no evidence for.

## 1. Preconditions

Read the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading it, then load
`stages.ship.skills` per `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`.

Check in order, before touching git. Any failure stops here — say which one and why.

1. **On a feature branch.** Run `${CLAUDE_PLUGIN_ROOT}/contracts/branch-guard.md`. A planning
   branch ships per step 5b; a no-issue branch skips checks 3–4 and ships per step 5d.
2. **Clean tree.** `git status --porcelain` is empty. Leftover changes → stop and suggest
   committing them first (`capabilities.commit.skill` when set).
3. **`state.json` resolves** in the workspace (`<domain-path>/docs/work/<slug>/state.json`, per
   `/to-ticket`'s workspace-root rule). Read `specPath`, `ticketRef`, `units[]`, `workspaceRoot`. **This unit** is the `units[]` entry whose `branch` equals the
   current branch, else whose `remoteRef` is `#N`.
   **No workspace** — issue `#N`'s Pipeline block says `workspace: null`: skip this check; there
   is no spec and no `units[]`, only issue `#N`.
4. **Issue branch only — work is finished.** Find `progress.md` in the tasks root
   (`/to-tasks` § 5).
   - **Found:** every row is `✅ done`,
     `🧪 awaiting CI` (CI on this PR proves it) or `⏭ skipped`; any `▶ in progress` or
     `⬚ pending` → stop. Do not ship unfinished steps.
   - **None** (the issue body was the step): the branch's `N` already matched in check 1. Read
     the issue's "Acceptance criteria" boxes (read through `docs/agents/issue-tracker.md` `## Fetch`). All ticked →
     ship with `Closes #N`. Some unticked → ship only if `/implement` reported the issue as
     partially satisfied, with `Refs #N` (§5a). None ticked → stop: `/implement` hasn't closed
     out.
5. **Something to ship.** `git log --oneline origin/main..HEAD` is non-empty.
6. **Code host.** `git remote get-url origin`: a GitHub host → `gh`; a GitLab host → `glab`
   (merge requests; same steps, with the commands below swapped per this table).
   Anything else → stop and name it.

   | `gh` | `glab` ([docs](https://docs.gitlab.com/cli/mr/)) |
   |---|---|
   | `gh pr list --head <b> --state open --json number,url` | `glab mr list --source-branch <b> --output json` (open is the default; fields are `iid`, `web_url`) |
   | `gh pr create --base main --head <b> --title T --body-file F` | `glab mr create --target-branch main --source-branch <b> --title T --description-file F --yes` |
   | `gh pr merge <n> --auto --rebase` | `glab mr merge <n> --auto-merge --rebase --yes` |

   `glab mr create --head` names a fork repo, not a branch — use `--source-branch`.

## 2. Gate — the developer approves the story

This is the pipeline's human gate (`/implement` commits per step without asking). Show:

- `git log --reverse --format='%h %s' origin/main..HEAD` — the commit story, oldest first.
- The review record, `review.md` in the tasks root (`/review` § 4): its reviewer, verdict and
  every line under **Still blocking**. Say plainly when it is missing (no review ran — expected
  only with `stages.review.skill: "none"`), `failed`, or **stale** — a commit in
  `<Reviewed head>..HEAD` that isn't a listed fix commit or the `review.md` commit
  (`/review` § Re-running). None of these
  stops the gate; the developer decides with them in view.

Wait for explicit approval. The developer may ask for fixes first — those become new commits
(never `--amend`, never interactive rebase); then re-run from step 1.

## 3. Rebase onto `origin/main`

```bash
git fetch origin
git rebase origin/main
```

No merge commits, ever — never `git merge origin/main` into the branch. On conflict:
`git rebase --abort`, stop, and name the conflicting files. Resolving them is the developer's
call.

Record whether the rebase rewrote anything (`HEAD` changed) — step 4 needs it.

## 4. Push

```bash
git push -u origin <branch>                    # first push
git push --force-with-lease origin <branch>    # branch already on remote and step 3 rewrote it
```

Never plain `--force`, never `--no-verify`. A rejected push (hook, branch-name validator,
lease failure) is a signal — fix the cause, don't route around it. A lease failure means someone
(or `rebase-behind-prs.yml`) pushed to the branch; fetch, re-run from step 3.

## 5. Open the PR — deduplicated

```bash
gh pr list --head <branch> --state open --json number,url
```

- **Open PR exists:** step 4 already updated it. Skip to 5c with its number — do not run
  `gh pr create`.
- **None:** draft, review, create (5a / 5b / 5d), then 5c.

**Title** — per `${CLAUDE_PLUGIN_ROOT}/contracts/commit.md` § PR title: the subject the
repo's commit renderer produces for the branch's summary, without a stage, ending in ` (#N)`
(no-issue branch: no ref). Don't restate the format here. The repo's `pr-conventions.yml`
checks it when the repo has a commitlint config.

**Body drafting** goes to a writer: `Agent`, `subagent_type: "general-purpose"`,
`model: "sonnet"`. It starts with no context, so hand it everything: the commit log
(`git log --reverse --format='%h %s%n%b' origin/main..HEAD`), the spec path, the step titles
from `progress.md` (issue branch), and the body template below. It returns text only; it does
not run `gh`. Review its output against the template and the log before creating — the
closing line in particular must be exactly as specified below.

```bash
gh pr create --base main --head <branch> --title "<title>" --body-file <tmpfile>
```

### 5a. Issue branch body

```markdown
## Summary
<1-3 bullets: what changed and why>

## Commits
<one line per commit, oldest first: `<sha>` <subject> — reads as the story of the change>

## Evidence
- Spec: <specPath>                               (no workspace: omit)
- Design: <designPath>                           (omit when null)
- <evidence lines wired skills add>
- Steps: <workspaceRoot>/tasks/issue-<N>/        (no workspace: "issue body")

Closes #<N>
```

The closing line follows the repo's `issue-tracker.md` `## Issue references`. Jira: the ticket
key and its URL, no keyword — closing is a Jira transition, not this skill's job. GitHub/GitLab:
exactly one `Closes #<N>` — this issue only. Exception: if `/implement` reported acceptance
criteria left unchecked on the issue (partially satisfied), write `Refs #<N>` instead and say so
in the Summary — the issue stays open. `Closes` is what closes the issue on merge; a bare
`#N` only links. Commits carry `Refs: #N`, never a closing keyword.

### 5b. Planning branch body

Same shape, but it closes nothing: the planning PR lands the decisions, spec and issue graph
that the slice issues build on. Replace the closing line with a reference to `state.json`'s
`ticketRef` (the intake item the slices sit under), in the `## Issue references` form without a
closing keyword, and list the created slice issues under **Evidence**.

### 5c. Record the PR

Write the PR/MR number to this unit's `units[].pr` in `state.json`. Already set to the same number → no-op. No workspace, a no-issue branch, or a planning
branch with no matching unit → skip.

### 5d. No-issue branch body

Same shape as 5a without the closing line and without a spec or steps: **Evidence** names what
produced the change (e.g. `/sdlc:setup`) and says the PR closes nothing.

## 6. Enable auto-merge

```bash
gh pr merge <number> --auto --rebase
```

Rebase is the only allowed method (repo settings disable merge commits and squash). GitHub merges
when the required checks (`ci-gate`, `pr-conventions`) and any required review pass, deletes the
branch, and the closing line closes the issue (GitHub/GitLab).

If `gh` reports auto-merge isn't allowed on this repo, stop and say so — the repo hasn't had the
`setup` branch-workflow bootstrap (rulesets + `allow_auto_merge`). Do not merge by hand
as a workaround.

## 7. Report and stop

- The PR URL, and "auto-merge on (rebase)".
- Acceptance checks are **implemented, not verified** — CI on the PR decides. Do not poll CI,
  do not merge, do not close anything.
- **Next frontier.** From `<workspaceRoot>/issue-graph.md`'s edges and one read of open issues
  (through `docs/agents/issue-tracker.md` `## Fetch`), name the issues this PR will unblock once
  it merges, and any already unblocked now. Blocked issues start only after the PR/MR merges — the
  next `/to-tasks` prunes this branch's worktree and fast-forwards `main` at that point.
- Local cleanup is not this skill's job (see `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md`).

## Re-running

`/ship` is idempotent on a branch. Re-run it when:

- the developer added fix commits after review;
- the PR fell behind `main` and `rebase-behind-prs.yml` couldn't rebase it (conflict comment on
  the PR).

Steps 3–4 rebase and `--force-with-lease`; step 5 finds the existing PR; step 6 is a no-op if
auto-merge is already on. No second PR, no re-created branch.
