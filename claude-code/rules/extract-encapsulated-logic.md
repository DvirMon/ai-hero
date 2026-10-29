---
paths:
  - "**/*.{ts,tsx,html}"
---

# Extract encapsulated logic, reuse not required

While editing a component/hook/service, watch for inline logic that
became its own scope, even if nothing else will consume it. Reuse is
not the test. The test: **does it have its own state, lifecycle, or
reasoning separable from its host?** If yes, pull it into a named
function (same file) or its own file/directive/hook.

## Signals that logic has its own scope

- **Owns a lifecycle** — acquire/release, subscribe/cleanup, schedule/cancel (listener, timer, subscription). Keep both halves together, away from the host's other setup.
- **Owns state that isn't the host's** — a derived value or local state the host only reads, not reasons about.
- **Would need a comment** to explain the block — the comment belongs in the function's name.
- **Independently testable** — you'd want a unit test without mounting the host.

Framework-agnostic: an Angular directive with `afterNextRender` +
`DestroyRef`, a React `useRef` + `useEffect` pair, a Node polling
loop — same test. Same for markup: a repeated `@for`/`.map()` cell
with its own shape is its own `ng-template`/component.

## Don't extract when

- It's a single expression or trivial transform with no independent meaning.
- It would need most of the host's local state passed back — no real seam yet.

## Guard against over-extraction

Extraction trades a name for a jump. Take it only if the host gets
easier to hold in your head. Gone too far when:
- Reading one flow means opening 3+ thin pass-through files/functions.
- The piece takes most of the host's state as parameters.
- You extracted because the block was *long*, not because it *owned* something.

No lifecycle/state of its own → default to inline.

## Where it goes

- Same file, named function/hook: default for a small piece with no reason to be found separately.
- Own file (directive, `use<Thing>` hook, `.utils.ts` export): once it has inputs/state worth naming at file level, per `file-organization.md`.

`file-organization.md` governs *where* a file goes; this rule governs
*whether* to pull logic out of its host at all.
