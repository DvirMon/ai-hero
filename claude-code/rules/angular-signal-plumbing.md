# Angular: how signals get wired between objects

Two conventions about moving a signal from one owner to
another. Both are about the *plumbing*, not about whether the
source is already reactive.

## Read-only → writable: `linkedSignal`, never effect + copy

When a `resource()` / `rxResource()` / `httpResource()` (or any
read-only signal) must feed something typed
`WritableSignal<T>`, the answer is `linkedSignal`, not an
`effect()` that copies into a `signal()`.

`linkedSignal` returns a `WritableSignal`, so it slots into the
input directly. Its `{ source, computation(value, previous) }`
overload also carries the last resolved value through loading
and error states.

**Why:** the user interrupted a planning session on seeing
"resource + effect" reasoning: "the solution is use
linkedSignal. I would expect you to reason about that."

**How to apply:** reach for `linkedSignal` first whenever
bridging read-only → writable. Mention `effect` only to say
why it was rejected.

## Never alias a signal reference onto a field

Never write `protected readonly foo = this.bar.someSignal;` —
aliasing a signal reference straight off another
object/service. Two acceptable fixes:

1. **Prefer `computed()`:**
   `protected readonly foo = computed(() => this.bar.someSignal());`
   — consumer calls it once, `foo()`.
2. **Or wrap the access in a method** that returns the signal
   itself (don't assign the signal to a field at all):
   `protected foo() { return this.bar.someSignal; }` — consumer
   then calls twice to read: `foo()()`.

**Why:** flagged on a story-host component where
`protected readonly undoLabel = this.undo.label;` was called
out as wrong even though `undo.label` was itself already a
`computed()`. The convention is about the aliasing pattern
itself, not the source's reactivity.

**How to apply:** whenever pulling a signal off an injected
service, a composed feature/store, or any nested object onto a
class field — recompute with `computed()` or expose behind a
method call. Never reassign the reference to a field.
