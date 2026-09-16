---
name: ds-plan
description: Phase 4 of DS component creation — generates the versioned implementation task plan. Run after ds-spec, after the phase-end context trim.
portedFrom: f1bf097e92c1
---

# DS Component Builder — Phase 4: Task Plan

## Config Setup

Discover `{projectPath}/.claude/ds-wayfinder.config.json` (walk up from component path):
- Output structure (where to write task plan)

Read task template agnostic: `~/.cursor/skills/ds-plan/references/tasks.md`
Read task template framework: `~/.cursor/skills/ds-plan/references/tasks.{framework}.md`
Read step strategy: `~/.cursor/skills/ds-plan/references/step-strategy.md`
Read file structure agnostic: `~/.cursor/skills/ds-scaffold/references/file-structure.md`
Read file structure framework: `~/.cursor/skills/ds-scaffold/references/file-structure.{framework}.md`

---

## On start

Ask the user for the component name, then read `{componentPath}docs/session-handoff.md`.

If the "Spec" checklist item is not marked complete → tell the user to finish `ds-spec` first.

## Ask before generating

Ask conversationally:
> "Should I also generate:
> - Storybook stories + API docs?
> - Unit tests?
> (Both are optional — decide now so the plan includes those steps)"

Record `includeStorybook` and `includeTests` from the user's answer.

## Generate the task plan yourself

There is no subagent to dispatch this to — do the planning work directly, in this session, following the process below (this is the substance of what the Claude Code version's `ds-task-planner` agent does).

`isComplex` and `scopeTriage` are read from `{componentPath}docs/phase-state.json`.

**Inputs to read first:**
1. `docs/prd.md` in full — pull scope (by version), API summary, acceptance criteria.
2. If `isComplex`, `docs/architecture.md` — pull component pattern, hierarchy, primitive wiring, state machine.
3. The a11y spec (inline text or `docs/roles-map.md`, per `phase-state.json`) — pull keyboard contract, ARIA attributes, focus behavior.

**Build the plan:**
1. Group PRD/architecture requirements by version bucket per `scopeTriage`.
2. For each version bucket with assigned features, generate the ordered step sequence: types/public-api skeleton → component class → template → styles → a11y verification → tests (if `includeTests`) → Storybook (if `includeStorybook`) → Code Connect.
3. Before naming any directive/behavior-unit, search the live codebase for the current naming convention (e.g. grep for `selector:` in `*.directive.ts` or the framework equivalent) and use the convention found, not an assumed one.
4. Write the styles step with the full DS styling requirements: design token table (Level 1 → Level 2), override API, locked tokens, prior-art analysis of existing v2 components, parent-ownership check, reference-library comparison.
5. Populate every step file's required sections in full: Title, PR scope, Skills used, Files, Why This Step Exists, What To Do, Implementation Notes, Risks/Watchouts, Non-Goals, Acceptance Checks.
6. Before ordering, apply `dependency-task-graph` (execution specialization of `decompose-by-dependency-graph`): map real edges between candidate steps (does step B need a file/type step A produces to compile, run, or be reviewed?). Mark `Depends on: Step N` only for hard compile/runtime dependencies found in the graph; mark `Parallel-safe with: Step N` for steps with no real edge between them — default every step to independently deployable.
7. Keep every step atomic — minimum files touched, independently reviewable, describable in 1–3 sentences; split further if not.
8. Only generate Storybook steps if `includeStorybook`; only generate test steps if `includeTests`.
9. Plan the smallest working V1 first — defer named-but-not-required enhancements to later versions or `Out of Scope`, never pre-wire for future complexity.
10. Copy Acceptance Criteria verbatim from `docs/prd.md` into the relevant step(s) — never paraphrase the definition of done.

**Output structure** — one plan folder per version bucket, omit any version folder with zero assigned features:

```
.claude/plans/NNN-atera-{name}/
  v1-core/
    step-1.plan.md
    step-2.plan.md
    ...
  v2-enhancement/
    ...
  v3-additional/
    ...
  v4-nice-to-have/   ← only if features assigned
    ...
```

Each version folder ships as a separate PR.

## Developer checkpoint

Present every plan folder and file as clickable/relative-path links, grouped by version:

> "Here is the implementation plan grouped by PR:
> - **V1 Core:** [step files]
> - **V2 Enhancement:** [step files]
> - ...
> Each version ships as a separate PR. Please review and confirm before scaffolding begins."

Wait for explicit approval before continuing.

## Write handoff

Merge `planDir`, `includeStorybook`, and `includeTests` into `{componentPath}docs/phase-state.json` (preserve existing keys).

Update `{componentPath}docs/session-handoff.md` — mark the "Task Plan" checklist item complete, update "What to do next".

Print:

```
Task plan complete.

Before continuing, drop the full task-plan generation output and developer-checkpoint discussion from working context — fully written to the plan's step files already. Keep: componentPath, phase-state.json values (planDir, includeStorybook, includeTests), prdPath.

Then run the ds-scaffold skill for <name> next.
```
