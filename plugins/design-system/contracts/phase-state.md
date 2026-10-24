# Component phase state

Each component under construction carries two files in `{docsDir}`:

- `phase-state.json` — machine state. Downstream phases read their inputs from it.
- `session-handoff.md` — the human checklist: current phase and next step only
  (template: `${CLAUDE_PLUGIN_ROOT}/skills/ds-wayfinder/references/session-handoff-template.md`).

When the two disagree with the artifacts on disk, trust the artifacts and say so.

## `phase-state.json`

Every phase merges its keys in; none removes another phase's keys.

| Key | Written by | Value |
|---|---|---|
| `componentName` | ds-discovery | kebab-case name |
| `figmaUrl` | ds-discovery | URL · `null` |
| `workType` | ds-discovery | `new` · `variant` · `modify` · `tokens` |
| `discoverySummaryPath` | ds-discovery | path relative to `{componentPath}` |
| `verdictChoice` | ds-discovery | `build-new` · `extend` · `reuse` |
| `interviewComplete` | ds-interview | boolean |
| `isComplex` | ds-interview | boolean |
| `scopeTriage` | ds-interview | `[{ subPart, rank: core·independent·dependent, dependsOn[] }]` |
| `a11ySpecText` | ds-spec | inline spec (non-complex) · `null` |
| `a11ySpecPath` | ds-spec | path relative to `{componentPath}` (complex) · `null` |
| `planDir` | ds-plan | repo-relative path to the active version folder |
| `includeStorybook` · `includeTests` | ds-plan | boolean |
| `componentFilePath` · `stylesFilePath` | ds-scaffold | absolute paths |

## Artifacts

| File in `{docsDir}` | Written by |
|---|---|
| `discovery-summary.md` | ds-discovery |
| `decisions.md` | ds-interview |
| `prd.md`, `roles-map.md` (complex), `architecture.md` (complex) | ds-spec |
| `{plansDir}/v*/step-*.plan.md`, `progress.md` | ds-plan |
| `{plansDir}/v*/review-issues.md` | ds-review |
