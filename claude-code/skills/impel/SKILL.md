---
name: impel
description: "Execute a ticket's task plan by dispatching each step to the agent that owns that kind of work — code, story, or test."
disable-model-invocation: true
---

# Impel

You are a **dispatcher**, not an implementer. You read the task plan, route each step to the
agent that owns that kind of work, commit each step as it lands, then verify and close out. Writing feature code
yourself is the exception (see "Steps you handle directly"), not the default — routing is what
makes each step arrive with the right conventions loaded.

## 1. Gather context

1. Find `state.json` at the workspace root — `<domain-path>/docs/work/<slug>/` (or the
   workspace root the user points you at directly). Validate it per
   `to-ticket/references/state-schema.md`, then read `workspaceRoot` and `stack`.
   **No workspace** — the issue's Pipeline block says `workspace: null`: there is no
   `state.json` to find; don't ask to create one. Infer `stack` from the files the issue names
   (ask only if they span stacks). Paths below use the **tasks root** as `/to-tasks` §5 defines
   it; for these issues it is `$(git rev-parse --git-dir)/pipeline/issue-<N>/`.
2. Read all `<tasks root>/step-*.plan.md` (normally `<workspaceRoot>/tasks/issue-<N>/`) in order — these are the plan
   from `/to-tasks`. **v3 workspaces** keep their older step folder; read it in place per
   `to-ticket/references/state-schema.md` § Reading version 3. **Legacy plans** sit directly in
   the workspace's step folder (one folder per workspace); read them there, but treat that folder
   as read-only history — any rewrite goes to `tasks/issue-<N>/`. Each step file is self-contained. Routing fields live in YAML
   frontmatter: `step`, `type`, `commit`, `depends_on`, `files`. The body holds a summary, `## Do`,
   `## Watch out`, `## Out of scope` and `## Done when` (the step's own checks).
   **Legacy step files** (no frontmatter — plans written before the format change) carry
   bold header lines instead: `**Task type:**`, `**Depends on:**`, a `## Files` list, and
   `## Acceptance Checks` in place of `## Done when`. Read those when frontmatter is absent.
   Note which `code` steps have a sibling `step-N-<slug>.test-plan.md` — those run
   test-first (§2).
3. Read the plan's `progress.md`. Skip steps already `✅ done`. Its header carries
   `**Branch:**` and `**Worktree:**` (checked in §1a). Its top holds
   the plan's dependency graph (a Mermaid `graph LR` block, edges `S<A> --> S<B>`, plus a
   one-line `Parallel-safe / Dependency` summary) — the schedule you run, see §3
   Parallelism. Older plans draw the graph in ASCII; read it the same way. Legacy
   `progress.md` files have no graph.
4. If no step folder exists, **do not fall through to implementing anyway.** Read the
   issue's readiness rung and obey the ladder — see step 1b.
5. Read `designPath` when set (before the first UI step). Only read `specPath`/`architecturePath`
   if a step is ambiguous — step files are the pre-digested version, not the spec itself.

If the user pointed at several tickets, do this per ticket and keep each ticket's steps as
its own ordered run. Several tickets means several branches and worktrees — one run each, never
two issues' commits on one branch.

## 1a. The branch guard

Every commit this skill makes lands on the issue's own branch, in the issue's own worktree.
Check before any dispatch. **Stop** if any of these holds:

- The current branch is the default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`
  → `origin/<default>`), or HEAD is detached.
- `progress.md` has a `**Branch:**` line and the current branch differs from it.
- There is no `progress.md` (the issue body is the step, §1b) and the branch isn't
  `<type>/<N>-<slug>` for this issue's `N`.
- `progress.md` has a `**Worktree:**` line and the session isn't inside that path. If the
  worktree exists, enter it (`EnterWorktree` with `path`) and re-check rather than stopping.

Say which check fired, and stop — never "just this once" on `main`.

**No branch yet** — a `ready-for-agent` issue with no `tasks/` plan (§1b), or a legacy
`progress.md` with no `**Branch:**` line: run `to-tasks/references/start-branch.md` with
`<type>/<issue#>-<slice-slug>` first, then continue inside the new worktree. For a legacy plan,
write `**Branch:**`/`**Worktree:**` into the new `progress.md` copy under `tasks/issue-<N>/`.

## 1b. The readiness gate

