# to-tasks step-file format — refinement decisions

**Date:** 2026-09-25

**Context:** step files are too verbose (avg ~5KB, max ~19KB). Reviewed
sample `issue-100-sorting-schema/step-1-sorting-schema-module.plan.md`:
~45 of 131 lines are rationale or duplicated content, not instructions.

## Skeleton (F1–F11)

````markdown
---
step: 1
type: code
depends_on: []
files:
  - libs/.../with-sorting/types.ts (new)
  - libs/.../with-sorting/schema.ts (new)
---
# Step 1 — Sorting schema module

Adds the sorting declarators and the reuse helper as new files.
Nothing reads them yet; Step 2 wires them into `withSorting()`.

Decisions: SO21, SO22

## Do

Short, plain sentences, one idea each (F5). Every API or shape change
carries a few-line usage or signature snippet (F7):

```ts
sortable(path.total, { enable: () => canSort() });
```

## Watch out    ← Notes + Risks, one line each (F3)

## Out of scope    ← its own heading (F9)

## Done when
````

Skills and scaffolding agent are derived from `type` + ticket `stack`,
not written per step.

## Decisions

### F1 — Rationale is link-only

**Status:** accepted

Rationale / planning rulings are link-only — the step lists decision IDs
linking to the decisions log; no inline "Why This Step Exists" prose.

### F2 — Header is YAML frontmatter

**Status:** accepted

Frontmatter fields: `type`, `depends_on`, `files`.
(`decisions` was listed here originally, dropped by F8; `parallel_with`
dropped by F11.)

- "Skills used" and "Scaffolding agent" dropped — `/implement` derives
  them from `type` + ticket `stack`.
- PR-scope prose dropped — every step must leave the tree green anyway.
- Follow-up owed: `/implement` must read frontmatter.

### F3 — One "Watch out" list

**Status:** accepted, amended by F9 (Non-Goals no longer merged)

Implementation Notes, Risks / Watchouts and Non-Goals merge into one
`## Watch out` list, one line per bullet. Out-of-scope items are
prefixed `Out of scope:`.

### F4 — Code sketches only where no pattern exists

**Status:** superseded by F7

`## Do` carries full code sketches only for shapes with no existing
pattern in the codebase. Where a pattern exists, the step gives a pointer
(e.g. "mirror `with-grouping/schema.ts`") plus the deltas from it, no code.

### F5 — Style rules, not a line budget

**Status:** accepted

The problem is prose density per section, not file length. No line
budget. Style rules instead:

1. Short, plain, full sentences — one idea each. No telegraphic
   shorthand. (Revised: the user reads and approves every step, so it
   must stay human-readable.)
2. No "because", history or rejected alternatives (F1 covers rationale).
3. Don't restate conventions the agent already loads (CLAUDE.md, rules,
   skills).
4. Each fact is stated once, in one section.

The cut targets duplication and history, not grammar.

Enforcement mechanism: see F13.

### F6 — Two-line summary under the title

**Status:** accepted

Every step opens, right under the title, with a 2-line plain summary:
what the step does, and what it leaves for later steps. It is followed
by a `Decisions: SO21, SO22` line.

### F7 — Always show a snippet for a shape change

**Status:** accepted. Supersedes F4.

Any step that adds or changes an API or code shape includes a short
snippet, even when an existing pattern is pointed to — so the reviewer
sees the change, not only reads it. A snippet is a usage or a signature,
a few lines long; no function bodies, no JSDoc.

### F8 — Decision IDs appear once

**Status:** accepted. Amends F2.

Decision IDs appear once — the body `Decisions:` line (F6), linked to
the log. The frontmatter `decisions:` field from F2 is dropped;
`/implement` doesn't route on it.

### F9 — "Out of scope" is its own heading

**Status:** accepted. Amends F3.

"Out of scope" is its own `## Out of scope` heading, after
`## Watch out`. F3's merge still holds for Implementation Notes + Risks
→ Watch out.

### F10 — "Done when" lists step-specific checks only

**Status:** accepted

`## Done when` lists only step-specific checks. Generic gates
(typecheck) are dropped. They are already enforced by:

- each implementer agent — `angular-implementer` step 7,
  `react-implementer` step 6, `test-implementer` step 6,
  `story-implementer` step 5;
- `/implement`'s affected-projects typecheck gate
  (`implement/SKILL.md:161`, `:177-178`).

Exception: a `chore` step touching tsconfig or project config lists the
typecheck explicitly, since forks have no built-in gate.

### F11 — The dependency graph lives once, in progress.md

**Status:** accepted. Amends F2.

For dependencies, step frontmatter keeps only `depends_on`.
"Parallel-safe with" is dropped per step. The full dependency graph
(ASCII + one-line "Parallel-safe / Dependency" summary) lives once, at
the top of `progress.md`.

Follow-up owed: amend the global rule
`~/.claude/rules/decompose-by-dependency-graph.md` § Execution grain,
which currently says to emit Parallel-safe per step.

### F12 — /implement schedules from the plan's graph

**Status:** accepted

`/implement` must schedule from the approved plan's graph, not re-derive
it. Today (`implement/SKILL.md:144`) it reads Depends on but decides
parallelism itself via a Files-overlap heuristic, ignoring the plan's
parallel declarations.

Behaviour:

- `/implement` schedules from `progress.md`'s graph, running the
  unblocked frontier.
- Before dispatching, it checks Files overlap between steps the graph
  marks parallel.
- On overlap it stops dispatching and adds the missing edge. It updates
  the later step's `depends_on` and the graph + summary in
  `progress.md`, reports the change, then resumes from the corrected
  graph.
- The plan on disk stays the source of truth; nothing is re-ordered
  without being written back.
- The fix is not limited to patching `depends_on` by hand. If
  correcting the graph means rewriting step files (e.g. a step's Do or
  Watch out changes once it is sequenced after another), `/implement`
  re-invokes whatever skill or agent owns that — `/to-tasks`' writer
  for step files — before resuming. User, confirmed: "if this needs to
  invoke again some skills, so be it."

Follow-up owed: edit `implement/SKILL.md` § Parallelism (line ~144).

### F13 — F5 is enforced through the writer brief

**Status:** accepted. Closes F5's pending enforcement mechanism.

F5 is enforced through the writer brief only. The to-tasks step-file
template carries the F5 rules plus one before/after example.

No `doc-compressor` / `concise-docs` pass: its fewer-words goal pushes
toward the density F5 rejected.

Revisit if long plans visibly drift back to dense prose.

## Discovery input

Prior-art survey:
[discovery-task-file-format.md](discovery-task-file-format.md).
Open items it raises:

- ~~**"Out of scope" rated highest-leverage** — tension with F3, which
  merges it into `## Watch out`.~~ Resolved by F9.
- ~~**`parallel_with` possibly derivable** from `depends_on` +
  `files`.~~ Resolved by F11 (dropped per step; graph in `progress.md`).

## Owed edits

- **`to-tasks/SKILL.md` step-file template** — apply F1–F11 and F13.
- **`implement/SKILL.md`** — read step frontmatter (F2); schedule from
  `progress.md`'s graph with the overlap flow (F12, § Parallelism,
  line ~144).
- **`progress.md` template** — gains the ASCII graph + one-line
  "Parallel-safe / Dependency" summary at the top (F11).
- **`~/.claude/rules/decompose-by-dependency-graph.md`** § Execution
  grain — stop emitting Parallel-safe per step (F11).
