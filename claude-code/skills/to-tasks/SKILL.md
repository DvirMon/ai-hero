---
name: to-tasks
description: Generate a step-by-step implementation task plan for a single issue, from its spec and architecture doc — the last stop before /impel.
disable-model-invocation: true
---

# To Tasks

Turn one issue's slice of work into an ordered, step-by-step implementation plan — fine enough grain that `/impel` can follow it directly, without re-deriving the design.

## Process

### 0. Start the issue branch

`/to-tasks` is where work on one issue begins, so it is where the issue's branch begins. Nothing
in this skill writes to the default branch.

1. **Blockers merged.** Read the issue's blocked-by links (`gh issue view <n>`, plus the
   tracker's dependency relation). Any blocker still open → stop: `Next: /to-tasks <#blocker>`
   or wait for its PR to merge. Every branch starts from `origin/main`, so a blocker's code
   must already be there.
2. **Planning PR merged.** The epic's `docs/<epic-slug>` PR (spec, `issue-graph.md`) must be
   merged — `gh pr list --state merged --head docs/<epic-slug>`. Still open → stop and point at
   it. An issue with no epic workspace skips this check.
3. **Branch + worktree.** Run `references/start-branch.md` with
   `<type>/<issue#>-<slice-slug>` and **`useWorktree: true`** (default for issue work). It
   prunes merged work, creates the worktree off `origin/<default>` and enters it. Every later
   step in this skill works inside it.

### 1. Gather context

Read the target issue in full (body + comments), via the issue tracker convention from `docs/agents/issue-tracker.md`. If the ticket workspace's `state.json` exists, also read `specPath`, `designPath` (when set), and `architecturePath` — the task plan must stay consistent with all of them, not just the issue's own text. UI issues with a **Figma frames** section follow `references/figma-steps.md`.

If no `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug` and `stack`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket). `stack` must not be left `null` — `/impel` routes on it. If `state.json` already exists, validate it per `to-ticket/references/state-schema.md`.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so at the exact seams the issue touches.

### 3. Draft the plan

An ordered list of concrete steps — which files to create or edit, in what order, and what "done" looks like for each step.

- Follow the architecture doc's file-layout table when one exists; don't invent a different structure.
- Before numbering, apply `decompose-by-dependency-graph` § Execution grain: list the candidate steps, map real edges, rank core/independent/dependent.
- Order steps so each one leaves the codebase in a working, testable state — the same discipline `/to-issues` applies to slicing, one level down. This numbering is presentation order, not proof of a dependency — two adjacent steps with no real edge are parallel-safe.
- Call out where tests should land, using the spec's Testing Decisions.
- When the issue lists Figma frames, bind `figma:` on UI `code` steps and add a terminal
  `verify-ui` step per `references/figma-steps.md`.

### 4. Quiz the user

Present the plan as a numbered list of steps. Ask whether the ordering and grain feel right — too coarse, too fine, or missing a step. Iterate until approved.

### 4b. Design the tests (review round 2)

Only after the outline is approved — an outline change makes a test plan stale.

