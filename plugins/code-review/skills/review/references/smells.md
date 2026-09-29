# Smell baseline

Fowler, _Refactoring_ ch.3. Applies even when a repo documents nothing.
Owned by `standards-reviewer`.

## Rules

- **P3 by default.** A smell is an `impact` finding, severity P3, tag
  `improvement`. It lands in the capped one-liner list.
- **P2 only with a concrete defect** the smell is already causing —
  e.g. two duplicated copies that already disagree, a primitive standing
  in for an id that's already been passed in the wrong slot. Cite both
  sites.
- **The repo overrides.** A documented repo rule that endorses the shape
  suppresses the smell.
- **Always a heuristic.** Phrase as "possible Feature Envy", never as a
  violation. Never `conformance` — there's no rule to cite.
- Skip what tooling enforces.

## Smells

Each: *what it is* → *fix*.

- **Mysterious Name** — name doesn't reveal what it does or holds. →
  rename; no honest name means murky design.
- **Duplicated Code** — same logic shape in more than one hunk or file. →
  extract the shared shape.
- **Feature Envy** — method reaches into another object's data more than
  its own. → move it onto the data.
- **Data Clumps** — same few fields/params keep travelling together. →
  bundle into one type.
- **Primitive Obsession** — a primitive standing in for a domain concept.
  → give the concept its own type.
- **Repeated Switches** — same `switch`/`if`-cascade on the same type in
  several places. → polymorphism, or one shared map.
- **Shotgun Surgery** — one logical change forces scattered edits. →
  gather what changes together.
- **Divergent Change** — one module edited for several unrelated reasons.
  → split by reason to change.
- **Speculative Generality** — abstraction/params for needs the spec
  doesn't have. → delete; inline until a real need shows.
- **Message Chains** — long `a.b().c().d()` walks. → hide behind one
  method on the first object.
- **Middle Man** — mostly delegates onward. → call the real target.
- **Refused Bequest** — implementer ignores most of what it inherits. →
  composition over inheritance.
