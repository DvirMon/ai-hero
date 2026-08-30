# JSDoc: terse, not narrative — serves developers and LLMs alike

JSDoc/docstrings on functions and components should be terse and IDE-readable, not narrative.
Aim for under ~50 words on a function/component doc comment; props/interface docs stay
prop-level and terse too.

**Why:** JSDoc serves two readers — developers in IDE hover/autocomplete, and LLMs
context-reading the code. Verbose multi-line narrative comments bloat the context window without
adding signal; TypeScript signatures and identifiable structure (component names, CSS module
names) already convey most of it.

**How to apply:**
- Don't describe layout/composition/structure that's already visible in the code.
- Do mark only what's non-obvious from reading the code: semantic constraints, non-obvious
  behavior (e.g. responsive collapse), scope/reusability boundaries (e.g. "feature-local, not
  design-system"), or links to the decision that produced a constraint (an ADR).
- Skip `@example` unless usage is genuinely ambiguous — the type signature usually suffices.
- One line for "what this renders/does + purpose" is often enough; only extend past that for a
  genuinely non-obvious constraint.
