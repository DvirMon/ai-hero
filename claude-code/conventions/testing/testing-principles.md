# Testing Principles (Shared)

> Cross-cutting rules all testing skills reference. Layer-specific guidance lives in sibling files (e.g. `unit-testing.md`, `e2e-testing.md`).

## Test Type Taxonomy

| Type | Purpose | Volume | Tool |
|---|---|---|---|
| **Smoke / E2E** | Critical user paths work end-to-end | Very few | Playwright |
| **Unit** | Complex pure logic (algorithms, transforms) | Few — only for real complexity | Vitest / Jest |
| **UI Component** | DS component logic in isolation (no server/DB) | Per-component, logic branches only | Vitest + Testing Library (React), Vitest Browser (Angular) |
| **Contract** | Fake server/DB matches real one | Per API boundary | MSW, DI-injected fakes |

Pick the lightest test type that catches the bug. Don't write E2E when a component test suffices.

## Coverage Philosophy

Don't chase 100% code coverage. Coverage measures lines executed, not bugs caught. Focus on covering decision points — conditions, guards, precedence rules, error paths.

Before writing any test, ask: **"Would this catch a bug in real logic?"**
- **Yes** → write it
- **No** (only catches template/CSS/framework behavior change) → skip it

## Mocking Boundaries

Mock at system boundaries, not internal implementation:

- **Mock:** network layer (HTTP interceptors, MSW), timers, browser APIs (IntersectionObserver, ResizeObserver), external services
- **Don't mock:** internal hooks, private helpers, framework primitives, sibling components in same domain

A test that mocks internals breaks on every refactor. A test that mocks boundaries survives.

## Fake Server / Database Pattern

For tests needing server state, prefer fake server (MSW) or DI-injected fake services over mocking individual HTTP requests. Seed fake data directly in test setup using libraries like Faker. Run contract tests to verify fake matches real.

## Interaction Fidelity

Use high-fidelity user event simulation over low-level synthetic events. Real user actions trigger full browser event chain — synthetic dispatches skip intermediate steps and mask bugs.

## Accessibility Auditing

Run automated a11y checks (axe-core) on every rendered component/page, not just manual ARIA assertions. Applies to component tests and E2E alike.
