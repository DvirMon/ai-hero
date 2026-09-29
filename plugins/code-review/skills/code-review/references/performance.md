# Performance

Loaded by `correctness-reviewer` only when a changed file is on a
configured hot path. Everywhere else, a perf concern is P3 unless it
comes with the evidence below.

## Evidence that earns P2

Both halves, named:

- **Scale** — a realistic size for this code: "10k rows", "200 columns",
  "50 open groups". Take it from specs, stories, or config; don't invent
  a worst case nobody runs.
- **Trigger** — how often it runs: "every keystroke", "every change
  detection", "per row per render", "once on init".

"O(n²)" alone is not evidence. "O(n²) over rows, re-run on every filter
keystroke, at 10k rows" is.

P1 only when the scale is one the product documents as supported and the
cost makes it unusable (frozen UI, dropped frames on scroll).

## What to look for

- Work inside a per-row / per-cell loop that doesn't depend on the row
- A `computed()` / derivation reading more signals than it needs, so it
  re-runs on unrelated changes
- Re-creating arrays/objects that feed `===`-compared inputs, breaking
  `OnPush` / memoization
- Template bindings calling methods that recompute per change detection
- Allocations in scroll/resize/pointer handlers
- `track` missing or tracking by index in `@for` over mutable lists
- Synchronous work that could be deferred off the input path

## Not a finding

- Micro-optimizations with no named scale (`for` vs `forEach`)
- Cost paid once at setup
- Anything a benchmark in the repo already covers and passes
