# Unit Testing — DS Components (Framework-Agnostic)

> Shared testing rules (coverage philosophy, mocking boundaries, interaction fidelity) live in `testing-principles.md` — read it first. Framework-specific test syntax lives in sibling files (e.g. `unit-testing.angular.md`, `unit-testing.react.md`). This file covers DS component-level principles.

## The Contract Model

Every component has a **public contract** defined by three pillars:

1. **Inputs** (props/attributes) — what data the component accepts
2. **Outputs** (events/callbacks) — what signals it sends to the parent
3. **Visible State** (DOM/a11y tree) — what result is rendered to the screen

Test only the contract. Treat internal framework implementation (hooks, signals, composables) as a black box. If you refactored the internals but the inputs, outputs, and rendered a11y tree stayed the same, every test should still pass.

## The Rule

Before writing a test, ask: **"Would this catch a bug in the component's logic?"**
- **Yes** → write it
- **No** (it only catches a template or CSS change) → skip it

## What to Test

- **Computed state with conditions** — derived values that change based on prop/input combinations
- **Event emissions triggered by logic** — an event fires (or doesn't) depending on a guard condition, not on every call
- **Observer-based calculations** (resize, intersection, mutation) — logic that reacts to measured DOM state
- **State derived from multiple inputs** — precedence/priority rules between competing inputs
- **Guard logic** — a method that returns early, throws, or no-ops under a specific condition
- **Happy and unhappy paths** — error messages, validation failures, edge-case states, not just the golden path

## What NOT to Test

- **Tautological assertions** — the expected value is recomputed the same way the code computes it (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself). Passes by construction, can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
- **CSS class presence for its own sake** — tests the template binding, not logic
- **Content projection** — rendering projected content is the framework's responsibility
- **Static HTML structure** — asserting an element exists with no logic behind it
- **Simple input passthrough with no logic** — a binding with no conditions attached
- **The framework itself** — don't verify that the framework updates the DOM; assume it works, test that your logic correctly instructs it

## Query Priority — Strong vs Weak Selectors

Tests must use **strong selectors** that reflect how users and assistive technology find elements. Weak selectors couple tests to implementation details and break on refactors.

| Strength | Selector type | Example | Why |
|----------|--------------|---------|-----|
| **Strong** | Role | `getByRole('button')` | Mirrors a11y tree |
| **Strong** | Label | `getByLabelText('Email')` | Mirrors form association |
| **Strong** | Visible text | `getByText('Submit')` | Mirrors what user sees |
| Acceptable | Test ID | `getByTestId('canvas')` | Last resort — only when semantics genuinely fail |
| **Banned** | CSS class | `.btn-primary`, `By.css('.active')` | Implementation detail |
| **Banned** | Tag name | `div > span`, `By.css('p')` | Structural detail |
| **Banned** | DOM path | `querySelector('.wrapper > .inner')` | Breaks on any restructure |

**Rule:** if a strong selector can't find your element, fix the markup semantics — don't reach for a weaker selector.

Test IDs (`data-testid`) are acceptable only for elements with no semantic role, label, or visible text (custom canvas, complex composite widgets). Never as convenience shortcut.

## Mocking Boundaries

Mock at system boundaries, not internal implementation:

- **Mock:** network layer (HTTP interceptors, MSW), timers, browser APIs (IntersectionObserver, ResizeObserver)
- **Don't mock:** internal hooks, private helpers, framework primitives, sibling components in the same domain

A test that mocks internals breaks on every refactor. A test that mocks boundaries survives.

## Variant Matrix Testing

DS components are driven by prop combinations (`variant`, `size`, `tone`, `disabled`). Use parameterized tests (`test.each` / Jasmine `forEach`) to cover the prop matrix efficiently instead of writing one test per variant by hand.

## Accessibility Auditing

Run automated a11y checks (axe-core) on every component render, not just manual ARIA assertions. This catches contrast, labeling, and role violations that semantic queries alone miss. See framework files for integration (`vitest-axe` / `jest-axe` / `jasmine-axe`).

## Interaction Fidelity

Use high-fidelity user event simulation over low-level synthetic events. Real user actions trigger the full browser event chain (pointerDown, mousedown, focus, click) — synthetic `fireEvent` skips intermediate steps and can mask bugs in focus management, validation timing, or event ordering. See framework files for the correct library.

## Setup Functions

Use a `setup()` factory instead of duplicating component creation across tests. Each test calls `setup()` with only the overrides relevant to that case — defaults live in one place.

Benefits:
- Single update point when component API changes
- Each test self-documents what matters — only overridden inputs visible
- More flexible than `beforeEach` — different tests need different configurations
- Returns render artifacts (fixture, element, queries) for tests that need them

```
function setup(overrides = {}) {
  // merge defaults + overrides, create component, return test handles
}

it('handles disabled state', () => {
  const { element } = setup({ disabled: true });
  // assert only what 'disabled' affects
});
```

See framework files for concrete Angular (`TestBed`) and React (`render`) implementations.

---

See the framework file for concrete test code implementing these rules.
