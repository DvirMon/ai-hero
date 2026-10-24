---
name: to-issues
description: Break a spec, plan, or the current conversation into a set of tracer-bullet issues, each declaring its blocking edges, published to the configured tracker — edges as text in one file per issue locally, or native blocking links on a real tracker. (Renamed from to-tickets — "ticket" is reserved for the product-level intake stage; these are engineering-level issues sliced from a spec.)
disable-model-invocation: true
---

# To Issues

Break a spec, plan, or conversation into a set of **issues** — tracer-bullet vertical slices, each declaring the issues that **block** it.

Every child is created **under the intake item** (`state.json` `ticketRef`) — this skill never
creates a parent item. Capturing a new item is `/to-intake`.

Read `docs/agents/issue-tracker.md` — the repo's implementation of
`${CLAUDE_PLUGIN_ROOT}/contracts/tracker.md` — for every tracker operation (run `/setup-skills` if
that file is missing). Never branch on a tracker name: follow the file's section.

## Process

### 0. Branch guard

The issue graph and `state.json` update are committed on the epic's planning branch,
`docs/<slug>`, in its worktree. On the default branch or an issue branch, stop and point the
user to `/to-ticket`, which starts it via `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md`.

### 1. Gather context

**Requires a ticket workspace.** With no `state.json`, or a `state.json` whose `ticketRef` is
`null`, stop and point the user to `/to-ticket` — do not create either here. Validate
`state.json` per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md`; a version-3 file is read through its
§ Reading version 3, and every write is version 4.

Default to its `specPath` (and `architecturePath`, if set) as the source — read both fully. When `designPath` is set, read `design.md` for frame and DS routing (do not restate it in slice prose). Also use what is already in the conversation context.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

If `1-decisions.md` records a `decompose-by-dependency-graph` ranking from `grill-with-docs`, use
it as the starting point — don't re-derive the sub-feature structure from scratch. But re-check
the edges at issue grain per `decompose-by-dependency-graph` § Execution grain: the grilling ranking ordered *discussion*
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

**Figma-aware FE slices.** When `designPath` or `figma[]` is non-empty, apply
`references/figma-slicing.md`: each UI slice gets a **Figma frames** table (node IDs), a
`designPath` link, and blockers for design-system / icon / KB work routed to the right flow.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own issue blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in an issue blocked by every migrate batch. A wide refactor is still sequenced issues off `main` — never a shared integration branch: one issue = one branch = one PR, and every branch starts from `origin/main` after its blockers merged. When a batch can't stay green alone, the batch is too big — split it further, or widen the expand step until each batch can land on its own.

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

### 5. Before creating anything on the tracker

Every create in this skill is guarded. Re-running `/to-issues` on a spec that was already sliced
must converge on the existing issues, never produce a second set.

1. **Slice issues.** Each created issue body carries `<!-- slice: <ticketRef>/<slice-slug> -->`.
   Before creating, list the intake item's existing children (`issue-tracker.md` § Fetch on
   `ticketRef`, or its re-slice search when the file has one). Reuse an existing ref on match;
   do not create a duplicate.
2. **Labels.** Create only names the tracker does not already have, as the file says.
3. **Parent attachment.** `## Create a child` attaches the child to `ticketRef`; when that is a
   separate call, check the existing children first and skip what is already attached.
4. **Blocking edges.** Read the existing blocking links before writing one; skip duplicates.

Report at the end how many issues were created versus reused. A run that reuses everything is a
success, not a no-op to be worked around.

### 6. Publish the issues to the configured tracker

Publish the approved issues, applying the existence checks from step 5 above. Create each one
through `docs/agents/issue-tracker.md` `## Create a child`, with `ticketRef` as the parent, one
per slice in dependency order (blockers first) so each issue's blocking edges can reference
real identifiers. Use the issue template below; when the file creates children as local files,
use the per-issue file template instead — one issue per file, never a single combined file.
Apply the `ready-for-agent` triage label unless instructed otherwise — the issues are
agent-grabbable by construction.

  **Set both relations, not just one** — they are different axes. Both are guarded by step 5
  above: query before writing, skip what's already there.

  - **Hierarchy** — every slice is a child of the intake item, so it shows a progress rollup and
    each slice shows a parent breadcrumb. Where the tracker has a native parent link, it
    **replaces** the `## Parent` prose section; keep that section only as a fallback where it
    doesn't.
  - **Sequencing** — record each blocking edge natively where the tracker can, so "is this
    unblocked" is a query rather than prose someone has to read. Keep the `## Blocked by` body
    section too: it is what survives a tracker migration and what a reader sees without an API
    call.

  Setting these is not optional cleanup — an epic published without them has its structure in
  prose only, which is exactly the state `issue-graph.md` then has to be reconciled against by hand.

Work the **frontier**: any issue whose blockers are all merged. For a purely linear chain that means top to bottom.

Do NOT close the intake item. Its only change: once every slice is published, record
`readiness: in-progress` on it through `issue-tracker.md` `## Readiness` (on the body-block form
also add `graph: <workspaceRoot>/issue-graph.md`, per `references/pipeline-block.md` § Epic form).
Never edit its description otherwise.

Update `state.json` `units[]` per `prUnit`, then refresh `updatedAt` — per
`${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md`'s validation routine:

- **`prUnit: sub-issue`** — append one unit per created child (`remoteRef` = its ref; the rest
  `null` until `/to-tasks` starts its branch). Reuse an existing unit on a re-slice.
- **`prUnit: ticket`** (e.g. Jira sub-tasks) — append nothing; the ticket is the one unit. The
  child refs go in `issue-graph.md`, and `/to-tasks` puts each on its step file.

