# Module-design baseline

Ousterhout, _A Philosophy of Software Design_. Applies even when a repo
documents nothing. Owned by `standards-reviewer`.

Smells (`smells.md`) look at one spot. This baseline looks at the diff as
a whole and asks one question: **is the codebase easier or harder to
change after this diff?** An agent optimises for the task in front of
it; the cost of a design mistake shows up months later, in code the next
agent has to work in.

## Rules

- **P3 by default.** An `impact` finding, severity P3, tag
  `improvement`, in the capped one-liner list.
- **P2 when a record names the boundary.** The spec, the architecture
  doc, an ADR or a glossary entry says where a decision lives or what a
  module hides, and the diff breaks it. Cite the record and the site.
- **Say the cost.** Each finding names what gets harder later, in one
  line: "the next format needs edits in 3 files", not "this is shallow".
- **The repo overrides.** A documented rule or decision that endorses the
  shape suppresses the finding.
- **Always a heuristic.** Phrase as "possible information leak", never as
  a violation. Never `conformance`.
- **Diff-level only.** Report what the diff adds or worsens, not debt the
  code already had.

## Checks

Each: *what it is* → *fix*.

- **Shallow module** — the diff adds interface (params, exports,
  options) without hiding more work behind it. → fold the new surface
  into fewer, more powerful operations.
- **Information leak** — one decision (a format, an order, a protocol)
  now lives in more than one module. → give it one owner.
- **Special case** — a new branch or flag handles one case where a
  general rule would cover it and its neighbours. → widen the rule
  (rule `general-mechanism-over-enumerated-cases`).
- **Pass-through** — a new layer or method mostly forwards its arguments
  onward. → remove the layer, or give it real work.
- **Flag argument** — a boolean or mode param switches between two
  behaviours. → two operations, or one general one.
- **Complexity pushed up** — callers must now know an order, a retry, a
  default or a cleanup the module could handle. → handle it inside.
- **Temporal coupling** — the change works only if calls happen in an
  order nothing enforces. → enforce it in the API, or remove the order.
