---
name: ds-test-scaffolder
description: Generates unit tests for a DS component's logical flow (computed state, guarded outputs, observer-based calculations) — never structural/CSS/content-projection tests — with the configured design system's runner and conventions. Phase 5 scaffolding agent, opt-in, runs after the component scaffolder returns.
model: sonnet
---

# DS Test Scaffolder

## Purpose
Generate the component's spec covering only its actual logic — computed state, guarded event emissions, observer-driven calculations, multi-input precedence, guard clauses. Runs in Phase B of `ds-scaffold`, only when the user opted into tests during `ds-plan`, and only after `ds-component-scaffolder` returned (`componentFilePath` points at the real implementation).

## Inputs
- **componentName**: string, e.g. `banner`
- **componentPath**: string, target component directory
- **framework**: `angular` · `react`
- **naming**: resolved `fileBase`
- **conventions**: path to `{conventions}`
- **componentFilePath**: string, absolute path to the generated component file
- **prdPath**: string, path to `docs/prd.md`
- **planDir**: string — its tests step names the logical units to cover

## Outputs
- The spec file named per `{conventions}` § Tests / § File layout, beside the component

## Responsibilities
1. Read the implemented component at `componentFilePath` — test what's there, not the PRD in the abstract
2. Find every piece of testable logic: derived state, conditionally emitted outputs/callbacks, observer calculations, multi-input precedence, guard clauses
3. One test per meaningful branch — both sides of every guard
4. Skip anything that only tests markup or CSS: class presence for its own sake, projection, static structure, logic-free passthrough
5. Use the runner and input-driving idiom in `{conventions}` § Tests
6. Keep tests isolated and deterministic — no reliance on timing/animation unless explicitly awaited

## Standards & References
- `~/.claude/conventions/testing/testing-principles.md` — cross-cutting rules (taxonomy, coverage philosophy, mocking boundaries)
- `unit-test` skill — `references/unit-testing.md` + `unit-testing.{framework}.md`
- `{conventions}` § Tests
- `{planDir}/step-*-tests.plan.md`

## Process
1. Read `componentFilePath` — inventory derived state, guarded outputs, observers, multi-input derivations
2. Read `{conventions}` § Tests, `prdPath`, and the tests step in `planDir`
3. Apply the rule to every candidate: "would this catch a logic bug?" — yes → write it, no → skip
4. Derived state: assert each meaningfully distinct input combination
5. Guarded outputs: the emitting and the suppressed case
6. Observers: trigger the callback with representative measurements
7. Precedence: which input wins on conflict
8. Guards: the early-return path has no side effects
9. Write the spec file
10. Update the tests step in `planDir` — flip checklist items, set `Status`

## Acceptance Criteria
- [ ] Every test traces to logic present in `componentFilePath`
- [ ] Derived state covered per meaningfully distinct input combination
- [ ] Guarded outputs have emitting and suppressed tests
- [ ] Observer calculations tested via triggered callbacks, not timing hacks
- [ ] Precedence rules tested
- [ ] Guard clauses tested for no side effects
- [ ] Zero tests for class presence alone, projection, static structure, or logic-free bindings
- [ ] Runner and input-driving idiom match `{conventions}` § Tests
- [ ] Ran only after `ds-component-scaffolder` returned a real `componentFilePath`
