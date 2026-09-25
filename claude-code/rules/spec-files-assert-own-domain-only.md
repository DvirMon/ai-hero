# A spec asserts its own domain only

When proposing test seams, check *ownership* of each
assertion, not just which file it currently sits in. A spec
that asserts another domain's type behavior is coupling, even
when the runtime test beside it is legitimate.

Reference case: proposed keeping a block of what was then
`with-filtering.spec.ts` (phantom `TRow`, `TState` carriage —
both facts about `Filters<>`, then owned by a separate
`createFilters` module) inside the *feature's* spec while
decoupling the two domains. The user caught it: "does this
continue the coupling?" It did. The fix that followed — split
by ownership into `feature.spec.ts` (runtime) and
`feature.types.spec.ts` (type assertions) — is now moot for a
different reason: `createFilters` was later folded back into
`withFiltering` itself (#124), so `Filters<TRow, TState>` is
the feature's own type again, not a fact borrowed from
elsewhere. The domain split that made the original coupling
possible no longer exists. The mechanism below still applies
to the next seam that does split a domain out.

**Why:** the user treats the test file as a readable statement
of ownership — reading it should tell you which domain it
belongs to. Carrying another domain's assertions defeats that,
and survives refactors that were supposed to cut the seam.

**How to apply:** for each existing assertion in a seam you're
reusing, ask which module would have to change to break it. If
the answer isn't the module under test, move it. Do this
*before* presenting the seam proposal — pairs with
[[decompose-by-dependency-graph]].

Related: when the user picks an ordering that changes the
premises of a pending question, re-derive the question rather
than asking it as drafted. A settled non-choice presented as a
choice reads as not having followed the decision through.
