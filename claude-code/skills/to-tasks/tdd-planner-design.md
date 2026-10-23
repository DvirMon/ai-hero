# Design note — `tdd-planner` agent + `/to-tasks` TDD gate

Decided 2026-09-25, during `/impel 143` in `ng-table`.

## Problem

Testing reasoning is currently fully delegated to `test-implementer` — the
user never sees *why* a given seam gets a given test before the test file
exists. The user wants to write tests first (TDD, red-green) but also wants
visibility into the test design, to learn the reasoning rather than stay
hands-off on it.

## Decision

Add a new agent, `tdd-planner`, that takes one `/to-tasks` step file (or an
issue body, when a ticket has no step split) and produces a **test-design
doc** — not test code:

- which seams exist for this step
- one test per seam
- what each test asserts, and why
- the red-green-refactor order to write them in

Saved as `step-N.test-plan.md`, sibling to `step-N.plan.md`.

**Placement: plan-time, inside `/to-tasks`.** Produced and reviewed
alongside the implementation step plan, before `/impel` ever runs —
matches the existing plan-then-execute-in-a-separate-session habit
(`~/.claude/rules/plans-execute-in-separate-session.md`). Rejected:
execution-time inside `/impel` — would skip review for issues with no
`/to-tasks` split (e.g. #143, which went straight from issue body to
`ready-for-agent`).

## Downstream change — `/impel` execution order for a code+test pair

Once a step has an approved `step-N.test-plan.md`:

1. `test-implementer` writes the failing tests **from that approved plan**,
   not from its own judgment.
2. The code agent (`angular-implementer`/`react-implementer`/inline node)
   makes them pass, one seam at a time.
3. `/tdd`'s red-green discipline governs the loop, not "write file, run
   whole suite."

This reverses `/impel`'s current default line 148 — "A `story` or
`test` step always waits for the `code` step that produces its subject" —
for any step that has a `test-plan.md`. A step with no test-plan (docs,
chore, or code with no test seam) keeps today's ordering unchanged.

## Prior art / reference

- Matt Pocock's `skills/engineering/tdd/SKILL.md`
  (github.com/mattpocock/skills) — red-before-green, one seam at a time,
  no test written at an unconfirmed seam. This repo's `/impel` had
  silently dropped that default when it became a dispatcher — this design
  restores it, scoped to the planning step rather than execution.
- `~/.claude/skills/impel/SKILL.md` lines 80–92 (routing table), 148
  (test-waits-for-code rule), 150–153 (`/tdd` carve-out for `code`+`node`).

## Decisions made while building (2026-09-25)

D1 — A test plan is absorbed into its code step.
`step-N.test-plan.md` belongs to code step N. /to-tasks stops
making a separate `Task type: test` step for code that has a
test plan; /impel runs test-implementer (red) then the
code agent (green) inside step N. One step = one red-green
unit, one progress.md row. Separate `test` steps remain only
for code with no test plan. Rejected: keeping the test step
and reversing its edge (splits one unit across two steps).

D2 — Red-green grain: all red, then seams. Three phases per
planned step:
1. Red — test-implementer writes stub exports with the real
   signature (throwing `not implemented`) plus every logic
   test in the test plan; confirms each fails on its
   assertion, not on compile.
2. Green — the code agent makes them pass one seam at a time,
   in the plan's order, running only that seam's test.
3. Types — type-inference tests (`*.types.spec.ts`,
   `expectTypeOf`) are written after the code, by
   test-implementer. They check signature shape, not
   behaviour, so red-first adds little.
Why stubs: in TS a test importing a missing symbol fails to
compile, which hides the real red.
Rejected: alternating per seam (2 dispatches per seam, cold
context each turn); code agent doing both (tests written
without the unit-test skill's selection policy).

D3 — Loop rules live in the unit-test skill, not a new /tdd
skill. New file
`~/.claude/skills/unit-test/references/test-first.md` holds
the red, green and types-last rules; unit-test/SKILL.md gets
a "Test-first mode" pointer. unit-test owns *which* tests
(selection policy); test-first.md owns *when/in what order*.
They meet at seam choice — tdd-planner picks seams with
unit-test's policy — so one skill. The dead `/tdd` references
in implement/SKILL.md point to test-first.md instead.
Rejected: a separate tdd skill (second skill to keep in
sync); inlining in /impel (rules in dispatch text, not
something agents load).

D4 — tdd-planner runs as review round 2 in /to-tasks. Step 4
approves the step outline as before. New step 4b: tdd-planner
runs once per `code` step that has a test seam, in parallel,
read-only — it returns the test plan as text and writes
nothing. The user reviews the test plans (the learning
point). Step 5's single writer then writes step-N.plan.md and
step-N.test-plan.md together. Keeps the planner read-only and
the one-writer rule intact.
Rejected: one combined review before the outline settles
(outline changes make test plans stale); planner writing its
own file after step 5 (breaks one-writer, delays
ready-for-agent).

D5 — step-N.test-plan.md format, approved as drafted:
- Header: `# Step N test plan — <title>`, link to the step
  file, target spec file path.
- `## Stubs (red phase)` — signatures to stub, each throwing
  `not implemented`.
- `## Seams — in red-green order` — one `### <letter>. <seam>`
  per seam, each with: Test (`it(...)` name), Asserts, Why
  this seam (the bug it catches), Order reason.
- `## Types phase (after green)` — `expectTypeOf` checks.
- `## Not tested` — deliberately skipped items and why (cites
  unit-test's skip list).
The "why", "order reason" and "not tested" parts are the
reasoning the user wants to see.
Rejected: dropping Not tested; a summary table at the top
(duplicates the headings).

D6 — tdd-planner agent definition: lives at
`~/.claude/agents/tdd-planner.md`; `model: opus` (seam choice
is the reasoning the user wants to learn from, and it runs
once per code step at plan time, not in a loop — matches
discovery/story-discovery/sdlc-assessor); `tools: Read, Glob,
Grep` (read-only per D4). Rejected: sonnet (cheaper, but a
weak plan weakens every later phase); inherit.

### Found gaps

- No `/tdd` skill exists under ~/.claude/skills — /impel
  SKILL.md line 152 and this note both reference one. Resolved
  by D3 (test-first.md under unit-test).
- test-implementer step 2 returns `blocked` when code under
  test doesn't exist; it needs a test-plan (test-first) mode.

## Built (2026-09-25)

- `~/.claude/agents/tdd-planner.md` (new; opus, Read/Glob/Grep;
  returns the test-plan text).
- `~/.claude/skills/unit-test/references/test-first.md` (new;
  red / green / types rules) + a "Test-first mode" pointer in
  unit-test/SKILL.md.
- `to-tasks/SKILL.md`: new §4b review round; the writer also
  writes `step-N-<slug>.test-plan.md`; a code step with an
  approved plan absorbs its test step.
- `implement/SKILL.md`: three-phase dispatch table for code
  steps with a test plan; the old "/tdd" pointer now points to
  test-first.md.
- `test-implementer.md` gets `testPlanPath` + `phase:
  red|types`; `angular-implementer.md` and
  `react-implementer.md` get `testPlanPath` (green phase).

Note: file naming is `step-N-<slug>.test-plan.md` (matches
step files), not `step-N.test-plan.md`.

## Parked

- Whether `tdd-planner`'s output also needs a companion for issues with no
  `/to-tasks` split (like #143) — parked, not decided; the placement
  decision above implies these stay on the current test-after-code default
  until they go through `/to-tasks`.
