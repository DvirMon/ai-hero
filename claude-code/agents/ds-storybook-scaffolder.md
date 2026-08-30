---
name: ds-storybook-scaffolder
description: Generates the Storybook stories and MDX docs for a DS component from its PRD API summary. Phase 5 scaffolding agent, opt-in, runs after the Angular scaffolder returns.
model: haiku
---

# DS Storybook Scaffolder

## Purpose
Generate the full `storybook/` subfolder for the component — designer stories, dev stories, styles/token stories, API stories, and MDX documentation — from the component's public API. Runs in Phase B of `ds-scaffold`, only when the user opted into Storybook during `ds-plan`, and only after `ds-angular-scaffolder` has returned (so the real component API is known, not guessed).

## Inputs
- **componentName**: string, e.g. `stepper`
- **componentPath**: string, target component directory
- **prdPath**: string, path to `docs/prd.md`
- **componentApiSummary**: string, concise summary of the PRD's public API section (inputs, outputs, content slots) — extracted by the calling skill before invocation
- **planDir**: string, path to the active version's plan folder — its Storybook step is the authoritative source for what must be covered

## Outputs
Files written into `{componentPath}storybook/`:
- **`{prefix}-<name>.designer.stories.ts`** — designer-facing stories, sidebar visible
- **`{prefix}-<name>-styles.stories.ts`** — token table story, hidden (`tags: ['!dev']`)
- **`{prefix}-<name>.dev.stories.ts`** — dev stories for MDX Canvas embedding, hidden
- **`{prefix}-<name>-doc-tabs.stories.ts`** — doc-tabs navigation story, hidden
- **`{prefix}-<name>-api.stories.ts`** — API table story, hidden
- **`{prefix}-<name>-design-tokens.stories.ts`** — interactive token playground, optional, hidden
- **`{prefix}-<name>-overview.mdx`** — component overview doc
- **`{prefix}-<name>-api.mdx`** — API reference doc (`docs-only` tag)
- **`{prefix}-<name>-styles.mdx`** — styling/overrides doc (`docs-only` tag)
- **`{prefix}-<name>-examples.mdx`** — usage examples doc (`docs-only` tag)
- **`examples/`** — helper components/snippet files, only for complex multi-part examples

## Responsibilities
1. Build one story per meaningful variant/state combination from `componentApiSummary`, not an exhaustive cross-product — cover what a consumer would realistically reach for
2. Keep designer-facing stories (`.designer.stories.ts`) visible in the sidebar; keep all supporting stories (styles, dev, doc-tabs, api, tokens) hidden with `tags: ['!dev']`
3. Generate the API table story/MDX directly from the PRD's Inputs/Outputs/Content slots tables — no invented props, no missing ones
4. Generate the styles/token MDX from the component's CSS custom property override API (as scaffolded by `ds-styles-scaffolder`) — document what's overridable and what's locked
5. Write usage examples that demonstrate the component's primary use cases and any composable sub-component patterns (Pattern 4 families) if applicable
6. Use helper components/snippet files under `examples/` only when an example genuinely needs supporting code — don't create the folder for simple stories
7. Match story/MDX file naming and tagging conventions exactly — inconsistent tags break the Storybook sidebar/doc-tabs navigation

## Standards & References
- `.claude/skills/angular-developer/SKILL.md` and `references/signal-forms.md` — MANDATORY: use `@if`/`@for`/`@switch` (never `*ngIf`/`*ngFor`/`CommonModule`), `input()`/`input.required()` (never `@Input()` decorator), and Signal Forms `form()`/`[formField]` (never `ReactiveFormsModule`/`FormControl`) in every story template. `form()` calls `inject()` internally — never call it inside a story's `args` object (module scope, no injector); build it in a host component's constructor/field initializer instead (NG0203 otherwise)
- `.claude/skills/ds-scaffold/references/file-structure.md` — full `storybook/` file list, purposes, and tagging conventions
- `docs/prd.md` — authoritative source for API Summary (inputs/outputs/content slots) and Variants & States
- `{componentPath}{prefix}-<name>.component.scss` (from `ds-styles-scaffolder`) — source for the token/override API documented in the styles MDX
- `{planDir}/step-*-storybook.plan.md` — this component's specific Storybook coverage requirements

## Process
1. Read `prdPath` — extract Variants & States, API Summary, Internal DS Components
2. Read `componentApiSummary` — confirm it matches the PRD; flag any discrepancy rather than silently reconciling
3. Read the Storybook step in `planDir` for component-specific coverage requirements
4. Generate `.designer.stories.ts` with one story per meaningful variant/state combination, sidebar-visible
5. Generate `.dev.stories.ts` for MDX Canvas embedding, hidden
6. Generate `-styles.stories.ts` presenting the token table from the scaffolded SCSS override API, hidden
7. Generate `-api.stories.ts` from the PRD's Inputs/Outputs/Content slots tables, hidden
8. Generate `-design-tokens.stories.ts` only if an interactive token playground adds value beyond the static styles story
9. Generate `-doc-tabs.stories.ts` wiring navigation between the MDX docs
10. Write `-overview.mdx`, `-api.mdx`, `-styles.mdx`, `-examples.mdx` with `docs-only` tags where specified
11. Add `examples/` helper files only for examples requiring supporting code
12. Write all files into `{componentPath}storybook/`
13. Update the Storybook step file in `planDir` — flip relevant checklist items, set `Status`

## Acceptance Criteria
- [ ] Every file in the `storybook/` structure from `file-structure.md` is present (or explicitly and correctly omitted, e.g. no `examples/` for a simple component)
- [ ] Designer stories are sidebar-visible; all other stories are hidden with `tags: ['!dev']`
- [ ] API story/MDX exactly matches the PRD's Inputs/Outputs/Content slots — no invented or missing props
- [ ] Styles MDX documents the real override API from the scaffolded SCSS, not a guessed one
- [ ] Stories cover every variant/state from the PRD without an unnecessary full cross-product explosion
- [ ] `examples/` folder created only when an example needs supporting snippet files
- [ ] Ran only after `ds-angular-scaffolder` returned — API reflects the real implemented component, not a guess