An issue with no task plan is not automatically an issue you may implement. It is either an issue
the pipeline decided needs no plan, or an issue nobody has looked at yet — opposite situations.
The readiness rung separates them. Read it where the repo's `docs/agents/issue-tracker.md`
`## Readiness` says it lives — the issue's `## Pipeline` block, or `state.json`
`units[].readiness` + `assessed` for a tracker whose description is never edited. The rungs, both
forms and the assessment triggers are defined in `to-issues/references/pipeline-block.md` — the
SSOT. Read the rung, never the labels; labels are a projection.

**An epic with children is never implemented directly.** Check the tracker's sub-issue relation
first; if it has children, refuse and point at the frontier child.

Then act on `readiness`:

| `readiness` | Do |
|---|---|
| `ready-for-agent` | Implement. The issue body is the step; its acceptance criteria are the checks. |
| `needs:tasks` | **Refuse.** `Next: /to-tasks <#>` |
| `needs:issues` | **Refuse.** `Next: /to-issues <#>` |
| `needs:spec` | **Refuse.** `Next: /to-spec <#>` |
| `needs:grill` | **Refuse.** `Next: /grill-with-docs <#>` |
| `needs:triage` | Assess, write the verdict back, **ask**. Never proceed on your own verdict. |

**Refuse means refuse.** Say which rung fired and what tripped it, hand over the pointer line, and
stop — no partial implementation, no "I'll make a start on the easy part", no offer to run the
missing stage inline. The stages exist to arrive in a fresh context; running one here and
implementing off it in the same window is the thing being prevented.

On a **sub** (the block has an `epic:` key), `needs:spec` and `needs:issues` are unreachable —
a sub's contract is the epic's. `needs:grill` **is** reachable and normal: an epic's grill often
leaves one question scoped to one slice. Refuse and point at the child, not the epic. If several
siblings read `needs:grill` at once, say so — that is the epic's grill having failed, and the
regrill belongs there.

On `needs:triage`: apply the triggers in `to-issues/references/pipeline-block.md`, record the rung and its dated reason through
`issue-tracker.md` `## Readiness` (it re-syncs the rung label), then stop and ask. **You may not promote an
issue to `ready-for-agent` yourself** — you are the party that benefits from the answer, so it is
not yours to give. Ambiguity resolves upward.

**No rung recorded at all** (an issue predating the convention): treat it as `needs:triage`
and record one while you assess.

If the user explicitly says to implement a refused issue anyway, that is their call — proceed, and
note in your final report which stage was bypassed.

## 2. Route each step

Every step file declares a type — frontmatter `type`, or `**Task type:**` on a legacy file.
Combine it with the ticket's `stack` from `state.json`. Step files no longer name their skills
or agent; this table derives both:

| `Task type` | `stack` | Dispatch to |
|---|---|---|
| `code` | `react` | `react-implementer` agent |
| `code` | `angular` | `angular-implementer` agent |
| `code` | `node` | handle directly, loading the `nodejs-developer` skill first |
| `story` | any | `story-implementer` agent |
| `test` | any | `test-implementer` agent |
| `docs`, `chore` | any | fork (see "Docs and chore steps dispatch too" below) |
| `verify-ui` | any | handle inline per `references/figma-ui.md` § Visual verify |

**Figma UI `code` steps** (`angular` / `react` with `figma:` frontmatter or UI files under
`designPath`): before dispatch, follow `references/figma-ui.md` § UI code steps; after
implementer return, run verify there or defer to a later `verify-ui` step in the same plan.

