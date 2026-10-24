# Primitives (Framework-Agnostic)

> Framework-specific selection tables and library names live in the sibling file for your target framework (e.g. `primitives.angular.md`). This file covers the discovery order — read it first, then the framework file for concrete libraries/imports.

Before writing any interaction logic from scratch, check whether the platform's primitive/behavior library already solves it. These libraries handle keyboard management, focus trapping, and ARIA wiring correctly and accessibly — reinventing them risks silent a11y regressions.

## Discovery Order

1. **Framework-native behavior library** (e.g. Angular CDK, React Aria, Radix, Headless UI, Vue's `@vueuse/core`) — check its selection table (framework file) first.
2. **Unstyled accessible primitive collection** for the framework (e.g. `ng-primitives` for Angular, Radix Primitives / Ark UI for React) if the native library doesn't cover the pattern.
3. **Reference implementation as inspiration only** — a mature component library built on the same primitives (e.g. Angular Material, MUI, Radix-based libraries). Use it to understand *what* to build and *which primitive to use* — **never copy its code directly**. These libraries often carry legacy patterns of their own framework version; always adapt to current idioms.
4. **ARIA Authoring Practices Guide** — if no primitive fits, check the [ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) for the interaction pattern, implement keyboard handling manually, and document in a comment why no primitive was used.

Primitives/behavior libraries provide behavior only — the DS owns the visual styling.

## Legacy-Pattern Adaptation

When drawing inspiration from a reference component library, always translate its patterns to current framework idioms rather than copying verbatim — reference libraries frequently lag behind current framework conventions (e.g. imperative lifecycle hooks instead of reactive primitives, global override escape hatches instead of a scoped custom-property API). See the framework file's adaptation table for concrete before/after mappings.
