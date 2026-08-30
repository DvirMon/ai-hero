# Design one general mechanism, not an enumerated case per API surface

When a cluster of edge cases appears in an API, don't propose a config flag or method per case.
Ask what single operation they're all instances of, and whether the underlying engine/module can
expose that instead. Reaching a general-enough mechanism often means building *more* into the
engine — that's expected, not a cost to avoid. What gets minimized is enumerated surface area on
the public API, not internal complexity.

**Why:** the user wants consumers to compose their own edge-case handling on top of one general
primitive, rather than the library anticipating every product's definition of a concept.
Reference case: `updateRows(table, updater)` — one general write covering add, remove, update,
duplicate, bulk, import. Shipped convenience updaters are sugar, not contract — e.g.
duplicate-a-row was never separately designed, it falls out of `addRow({ ...row, id: newId() })`.

**How to apply:** try the general shape first — it's a hypothesis to test per cluster of cases,
not a rule that always transfers. Some clusters really are better served by the library shipping
the complete, specific answer directly — a general mechanism nobody ends up extending is cost
without payoff. When reworking internals to reach the general shape is the actual work needed,
don't treat that rework as something to avoid or minimize.
