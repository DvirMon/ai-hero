<!-- Shared contract. Cited by to-issues, grill-with-docs, to-spec, to-tasks,
     impel and ship. Edit here, never restate in a skill body. -->

# The Pipeline block

Every issue body ends with a `## Pipeline` section: which upstream stages actually ran, and
whether the issue is ready to implement. `/impel` reads it and refuses to start work the
pipeline has not prepared.

It exists because `state.json` only tracks issues that came from a workspace. An issue opened
mid-work — noticed while building something else, written down so a future session picks it up
— has no workspace, so nothing records what was *not* done to it.

## Where the rung lives

The repo's `docs/agents/issue-tracker.md` `## Readiness` (per `doc-contracts/tracker.md`) says
which form applies. `/impel` reads the rung from that place and nowhere else.

| Form | Trackers | Rung + `assessed:` live in | `/impel` reads |
|---|---|---|---|
| **Body block** | GitHub, GitLab, local | the item's `## Pipeline` block (below) | the block |
| **State form** | any tracker whose description must not be edited — e.g. Jira | `state.json` `units[].readiness` / `units[].assessed` | `units[]` |

The state form never edits the item's description — product owns it. It uses the same rungs,
triggers and dated `assessed:` reason as below, with labels mirroring the rung; on conflict,
`units[]` wins. The rest of this file describes the body block.

## Two kinds

**Epic** — owns its pipeline: grill, spec, slicing. Children are optional; an epic with no
children is just one that never needed slicing. **An epic with children is never implemented
directly** — you work the children. That is derived from the tracker's sub-issue relation, not
declared, so it cannot go stale.

**Sub** — a child of an epic. It inherits grill and spec from the parent and owns exactly one
stage of its own: tasks.

## Epic form

````markdown
# Pipeline

```yaml
workspace: <path to the folder holding state.json, or null>
grill: none
spec: none
tasks: none
readiness: needs:triage
```
````

Stage values: `none`, `done: <path>`, or `skipped: <one-line reason>`. This block is the single
record of `grill`/`spec` status for an epic — `state.json` does not carry a duplicate.

Once `/to-issues` has sliced the epic, it sets `readiness: in-progress` and adds one key,
`graph: <workspace>/issue-graph.md`. The block never names the frontier issue — that is
derived (native blocked-by edges, `issue-graph.md`), and a stored copy would go stale on every
child that ships.

## Sub form

````markdown
# Pipeline

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

`tasks` lives on the issue, not in `state.json`. `/to-tasks` plans **one issue**, and a single
workspace-level boolean could never answer "is *this* issue planned" on a multi-issue epic —
see `to-ticket/references/state-schema.md`'s "Removed in this version" for why that boolean no
longer exists on `state.json` at all. Grain decides the home:
`state.json` tracks per-workspace facts (paths, complexity, the ticket pointer); every
per-issue pipeline stage — `grill`, `spec`, `tasks` — lives entirely in the issue's own
`## Pipeline` block.

## `readiness` — the ladder

A rung means "run this stage and every stage below it before implementing".

| rung | meaning | epic | sub |
|---|---|---|---|
| `needs:triage` | nobody has judged this yet | ✓ | ✓ |
| `needs:grill` | open questions gate this issue | ✓ | ✓ (scoped) |
| `needs:spec` | exported surface changes, no contract written | ✓ | — |
| `needs:issues` | grilled and specced, not yet sliced | ✓ | — |
| `needs:tasks` | design settled, execution order is not | ✓ | ✓ |
| `ready-for-agent` | implementable now | ✓ (childless only) | ✓ |
| `in-progress` | sliced; work the children, never the epic | ✓ (with children only) | — |

A sub is never `needs:spec` or `needs:issues` — a sub *is* the slice, and its contract is the
epic's.

**A sub may be `needs:grill`, and usually that is where an open question belongs.** An epic's
grill settles the shape; it routinely leaves a residual question scoped to one slice. Put the rung
on the slice the question actually gates, not on the epic — a question parked on the parent blocks
every sibling, when only one of them is waiting on it.

The diagnostic is the count, not the rung: **one** sub at `needs:grill` is a scoped leftover and
normal; **several** at once means the epic's grill did not settle the shape, so regrill the epic
rather than each child.

**An epic's rung describes the epic's own pipeline — grill, spec, slicing — never its children's
readiness.** Once those three are done and children exist, the epic is `in-progress`
regardless of what the children still need. Anything else double-counts a child's blocker as the
parent's. Never `ready-for-agent` on an epic with children: that rung invites `/impel`, and
an epic with children is never implemented directly. `in-progress` is off the ladder — it
means the epic's own pipeline is finished, and the next action is the frontier child's rung.

