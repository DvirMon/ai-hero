# Classify every error before deciding how to handle it

When designing a feature or API that accepts consumer input — callbacks, config, persisted
state — do not pick one error strategy for the whole surface. Split each failure into two
classes first, because they do not share a trade:

| | Construction / wiring | Runtime, data-dependent |
|---|---|---|
| Fires | at setup, every run, before data flows | on one record, possibly only in production |
| Deterministic | yes | no — depends on that day's data |
| Reaches the developer | always, on first run | only if fixtures happen to contain the bad case |
| Sane degraded behavior | usually none | usually yes |
| **Handling** | **throw**, with a message naming both parties | **never throw** — degrade + report |

**Construction errors throw.** Two features claiming one key, a duplicate registration, a config
naming a field that doesn't exist. There is no correct degraded reading, and it cannot ship
accidentally because it fires on first run.

**Runtime errors degrade.** A consumer callback throwing on row 4,318 must not take down the
screen. Pick a fallback per callback, and pick it so the failure is *visible* rather than
*silent* — showing unfiltered rows beats hiding rows; visibly unsorted beats silently mis-sorted.
Hiding data is the unrecoverable direction.

Three things that are easy to get wrong:

- **Report in production too, not dev-only.** Dev-only reporting makes exactly the failures you
  can't reproduce invisible. Dev/prod branching also means the behavior under test isn't the
  behavior shipped.
- **Catch at the unit that has a coherent fallback, not per item.** Wrapping per row yields an
  inconsistent result set (some tested, some skipped) that is harder to diagnose than a whole
  step uniformly not applying — and it puts a `try` in the hot loop. Dedupe reports to once per
  callback per evaluation, not once per row.
- **Absence of a guard is not a decision.** An existing unguarded path is not precedent for
  leaving the next one unguarded; it usually means nobody specced it. Say so rather than citing
  it as convention.

**Why:** a library-wide "we throw, we never catch" convention was cited as settled during a
design review, when in fact every throw site was construction-time and the one runtime path was
unguarded by omission. Applying the wrong class's trade meant one null in one production record
would blank an entire table. Called out as bad DX — correctly.

**How to apply:** when a feature discussion reaches "what happens when this fails", classify
before proposing. Say which class it is and why, then name the fallback and the report. If the
answer is cross-cutting (it applies to every consumer callback, not just this feature), it's an
ADR — don't let one feature's spec quietly set library-wide policy it doesn't own.
