---
name: to-tasks
description: Generate a step-by-step implementation task plan for a single issue, from its spec and architecture doc — the last stop before /implement.
portedFrom: 54895f51908a
---

# To Tasks

Turn one issue's slice of work into an ordered, step-by-step implementation plan — fine enough grain that `/implement` can follow it directly, without re-deriving the design.

## Process

### 1. Gather context

Read the target issue in full (body + comments), via the issue tracker convention from `docs/agents/issue-tracker.md`. If the ticket workspace's `state.json` exists, also read `specPath` and, if set, `architecturePath` — the task plan must stay consistent with both, not just the issue's own text.

If no `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug` and `stack`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket). `stack` must not be left `null` — it decides which stack-specific skill to follow when executing `code` steps.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so at the exact seams the issue touches.

### 3. Draft the plan

An ordered list of concrete steps — which files to create or edit, in what order, and what "done" looks like for each step.

- Follow the architecture doc's file-layout table when one exists; don't invent a different structure.
- Before numbering, apply `dependency-task-graph` (which specializes `decompose-by-dependency-graph` for execution): list the candidate steps, map real edges, rank core/independent/dependent.
- Order steps so each one leaves the codebase in a working, testable state — the same discipline `/to-issues` applies to slicing, one level down. This numbering is presentation order, not proof of a dependency — two adjacent steps with no real edge are parallel-safe.
- Call out where tests should land, using the spec's Testing Decisions.

### 4. Quiz the user

Present the plan as a numbered list of steps. Ask whether the ordering and grain feel right — too coarse, too fine, or missing a step. Iterate until approved.

### 5. Write the plan

If the ticket workspace's `state.json` does not exist, ask the user whether to create it (with `specPath`, `architecturePath` if known, and `checklist.tasks = true`) before writing the plan. Always write the plan as files — never present it inline only.

Write all task files under `<workspaceRoot>/docs/tasks/`, colocated with the domain's other docs (spec, architecture, decisions).

#### Step files

One `step-N-<slug>.plan.md` per step. Follow the ds-plan step-file format (Title, PR scope, Task type, Skills used, Scaffolding agent, Files, Why This Step Exists, What To Do, Implementation Notes, Risks / Watchouts, Non-Goals, Acceptance Checks). Each step must be independently reviewable and independently deployable unless the dependency graph shows a hard edge (`Depends on: Step N`). Steps with no edge between them, even if adjacent in the numbered list, carry `Parallel-safe with: Step N` in PR scope instead of an implied sequential dependency.

**`Task type` is required on every step file** — it decides which skill to follow when you
execute the step. Exactly one of:

| `Task type` | Step produces | How to execute it |
|---|---|---|
| `code` | components, hooks, services, stores, utils | follow the `react-developer` or `angular-developer` skill, by the ticket's `stack` |
| `story` | `<Component>.stories.tsx` | follow the `story-create` skill |
| `test` | `*.spec.ts(x)` | follow the `unit-test` skill |
| `docs` | markdown, ADRs, README | write directly, no extra skill needed |
| `chore` | config, deps, tooling | write directly, no extra skill needed |

Rules that follow from this:

- One type per step. A step that writes a component *and* its stories is two steps, not one —
  otherwise the story conventions never get loaded when you execute the combined step.
- A `story` or `test` step must declare `Depends on: Step N` naming the `code` step that
  produces its subject.
- Don't leave the type to inference. Guessing it from file extensions at execution time means
  the step file was written wrong.

Each step file must include navigation links at the bottom:

```markdown
---
← [Step N-1: <title>](step-N-1-<slug>.plan.md) | [Step N+1: <title>](step-N+1-<slug>.plan.md) →
```

First step omits the `←` link; last step omits the `→` link.

#### Progress file

Write `<workspaceRoot>/docs/tasks/progress.md` to track execution of the plan:

```markdown
# Implementation Progress — <issue title>

**Issue:** #<number>
**Status:** 0 / N complete

| Step | Title | Status | PR |
|---|---|---|---|
| 1 | <title> | ⬚ pending | — |
| 2 | <title> | ⬚ pending | — |
| ... | ... | ... | ... |
```

Status values: `⬚ pending`, `▶ in progress`, `✅ done`, `⏭ skipped`.
Update this file yourself as you work through steps.

**Update the source issue's `## Pipeline` block** (format: `to-issues`, "The Pipeline block"):
set `tasks: done: <workspaceRoot>/docs/tasks/` and `readiness: ready-for-agent`, and swap the
`needs:tasks` label for `ready-for-agent`.

This is the one promotion to `ready-for-agent` that may be made unasked — a step plan either
exists on disk or it does not, so it is an observation, not the judgement call `to-issues`
reserves for the user.

#### State update

If `state.json` exists (or was just created), set `checklist.tasks = true`.

End your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /implement <issue-#-or-slug>
```
