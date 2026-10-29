# Decompose before acting: map the dependency graph first

For any feature with multiple sub-features/steps/nodes, map the graph
before processing them. Callers (grilling, task planning, anything
decomposing work) apply this, then act on the ranking their own way.

1. List the nodes only — no processing yet.
2. Map dependency edges **between nodes** (not against existing code): does B need a decision/output/artifact from A?
3. Rank: **core** (others depend on it; resolve first), **independent/leaf** (no edges; act now, in parallel), **dependent** (needs upstream resolved first — sequenced, not parked).
4. Process in graph order. Core/independent: resolve fully now. Dependent: only after upstream settles.

A node already in progress stays exhaustive — this decides *which
node next*, not how thoroughly. Don't skip step 2: an unmapped edge
surfaces later as rework. An uncertain edge counts as real until
proven otherwise.

**Accepted risk:** a node marked independent may turn out coupled.
Fix the edge and absorb that node's rework; don't re-litigate the
whole graph.

## Execution grain: a step graph an agent will run

Specialization for skills emitting steps an **agent** executes
(`/to-tasks`, `/to-issues`; `ds-plan` in `design-system`), vs.
grilling, which orders a conversation.

Discussion-independent ≠ execution-independent: a shared
file/schema/type can couple steps whose *decisions* were independent.
Re-map edges at execution grain; don't reuse a grilling ranking.

1. Map real edges (B fails to compile/run/review without A's artifact) → core/independent/dependent.
2. Presentation order (file layout, numbering) is **not** a dependency.
3. Emit per step only the hard edge: `depends_on: [N]` (empty when none). No per-step `Parallel-safe with:` — read parallelism off the graph.
4. Work the **frontier** — any step whose blockers are done.
5. Render the graph **once**, in the plan's progress file (`progress.md` for `/to-tasks`): a diagram (Mermaid in `progress.md`, ASCII where the caller's template says so) plus a one-line summary (`Parallel-safe: [D,E,G] after B` / `Dependency: A → B → F`). Per-step `depends_on`, diagram and summary derive from one ranking; if they disagree, fix the ranking.
6. The executor schedules from that graph; it doesn't re-derive parallelism.
