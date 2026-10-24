# Primitives (Framework-Agnostic)

> The libraries to consult, in order, are `sources.primitives` then `sources.references` from
> the design-system config. The framework file (`primitives.{framework}.md`) is a **catalog**:
> selection tables and source URLs for well-known libraries. A configured library the catalog
> doesn't list is researched from its own docs.

Before writing interaction logic from scratch, check whether a behavior library already solves
it. These libraries handle keyboard management, focus trapping and ARIA wiring — reinventing
them risks silent a11y regressions.

## Discovery Order

1. **Internal wrappers** — overlay/portal/focus helpers the DS already has
   (`{conventions}` § Building blocks, codebase discovery). They override any library below.
2. **`sources.primitives`, in order** — the first library that covers the pattern wins.
3. **`sources.references`, inspiration only** — a mature component library built on similar
   primitives. Learn *what* to build and *which primitive* to use; **never copy its code**.
4. **ARIA Authoring Practices Guide** — no primitive fits: implement the
   [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) by hand and document in a comment
   why no primitive was used.

Primitives provide behavior only — the DS owns the visual styling.

## Legacy-Pattern Adaptation

Reference libraries often lag current framework idioms. Translate what you learn into the idioms
in `{conventions}` (and the framework file's adaptation table) — never carry a legacy pattern into
the recommendation.
