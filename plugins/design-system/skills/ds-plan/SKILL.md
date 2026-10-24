---
name: ds-plan
description: Phase 4 of DS component creation — generates the versioned implementation task plan. Run after ds-spec, after the phase-end /compact.
---

# DS Component Builder — Phase 4: Task Plan

## Config Setup

Discovers `{projectPath}/.claude/ds-wayfinder.config.json` (walks up from component path):
- Output structure (where to write task plan)

Read task template agnostic: `.claude/skills/ds-plan/references/tasks.md`
Read task template framework: `.claude/skills/ds-plan/references/tasks.{framework}.md`
Read step strategy: `.claude/skills/ds-plan/references/step-strategy.md`
Read file structure agnostic: `.claude/skills/ds-scaffold/references/file-structure.md`
Read file structure framework: `.claude/skills/ds-scaffold/references/file-structure.{framework}.md`

---

## On start

Ask the user for the component name, then read `{componentPath}docs/session-handoff.md`.

If the "Spec" checklist item is not marked complete → tell the user to finish `ds-spec` first.

## Ask before launching

Ask:
> "Should I also generate:
> - Storybook stories + API docs?
> - Unit tests?
> (Both are optional — decide now so the plan includes those steps)"

Record `includeStorybook` and `includeTests` from the user's answer.

## Launch agent

| Agent | subagent_type | model | Inputs |
|---|---|---|---|
| Task planner | `ds-task-planner` | sonnet | componentName, componentPath, prdPath, isComplex, includeStorybook, includeTests, scopeTriage |

`isComplex` and `scopeTriage` are read from `{componentPath}docs/phase-state.json`.

The agent generates one plan folder per version bucket:

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

Present every plan folder and file as clickable links, grouped by version:

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

/compact Keep: componentPath, phase-state.json values (planDir, includeStorybook, includeTests), prdPath. Drop: full task-plan generation output and developer-checkpoint discussion — fully written to the plan's step files already.

Then run `ds-scaffold <name>` next.
```
