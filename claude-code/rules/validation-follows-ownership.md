---
paths:
  - "**/*.{ts,tsx}"
---

# Validation follows ownership of the round-trip

When a library primitive hands data back to a consumer-owned flow, it
ships no guard for what comes back. Validation follows ownership of
the round-trip, not proximity to the types.

Example: `withFiltering({ schema })` / `table.filters`. Persistence is
consumer-owned, so a snapshot from `localStorage` or a URL is the
consumer's to validate before `reset()` — no `restore(unknown)`, no
per-rule `isValidShape`, even though the library authored the shapes.
Closed as documented-not-built (decision R21, filtering feature doc).

**Why:** the user's ruling — "since all of the persistent flow is on
the consumer side, it's also his responsibility to provide the
correct object; if we in the future support internal persistence,
then we can discuss the guard."

**How to apply:** when a gap report reads "X has no typed entry
point", first ask who owns the flow producing X.

- Consumer-owned → document the guard as the contract, fix any doc snippet teaching the unsafe spelling, record the revisit condition, close.
- Library-owned → then design the guard.

Say the ownership answer before showing API options; don't lead with
a menu for a decision ownership already settles. Keep the deferral
additive and name the condition that reopens it.

Distinct from [[classify-errors-construction-vs-runtime]]: that picks
throw vs. degrade once the library *owns* the failure; this decides
whether the library is in the business at all.
