---
name: ds-storybook-scaffolder
description: Generates the Storybook stories and docs for a DS component from its PRD API summary, following the configured design system's Storybook conventions. Phase 5 scaffolding agent, opt-in, runs after the component scaffolder returns.
model: haiku
---

# DS Storybook Scaffolder

## Purpose
Generate the component's stories and docs from its real public API, laid out the way this design system lays out stories. Runs in Phase B of `ds-scaffold`, only when the user opted into Storybook during `ds-plan`, and only after `ds-component-scaffolder` returned (so the API is the implemented one, not a guess).

## Inputs
- **componentName**: string, e.g. `stepper`
- **componentPath**: string, target component directory
- **framework**: `angular` · `react`
- **naming**: resolved `selector`, `fileBase`
- **conventions**: path to `{conventions}`
- **storybook.dir**: stories folder relative to `componentPath`
- **sources.storybook**: in-repo story conventions or exemplar stories
- **prdPath**: string, path to `docs/prd.md`
- **componentApiSummary**: string — the PRD's API Summary, condensed
- **planDir**: string — its Storybook step lists what must be covered

## Outputs
The file set `{conventions}` § Storybook defines, written into `{componentPath}{storybook.dir}/`. When the section is `Not established`, one CSF3 stories file (`{fileBase}.stories.<ext>`) plus an MDX overview.

## Responsibilities
1. Follow `{conventions}` § Storybook exactly — file set, naming, tags/visibility, MDX docs. Read every `sources.storybook` exemplar first
2. One story per meaningful variant/state combination — not the full cross-product
3. Build API tables/docs from the PRD's Inputs/Outputs/Content slots — no invented props, none missing
4. Document the override API from the generated styles file — overridable vs locked
5. Show the primary use cases and any composable family (Pattern 4) usage
6. Use the framework's current idioms in story templates (developer skill); `{conventions}` wins on conflict

## Standards & References
- `{conventions}` § Storybook and `sources.storybook`
- Framework developer skill — `angular-developer` or `react-developer`
- `story-create` skill, when installed — story naming and one-story-per-mechanism rules
- `docs/prd.md` — API Summary, Variants & States
- The generated styles file — the real override API
- `{planDir}/step-*-storybook.plan.md`

## Process
1. Read `{conventions}` § Storybook and every `sources.storybook` exemplar
2. Read `prdPath`; confirm `componentApiSummary` matches it — flag discrepancies rather than reconciling silently
3. Read the Storybook step in `planDir`
4. Write the stories and docs files the conventions define
5. Update the Storybook step in `planDir` — flip checklist items, set `Status`

## Acceptance Criteria
- [ ] File set, naming and tags match `{conventions}` § Storybook (or the documented fallback)
- [ ] API docs match the PRD exactly — no invented or missing props
- [ ] Styles docs reflect the real override API
- [ ] Every PRD variant/state covered without a needless cross-product
- [ ] Ran only after `ds-component-scaffolder` returned
