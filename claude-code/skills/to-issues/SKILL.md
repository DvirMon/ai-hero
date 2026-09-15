---
name: to-issues
description: Break a spec, plan, or the current conversation into a set of tracer-bullet issues, each declaring its blocking edges, published to the configured tracker — edges as text in one file per issue locally, or native blocking links on a real tracker. (Renamed from to-tickets — "ticket" is reserved for the product-level intake stage; these are engineering-level issues sliced from a spec.)
disable-model-invocation: true
---

# To Issues

Break a spec, plan, or conversation into a set of **issues** — tracer-bullet vertical slices, each declaring the issues that **block** it.

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-skills` if not.

## Process

### 1. Gather context

If a ticket workspace's `state.json` exists in context, default to its `specPath` (and `architecturePath`, if set) as the source — read both fully. Otherwise, work from whatever is already in the conversation context, or if the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

If no `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket). Backfill `specPath`/`architecturePath` from whatever source you actually used.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

If `decisions.md` records a `decompose-by-dependency-graph` ranking from `grill-with-docs`, use
it as the starting point — don't re-derive the sub-feature structure from scratch. But re-check
the edges at issue grain per `dependency-task-graph`: the grilling ranking ordered *discussion*
(which decisions had no shared unknowns), not *build* (which issues share a schema, a file, or a
compile-time type) — a node independent for one is not automatically independent for the other.
Core/independent nodes that hold up at issue grain become issues with "None — can start
immediately"; dependent nodes become issues blocked by the issue(s) covering their upstream
node. If no ranking exists (grill predates this rule, or the work was never multi-node), derive
blocking edges directly as below.

Break the work into **tracer bullet** issues.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each issue its **blocking edges** — the other issues that must complete before it can start. An issue with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own issue blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in an issue blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify issue — green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each issue, show:

- **Title**: short descriptive name
- **Blocked by**: which other issues (if any) must complete first
- **What it delivers**: the end-to-end behaviour this issue makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct — does each issue only depend on issues that genuinely gate it?
- Should any issues be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the issues to the configured tracker

Publish the approved issues. **How** depends on the tracker `/setup-skills` configured — the issues are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per issue under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-issue file template below — one issue per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per slice in dependency order (blockers first) so each issue's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each issue's "Blocked by" to the blocking issues. Apply the `ready-for-agent` triage label unless instructed otherwise — the issues are agent-grabbable by construction.

  **Set both native relations, not just one** — they are different axes, and the tracker doc has
  the exact commands (for GitHub, `docs/agents/issue-tracker.md` § Epics and hierarchy):

  - **Hierarchy** — attach every slice to the epic as a sub-issue, so the epic shows a progress
    rollup and each slice shows a parent breadcrumb. When the tracker has this, it **replaces**
    the `## Parent` prose section; keep that section only as a fallback where it doesn't.
  - **Sequencing** — record each blocking edge natively, so "is this unblocked" is a query
    rather than prose someone has to read. Keep the `## Blocked by` body section too: it is what
    survives a tracker migration and what a reader sees without an API call.

  Setting these is not optional cleanup — an epic published without them has its structure in
  prose only, which is exactly the state `issue-graph.md` then has to be reconciled against by hand.

Work the **frontier**: any issue whose blockers are all done. For a purely linear chain that means top to bottom.

Do NOT close or modify any parent issue.

If the ticket workspace's `state.json` exists, append the created issue numbers/references to its `githubIssues` array and set `checklist.issues = true`.

<local-issue-template>

# <NN> — <Issue title>

**What to build:** the end-to-end behaviour this issue makes work, from the user's perspective — not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the issues that gate this one, or "None — can start immediately".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

## Pipeline

<the sub form from "The Pipeline block" below — this issue came from a spec, so it has an epic>

</local-issue-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this issue makes work, from the user's perspective — not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking issue, or "None — can start immediately".

## Pipeline

<the sub form from "The Pipeline block" below — this issue came from a spec, so it has an epic>

