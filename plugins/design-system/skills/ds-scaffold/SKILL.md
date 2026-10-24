---
name: ds-scaffold
description: Phase 5 of DS component creation — scaffolds the component, styles, Storybook, and tests in parallel, for the framework in the design-system config. Run after ds-plan, after the phase-end /compact.
---

# DS Component Builder — Phase 5: Scaffold

## Config

Resolve the config per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md` and read `{conventions}`.
Missing either → stop and point to `/ds-setup`.

Agents load their own guides; this skill only gathers inputs. The guides they use:

- The stack skills in `stacks.*.skill`, when set (`ds-config.md` § Slots)
- `references/motion.md`
- `{conventions}` — component shape, file layout, styling, tests
- Storybook conventions and stack — the DS project's `.claude/story.json` entry, read by
  `/story:create` and `story:implementer`, not by this skill

---

## On start

Ask the user for the component name and which version to scaffold (e.g. "V1 Core"), then read `{docsDir}session-handoff.md`.

If the "Task Plan" checklist item is not marked complete → tell the user to finish `ds-plan` first.

From `{docsDir}phase-state.json`, load:
- `planDir` — the version subfolder under `{plansDir}`
- `includeStorybook`, `includeTests` — from Task Plan decisions (user may override now)
- `discoverySummaryPath` — source of `figmaTokens`

Ask if they want to confirm or change the Storybook/tests choices before launching.

## Pre-scaffold: classify responsibilities

Classify the component's responsibilities from the PRD (`prdPath`) — behavior unit (directive/hook) / service / utils / component — and pass the result as `srpClassification` to the component scaffolder.

## Launch agents

Every agent also receives: `framework`, the resolved `naming` patterns, `{componentPath}`,
`{conventions}`, and `planDir`.

### Phase A — Component + Styles (parallel, run first)

| Agent | subagent_type | model | When | Extra inputs |
|---|---|---|---|---|
| Component scaffolder | `design-system:ds-component-scaffolder` | sonnet | Always | componentName, prdPath, a11ySpec, apiSpec, srpClassification, `publicApi`, `{importPath}`, `{frameworkSkill}` |
| Styles scaffolder | `design-system:ds-styles-scaffolder` | sonnet | Always | componentName, prdPath, figmaTokens, `tokens`, `styles.language`, `stacks.css.skill` |

Wait for both before Phase B.

### Phase B — Tests + Storybook (parallel, after Phase A)

Run only after the component scaffolder returned `componentFilePath`.

| Work | Runs | When | Extra inputs |
|---|---|---|---|
| Test scaffolder | agent `design-system:ds-test-scaffolder` (sonnet) | `includeTests` | componentName, componentFilePath, prdPath, `stacks.test.skill` |
| Storybook | skill `/story:create`, once per story | `includeStorybook` | componentName, componentFilePath, prdPath, componentApiSummary, the story's line from the step file |

**Storybook.** The `step-*-storybook*` file(s) in `planDir` list the stories to create, one
per mechanism. Invoke `/story:create` once per listed story, passing the component, `prdPath`
and `componentApiSummary` as context. It writes the story spec at `story.json` `paths.specs`
and dispatches the `story:implementer` agent, which loads the stack from `skills.implement`
and follows `docs.conventions`. This skill passes no Storybook path, source or skill — those
live in the DS project's `.claude/story.json` entry. No entry → `/story:create` runs
`/story:setup`; a `blocked` implementer report is a ❌ for that step.

### Inputs

- `figmaTokens` — the Tokens section of `{componentPath}{discoverySummaryPath}`.
- `a11ySpec` — **inline text**: `a11ySpecText` when set (non-complex), else the content of
  `{componentPath}{a11ySpecPath}` (complex). Never a path.
- `prdPath` — `{docsDir}prd.md`, passed as a path.
- `apiSpec` — **inline text**: the PRD's API Summary (inputs, outputs, content slots).
- `componentApiSummary` — the same API Summary, condensed, for `/story:create`.

## After agents return

### Update progress tracking

For each scaffolder that returned successfully, flip its step files in `planDir` from
`Status: pending` → `Status: completed` (Glob for step files naming the agent). A Storybook
step completes when every story it lists came back from `story:implementer` as done. Update
`progress.md` — ✅ `completed` per finished step, ❌ `failed` per failed one.

Report all generated files as clickable links.

## Write handoff

Merge into `{docsDir}phase-state.json` (preserve existing keys):

```json
{
  "componentFilePath": "<absolute path to the generated component file>",
  "stylesFilePath": "<absolute path to the generated styles file>"
}
```

Update `{docsDir}session-handoff.md` — mark "Scaffold" complete, update "What to do next".

## Continuation

```
Scaffold complete.

/compact Keep: componentPath, phase-state.json values (componentFilePath, stylesFilePath, planDir), prdPath. Drop: raw scaffolder transcripts and progress.md narration — the code and progress state live on disk already.

Then run `ds-review <name>` next.
```
