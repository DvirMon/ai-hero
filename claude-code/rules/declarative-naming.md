# Declarative naming and decomposition

Names should say *what a thing means in the workflow*, not what it contains or how it's wired. Applies to event handlers, booleans, and function extraction.

## Event handlers

Name for the domain action the handler triggers, not the DOM event.

- `onSelectCustomerRow`, `onSubmitInvoice` — not `onClick`, `handleClick`.
- Caller-facing prop name matches: `<Table onSelectCustomerRow={selectCustomerRow} />`, not `<Table onRowClick={handleClick} />`.

## Booleans

- Never inline a boolean condition in `if`/`&&`/ternary. Extract to a named `const` first.
- Name for workflow intent, not raw state: `shouldSendPostRequest`, `canContinue` — not `isValid`, `isTrue`, `flag`.
- Complex condition (3+ sub-conditions) — give each sub-condition its own named `const`, then combine them in a final named boolean.

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

Any function whose return value is a boolean guard/predicate
takes an `is*` / `has*` / `can*` prefix: `isEqual(a, b)`,
`isInRange(v, r)`, `hasAnyOf(list, wanted)`. A bare verb
(`equals`, `contains`) is reserved for functions that *do*
something — e.g. a declaration rule that registers a filter.

**Why:** raised as an already-established convention when a
filter matcher and a filter rule were both named `equals`. The
prefix is what makes the two forms distinguishable at a
glance, and it resolves the name collision structurally
instead of by namespacing.

Same instinct as the boolean-`const` section above, applied to
the function's name rather than the variable's.

## Function decomposition

Reason about whether a step inside a larger function deserves its own named pure function — even if it's used exactly once and never reused elsewhere. The payoff is clarity and self-documenting structure, not reuse.

Extract when:
- Inline object/shape construction mid-function — pull into a named `createX`/`toX` helper, single-use is fine.
- The function mixes multiple workflow steps (e.g. fetch → transform → dispatch) — give each step its own named function so the outer function reads like a table of contents.
- You'd otherwise need a comment to explain what a block does — the comment belongs in the function's name instead.

Don't extract:
- A single expression or trivial one-line transform with no independent meaning (over-extraction produces a maze of one-line indirections).
- Logic that would need most of the caller's local state passed back in (no real seam exists yet).

Once extracted helpers accumulate in a file, split by concern — see [file-organization.md](file-organization.md).
