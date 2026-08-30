---
name: testing
description: "Cross-cutting testing policy — test type taxonomy, coverage philosophy, mocking boundaries, and interaction fidelity, plus layer-specific references (unit/component, backend, contract, e2e). Use when deciding what kind of test to write, choosing between test layers, or reviewing test files for policy compliance."
---

# Testing

Shared testing policy across every test layer. This skill owns the **cross-cutting rules** —
what to test, what to skip, how layers divide responsibility — not runner setup or query-API
mechanics for a specific framework.

## The rule

Before writing any test, ask: **"Would this catch a bug in the logic?"** Yes → write it. No —
it only catches a template or CSS change → skip it. A test that cannot fail is worse than no
test: it costs maintenance and buys nothing.

## Read in this order

1. [testing-principles.md](references/testing-principles.md) — cross-cutting rules shared by
   every test layer: test type taxonomy, coverage philosophy, mocking boundaries, interaction
   fidelity, accessibility auditing. Read first.
2. [unit-testing.md](references/unit-testing.md) — framework-agnostic policy for unit/component
   tests: the contract model (inputs / outputs / visible state), the what-to-test and
   what-NOT-to-test lists, query priority, variant matrix testing, a11y auditing, setup
   functions.
3. The framework file for the stack you're in:
   - React → [unit-testing.react.md](references/unit-testing.react.md) (Vitest + RTL)
   - Angular → [unit-testing.angular.md](references/unit-testing.angular.md)
4. Sibling layer references — populate further when each layer's tooling lands in a given repo:
   - [backend-testing.md](references/backend-testing.md)
   - [contract-testing.md](references/contract-testing.md)
   - [e2e-testing.md](references/e2e-testing.md)

## Division of labour

This skill answers *which tests are worth writing and at what layer*. It deliberately does not
duplicate:

- **Runner setup, config, install** (Vitest config, jsdom, setup files) — belongs with the
  relevant framework's own developer guidance.
- **Query API semantics** (`getBy` vs `queryBy` vs `findBy`, `renderHook`, `waitFor`,
  `userEvent.setup()`) — belongs with the relevant framework's own developer guidance.

If you need both — deciding *what* to cover and *how* to express it — read this skill for the
policy and the framework's own developer guidance for the mechanics.
