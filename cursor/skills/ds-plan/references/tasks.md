# Task Generation — steps.md (Framework-Agnostic)

> Framework-specific checklist items live in the sibling file for your target framework (e.g. `tasks.angular.md`). This file covers the phase structure and rules that hold regardless of framework.

> **Note:** Replace `{PREFIX}` with your component prefix (e.g., `atera`, `my`, `app`). Replace `<Name>` with the component name (e.g., `Card`, `Stepper`).

Generate `tasks/steps.md` inside the component folder after all planning docs are produced. This is the implementation checklist — it translates the PRD and architecture into concrete, ordered, checkable steps.

## When to Generate

Always, as the final planning artifact at the end of Phase 2 — after `docs/prd.md` and any other planning docs are complete, before Phase 3 scaffolding begins, so it can reference the full planning set.

## How to Generate

1. Read `docs/prd.md` — extract scope, API, acceptance criteria
2. Read `docs/architecture.md` if it exists — extract component pattern, state machine, primitive wiring
3. Read `docs/design-tokens.md` if it exists — extract token list
4. Read `docs/roles-map.md` if it exists — extract ARIA and keyboard contracts
5. Translate everything into a flat, ordered checklist

Steps must be:
- **Concrete** — "Wire `aria-expanded` to the open state" not "add ARIA"
- **Checkable** — can be ticked off without ambiguity
- **Ordered** — dependencies first (types before class, class before template, template before styles)
- **Scoped** — one step = one file change or one logical unit

## Template

```markdown
# Implementation Steps: {PREFIX}-<Name>

**PRD:** [docs/prd.md](../docs/prd.md)
**Status:** 0 / N complete

---

## Phase 1 — Types & Public API skeleton

- [ ] Define `<Name>Variant`, `<Name>Size`, `<Name>Color` types
- [ ] Create public entry point with component + type exports (component stub)
- [ ] Register in component library's main entry point

## Phase 2 — Component class

- [ ] Scaffold component definition with efficient re-render mode, base class
- [ ] Add theme class and selector class to the root
- [ ] Declare all inputs/props with types and defaults (from PRD API Summary)
- [ ] Declare all outputs/events
- [ ] Wire variant/state classes at the root
- [ ] Wire ARIA attributes at the root (from roles-map / accessibility planning)
- [ ] [if architecture.md exists] Implement state and transitions
- [ ] [if primitive-backed] Wire primitive/behavior-unit services, overlay/focus management

## Phase 3 — Template

- [ ] Add default content slot
- [ ] Add named slots for [title / actions / ...] (from PRD content slots)
- [ ] Add internal structural elements (icon, spinner, etc. — from Figma anatomy)
- [ ] Wire conditional/repeated control flow for conditional regions

## Phase 4 — Styles

- [ ] Declare CSS custom property override API at the root (from design-tokens.md or styles planning)
- [ ] Style root base layout (display, align, border-radius, etc.)
- [ ] Style each variant class using role tokens (from Figma token mapping)
- [ ] Style each state (hover, focus-visible, disabled)
- [ ] [if motion.md] Add transition declarations + `prefers-reduced-motion` override

## Phase 5 — Accessibility

- [ ] Verify keyboard contract is fully implemented (from roles-map / accessibility planning)
- [ ] Verify focus ring is visible on focus-visible
- [ ] [if overlay] Verify focus trap activates on open, releases on close
- [ ] [if overlay] Verify focus returns to trigger on close
- [ ] Verify all decorative icons have `aria-hidden="true"`
- [ ] Verify all interactive icon-only elements have `aria-label`

## Phase 6 — Tests

- [ ] Identify testable logic (computed state, outputs, observer calculations)
- [ ] Write tests for [specific logical units from PRD/architecture]
- [ ] Verify no structural/CSS tests are included

## Phase 7 — Code Connect

- [ ] Create `{PREFIX}-<name>.figma.ts`
- [ ] Map all Figma variant props to framework props/inputs
- [ ] Publish via code-connect tooling

## Acceptance Criteria (from PRD)

Copy verbatim from `docs/prd.md` — these are the gate for done:

- [ ] [paste from prd.md]
```

See framework file for the concrete checklist items per phase (e.g. exact host bindings/host directives syntax for Angular).

## Rules for Generating

- **Phase order is fixed** — types before class, class before template, template before styles, styles before a11y verification
- **Steps derived from docs** — every step should trace back to the PRD, architecture, or planning output. No invented steps.
- **Acceptance criteria are copied verbatim** from `prd.md` — they are the definition of done, not a summary
- **Update `Status` counter** as steps are completed: `12 / 24 complete`
