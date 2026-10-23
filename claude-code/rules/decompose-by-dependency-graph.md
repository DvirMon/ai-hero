# Decompose before acting: map the dependency graph first

For any feature with multiple sub-features/steps/nodes: don't
process all of them before mapping the graph. This is the
shared mechanism — callers (grilling, task planning, anything
else that decomposes work into nodes) apply it, then act on
the ranking in whatever way fits their own concern.

1. List the nodes only — no processing yet.
2. Map dependency edges **between nodes** (not against
   existing code): does B need a decision/output/artifact
   from A?
3. Rank: **core** (others depend on it, resolve it first),
   **independent/leaf** (nothing depends on it, nothing it
   depends on — act on it now, in parallel), **dependent**
   (needs core/another node resolved first — sequenced, not
   parked).
4. Process nodes in graph order. Core/independent nodes: fully
   resolve now. Dependent nodes: resolve only after their
   upstream settles.

Processing a node already in progress stays exhaustive — this
only decides *which node next*, not how thoroughly. Don't skip
step 2 to save time; an unmapped edge just surfaces later as
rework instead of being caught now. An uncertain edge counts
as real until proven otherwise — never independent by default.

**Accepted risk:** a node marked independent may turn out
coupled once more is known. That's the trade for not
waterfalling everything upfront — fix the edge and absorb
rework on that node, don't re-litigate the whole graph next
time.

## Execution grain: a step graph an agent will run

Specialization for skills emitting steps an **agent** executes
(`/to-tasks`, `/to-issues` globally; `ds-plan` inside `org`,
project-scoped there, not global) — vs. grilling, which orders
a conversation.

Discussion-independent ≠ execution-independent. A shared
file/schema/type can still couple two steps whose *decisions*
were independent to discuss. Re-map edges at execution grain;
don't reuse a grilling ranking.

1. Map real edges (B fails to compile/run/review without A's
   artifact) → core/independent/dependent.
2. Presentation order (file layout, a phase heuristic,
   numbering) is **not** a dependency — don't let step order
   imply an edge the graph doesn't show.
3. Emit per step only the hard edge: `depends_on: [N]`
   (empty when none). No per-step `Parallel-safe with:` —
   parallelism is read off the graph, not restated per step.
4. Work the **frontier** — any step whose blockers are done —
   as the execution unit.
5. Render the graph **once**, in the plan's progress file
   (`progress.md` for `/to-tasks`), not per step: a diagram
   (Mermaid in `progress.md`, ASCII where the caller's
   template says so — nodes + arrows), plus a
   one-line summary (`Parallel-safe: [D,E,G] after B` /
   `Dependency: A → B → F`).
   All three views (per-step `depends_on`, diagram, summary)
   derive from the same ranking — if they disagree, the
   ranking is wrong. Fix that, not one view.
6. The executor schedules from that graph; it does not
   re-derive parallelism on its own.
