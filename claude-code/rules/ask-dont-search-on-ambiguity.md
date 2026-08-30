# Ask, don't search, when the ambiguity is about direction/preference

When there's genuine ambiguity about what to do next — a judgment call or preference, not a fact
— ask the user directly rather than spending additional tool calls (file searches, exploration)
trying to resolve it yourself.

**Why:** called out for "wasting tokens on search" after hitting ambiguity (couldn't find a
template locally) and instinctively broadening the search further instead of just asking. Asking
is cheaper and faster than exploratory search when the uncertainty is about direction or
preference, not something discoverable in one lookup.

**How to apply:** Distinguish (a) looking up a concrete fact that's cheap to verify — one
grep/read — fine to just do, from (b) open-ended exploration to resolve a judgment call or
preference ("is there a better template somewhere?", "which approach do you want?") — stop after
one reasonable attempt and ask instead of escalating the search. Pairs with
`never-run-build-serve-test-unprompted.md` — both are about checking in before spending effort,
not after.
