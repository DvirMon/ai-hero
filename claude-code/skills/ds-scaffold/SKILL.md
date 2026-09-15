---
name: ds-scaffold
description: Phase 5 of DS component creation — scaffolds Angular component, styles, Storybook, and tests in parallel. Run after ds-plan, after the phase-end /compact.
---

# DS Component Builder — Phase 5: Scaffold

## Config Setup

Discovers `{projectPath}/.claude/ds-wayfinder.config.json` (walks up from component path):
- Framework-specific scaffold template path
- Output structure (docs dir)

Read styling guide agnostic: `.claude/skills/css-styling/SKILL.md` (see its "DS Components" section for the stricter rules)
Read styling guide framework: `.claude/skills/css-styling/references/styles.{framework}.md` (see each file's DS-scoped subsections)
Read test guide agnostic: `.claude/skills/ds-scaffold/references/unit-testing.md`
Read test guide framework: `.claude/skills/ds-scaffold/references/unit-testing.{framework}.md`
Read file structure agnostic: `.claude/skills/ds-scaffold/references/file-structure.md`
Read file structure framework: `.claude/skills/ds-scaffold/references/file-structure.{framework}.md`

---

## On start

Ask the user for the component name and which version to scaffold (e.g. "V1 Core"), then read `{componentPath}docs/session-handoff.md`.

If the "Task Plan" checklist item is not marked complete → tell the user to finish `ds-plan` first.

From `{componentPath}docs/phase-state.json`, load:
- `planDir` — path to the version subfolder (e.g. `.claude/plans/NNN-atera-{name}/v1-core/`)
- `includeStorybook`, `includeTests` — from Task Plan decisions (user may override now)
- `discoverySummaryPath` — relative path to the discovery summary used to source `figmaTokens` (e.g. `"docs/discovery-summary.md"`)

Ask if they want to confirm or change the storybook/tests choices before launching.

## Pre-scaffold: classify responsibilities

Before launching any agents, classify the component responsibilities from the PRD (`prdPath`) (directive / service / utils / component) and pass the classification as `srpClassification` input to the Angular scaffolder.

## Launch agents

### Phase A — Angular + Styles (parallel, run first)

| Agent | subagent_type | model | When | Inputs |
|---|---|---|---|---|
| Angular scaffolder | `ds-angular-scaffolder` | sonnet | Always | componentName, componentPath, prdPath, a11ySpec, apiSpec, planDir, srpClassification |
| Styles scaffolder | `ds-styles-scaffolder` | sonnet | Always | componentName, componentPath, prdPath, figmaTokens (from handoff), planDir |

Wait for both Phase A agents to complete before proceeding.

### Phase B — Tests + Storybook (parallel, run after Phase A)

Run only after the Angular scaffolder has returned and `componentFilePath` (the generated `.component.ts`) is known.

| Agent | subagent_type | model | When | Inputs |
|---|---|---|---|---|
| Storybook scaffolder | `ds-storybook-scaffolder` | sonnet | `includeStorybook` | componentName, componentPath, prdPath, componentApiSummary, planDir |
| Test scaffolder | `ds-test-scaffolder` | sonnet | `includeTests` | componentName, componentPath, componentFilePath, prdPath, planDir |

`figmaTokens` = design tokens from `{componentPath}{discoverySummaryPath}` — resolve `discoverySummaryPath` from `phase-state.json` (e.g. `"docs/discovery-summary.md"`) and join it to `componentPath`.

`a11ySpec` = inline accessibility text, sourced from `{componentPath}docs/phase-state.json`:
- If `a11ySpecText` is set (non-complex): use its value as the inline text.
- If `a11ySpecPath` is set (complex): read `{componentPath}{a11ySpecPath}` and pass its full content as inline text.
Do **not** pass a file path — `ds-angular-scaffolder` expects inline text for `a11ySpec`.

`prdPath` = path to `{componentPath}docs/prd.md` — passed as a file path to all scaffolders.

`apiSpec` = **inline API text** (not a file path) — read the public API section of `prd.md` and extract inputs, outputs, and content slots as inline text before invoking `ds-angular-scaffolder`.

`componentApiSummary` = a concise summary derived from `{componentPath}docs/prd.md` — specifically the public API section listing all inputs, outputs, and content slots. Read that section of the PRD and extract or summarize it before invoking `ds-storybook-scaffolder`.

## After agents return

### Update progress tracking

For each scaffolder that returned successfully, update the corresponding step plan files — change `Status: pending` → `Status: completed`:
- `ds-angular-scaffolder` → step files it owns (Glob for files with agent name)
- `ds-styles-scaffolder` → its step file
- `ds-test-scaffolder` → its step file
- `ds-storybook-scaffolder` → its step file

Update `progress.md` — mark each completed step row with ✅ `completed`. Mark failed steps with ❌ `failed`.

Report all generated files to the user as clickable links.

## Write handoff

Merge `componentFilePath` and `scssFilePath` into `{componentPath}docs/phase-state.json` (preserve existing keys):

```json
{
  "componentFilePath": "<absolute path to the generated .ts component file>",
  "scssFilePath": "<absolute path to the generated .scss styles file>"
}
```

Update `{componentPath}docs/session-handoff.md` — mark the "Scaffold" checklist item complete, update "What to do next". List all generated files to the user as clickable links.

## Continuation

Print:

```
Scaffold complete.

/compact Keep: componentPath, phase-state.json values (componentFilePath, scssFilePath, planDir), prdPath. Drop: raw scaffolder-agent code-generation transcripts and progress.md narration — the generated code and progress state live on disk already.

Then run `ds-review <name>` next.
```