For every `code` step, dispatch the `tdd-planner` agent, all steps in parallel, passing
`stepOutline` (that step's approved outline), `stepNumber`, `stepSlug`, `stack`, and
`specPath`/`architecturePath` if set. It is read-only: it returns the test plan as text and
writes nothing.

Then present each returned plan to the user, one step at a time, and iterate until approved.
This review is the point of the stage — the user sees *why* each seam gets its test before any
test exists. Raise the plan's **Open questions** here; don't carry them to `/impel`.

A planner that returns `Seams: none` gets no test plan. That step keeps test-after-code: if it
still needs tests, it keeps its own `type: test` step.

A step whose test plan is approved **absorbs** its test step: drop the separate `type: test`
step for that code from the outline, and renumber. `/impel` runs red, green and types
inside the code step.

### 5. Write the plan

If the ticket workspace's `state.json` does not exist, ask the user whether to create it (with `specPath`, `architecturePath` if known) before writing the plan — unless the issue's Pipeline block says `workspace: null` (see **Tasks root** below). Always write the plan as files — never present it inline only.

**Tasks root** — where this issue's plan lives. `/impel`, `/implement` (Org server), and `/ship` resolve it the same way:

| Case | `<tasks-root>` |
|------|----------------|
| `state.json` with `workspaceRoot` | `<workspaceRoot>/tasks/` |
| Pipeline `workspace: null` (standalone issue, no epic) | `$(git rev-parse --git-dir)/pipeline/issue-<N>/` inside the issue worktree (untracked; deleted with worktree) |
| No ticket workspace | `.cursor/plans/<slug>/` at the repo root when `.cursor/rules/plan-format.mdc` exists (Org server default) |

Write all plan files under `<tasks-root>/`, colocated with the ticket's other docs when a workspace
exists. One epic workspace may hold many issues — each issue branch should touch only its own
`tasks/` (or pipeline folder). Do **not** use repo-root `4-tasks/` (legacy scratch).

**Org server:** canonical procedure is `.claude/skills/to-tasks/SKILL.md` in that repo; hand off
to `/implement`, not `/impel`.

**Dispatch every write in this step — step files, test plans, `progress.md`, the `state.json`
update — to one `sonnet` writer**, per `to-ticket/references/file-writes.md`. It renders step
files from the approved outline into the template below, so the brief carries the full approved
plan, the approved test plans verbatim, the ticket's `stack`, and this section's format rules. **Wait for its report before the
Pipeline-block update below:** promoting to `ready-for-agent` claims the plan is on disk, so
it rests on what the writer actually wrote.

#### Step files and `progress.md` (format)

When the workspace contains **`.cursor/rules/plan-format.mdc`** (Org server), follow that rule
exactly for every `step-N-<slug>.plan.md` and for `progress.md` — do not use the legacy frontmatter
template below.

**Legacy repos (no plan-format rule):** one `step-N-<slug>.plan.md` per step with YAML frontmatter
(`step`, `type`, `commit`, `depends_on`, `files`, optional `figma`) and sections **Do**, **Watch out**,
**Out of scope**, **Done when** — `/impel` routes on `type` + ticket `stack`. See git history of this
skill for the full legacy example.

**Either format:** one graph node per step file; **Depends on** / **Parallel-safe** on each step;
parallel-safety summary once in `progress.md`. Link steps with relative paths
(`./step-2-foo.plan.md`), not section hops inside one file.

#### Test plan files

One `step-N-<slug>.test-plan.md` per step with an approved test plan, beside its
`step-N-<slug>.plan.md` — written verbatim from the approved `tdd-planner` output (format in
`~/.claude/agents/tdd-planner.md`). The writing rules above do not apply to it: its "why" and
"order reason" lines are the content the user reviewed. No navigation links. Its presence is
what makes `/impel` run the step test-first, so never write one that wasn't approved in
§4b.

#### Progress file

Write `<tasks-root>/progress.md`. Under **plan-format.mdc**, include every required section there
(Summary, Assumptions, Affected areas, Graph, Files rollup, Contract & i18n, Open questions, Build
todos) plus a status table `| Step | Plan | Status | Depends / parallel |`.

Legacy layout: issue header (`**Issue:**`, `**Branch:**`, `**Worktree:**`), ASCII graph, and
`| Step | Title | Status |` with values `⬚ pending`, `▶ in progress`, `✅ done`, `🧪 awaiting CI`,
`⏭ skipped`. `/impel` or `/implement` updates status as steps complete.

#### State update

Don't touch an existing `state.json` from an issue branch. It is epic-level and was settled by
the planning PR; bumping `updatedAt` from several issue branches at once only makes rebase
conflicts. `tasks` status is tracked on the issue's `## Pipeline` block below. The one exception
is a `state.json` this run had to create (§1) — it is committed with the plan.

**Update the source issue's `## Pipeline` block** (contract: `to-issues/references/pipeline-block.md`):
set `tasks: done: <tasks-root>/` (no workspace: `tasks: done: local, in the issue's worktree`) and
`readiness: ready-for-agent`, and
swap the `needs:tasks` label for `ready-for-agent`.

This is the one promotion to `ready-for-agent` an agent may make unasked — a step plan either
exists on disk or it does not, so it is an observation, not the judgement call
`to-issues/references/pipeline-block.md` reserves for the user.

#### Plan commit

After the writer's report, commit the plan on the issue branch — the first commit of the PR's
story. Skip this when the tasks root is the untracked no-workspace folder (§5). Stage only
`<tasks-root>/` (plus a `state.json` this run created), never `-A`:

```
📚 [#<N> plan] docs(<scope>): plan tasks for #<N>

Refs: #<N>
```

`<scope>` and emoji per `atomic-commit/SKILL.md`. Don't push — `/ship` pushes.

End your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /impel <issue-#-or-slug>
```
