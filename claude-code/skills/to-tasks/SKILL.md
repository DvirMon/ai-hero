---
name: to-tasks
description: Generate a step-by-step implementation task plan for a single issue, from its spec and architecture doc — the last stop before /implement.
disable-model-invocation: true
---

# To Tasks

Turn one issue's slice of work into an ordered, step-by-step implementation plan — fine enough grain that `/implement` can follow it directly, without re-deriving the design.

## Process

### 1. Gather context

Read the target issue in full (body + comments), via the issue tracker convention from `docs/agents/issue-tracker.md`. If the ticket workspace's `state.json` exists, also read `specPath` and, if set, `architecturePath` — the task plan must stay consistent with both, not just the issue's own text.

If no `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug` and `stack`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket). `stack` must not be left `null` — `/implement` routes on it. If `state.json` already exists, validate it per `to-ticket/references/state-schema.md`.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so at the exact seams the issue touches.

### 3. Draft the plan

An ordered list of concrete steps — which files to create or edit, in what order, and what "done" looks like for each step.

- Follow the architecture doc's file-layout table when one exists; don't invent a different structure.
- Before numbering, apply `decompose-by-dependency-graph` § Execution grain: list the candidate steps, map real edges, rank core/independent/dependent.
- Order steps so each one leaves the codebase in a working, testable state — the same discipline `/to-issues` applies to slicing, one level down. This numbering is presentation order, not proof of a dependency — two adjacent steps with no real edge are parallel-safe.
- Call out where tests should land, using the spec's Testing Decisions.

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
test exists. Raise the plan's **Open questions** here; don't carry them to `/implement`.

A planner that returns `Seams: none` gets no test plan. That step keeps test-after-code: if it
still needs tests, it keeps its own `type: test` step.

A step whose test plan is approved **absorbs** its test step: drop the separate `type: test`
step for that code from the outline, and renumber. `/implement` runs red, green and types
inside the code step.

### 5. Write the plan

If the ticket workspace's `state.json` does not exist, ask the user whether to create it (with `specPath`, `architecturePath` if known) before writing the plan. Always write the plan as files — never present it inline only.

Write all task files under `<workspaceRoot>/4-tasks/`, colocated with the domain's other docs (spec, architecture, decisions).

**Dispatch every write in this step — step files, test plans, `progress.md`, the `state.json`
update — to one `sonnet` writer**, per `to-ticket/references/file-writes.md`. It renders step
files from the approved outline into the template below, so the brief carries the full approved
plan, the approved test plans verbatim, the ticket's `stack`, and this section's format rules. **Wait for its report before the
Pipeline-block update below:** promoting to `ready-for-agent` claims the plan is on disk, so
it rests on what the writer actually wrote.

#### Step files

One `step-N-<slug>.plan.md` per step, in this shape:

````markdown
---
step: 1
type: code
depends_on: []
files:
  - libs/table/src/api/features/with-sorting/types.ts (new)
  - libs/table/src/api/features/with-sorting/schema.ts (new)
---
# Step 1 — The sorting schema module

Adds the three sorting declarators in a new `with-sorting/schema.ts`.
Nothing uses them yet; Step 2 wires them into `withSorting()`.

Decisions: [SO21, SO22](../../decisions/sorting.md)

## Do

Model `schema.ts` on `with-grouping/schema.ts`. The new API:

```ts
sortNulls(path.total, { order: 'last' });
sortFn(path.name, (a, b) => a.name.localeCompare(b.name));
sortable(path.id, { enable: () => false });
```

## Watch out

- Export nothing from `index.ts` yet. Step 3 swaps the names.

## Out of scope

- The `ctx` argument to the comparator (#117).

## Done when

- [ ] `schema.ts` calls `runRecordedSchema` and has no recorder
      session code of its own.
````

Section rules:

- **Frontmatter** holds `step`, `type`, `depends_on`, `files` — nothing
  else. Skills and scaffolding agent are not written: `/implement`
  derives them from `type` + the ticket's `stack`. No PR-scope prose;
  every step leaves the tree green anyway.
- **Summary** — two plain lines under the title: what the step does,
  and what it leaves for later steps.
- **Decisions** — one line of decision IDs, linked to the capability's
  decisions log. Rationale is link-only: no "why this step exists"
  prose, no planning rulings copied in.
- **Do** — the work. Any step that adds or changes an API or code shape
  shows a short usage or signature snippet, even when it also points to
  an existing pattern. A few lines; no function bodies, no JSDoc.
- **Watch out** — implementation hints and risks, one bullet each.
- **Out of scope** — what the step must not do. Its own heading, so the
  step's boundary is visible at a glance.
- **Done when** — step-specific checks only. Generic gates (typecheck)
  are left to the implementer agents and `/implement`, which already
  run them. Exception: a `chore` step touching tsconfig or project
  config lists the typecheck explicitly.

Each step must be independently reviewable and deployable unless the
graph shows a hard edge, written as `depends_on: [N]`. Parallel-safety
is not written per step; it lives once, in `progress.md`'s graph.

#### Writing rules (part of the writer brief)

The user reads and approves every step, so it must read easily. The
cut targets duplication and history, not grammar.

1. Short, plain, full sentences — one idea each. No telegraphic
   shorthand.
2. No "because", history or rejected alternatives. Rationale lives in
   the decisions log.
3. Don't restate conventions the agent already loads (CLAUDE.md,
   rules, skills).
