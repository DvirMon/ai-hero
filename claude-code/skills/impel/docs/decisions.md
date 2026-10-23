# Decisions

## One commit per step, on the issue's own branch

Decided 2026-09-25, as part of the PR-branch workflow (plan:
`~/.claude/plans/okay-um-i-need-typed-sutton.md`, D2–D4). Supersedes the two closing-reference
entries below and the "commit once at the end, only if the user confirms" line in the
dispatcher entry.

- **D2 — auto-commit per step.** Each step commits when verified `✅ done` (or
  `🧪 awaiting CI`): its `files` + `progress.md`, emoji-conventional, `Refs: #N`. No approval
  prompt per step; the human gate moved to `/ship`, which shows the full commit story before
  pushing. Review and typecheck fixes are new commits, never amends.
- **D3 — every branch starts from `origin/main`.** §1a refuses the default branch, a branch
  other than `progress.md`'s `**Branch:**`, or a session outside the issue's worktree. No
  stacked branches: a blocked issue waits for its blocker's PR to merge.
- **D4 — no merge commits.** Commits never carry a closing keyword; the PR body owns
  `Closes #N`, and GitHub rebase-merges. Direct-push mode no longer exists, so the Ship-mode
  and closing-trailer logic is gone from §5.

**Why:** the user moved the whole pipeline to one issue = one branch = one PR, with commits that
tell the PR's story step by step. One commit at the end on whatever branch was checked out
(usually `main`) produced neither: no branch until `/ship`, and no story.

**How to apply:** a step isn't done until its commit exists. Stage only the step's own files —
parallel steps finish at different times. Plans live in `tasks/issue-<N>/`; a v3 workspace's
older step folder is read in place, and a per-workspace legacy folder is read-only.

## The closing reference comes from the repo's issue-tracker.md

*Superseded 2026-09-25 by the entry above — kept as history.*

Decided 2026-09-25. Step 5 no longer hard-codes `Closes #N`. It reads the repo's
`docs/agents/issue-tracker.md` `## Closing trailer` line
(``**Closing trailer: `<X> #N`.** **Partial trailer: `<Y> #N`.**``) and writes `<X> #N` for every
issue this run fully implemented, `<Y> #N` for issues it only touched or partially satisfied.
Section missing → `Closes #N`, no partial trailer, so other repos behave as before. `/ship` reads
the same line for its checks.

**Why:** in a direct-push repo, GitHub acts on a closing keyword (`Closes #N`) at push time,
before CI runs — so the workflow meant to close issues on CI green
(`close-linked-issue-on-ci-green.yml`) was bypassed. `ng-table` #145/#143/#100/#122 were all
closed by the pusher with the commit linked, not by `github-actions`. A trailer GitHub ignores
(`Ships: #N` / `Refs: #N`) leaves the close to the workflow, after CI passes.

**How to apply:** the trailer is a per-repo contract, never a skill default. When a repo defines
one, the commit message must carry no GitHub closing keyword anywhere, not even in prose.
Trailers are written into the commit in both Ship modes when a repo defines one — its hook
enforces them per commit, so the PR body can't be the only carrier.

## The commit writes the closing reference itself, in direct-push mode

*Superseded 2026-09-25 — direct-push mode was removed.*

Decided 2026-09-24. Closing-reference source amended 2026-09-25 (entry above). In direct-push repos there is no PR body for `/ship` to write `Closes #N`
into — the commit message is the only place the keyword can live, and `/ship` refuses to amend a
commit to add it after the fact (rewriting a commit `/impel` already authored isn't `/ship`'s
call to make). So step 5 ("Close out") checks the repo's Ship mode flag
(`docs/agents/issue-tracker.md`) before writing the commit message, and includes the closing
reference (default `Closes #N`) for every issue this run fully implemented when that flag is
direct-push.

**Why:** found via a real gap — `ng-table` (direct-push mode) had a 30-commit backlog where only
one commit carried `Closes #N` (written by an earlier, unrelated session), and every other
shipped issue had to be closed by hand after the fact. Neither `/impel`'s prior instructions
nor `/ship`'s ever added the keyword; `/ship` explicitly refuses to amend history, so the gap had
nowhere else to close from.

**How to apply:** the check is per-run, not per-workspace — only issues this specific run fully
implemented get the closing reference, never every issue a shared epic `state.json` happens to
list. PR-gated mode is unaffected; `/ship` still owns writing the closing reference into the PR
body there.

## /impel is a dispatcher, not an executor

Decided 2026-07-28. In the `/to-ticket` → … → `/impel` pipeline, **skills are knowledge
SSOTs and agents are executors**. `/impel` writes no feature code by default — it routes.

Routing keys: `state.json.stack` (`react|angular|node|none`, set by `/to-ticket`) × step file
`Task type` (`code|story|test|docs|chore`, required by `/to-tasks`).

| type + stack       | agent               | skill the agent loads          |
|---------------------|----------------------|----------------------------------|
| code + react        | `react-implementer`  | `react-developer`                |
| code + angular      | `angular-implementer`| `angular-developer`              |
| story               | `story-implementer`  | `story-create`                   |
| test                | `test-implementer`   | `unit-test` (see its own decisions.md for the testing-skill-architecture split) |
| test, DS pipeline   | `ds-test-scaffolder` | reads references directly        |

**Why:** agents can invoke skills, skills cannot spawn agents. Only agents can run in parallel or
be dispatched dynamically, so execution has to live there. Enforcement lives in `/to-tasks` — one
`Task type` per step, so a component+stories step must split in two, otherwise story conventions
never load.

**How to apply:** agents are named `*-implementer`, deliberately NOT the same name as their skill
(`react-developer` skill vs `react-implementer` agent) — identical names make dispatching a skill
vs. dispatching an agent ambiguous at call time. Keep that separation when adding stacks.
Implementer agents never commit, never run builds/servers/full test suites. The dispatcher
commits, once per verified step (see the 2026-09-25 entry above); builds and suites stay with the
user and CI (see `never-run-build-serve-test-unprompted` rule).

Note: this is a Claude-Code-native design (relies on agent dispatch). The Cursor port of this
skill rewrites the routing table as sequential "load this skill yourself, in order" steps, since
Cursor has no subagent dispatch mechanism — see the Cursor `implement/SKILL.md` for that version.
