---
name: to-tasks
description: Generate a step-by-step implementation task plan for a single issue, from its spec and architecture doc — the last stop before /implementation.
disable-model-invocation: true
---

# To Tasks

Turn one issue's slice of work into an ordered, step-by-step implementation plan — fine enough grain that `/implementation` can follow it directly, without re-deriving the design.

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
3. **Branch (+ worktree).** Resolve `prUnit` and `isolation` from the workflow config
   (`${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md`).
   - `prUnit: ticket` — the unit is the ticket. If its `units[]` entry already has a `branch`
     (started by `/to-ticket`), switch to it — or enter its worktree — and don't create one.
     The Jira sub-tasks become steps on that branch, not branches of their own.
   - Otherwise run `references/start-branch.md` with `<type>/<issue#>-<slice-slug>` and the
     resolved `isolation`. It prunes merged work and creates the branch off
     `origin/<default>` — in its own worktree, which it enters (`worktree`), or in place
     (`branch`, no worktree). Every later step in this skill works there.

### 1. Gather context

Read the target issue in full (body + comments), via the issue tracker convention from `docs/agents/issue-tracker.md`. If the ticket workspace's `state.json` exists, also read `specPath`, `designPath` (when set), and `architecturePath` — the task plan must stay consistent with all of them, not just the issue's own text. UI issues with a **Figma frames** section follow `references/figma-steps.md`.

If no `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket). If `state.json` already exists, validate it per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md`.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so at the exact seams the issue touches.

### 3. Draft the plan

An ordered list of concrete steps — which files to create or edit, in what order, and what "done" looks like for each step.

- Follow the architecture doc's file-layout table when one exists; don't invent a different structure.
- **One project per step.** Each step's files fall inside one project from the workflow config
  (§ Projects) — `/implementation` loads that project's skills for it. Work that crosses projects (an API
  change and the screen that calls it) is two steps with an edge between them.
- Before numbering, apply `decompose-by-dependency-graph` § Execution grain: list the candidate steps, map real edges, rank core/independent/dependent.
- Order steps so each one leaves the codebase in a working, testable state — the same discipline `/to-issues` applies to slicing, one level down. This numbering is presentation order, not proof of a dependency — two adjacent steps with no real edge are parallel-safe.
- Call out where tests should land, using the spec's Testing Decisions.
- When the issue lists Figma frames, bind `figma:` on UI `code` steps and add a terminal
  `verify-ui` step per `references/figma-steps.md`.

### 4. Quiz the user

Present the plan as a numbered list of steps. Ask whether the ordering and grain feel right — too coarse, too fine, or missing a step. Iterate until approved.

### 4b. Design the tests (review round 2)

Only after the outline is approved — an outline change makes a test plan stale.

For every `code` step, dispatch the `sdlc:tdd-planner` agent, all steps in parallel, passing
`stepOutline` (that step's approved outline), `stepNumber`, `stepSlug`, `testSkills` (the step's
project `skills.test`), and
`specPath`/`architecturePath` if set. It is read-only: it returns the test plan as text and
writes nothing.

Then present each returned plan to the user, one step at a time, and iterate until approved.
This review is the point of the stage — the user sees *why* each seam gets its test before any
test exists. Raise the plan's **Open questions** here; don't carry them to `/implementation`.

A planner that returns `Seams: none` gets no test plan. That step keeps test-after-code: if it
still needs tests, it keeps its own `type: test` step.

A step whose test plan is approved **absorbs** its test step: drop the separate `type: test`
step for that code from the outline, and renumber. `/implementation` runs red, green and types
inside the code step.

### 5. Write the plan

If the ticket workspace's `state.json` does not exist, ask the user whether to create it (with `specPath`, `architecturePath` if known) before writing the plan — unless the issue's Pipeline block says `workspace: null` (see **Tasks root** below). Always write the plan as files — never present it inline only.

**Tasks root** — where this issue's plan lives. `/implementation`, `/review` and `/ship` resolve it the same way:

| Case | `<tasks-root>` |
|------|----------------|
| `state.json` with `workspaceRoot` | `<workspaceRoot>/tasks/issue-<N>/` |
| Pipeline `workspace: null` (standalone issue, no epic) | `$(git rev-parse --git-dir)/pipeline/issue-<N>/` inside the issue worktree (untracked; deleted with the worktree) |

