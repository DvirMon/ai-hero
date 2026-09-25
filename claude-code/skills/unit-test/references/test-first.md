# Test-first mode

Applies when a `code` step has an approved `step-N.test-plan.md`
beside its `step-N.plan.md`. Everything else in this skill decides
*which* tests to write; this file decides *when*, and in what
order.

The test plan is the contract. Seams, their order, the stubs and
the skip list were chosen at plan time and reviewed by the user.
Don't re-choose them while executing — a plan that looks wrong is
reported, not silently corrected.

Three phases, three owners:

| Phase | Owner | Writes |
|---|---|---|
| Red | `test-implementer` (`phase: red`) | stubs + every logic test |
| Green | the step's code agent | the implementation |
| Types | `test-implementer` (`phase: types`) | `*.types.spec.ts` |

## 1. Red

1. Create each stub under the plan's **Stubs** heading, in the
   file the step's `Files` list names for that symbol. Real
   exported signature, body only
   `throw new Error('not implemented: <name>')`. No logic.
2. Write every test under **Seams**, in plan order, with the
   `it(...)` names the plan gives.
3. Typecheck through the spec config. It must pass. A compile
   error here means a stub signature is wrong — fix the stub,
   never loosen the test.
4. Run the spec file. Every planned test must fail, on
   `not implemented` or on an assertion.
5. A planned test that **passes** against a stub cannot fail.
   Keep it, and report it as a plan defect.
6. Don't write the types-phase tests yet.

Why stubs: in TypeScript a test that imports a missing symbol
fails to compile. That hides the real red — you learn nothing
about whether the assertion is right.

## 2. Green

1. Take the seams in plan order. For each one:
   - write the least code that makes that seam's test pass;
   - run only that test (`-t "<it name>"` /
     `--testNamePattern`).
2. Never edit, skip, or weaken a test to get green. A test that
   looks wrong → stop, return `blocked`, name the seam.
3. After the last seam: refactor if the code asks for it, then
   run the whole spec file once. Earlier seams must still pass.
4. No stub may remain. Grep for `not implemented:` before
   reporting.

## 3. Types

Written after green, against the finished signatures:
`expectTypeOf` checks from the plan's **Types phase** heading,
in the domain's `*.types.spec.ts`.

These check the signature's shape, not behaviour, so a red-first
pass adds little. Typecheck through the spec config — for type
tests the typecheck *is* the test run.

## Not tested

The plan's **Not tested** list is binding in both directions:
don't add tests for those items, and don't drop the reason when
reporting.
