# Weight stated requirements over stability bias when comparing libraries

When choosing between competing libraries/deps, score candidates against the user's explicitly
stated requirements first. Don't let institutional-stability heuristics ("first-party", "backed
by the framework team") silently outweigh them.

**Why:** during a primitive-library comparison, a first-party option was recommended on stability
grounds when the alternative was better on 4 of 7 stated requirements and worse on none. The user
challenged it and the challenge was correct — the ruling flipped.

**How to apply:**
- Build the requirement-by-requirement scoring table *before* forming a recommendation, not
  after being challenged on it.
- Ask whether third-party churn actually reaches the consumer — if the work wraps the dependency
  behind an owned API layer, blast radius is contained, which deflates pre-1.0 risk considerably.
- Consider trajectory: which dependency covers what's needed *next*, under one vocabulary.
- "First-party" is not automatically "stable" — check for recent breaking renames.
- Verify factual claims about a library's API from **installed published packages**, not
  reading source off a `next`/unreleased branch — source reads of unreleased branches have
  produced wrong claims (exports that don't exist, understated APIs, wrong dependency framing).
