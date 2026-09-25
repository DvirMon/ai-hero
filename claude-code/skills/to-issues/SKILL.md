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

If a ticket workspace's `state.json` exists in context, validate it per `to-ticket/references/state-schema.md`, then default to its `specPath` (and `architecturePath`, if set) as the source — read both fully. Otherwise, work from whatever is already in the conversation context, or if the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

If no `state.json` exists yet, don't skip workspace tracking — create it now per `/to-ticket`'s `state.json` format and workspace-root rule, asking the user for whatever required fields you can't derive yourself (at minimum `slug`; `ticketRef`/`ticketUrl` can stay `null` if there's no tracked ticket). Backfill `specPath`/`architecturePath` from whatever source you actually used.

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

### 5. Before creating anything on the tracker

Every create in this skill is guarded. Re-running `/to-issues` on a spec that was already sliced
must converge on the existing issues, never produce a second set.

1. **Slice issues.** Before creating, search for an existing issue carrying this slice's marker:
   `gh issue list --state all --search "<epic-ref> in:body" --json number,title,body`.
   Each created issue body carries a machine-readable marker line —
   `<!-- slice: <epic-ref>/<slice-slug> -->` — written at creation (see the templates below). A
   match means the slice exists: reuse its number, update the body if the spec changed, and do
   not create.
2. **Labels.** `gh label list --json name` once, before the loop in step 6. Create only names
   absent from that list.
3. **Sub-issue attachment.** Query the parent's existing sub-issues before `addSubIssue`; skip
   when the child is already attached.
4. **Blocking edges.** Query existing `blocked_by` entries before the POST; skip duplicates.

Report at the end how many issues were created versus reused. A run that reuses everything is a
success, not a no-op to be worked around.

### 6. Publish the issues to the configured tracker

Publish the approved issues, applying the existence checks from step 5 above. **How** depends on the tracker `/setup-skills` configured — the issues are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per issue under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-issue file template below — one issue per file, never a single combined file. `.scratch/` is git-ignored: these are drafts consumed by this publishing step, and the published issues on the tracker are the durable artifact.
- **A real issue tracker** (whichever this repo configured — see `docs/agents/issue-tracker.md`) → publish one issue per slice in dependency order (blockers first) so each issue's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each issue's "Blocked by" to the blocking issues. Apply the `ready-for-agent` triage label unless instructed otherwise — the issues are agent-grabbable by construction.

  **Set both native relations, not just one** — they are different axes, and the tracker doc has
  the exact commands (for GitHub, `docs/agents/issue-tracker.md` § Epics and hierarchy). Both are
  guarded by step 5 above: query before writing, skip what's already there.

  - **Hierarchy** — attach every slice to the epic as a sub-issue, so the epic shows a progress
    rollup and each slice shows a parent breadcrumb. When the tracker has this, it **replaces**
    the `## Parent` prose section; keep that section only as a fallback where it doesn't. Check
    the parent's existing sub-issues first (step 5.3) — skip `addSubIssue` when already attached.
  - **Sequencing** — record each blocking edge natively, so "is this unblocked" is a query
    rather than prose someone has to read. Keep the `## Blocked by` body section too: it is what
    survives a tracker migration and what a reader sees without an API call. Check existing
    `blocked_by` entries first (step 5.4) — skip the POST when the edge already exists.

  Setting these is not optional cleanup — an epic published without them has its structure in
  prose only, which is exactly the state `issue-graph.md` then has to be reconciled against by hand.

Work the **frontier**: any issue whose blockers are all done. For a purely linear chain that means top to bottom.

Do NOT close the parent issue. Its only edit: once every slice is published, set its
Pipeline block to `readiness: in-progress`, add `graph: <workspaceRoot>/issue-graph.md`, and
swap its rung label to `in-progress` (per `references/pipeline-block.md` § Epic form). Nothing
else in its body changes.

If the ticket workspace's `state.json` exists, append the created issue numbers/references to its `githubIssues` array and refresh `updatedAt` — per `to-ticket/references/state-schema.md`'s validation routine.

**File writes go to one `sonnet` writer**, per `to-ticket/references/file-writes.md`: the
local-issue drafts, the `state.json` update above, and step 7's `issue-graph.md` — the graph
is shaped from tracker data, not dictated, hence `sonnet`. The tracker calls stay in the main
session — the writer needs their issue numbers and edges, so dispatch it once they return,
with those in the brief. Join it before the final message.

<local-issue-template>

# <NN> — <Issue title>

<!-- slice: <epic-ref>/<slice-slug> -->

**What to build:** the end-to-end behaviour this issue makes work, from the user's perspective — not a layer-by-layer implementation list.

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

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this issue makes work, from the user's perspective — not layer-by-layer implementation.

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

Every issue body ends with a `## Pipeline` section recording which upstream stages ran and
whether the issue is ready to implement. `/implement` reads it and refuses work the pipeline
has not prepared.

**The full contract lives in [`references/pipeline-block.md`](references/pipeline-block.md)** —
the epic and sub forms, the `readiness` ladder, the assessment triggers, and the label
taxonomy. It is the SSOT for every skill that writes the block, not just this one. Read it
before stamping a block; don't work from memory of this summary.

Two rules that govern this skill's own steps, repeated here because steps 5-7 depend on them:

- **You set the rung from your own difficulty reasoning — `ready-for-agent` included.** Write
  the rung and its evidence into `assessed:`; never cite the user's approval of the breakdown
  as the reason. The closing `Next:` line follows the frontier issue's rung — `/implement` for
  `ready-for-agent`, `/to-tasks` for `needs:tasks`.
- **The body block is authoritative; labels are a projection.** Re-sync both labels in the same
  turn you write the block. On conflict the body wins.


## Opening an ad-hoc issue

When the user asks to open a single issue with no spec behind it — mid-work, to park something
for later — publish it with the epic form, `readiness: needs:triage`, labels `kind:epic` +
`needs:triage`. Do not assess it in the same breath as creating it; assessment happens when
someone actually wants to build it. Skip the issue graph and the frontier machinery — neither
applies to one parked issue.
