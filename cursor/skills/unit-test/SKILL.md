---
name: unit-test
description: "Decide what deserves a unit test and write it — the SSOT for unit/component test selection policy across React and Angular. Use when writing or reviewing `*.spec.ts(x)` files, when a task plan has a `Task type: test` step, or when deciding whether a given behavior is worth testing at all."
---

# Unit Test

The unit/component test layer. This skill owns **what to test and what to skip** — the
selection policy. It does not own test-runner setup or query-API mechanics; those live with
each framework's developer skill (see "Division of labour" below).

> **Role in the pipeline:** knowledge SSOT, not a standalone workflow. When an implementation
> plan has a `Task type: test` step, follow this skill directly as part of executing that
> step — load it, then write the spec files yourself. Read this skill directly for ad-hoc test
> work or when reviewing someone else's specs.

## The rule

Before writing any test, ask: **"Would this catch a bug in the logic?"** Yes → write it. No —
it only catches a template or CSS change → skip it. A test that cannot fail is worse than no
test: it costs maintenance and buys nothing.

## Read in this order

1. [testing-principles.md](references/testing-principles.md) — cross-cutting rules shared by
   every test layer: coverage philosophy, mocking boundaries, interaction fidelity. Read first.
2. [unit-testing.md](references/unit-testing.md) — framework-agnostic policy: the contract
   model (inputs / outputs / visible state), the what-to-test and what-NOT-to-test lists,
   variant matrix testing, a11y auditing.
3. The framework file for the stack you're in:
   - React → [unit-testing.react.md](references/unit-testing.react.md) (Vitest + RTL)
   - Angular → [unit-testing.angular.md](references/unit-testing.angular.md)

## Division of labour

This skill answers *which tests are worth writing*. It deliberately does not duplicate:

- **Runner setup, config, install** (Vitest/`vite.config.ts`, jsdom, setup files) — see the
  `react-developer` skill's `testing-fundamentals.md`, or `angular-developer`'s testing
  references.
- **Query API semantics** (`getBy` vs `queryBy` vs `findBy`, `renderHook`, `waitFor`,
  `userEvent.setup()`) — see `react-developer`'s `component-testing.md`.

If you need both — deciding *what* to cover and *how* to express it — load this skill for the
policy and the framework developer skill for the mechanics.

## Other layers

Sibling references exist for layers that don't have their own skill yet — create one when
there's a real need, don't scaffold ahead of it:

- [backend-testing.md](references/backend-testing.md)
- [contract-testing.md](references/contract-testing.md)
- [e2e-testing.md](references/e2e-testing.md)

`references/` mirrors the shared pool also used by the `testing` skill. Edit the files in place
— do not fork a second copy.
