---
paths:
  - "**/*.{ts,tsx}"
---

# Simplest type signature first

When designing a generic API signature, stop at the simplest
form that satisfies the verified cases. Don't escalate to
conditional types, recursive extraction, or named constraint
aliases to buy open-endedness the user didn't ask for.

**Why:** during a `createFilters` inference redesign I proposed
a recursive `RowOf<E>` extraction plus a named `RowEvidence`
constraint so the row-carrier slot would accept any future
shape. The user pushed back — "this is getting too complex...
do we even need RowEvidence at all?" — and was right: one
inline union member, `(() => readonly TRow[] | undefined)`,
already covered Signal, WritableSignal, a resource's pre-load
value, and a bare store method. The conditional type was
re-deriving structurally what one callable member stated
directly, for zero extra coverage.

**How to apply:** after a signature passes its probe, try
deleting machinery and re-running before presenting it. A union
member that covers a whole structural kind (anything callable,
anything array-like) usually beats a conditional type that
enumerates the same kinds. Present the simple version first;
mention the general one only if a concrete case needs it.

Pairs with [[general-mechanism-over-enumerated-cases]] — that
rule favors one general primitive over per-case API surface,
which is not a licence for type-level complexity nobody asked
for.
