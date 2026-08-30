# Decisions

## Testing skills: one skill per test layer, shared principles reference

Decided 2026-07-28. Testing skills use a one-skill-per-test-layer architecture, each with its own
reference files, plus a shared cross-cutting reference nothing layer-specific should contradict.

**Structure:**
- `unit-test` — unit/component test *selection policy* (what to test / what to skip), React +
  Angular. Executed by the `test-implementer` agent via `/implement`. Its `references/` is a
  symlink to the shared pool at `~/.claude/skills/testing/references/`.
- `ds-test-scaffolder` — DS component logic tests (ds-plan/ds-scaffold pipeline only; reads the
  same reference pool by path).
- `e2e-test-scaffolder` — future, Playwright critical-path smoke tests.
- `contract-test-scaffolder` — future, MSW/fake server contract tests.
- `backend-test-scaffolder` — future, if a backend lands in the repo.

Each layer skill = own agent, own scope, own reference files (e.g. `e2e-testing.md` +
`e2e-testing.{framework}.md`).

All layer skills also reference a shared `testing-principles.md` — cross-cutting rules only (test
type taxonomy, coverage philosophy, "mock at boundaries not internals", "don't chase coverage").
Not a skill itself, just a shared reference preventing contradiction across layers.

**Why:** taxonomy is smoke (few E2E), unit (complex logic only), UI component (DS), contract
(real vs fake server) — a deliberate split so each layer owns a narrow, well-defined slice.

Split of concerns: the `unit-test` skill owns *what deserves a test*; the framework developer
skills (`react-developer`, `angular-developer`) own *test mechanics* (runner config, query API,
`renderHook`, `waitFor`). Neither duplicates the other — they cross-link, don't collapse them.

**How to apply:** create each layer skill + its references at the moment of first real need, not
before — don't write aspirational docs before the tooling exists. When creating one, follow the
`ds-test-scaffolder` pattern: agent definition + layer-specific reference files + pointer to the
shared `testing-principles.md`.