**File writes go to one `sonnet` writer**, per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/file-writes.md`: the
local-issue drafts, the `state.json` update above, and step 7's `issue-graph.md` — the graph
is shaped from tracker data, not dictated, hence `sonnet`. The tracker calls stay in the main
session — the writer needs their issue numbers and edges, so dispatch it once they return,
with those in the brief. Join it before the final message.

<local-issue-template>

# <NN> — <Issue title>

<!-- slice: <epic-ref>/<slice-slug> -->

**What to build:** the end-to-end behaviour this issue makes work, from the user's perspective — not a layer-by-layer implementation list.

**Figma frames:** (omit for non-UI slices.) Per `references/figma-slicing.md`.

**Blocked by:** the numbers/titles of the issues that gate this one, or "None — can start immediately".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

## Pipeline

<the sub form from `references/pipeline-block.md` — this issue came from a spec, so it has an epic>

</local-issue-template>

<issue-template>

<!-- slice: <epic-ref>/<slice-slug> -->

## Parent

A reference to the intake item (`ticketRef`). Omit when the tracker links the parent natively.

## What to build

The end-to-end behaviour this issue makes work, from the user's perspective — not layer-by-layer implementation.

## Figma frames

(Omit for non-UI slices.) Per `references/figma-slicing.md` — table of frames this slice renders, node IDs, link to `designPath`.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking issue, or "None — can start immediately".

## Pipeline

<the sub form from `references/pipeline-block.md` — this issue came from a spec, so it has an epic>

</issue-template>

In either form, avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

### 7. Write the epic's issue graph

Always write `<workspaceRoot>/issue-graph.md` — one file per epic, regardless of tracker. It is
the structural view of the whole epic: every issue, its slice slug, and its edges. It does NOT
restate acceptance criteria or per-issue task steps — those live on the tracker and in
`/to-tasks` step files.

**Edges only, never state.** The file carries no open/closed column and no current frontier:
issue and PR state live on the tracker, which is canonical, and a committed copy would need a
commit on `main` every time a child merges. Readers derive state live — `issue-tracker.md`
§ Fetch against the edges gives the frontier. Rewrite the file only when the epic's **shape** changes
(an issue added or split, an edge corrected), and that rewrite goes through a branch + PR like
any other change.

<issue-graph-template>

# Issue graph — <epic-slug> epic (<ticketRef>)

Epic: [<ticketRef>](<url>) — <one-line epic summary>.

## Nodes

| # | Title | Slice slug | Depends on | Blocks |
|---|---|---|---|---|
| [#NN](<url>) | <title> | <slice-slug> | <blockers, or —> | <dependents, or —> |

The slice slug is what `/to-tasks` uses in the issue's branch name, `<type>/<NN>-<slice-slug>`.

## Graph

```
<ASCII: nodes + arrows, joined edges where a node has multiple blockers>
```

## Summary

- **Parallel-safe:** <issues with no edge between them, and what they share downstream>
- **Sequenced:** <the chains, with the artifact each edge is gated on>
- **Starting frontier:** <issues with no blockers — structural, not live state>

## Source

<how the edges were derived — user-confirmed, spec section, or grilling ranking> Titles pulled
from the configured issue tracker on <date>. Related docs: <spec/architecture/decisions paths>.

</issue-graph-template>

### 8. Commit and ship the planning PR

Join the writer, then make one commit on `docs/<slug>`, staged by path: `issue-graph.md` and
`state.json`. Never `-A`. Message per `atomic-commit` § Commit format:
`📚 docs(<scope>): slice <slug> into issues`, trailer `Refs: <ticketRef>` per
`issue-tracker.md` `## Issue references`.

The planning branch now holds the epic's whole planning story — workspace, decisions, spec,
graph — one commit per stage. `/ship` pushes it and opens the planning PR; GitHub auto-merges
it on green. **No issue branch starts until that PR has merged** — `/to-tasks` checks.

Then work the frontier: **one issue = one branch = one PR.** Each issue branch starts from
fresh `origin/main`; a blocked issue starts only after every blocker's PR has merged — no
stacked branches. Per issue, `/to-tasks` plans it (and starts its branch + worktree), then
`/impel`, then `/ship` — clearing context between issues. End your final message with a
one-line pointer, as the very last line — nothing after it:

```
Next: /ship (planning PR) — once merged: /to-tasks <first-frontier-issue-#-or-slug>
```

---

## The Pipeline block

Every issue body ends with a `## Pipeline` section recording which upstream stages ran and
whether the issue is ready to implement. `/impel` reads it and refuses work the pipeline
has not prepared.

**The full contract lives in [`references/pipeline-block.md`](references/pipeline-block.md)** —
the epic and sub forms, the `readiness` ladder, the assessment triggers, and the label
taxonomy. It is the SSOT for every skill that writes the block, not just this one. Read it
before stamping a block; don't work from memory of this summary.

Two rules that govern this skill's own steps, repeated here because steps 5-7 depend on them:

- **You set the rung from your own difficulty reasoning — `ready-for-agent` included.** Write
  the rung and its evidence into `assessed:`; never cite the user's approval of the breakdown
  as the reason. The closing `Next:` line follows the frontier issue's rung — `/impel` for
  `ready-for-agent` (it starts the issue branch itself), `/to-tasks` for `needs:tasks`.
- **The record is authoritative; labels are a projection.** Where the record lives is
  `issue-tracker.md` `## Readiness` (body block, or `units[]` in the state form). Re-sync
  labels in the same turn you write it. On conflict the record wins.

Opening a single item with no spec behind it is `/to-intake`, not this skill.
