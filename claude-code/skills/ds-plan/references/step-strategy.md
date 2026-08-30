# Step Strategy — DS Component Plans

Rules for how implementation plan steps must be structured, ordered, and scoped.
Extracted from the user-level workflow skill for repo-level portability.

> `{dsComponentsRoot}` = the design system's shared components root (resolved from `designSystem.path` + `componentPathPattern` in the project's `ds-wayfinder.config.json`).

---

## Dependency Graph Reasoning (before ordering)

Before assigning step numbers, apply `dependency-task-graph` (the execution specialization of
`decompose-by-dependency-graph`): list the candidate steps, map the edges between them (does
step B need a file/type/decision step A produces?), then rank each as core (others depend on
it), independent/leaf (nothing depends on it, depends on nothing), or dependent (needs another
step resolved first). An edge is real only when B cannot compile, run, or be reviewed without
A's output — not merely "logically comes after" in the heuristic below.

The phase heuristic below is the *default* linearization for presentation and file order, not
proof of a dependency. Two steps adjacent in the heuristic (e.g. template and styles) are
independent unless the graph shows an actual edge — mark them `Parallel-safe with: Step N`
rather than leaving an implied sequential dependency. Steps genuinely gated by the graph keep
`Depends on: Step N`.

## Step Ordering Heuristic

Default to this presentation order. Adjust only when a hard compilation dependency forces it:

1. Types / union types / model definitions
2. Component class (inputs/outputs, primitive wiring, reactive state — Angular: host bindings, CDK wiring, signals; React: props/callbacks, hooks, primitive wiring)
3. Template (slots, structural elements, control flow)
4. Styles (SCSS — tokens, variants, states, override API)
5. Accessibility verification (review gate — not a scaffold step)
6. Tests
7. Storybook
8. Code Connect

---

## Atomic Step Rules

Each step must:
- Touch the **minimum number of files** needed for that concern
- Be **independently reviewable** — someone reading only the step file should understand what to do
- Be **independently deployable** unless an explicit dependency is noted

If a step must ship after another, mark it:
```
Depends on: Step N
```

If a step has no edge to another step in the graph (safe to build/review in any order relative
to it), mark it:
```
Parallel-safe with: Step N, Step M
```

---

## Step File Required Sections

Every `step-N-*.plan.md` must contain all of these:

- **Title** — concise name
- **PR scope** — `Standalone`, `Depends on Step N`, or `Parallel-safe with Step N` (from the dependency graph, not the presentation order)
- **Skills used** — list the skill names that guide implementation (e.g. `angular-dev-v21`, `css-styling`)
- **Scaffolding agent** — the `ds-*` agent that executes this step
- **Files** — exact file paths to create or modify
- **Why This Step Exists** — why it is needed now and what it unlocks
- **What To Do** — concrete description of changes, traced back to PRD or architecture doc
- **Implementation Notes** — local constraints, architectural notes
- **Risks / Watchouts** — what could regress if implemented incorrectly
- **Non-Goals** — what this step must NOT change
- **Acceptance Checks** — concrete, checkable items (not vague assertions)

---

## DS Component Plans — Styling Step Requirements

The styles step (`step-4-styles.plan.md`) must include:

- **Design token table** — Level 1 internal tokens → Level 2 consumer-overridable tokens
- **Override API** — which CSS custom properties consumers can set, with recommended bounded values
- **Locked tokens** — what is intentionally NOT exposed (DS-controlled only)
- **Prior art analysis** — how existing sibling components handle similar overrides (search `{dsComponentsRoot}`)
- **Parent ownership check** — does a parent component already own this concern (e.g. form-field owns input sizing)? Don't duplicate.
- **No component-state props for visual styling** — all consumer overrides via SCSS/CSS-Module token API only
- **Reference-library comparison** — what the framework's primitive/reference library exposes for the same component vs what Atera needs to expose (Angular: Angular Material/CDK; React: Radix/React Aria/MUI)

---

## Behavior-Unit Naming — Verify Against Codebase

Before writing any behavior-unit (directive/hook/composable) selector or name in a plan step, grep the existing DS 2.0 codebase to confirm the current convention:

```
# Angular
grep -r "selector:" {dsComponentsRoot} --include="*.directive.ts"

# React
grep -r "^export function use" {dsComponentsRoot} --include="*.ts"
```

Use whatever convention the codebase shows. Do NOT hardcode an assumed format — derive it from the live code so the plan stays in sync with the project.

---

## Core-Minimal First

**Always plan the smallest working implementation first.**

1. Ask: what is the minimum that makes this component useful? Plan only that.
2. Defer enhancements explicitly — if a richer API (custom label slot, portal, lazy content) is known but not strictly required, name it in `overview.md` Out of Scope and do not create a step for it.
3. Do not pre-wire for future complexity — no placeholder injections, no unused abstractions, no "Phase 2" stubs.

---

## Step Granularity Rules

- If a step cannot be described in **1–3 sentences**, it is too large — split it
- Only include steps that are **actually needed** for the stated goal
- Steps should be **independent by default** — only add `Depends on` when the graph shows a hard edge (compilation failure, runtime error, broken binding); otherwise mark `Parallel-safe with`
- Every step **must have its own `.plan.md` file** — never collapse two concerns into one file
