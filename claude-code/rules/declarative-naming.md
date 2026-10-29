---
paths:
  - "**/*.{ts,tsx,html}"
---

# Declarative naming and decomposition

Names say *what a thing means in the workflow*, not what it contains
or how it's wired.

## Event handlers

Name for the domain action, not the DOM event.

- `onSelectCustomerRow`, `onSubmitInvoice` — not `onClick`, `handleClick`.
- Caller-facing prop matches: `<Table onSelectCustomerRow={selectCustomerRow} />`.

## Booleans

- Never inline a boolean condition in `if`/`&&`/ternary; extract a named `const` first.
- Name for workflow intent, not raw state: `shouldSendPostRequest`, `canContinue` — not `isValid`, `flag`.
- 3+ sub-conditions: name each, then combine in a final named boolean.

```ts
// not this
if (user.role === 'admin' && !user.isSuspended && org.plan !== 'free') { ... }

// this
const isAdmin = user.role === 'admin';
const isActiveUser = !user.isSuspended;
const isPaidOrg = org.plan !== 'free';
const canManageBilling = isAdmin && isActiveUser && isPaidOrg;
if (canManageBilling) { ... }
```

## Boolean-returning functions

A boolean guard/predicate takes an `is*` / `has*` / `can*` prefix:
`isEqual(a, b)`, `isInRange(v, r)`, `hasAnyOf(list, wanted)`. A bare
verb (`equals`, `contains`) is reserved for functions that *do*
something, e.g. a declaration rule that registers a filter. The
prefix keeps the two forms apart (a matcher and a rule were both
`equals`).

## Function decomposition

Ask whether a step deserves its own named pure function even if used
once. The payoff is clarity, not reuse.

Extract when:
- Inline object/shape construction mid-function — a named `createX`/`toX` helper.
- The function mixes workflow steps (fetch → transform → dispatch) — one named function per step so the outer reads like a table of contents.
- You'd need a comment to explain a block — the name replaces it.

Don't extract:
- A single expression or trivial one-line transform (a maze of indirections).
- Logic needing most of the caller's local state passed back (no real seam).

Once helpers accumulate, split by concern — see [file-organization.md](file-organization.md).
