---
paths:
  - "**/*.{ts,tsx}"
---

# Classify every error before deciding how to handle it

When designing a feature or API that accepts consumer input
(callbacks, config, persisted state), don't pick one error strategy
for the whole surface. Split each failure first:

| | Construction / wiring | Runtime, data-dependent |
|---|---|---|
| Fires | at setup, every run, before data flows | on one record, possibly only in production |
| Deterministic | yes | no — depends on that day's data |
| Reaches the developer | always, on first run | only if fixtures hold the bad case |
| Sane degraded behavior | usually none | usually yes |
| **Handling** | **throw**, with a message naming both parties | **never throw** — degrade + report |

**Construction errors throw.** Two features claiming one key, a
duplicate registration, a config naming a missing field. No correct
degraded reading exists, and it can't ship by accident.

**Runtime errors degrade.** A consumer callback throwing on row 4,318
must not take down the screen. Pick a fallback per callback that
makes the failure *visible*, not *silent* — unfiltered rows beat
hidden rows; visibly unsorted beats silently mis-sorted. Hiding data
is the unrecoverable direction.

Easy to get wrong:

- **Report in production too, not dev-only.** Dev-only reporting hides exactly the failures you can't reproduce, and tests then cover behavior that isn't shipped.
- **Catch at the unit with a coherent fallback, not per item.** Per-row wrapping gives an inconsistent result set and a `try` in the hot loop. Dedupe reports to once per callback per evaluation.
- **Absence of a guard is not a decision.** An unguarded path is not precedent for leaving the next one unguarded; say nobody specced it.

**Why:** a "we throw, we never catch" convention was cited as settled
when every throw site was construction-time and the one runtime path
was unguarded by omission; one null in one record would blank a table.

**How to apply:** at "what happens when this fails", classify first,
say which class and why, then name the fallback and the report. If
it's cross-cutting (every consumer callback), it's an ADR — don't let
one feature's spec set library-wide policy.