One exception on tests: if the step belongs to a DS component going through the `ds-plan` /
`ds-scaffold` pipeline (there's a `docs/prd.md` and a versioned plan folder), dispatch
`ds-test-scaffolder` instead — it takes `componentName`/`componentFilePath`/`prdPath`/`planDir`,
not a step file. Everywhere else, `test-implementer`.

**`code` steps with a test plan run test-first.** When `step-N-<slug>.test-plan.md` sits beside
the step file, the user approved it in `/to-tasks` §4b, and one step becomes three dispatches,
in order. Phase rules: the `unit-test` skill's `references/test-first.md`.

| Phase | Dispatch to | Extra inputs |
|---|---|---|
| 1. Red | `test-implementer` | `testPlanPath`, `phase: red`, `stack` |
| 2. Green | the code row above for this `stack` | `testPlanPath` |
| 3. Types | `test-implementer` | `testPlanPath`, `phase: types`, `stack` |

- Skip phase 3 when the plan's Types phase says `None`.
- Red must report every planned test failing. A test that passed against a stub stops the
  step — surface it to the user as a plan defect before green runs.
- Green `blocked` on a seam means a test looks wrong. Stop and surface it; never re-dispatch
  red to rewrite the test.
- A `code` step with no test plan keeps the single dispatch above, and any `test` step still
  waits for it.

**Docs and chore steps dispatch too, never handled inline.** A doc-heavy step — a capability's
decisions log, its feature-contract doc, an ADR amendment, a story `.mdx`, workspace tracking
files (`issue-graph.md`, `state.json`), an `llms.txt` regen — generates many reads and edits
across several Markdown files. That tool-call noise belongs in a subagent's transcript, not the
dispatcher's own context, which needs to stay free to track the rest of the plan. Default:
spawn a fork (`Agent`, `subagent_type: "fork"`) — it inherits this session's full context (every
prior step's diff, the decisions already made while planning), so unlike the other rows it needs
no self-contained briefing, just the step file path and a pointer to what changed since the plan
was written. Per `~/.claude/rules/fork-doc-writes-during-discussion.md`, dispatch it and continue
(don't idle waiting on tool output you don't need); block only when a later step actually depends
on this one's artifact.

Prefer a narrower specialist over the generic fork when the step is *exactly* that specialist's
job, not a mix: `adr-writer` when the step is "write one ADR" (it takes a decision/why/consequences
summary, not a step file — extract those fields from the step's summary and the decision-log
rows its `Decisions:` line links to, or from "Why This Step Exists" on a legacy file); `domain-docs-writer` (via `kipi`'s own config-resolution flow) when
the step is regenerating a whole domain's `docs/` folder from source, not editing existing docs in
place. A step mixing several artifact types (a decisions log entry plus a feature doc plus a
tracking-file update, say) stays on the fork; don't force it through a specialist scoped to one
artifact.

Workspace JSON/MD writes this skill makes *outside* a step (`progress.md` status flips,
`state.json`) are mechanical: they go to a `haiku` writer, not a fork, per
`to-ticket/references/file-writes.md`. `docs`/`chore` steps themselves stay on the fork above.

**Decisions made while executing or reviewing a step** — anything the step file, spec, design
or architecture did not settle — are appended to the ticket's `decisionsPath` per
`doc-contracts/ticket-decisions.md`, phase `implement` or `review`, through the same writer.
Never a `decisions.md` inside `tasks/`; the step's `progress.md` links to the D-number.

`code` + `node` remains the one row actually handled inline (see "Steps you handle directly"
below) — everything else, including docs/chore, is dispatched.

If a step file has no type (neither frontmatter `type` nor `**Task type:**`), infer it from the files it touches (`*.stories.tsx` →
`story`, `*.spec.ts(x)` → `test`, else `code`) and **say so in your final report** — an
inferred type means `/to-tasks` produced an incomplete step file.

If `stack` is missing from `state.json`, infer it from the project's dependencies and write it
back (refreshing `updatedAt`, per the validation routine) so later runs don't re-infer.

## 3. Execute

Work through steps in the order the plan's graph allows (see Parallelism below). For each
step:

1. Mark it `▶ in progress` in `progress.md`.
2. Dispatch per the table, passing `stepFilePath`, `workspaceRoot`, and `specPath` /
   `architecturePath` if set. For Figma UI code steps, include the brief from
   `references/figma-ui.md`. Also pass `stack` to `test-implementer` — it routes its toolchain
   on it. `react-implementer` and `angular-implementer` don't take `stack`: the routing table
   above already used it to pick the agent, and neither agent's body reads it again. One agent
   call per step — never batch several steps into one agent, or the step boundary (and its
   `Done when` checks) is lost. A test-first step is the one exception: its three phase calls
   (§2) run in sequence, all inside the one step. A `verify-ui` step runs inline — no
   implementer agent.
3. On return, verify the agent's claims against the files it says it touched. An agent
   reporting `done` is a claim, not proof.
4. Mark `✅ done` in `progress.md` — or `🧪 awaiting CI` when its `Done when` is a behavioural
   claim only the suite proves (§4) — or stop and surface the blocker. For scheduling,
   `🧪 awaiting CI` counts as done.
5. **Commit the step** (below), after the `progress.md` writer has reported — the flip must be
   on disk to go into the commit. A step isn't finished until its commit exists.

**One step = one commit.** The branch's history is the PR's story, told step by step — later
steps may edit files earlier steps touched; that is expected, not a reason to batch. No approval
prompt: this is a feature branch, nothing is final until `/ship`, and the human gate lives there.

- **Stage only this step's files**: the paths in its `files` frontmatter (legacy: `## Files`)
  plus `progress.md`, via `git add <paths>`. Never `git add -A` / `.` — a parallel step's
  half-written files must not leak into this commit. A file the step changed that isn't in
  `files` is a plan defect: include it and report it.
  **Issue body as the step** (no plan, §1b): one commit for the issue's changes, staged by path
  from what you changed; pick the type from the change (atomic-commit's table) — there is no
  `commit:` frontmatter to read; no step number, so omit the story tag. A `.git`-side tasks
  root is never staged.
- **Message**, per `atomic-commit/SKILL.md` (emoji, scope, types):

  ```
  <emoji> [#<N> s<step>] <commit>(<scope>): <step title, imperative, lower-case start>

  Refs: #<N>
  ```

  In a repo whose `~/.config/org/commit-format.json` matches it, use that
  format instead (see `atomic-commit` § Commit format).

  `<commit>` is the step's `commit` frontmatter (`ref`, not `refactor`). Missing (legacy file) → infer from `type`
  (`docs`→`docs`, `chore`→`chore`, `test`/`story`→`test`, `code`→`feat` unless the step is
  plainly a fix or restructure) and say so in the report. No closing keyword anywhere in the
  message (`Closes`, `Fixes`, `Resolves` before `#N`) — the PR body owns `Closes #N`.
  `s<step>` is the step number from the plan; the tag's issue must equal `Refs:`. Format rule:
  `docs/agents/issue-tracker.md#issue-references`.
- **Parallel steps** commit one at a time, in the order they finish. Their `files` don't overlap
  (the check below enforces it), so each commit stays clean.
- **A test-first step** (red → green → types) is still one step and one commit, made after the
  last phase.
- **The repo's `commit-msg` hook rejects the message** → fix the message and commit again. Never
  `--no-verify`, never `--amend` (the command guard denies both).
- A `docs`/`chore` step on a fork: the fork writes, you commit after verifying — forks don't commit.

**Parallelism: the plan's graph is the schedule.** The user approved the dependency graph at
the top of `progress.md`; run that graph, don't re-derive your own. Dispatch the unblocked
frontier — every pending step whose `depends_on` steps are all `✅ done` — concurrently, and
recompute the frontier as each one finishes.

**File overlap is a plan check, not a scheduler.** Before dispatching a frontier, compare the
`files` of the steps in it. Two steps the graph runs in parallel that share a file are a bug in
the plan, not a hint to serialise quietly. On overlap:

1. Stop dispatching. Let steps already running finish.
2. Fix the plan on disk: add the missing edge to the later step's `depends_on`, and update
   the graph and its summary line in `progress.md`.
3. If the new edge changes what a step must do (its `Do` or `Watch out` now assumes the
   other step landed first), re-invoke `/to-tasks`' writer — or whichever skill owns the
   file — to rewrite those step files. Re-invoking a skill here is expected, not a detour.
4. Report the change: which steps, which file, what edge was added.
5. Resume from the corrected graph.

Never run an order that isn't written back to the plan — the plan on disk stays the source of
truth for what ran.

**Legacy plans** (no graph in `progress.md`): build the frontier from `depends_on` /
`**Depends on:**` edges alone, apply the same overlap check, and write the graph you ran to
the top of `progress.md` so the fix above has something to amend. Ignore any per-step
`Parallel-safe with:` line — it is no longer read.

A `story` or `test` step always waits for the `code` step that produces its subject. Inside a
test-first step the order reverses: its tests come first (§2). That is a phase order within one
step, not a `test` step — `/to-tasks` absorbs the `test` step into it.

**The one step you handle directly** (per the table, `code` + `node`): load the `nodejs-developer`
skill first, then do the same work an agent would — read the step file, implement only its
`files` + `## Do`, satisfy its `## Done when` checks (legacy: Files + What To Do, Acceptance
Checks). When the step has a test plan, you are the green phase: dispatch red first, then
follow `unit-test`'s `references/test-first.md` § Green yourself, then dispatch types. Every
other row, including `docs`/`chore`, dispatches — see the row-by-row table above.

## 4. Verify

After all steps complete, start the machine checks **in the background** and do the reading
work while they run — they touch no shared files, so the review's wall-clock absorbs them:

1. **Dispatch in background, immediately:**
   - Typecheck across affected projects — `nx run-many -t typecheck -p <affected>`, plus
     `typecheck-spec` where a step wrote specs.

   CI runs the full test suite and `nx run-many -t lint` on every pull request. Both are the
   pipeline's gate, not this skill's — and the PR that carries that gate is opened by `/ship`.
   Running either here duplicates CI and costs minutes per implementation rather than per PR.

2. **In the foreground, while those run:**
   - Run the `source-docs` skill over the non-spec `.ts` files the steps touched — implementers
     write code, not comment prose, so this is the pass that brings JSDoc/`//` to
     `doc-contracts/jsdoc.md`. Skip only if no non-spec `.ts` file changed (story hosts and
     `.stories.ts` are out of its scope by design). It sets `context: fork`, so it already
     runs isolated and its file-by-file transcript never lands here — call it plainly, and
     do not "fix" this by wrapping it in an agent.
   - Use `/code-review` to review the work, with fixed point
     `$(git merge-base origin/<default> HEAD)` — the whole branch, every step's commit.
     `source-docs` edits land as their own `📚 [#<N> review] docs(<scope>): …` commit first, so the review
     sees them.

3. **Join before §5.** The typecheck must have reported before you close out. A red typecheck
   is fixed first — never reported as "done pending checks."

   **Fixes are new commits.** A typecheck or review fix is its own commit
   (`🐛 [#<N> review] fix(<scope>): …` or `🍎 [#<N> review] ref(<scope>): …`, `Refs: #<N>`) — never folded back into a
   step's commit, never `--amend`, never a rebase to squash it. The story may show the
   correction; that is honest history.

   Tests are the exception, and say so plainly in the summary: the suite has not run locally,
   and the work is green-in-CI or not green at all. A step whose `Done when` check is a
   behavioural claim the suite proves — "output byte-identical", "existing assertions
   unchanged" — is implemented, not verified, until the PR's CI run passes. Do not mark such a
   step `✅ done` in `progress.md` on the strength of a clean typecheck: mark it
   `🧪 awaiting CI` and commit it like any finished step. Its proof is the PR's CI run, which
   `/ship` opens and which gates the auto-merge. `/impel` stops at the last committed step.

This backgrounding does **not** replace the per-step typecheck each implementer runs. That one
stays: `ngc` aborts at the first `.ts` error and never reaches the template phase, so errors
accumulated across N steps make the terminal run *more* likely to abort in source and tell you
nothing about templates — exactly the blind spot the target exists to close. Per-step runs also
keep the fix with the agent holding that step's `Watch out` notes. See
`typecheck-angular-templates.md`.

## 5. Close out

Every step, and every fix, is already committed. Close-out writes no commit of its own and asks
for no approval — the human gate is `/ship`, where the user reviews the whole commit story
before anything is pushed.

Confirm the tree is clean (`git status --porcelain` empty). Anything left over is a step that
didn't commit its files — commit it now against that step, or report it; never leave it for
`/ship` to sweep up.

**No closing keyword in any commit.** Commits carry `Refs: #<N>` only. The PR body `/ship`
writes owns the closing line from `docs/agents/issue-tracker.md` `## Issue references` (GitHub/GitLab: `Closes #<N>`, closed on merge; Jira: a transition, no keyword). A closing keyword in a
commit (`close[sd]`, `fix(e[sd])`, `resolve[sd]` before `#N`) would fire on any push that reaches
the default branch, ahead of review and CI.

If the work came from a tracked ticket/issue, check off each satisfied item
in its "Acceptance criteria" section (`- [ ]` → `- [x]`, per the `to-issues` issue template) by
editing the issue body — read it through `docs/agents/issue-tracker.md` `## Fetch`, and edit it
the way that file says. A tracker whose description is never edited (the state form in
`pipeline-block.md`, e.g. Jira) gets no checkbox edit: list met and unmet criteria in the report.
Leave unmet criteria
unchecked and flag them. A partially satisfied issue is still shippable, but say so — `/ship`
then writes `Refs #<N>` in the PR body instead of `Closes #<N>`. When there is no `progress.md`
(the issue body was the step), these boxes are what `/ship` reads to decide the work is done —
tick them honestly; an unticked box is how the partial case reaches `/ship`.

This skill does not close the issue. The PR's `Closes #<N>` closes it when GitHub merges the PR.
Closing here, ahead of that, would assert a result this skill has no evidence for.

If the project also maintains a backlog/status file (e.g. referenced from the project's own
`CLAUDE.md`), update that ticket's status/link there too, as its own `📚 docs` commit on this
branch.

## 6. Hand off

Report per step: which agent ran it, files touched, `Done when` checks met, its commit
(`<short-sha> <subject>`), any inferred type or commit type. Also report any edge the overlap
check added to the graph, and the branch + `git log --oneline origin/<default>..HEAD` count.

End your final message with a one-line pointer to `/ship`, as the very last line — nothing
after it:

```
Next: /ship <issue-#-or-slug>
```
