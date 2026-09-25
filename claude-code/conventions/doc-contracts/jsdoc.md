# JSDoc on source

Two channels, by reader. `/** */` is read by consumers — API reference, IDE hover. `//` is
read by the next maintainer, in the file. Content goes to the channel whose reader needs it.
Budgets below are house policy; no published convention quantifies length.

## `/** */` — exported functions, factories, feature plugins

    /**
     * <Verb phrase, third person, one sentence: "Creates…", "Returns…". ≤25 words.>
     *
     * @remarks
     * <Only for semantics the signature cannot state: what counts as empty, mutate vs
     *  copy, ordering, when it re-runs. A consumer gotcha starts "Note: ".>
     *
     * @example <3-8 runnable lines, real identifiers — on entry points and composition
     *           functions; omit on accessors>
     */

4-10 lines, 25-60 words excluding the example. `@param` / `@returns` only when the name or
type does not already say it. `@see` at most twice. Defaults in prose: "Defaults to `X`."
No `@remarks` without a summary above it. No emoji.

## `/** */` — options properties, class fields, exported type aliases

One sentence, 12-30 words: what it controls or models, in domain terms, plus its default.
3-6 lines only for an interaction effect ("overrides any `initialState`"). Non-exported
helper types: no JSDoc.

## `//` — maintainer notes

Inside the body, directly above the clause. May explain *why this code is shaped this way*:
a TS constraint, a browser quirk, a performance choice. `Note: <constraint>. <why>.
<symptom if violated — e.g. "TS2589 infinite recursion">.` 2-8 lines. A bare issue or ADR
URL may follow. This is where "`any` must stay first because `Flatten<any>` recurses"
lives — kept, moved, never in `/** */`.

## Never in either channel

Decision history, D-numbers, rejected product alternatives, peer-library precedent,
restating the signature or the type. A `//` line may cite an ADR by URL; nothing restates it.
