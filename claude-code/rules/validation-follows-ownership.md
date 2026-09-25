# Validation follows ownership of the round-trip

When a library primitive hands data back to a consumer-owned
flow, it does not ship a guard for what comes back. Validation
follows ownership of the round-trip, not proximity to the
types.

Reference case: `withFiltering({ schema })` / `table.filters`
(formerly `createFilters`, since folded into the feature).
Persistence is consumer-owned, so a snapshot off `localStorage`
or a URL is the consumer's to validate before `reset()` — no
`restore(unknown)`, no per-rule `isValidShape`, even though the
library authored the criterion shapes and could check them.
Four guard shapes were drafted and all deferred without
ranking, closed as documented-not-built. The ruling now lives
as decision R21 in the filtering feature doc.

**Why:** the user's ruling — "since all of the persistent flow
is on the consumer side, it's also his responsibility to
provide the correct object; if we in the future support
internal persistence, then we can discuss the guard."
Reporting what was dropped was rejected on the same grounds
before that: not the library's job.

**How to apply:** when a gap report reads "X has no typed
entry point", first ask who owns the flow that produces X.

- Consumer-owned → document the guard as the contract, fix any
  doc snippet teaching the unsafe spelling, record the revisit
  condition, close.
- Library-owned → then design the guard.

Say the ownership answer out loud before showing API options;
leading with an option menu for a decision that ownership
already settles wastes turns. Keep the deferral additive, and
name the condition that reopens it.

Distinct from [[classify-errors-construction-vs-runtime]] —
that rule picks throw vs. degrade once the library *does* own
the failure; this one decides whether the library is in the
business at all.