## Assessing readiness

**The assessing agent sets the rung — `ready-for-agent` included.** Reason each issue's
difficulty against the triggers below, then write the rung, its label, and the reason into the
block. Don't hand the user a rung menu. The guard against always picking the cheap rung is the
`assessed:` line: it must name the difficulty evidence (seams, traps, open questions) so a
reader can check the call. "The user approved the breakdown" is not evidence — approving the
slicing says nothing about readiness.

Judge on triggers, not on feel. Any hit sets the rung; **ambiguity resolves upward, never down**:

- Unresolved questions in the body — `## Questions to settle`, `Decide Q1-Q3`, an unchecked
  `- [ ] Decide …`, an "open" or "worth checking" paragraph → **`needs:grill`**, on whichever
  issue the question actually gates. A question the body itself scopes to one slice ("gates slice
  2", "slice 1 is unaffected") belongs on that slice, not on the epic.
- **The rung must agree with its own `assessed:` line.** A reason reading "X must be answered
  first" under `readiness: needs:tasks` is a contradiction — the reason is usually the accurate
  half, so fix the rung to match it.
- Adds, renames, or retypes an **exported** symbol — a public type, a new factory, a changed call
  signature → **`needs:spec`**.
- Names 3+ modules, or carries more than ~6 acceptance criteria → **`needs:issues`** on an epic,
  **`needs:tasks`** on a sub. **This trigger measures breadth, not difficulty** — see below.
- None of the above, and the acceptance criteria are already concrete and testable →
  **`ready-for-agent`**.

**Rate each sub's difficulty, and let that set the rung — the count only flags it for review.**

- **Low** (deletion, mechanical edit the spec already enumerates) or **moderate** (a few files,
  one named trap) → **`ready-for-agent`**. `/to-tasks` would re-list the body.
- **High** (a new seam, an interaction between existing mechanisms, an open question) →
  **`needs:tasks`**.

Breadth ≠ difficulty. When the count fires but the work is low/moderate, say so in `assessed:`
and set `ready-for-agent` — never leave a `needs:tasks` rung standing on a count you don't
believe.

Record it dated, with the trigger that fired — a later reader should be able to check the call
rather than take it on trust:

```yaml
readiness: needs:grill
assessed: 2026-09-15 — body's Scope opens with "Decide Q1-Q3"; the column
  fold's read of grouping() has undecided ordering semantics.
```

## Labels

Three orthogonal axes. An issue carries one label from each of the last two, and optionally a
type:

| Axis | Values | Count |
|---|---|---|
| type | `bug` `enhancement` `documentation` | 0-1 |
| kind | `kind:epic` `kind:sub` | exactly 1 |
| rung | `needs:triage` `needs:grill` `needs:spec` `needs:issues` `needs:tasks` `ready-for-agent` `in-progress` | exactly 1 |
| area | `area:<feature>` — the project's own feature vocabulary | 1+ |

Create any that are missing (`gh label create`) before publishing — per `to-issues` step 5.2, list existing
labels first and create only the absent names.

**`area:` is what an issue touches, never what state it is in.** It is the one axis that outlives
the epic it came from: a bug filed against a feature two years after that feature's spec closed
still carries the area, which is why the area is a label and not a parent issue. Apply the areas
an issue actually changes or verifies — several is fine and often correct, but an issue carrying
every area is really an `area:engine` change.

Do not reach for a milestone or a sub-issue relation to express this. A milestone is single-valued
and will end up competing with releases; a sub-issue relation asserts that the parent's grill and
spec cover the child, which for a late-filed enhancement is false. Rationale and the survey behind
it: `docs/agents/discovery/issue-feature-taxonomy.md`.

**The body block (or `units[]`, in the state form) is authoritative; the labels are a
projection.** `/impel` reads the block,
never a label — a label is one edit away from being stale and carries no reason. Every skill that
writes the block re-syncs both labels in the same turn. On conflict the body wins and the label
gets corrected.

The kind label exists despite duplicating the native sub-issue relation because GitHub's
`parent-issue:` / `no:parent-issue` search qualifiers do not reconcile reliably (measured
2026-09-15: 27 open, 26 `no:parent-issue`, 0 `-no:parent-issue`). Set the native relation anyway —
it is the truth for parentage — but filter on the label.
