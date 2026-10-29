---
paths:
  - "**/*.spec.{ts,tsx}"
  - "**/*.types.spec.ts"
---

# A spec asserts its own domain only

When proposing test seams, check *ownership* of each assertion, not
just which file it sits in. A spec asserting another domain's type
behavior is coupling, even beside a legitimate runtime test.

**Why:** a feature spec kept `TRow`/`TState` type assertions that were
facts about a separate `createFilters` module; the user: "does this
continue the coupling?" It did. Fix: split by ownership into
`feature.spec.ts` (runtime) and `feature.types.spec.ts` (types).

**How to apply:** for each assertion in a seam you're reusing, ask
which module would have to change to break it. If it isn't the module
under test, move it. Do this *before* presenting the seam proposal —
pairs with [[decompose-by-dependency-graph]].

When the user's ordering changes the premises of a pending question,
re-derive the question; a settled non-choice presented as a choice
reads as not having followed the decision through.