</issue-template>

In either form, avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

### 6. Write the epic's issue graph

Always write `<workspaceRoot>/issue-graph.md` — one file per epic, regardless of tracker. It is
the high-level view of the whole epic: every issue, its edges, and where the frontier is. It does
NOT restate acceptance criteria or per-issue task steps — those live on the tracker and in
`/to-tasks` step files.

Rewrite this file whenever the epic's shape or state changes — an issue closed, added, split, or
an edge corrected. Pull live state with `gh issue list`/`gh issue view` (or the tracker's
equivalent) rather than trusting the file's own rows; a stale graph is worse than none.

<issue-graph-template>

# Issue graph — <epic-slug> epic (#<epic>)

Epic: [#<epic>](<url>) — <one-line epic summary>.

## Nodes

| # | Title | State | Depends on | Blocks |
|---|---|---|---|---|
| [#NN](<url>) | <title> | ✅ CLOSED / 🟡 OPEN | <blockers, or —> | <dependents, or —> |

## Graph

```
<ASCII: nodes + arrows, joined edges where a node has multiple blockers>
```

## Summary

- **Parallel-safe:** <issues with no edge between them, and what they share downstream>
- **Sequenced:** <the chains, with the artifact each edge is gated on>
- **Current frontier:** <every issue whose blockers are all closed>

## Source

<how the edges were derived — user-confirmed, spec section, or grilling ranking> Titles/states
pulled from `gh issue view` on <date>. Related docs: <spec/architecture/decisions paths>.

</issue-graph-template>

Work the frontier one issue at a time — `/to-tasks` first to plan it, then `/implement` — clearing context between issues. Then end your final message with a one-line pointer to the first frontier issue, as the very last line — nothing after it:

```
Next: /to-tasks <first-frontier-issue-#-or-slug>
```

---

## The Pipeline block

Every issue body ends with a `## Pipeline` section: which upstream stages actually ran, and
whether the issue is ready to implement. `/implement` reads it and refuses to start work the
pipeline has not prepared.

It exists because `state.json`'s `checklist` only covers issues that came from a workspace. An
issue opened mid-work — noticed while building something else, written down so a future session
picks it up — has no workspace, so nothing records what was *not* done to it.

### Two kinds

**Epic** — owns its pipeline: grill, spec, slicing. Children are optional; an epic with no
children is just one that never needed slicing. **An epic with children is never implemented
directly** — you work the children. That is derived from the tracker's sub-issue relation, not
declared, so it cannot go stale.

**Sub** — a child of an epic. It inherits grill and spec from the parent and owns exactly one
stage of its own: tasks.

### Epic form

````markdown
## Pipeline

```yaml
workspace: <path to the folder holding state.json, or null>
grill: none
spec: none
tasks: none
readiness: needs:triage
```
````

Stage values: `none`, `done: <path>`, or `skipped: <one-line reason>`. When `workspace` is set,
`state.json`'s `checklist` owns `grill`/`spec` and those lines are dropped from the block — one
copy only.

### Sub form

````markdown
## Pipeline

```yaml
epic: "#82"
workspace: <the epic's workspace path>
tasks: none
readiness: needs:tasks
```
````

`grill` and `spec` are **absent by construction** — asking them here is a category error, and
writing them would be a second copy of the epic's `state.json`. The `epic:` key is what makes
this a sub; there is no `kind:` line, because presence already says it.

`tasks` lives on the issue, not in `state.json`. `/to-tasks` plans **one issue**, while
`checklist.tasks` is a single boolean for the whole workspace — on a multi-issue epic that
boolean cannot answer "is *this* issue planned". Grain decides the home: epic-grain stages in
`state.json`, the issue-grain stage on the issue.

### `readiness` — the ladder

A rung means "run this stage and every stage below it before implementing".

| rung | meaning | epic | sub |
|---|---|---|---|
| `needs:triage` | nobody has judged this yet | ✓ | ✓ |
| `needs:grill` | open questions in the body | ✓ | — |
| `needs:spec` | exported surface changes, no contract written | ✓ | — |
| `needs:issues` | grilled and specced, not yet sliced | ✓ | — |
| `needs:tasks` | design settled, execution order is not | ✓ | ✓ |
| `ready-for-agent` | implementable now | ✓ (childless only) | ✓ |

A sub is never `needs:grill`, `needs:spec`, or `needs:issues` — those belong to its parent. A sub
that genuinely needs grilling means the **epic regressed**: say so and point at the epic rather
than grilling the child.

### Assessing readiness

**The assessment is a proposal, never a self-granted permission.** An agent that may promote
itself to `ready-for-agent` will, every time — it is the cheap path and it carries none of the
rework. Whoever assesses writes the verdict and its reason into the block and **stops**. Only the
user grants `ready-for-agent`.

Judge on triggers, not on feel. Any hit sets the rung; **ambiguity resolves upward, never down**:

- Unresolved questions in the body — `## Questions to settle`, `Decide Q1-Q3`, an unchecked
  `- [ ] Decide …`, an "open" or "worth checking" paragraph → **`needs:grill`**.
- Adds, renames, or retypes an **exported** symbol — a public type, a new factory, a changed call
  signature → **`needs:spec`**.
- Names 3+ modules, or carries more than ~6 acceptance criteria → **`needs:issues`** on an epic,
  **`needs:tasks`** on a sub.
- None of the above, and the acceptance criteria are already concrete and testable →
  **`ready-for-agent` is proposable**, not grantable.

Record it dated, with the trigger that fired — a later reader should be able to check the call
rather than take it on trust:

```yaml
readiness: needs:grill
assessed: 2026-09-15 — body's Scope opens with "Decide Q1-Q3"; the column
  fold's read of grouping() has undecided ordering semantics.
```

### Labels

Three orthogonal axes. An issue carries one label from each of the last two, and optionally a
type:

| Axis | Values | Count |
|---|---|---|
| type | `bug` `enhancement` `documentation` | 0-1 |
| kind | `kind:epic` `kind:sub` | exactly 1 |
| rung | `needs:triage` `needs:grill` `needs:spec` `needs:issues` `needs:tasks` `ready-for-agent` | exactly 1 |
| area | `area:<feature>` — the project's own feature vocabulary | 1+ |

Create any that are missing (`gh label create`) before publishing.

**`area:` is what an issue touches, never what state it is in.** It is the one axis that outlives
the epic it came from: a bug filed against a feature two years after that feature's spec closed
still carries the area, which is why the area is a label and not a parent issue. Apply the areas
an issue actually changes or verifies — several is fine and often correct, but an issue carrying
every area is really an `area:engine` change.

Do not reach for a milestone or a sub-issue relation to express this. A milestone is single-valued
and will end up competing with releases; a sub-issue relation asserts that the parent's grill and
spec cover the child, which for a late-filed enhancement is false. Rationale and the survey behind
it: `docs/agents/discovery/issue-feature-taxonomy.md`.

**The body block is authoritative; the labels are a projection.** `/implement` reads the block,
never a label — a label is one edit away from being stale and carries no reason. Every skill that
writes the block re-syncs both labels in the same turn. On conflict the body wins and the label
gets corrected.

The kind label exists despite duplicating the native sub-issue relation because GitHub's
`parent-issue:` / `no:parent-issue` search qualifiers do not reconcile reliably (measured
2026-09-15: 27 open, 26 `no:parent-issue`, 0 `-no:parent-issue`). Set the native relation anyway —
it is the truth for parentage — but filter on the label.

### Opening an ad-hoc issue

When the user asks to open a single issue with no spec behind it — mid-work, to park something
for later — publish it with the epic form, `readiness: needs:triage`, labels `kind:epic` +
`needs:triage`. Do not assess it in the same breath as creating it; assessment happens when
someone actually wants to build it. Skip the issue graph and the frontier machinery — neither
applies to one parked issue.