Each issue branch touches only its own tasks root. Never a repo-root scratch folder.

**Dispatch every write in this step — step files, test plans, `progress.md`, the `state.json`
update — to one `sonnet` writer**, per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/file-writes.md`. It renders step
files from the approved outline into the template below, so the brief carries the full approved
plan, the approved test plans verbatim, and this section's format rules. **Wait for its report before the
Pipeline-block update below:** promoting to `ready-for-agent` claims the plan is on disk, so
it rests on what the writer actually wrote.

#### Step files

One `step-N-<slug>.plan.md` per step — one graph node each:

````markdown
---
step: 1
type: code            # code · test · story · docs · chore · verify-ui
commit: feat          # the commit type /implementation uses
depends_on: []
files:
  - libs/table/with-sorting/schema.ts (new)
figma: []             # node IDs, UI steps only
---
# Step 1 — Sorting schema module

Two lines: what this step does, and what it leaves for later steps.

Decisions: D3, D7

## Do

Short, plain sentences, one idea each. An API or shape change carries a short usage snippet.

## Watch out

## Out of scope

## Done when
````

- No "why", history or rejected alternatives — the `Decisions:` line links them.
- Don't restate conventions the executor already loads (project skills, CLAUDE.md, rules).
- No skills or agent per step — `/implementation` derives them from `type` and the step's project.
- Link steps with relative paths (`./step-2-foo.plan.md`).

#### Test plan files

One `step-N-<slug>.test-plan.md` per step with an approved test plan, beside its
`step-N-<slug>.plan.md` — written verbatim from the approved `sdlc:tdd-planner` output (format in
`${CLAUDE_PLUGIN_ROOT}/agents/tdd-planner.md`). The writing rules above do not apply to it: its "why" and
"order reason" lines are the content the user reviewed. No navigation links. Its presence is
what makes `/implementation` run the step test-first, so never write one that wasn't approved in
§4b.

#### Progress file

`<tasks-root>/progress.md`: a header (`**Issue:**`, `**Branch:**`, `**Worktree:**`), the
dependency graph as a Mermaid `graph LR` (edges `S<A> --> S<B>`) with a one-line
parallel-safety summary, and `| Step | Title | Status |` with `⬚ pending`, `▶ in progress`,
`✅ done`, `🧪 awaiting CI`, `⏭ skipped`. `/implementation` updates the status.

#### State update

From an issue branch, touch `state.json` only to record this unit's own `units[].branch` and
`.worktree` (`null` under `isolation: branch`) when §0 started the branch — nothing else. It is
epic-level and was settled by the planning PR; editing other fields from several issue branches
at once only makes rebase conflicts. `tasks` status is tracked on the issue's `## Pipeline`
block below. A `state.json` this run had to create (§1) is written in full and committed with
the plan.

#### Decisions

Append every outcome this run settled with the user — a trade-off, an agreed how-to, a challenge
that changed the plan — to `1-decisions.md` (`decisionsPath`) as it settles, phase `tasks`, per
`${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md`. No workspace → no log.

**Update the source issue's `## Pipeline` block** (contract: `${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md`):
set `tasks: done: <tasks-root>/` (no workspace: `tasks: done: local, in the issue's worktree`) and
`readiness: ready-for-agent`, and
swap the `needs:tasks` label for `ready-for-agent`.

This is the one promotion to `ready-for-agent` an agent may make unasked — a step plan either
exists on disk or it does not, so it is an observation, not the judgement call
`${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md` reserves for the user.

#### Plan commit

After the writer's report, commit the plan on the issue branch — the first commit of the PR's
story. Skip this when the tasks root is the untracked no-workspace folder (§5). Stage only
`<tasks-root>/` (plus `state.json` when this run created it or recorded its unit), never `-A`:

commit per `${CLAUDE_PLUGIN_ROOT}/contracts/commit.md`: type `docs`, subject
`plan tasks for #<N>`, issue `#<N>`, stage `plan`. Don't push — `/ship` pushes.

End your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /implementation <issue-#-or-slug>
```