4. Say each fact once, in one section.

Before:

> **Take the simplest signature that works** ([[simplest-signature-first]]).
> Try a plain `SortingHandle<TRow>` parameter first, which is
> `K = string, V = unknown`. Only make the helper generic in `K` if
> `SortingHandle<Row, 'total', number>` turns out not to be assignable
> to it. Step 5's types spec settles this.

After:

> - `sortingSchema` takes a plain `SortingHandle<TRow>`. Add a `K`
>   generic only if Step 5's types spec fails.

Pass these rules and the example to the writer verbatim. No
compression pass runs afterwards — its fewer-words goal pushes toward
the density these rules reject.

**`type` is required on every step file** — it is what `/implement`
routes on. Exactly one of:

| `type` | Step produces | `/implement` dispatches to |
|---|---|---|
| `code` | components, hooks, services, stores, utils | `react-implementer` / `angular-implementer`, by the ticket's `stack` |
| `story` | `<Component>.stories.tsx` | `story-implementer` |
| `test` | `*.spec.ts(x)` | `test-implementer` (or `ds-test-scaffolder` for DS-pipeline components) |
| `docs` | markdown, ADRs, README | a fork (`adr-writer` for exactly one ADR) |
| `chore` | config, deps, tooling | a fork |

Rules that follow from this:

- One type per step. A step that writes a component *and* its stories is two steps, not one —
  otherwise it cannot be routed, and the story conventions never get loaded.
- A `story` or `test` step must declare `depends_on: [N]` naming the `code` step that
  produces its subject.
- A `code` step with an approved test plan has no separate `test` step — its tests are
  written inside it, first (§4b).
- Don't leave the type to inference. `/implement` will guess from file extensions if it's
  missing, but a guess means the step file was written wrong.

Each step file must include navigation links at the bottom:

```markdown
---
← [Step N-1: <title>](step-N-1-<slug>.plan.md) | [Step N+1: <title>](step-N+1-<slug>.plan.md) →
```

First step omits the `←` link; last step omits the `→` link.

#### Test plan files

One `step-N-<slug>.test-plan.md` per step with an approved test plan, beside its
`step-N-<slug>.plan.md` — written verbatim from the approved `tdd-planner` output (format in
`~/.claude/agents/tdd-planner.md`). The writing rules above do not apply to it: its "why" and
"order reason" lines are the content the user reviewed. No navigation links. Its presence is
what makes `/implement` run the step test-first, so never write one that wasn't approved in
§4b.

#### Progress file

Write `<workspaceRoot>/4-tasks/progress.md` to track `/implement` execution:

````markdown
# Implementation Progress — <issue title>

**Issue:** #<number>
**Status:** 0 / N complete

## Graph

```
Step 1 ──► Step 2 ──► Step 3
             └──────► Step 5
Step 4 (independent)
```

Parallel-safe: [4] · Dependency: 1 → 2 → 3

## Steps

| Step | Title | Status | PR |
|---|---|---|---|
| 1 | <title> | ⬚ pending | — |
| 2 | <title> | ⬚ pending | — |
| ... | ... | ... | ... |
````

The graph is the one place parallel-safety is written — derived from
the same ranking as every step's `depends_on`, so the two never
disagree. `/implement` schedules from it.

Status values: `⬚ pending`, `▶ in progress`, `✅ done`, `⏭ skipped`.
`/implement` updates this file as it works through steps.

#### State update

If `state.json` exists (or was just created), refresh `updatedAt` per `to-ticket/references/state-schema.md`'s validation routine — `tasks` status itself is tracked on the issue's `## Pipeline` block below, not in `state.json`.

**Update the source issue's `## Pipeline` block** (contract: `to-issues/references/pipeline-block.md`):
set `tasks: done: <workspaceRoot>/4-tasks/` and `readiness: ready-for-agent`, and swap the
`needs:tasks` label for `ready-for-agent`.

This is the one promotion to `ready-for-agent` an agent may make unasked — a step plan either
exists on disk or it does not, so it is an observation, not the judgement call
`to-issues/references/pipeline-block.md` reserves for the user.


End your final message with a one-line pointer, as the very last line — nothing after it:

```
Next: /implement <issue-#-or-slug>
```
