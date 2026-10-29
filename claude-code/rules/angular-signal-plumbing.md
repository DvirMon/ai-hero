---
paths:
  - "**/*.{ts,html}"
---

# Angular: how signals get wired between objects

Two conventions for moving a signal from one owner to another. Both
are about the *plumbing*, not whether the source is already reactive.

## Read-only → writable: `linkedSignal`, never effect + copy

When a `resource()` / `rxResource()` / `httpResource()` (or any
read-only signal) must feed something typed `WritableSignal<T>`, use
`linkedSignal`, not an `effect()` copying into a `signal()`.

`linkedSignal` returns a `WritableSignal`, so it slots in directly.
Its `{ source, computation(value, previous) }` overload also carries
the last resolved value through loading and error states.

**Why:** the user interrupted planning on "resource + effect"
reasoning: "the solution is use linkedSignal."

**How to apply:** reach for `linkedSignal` first when bridging
read-only → writable. Mention `effect` only to say why it was rejected.

## Never alias a signal reference onto a field

Never write `protected readonly foo = this.bar.someSignal;`. Two
acceptable fixes:

1. **Prefer `computed()`:**
   `protected readonly foo = computed(() => this.bar.someSignal());`
   — consumer calls `foo()` once.
2. **Or wrap the access in a method** returning the signal (don't
   assign it to a field):
   `protected foo() { return this.bar.someSignal; }` — consumer reads
   with `foo()()`.

**Why:** flagged even though `undo.label` was itself a `computed()`;
the convention is about the aliasing pattern, not the source's
reactivity.

**How to apply:** when pulling a signal off an injected service, a
composed store, or any nested object onto a class field, recompute
with `computed()` or expose behind a method. Never reassign the
reference to a field.
