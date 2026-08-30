---
name: ds-ship
description: Phase 7 of DS component creation — exports the component, issues Code Connect reminder, and runs final checklist. Runs after ds-review.
---

# DS Component Builder — Phase 7: Ship

> `{componentPath}` = this component's own working directory. `{dsComponentsRoot}` = the design system's shared components root (resolved from `designSystem.path` + `componentPathPattern` in the project's `ds-wayfinder.config.json`).

## Config Setup

Discovers `{projectPath}/.claude/ds-wayfinder.config.json` (walks up from component path):
- Project name, framework (determines export targets)

---

## On start

Ask the user for the component name, then read `{componentPath}docs/session-handoff.md`.

Previous phase must be `ds-review` (which runs after `ds-scaffold`). If not complete → tell the user to run it first.

## Ship steps

1. Ensure the component's `public-api.ts` and `index.ts` exist under its directory (`{componentPath}`, e.g. `libs/shared/ui-core/src/lib/components/2.0/atera-{name}/` for this repo's config). There is no single root barrel — each component is self-contained. To locate the correct parent path, check neighbouring components under `{dsComponentsRoot}`.
2. Remind the user to invoke the `figma-code-connect` skill to publish the Code Connect mapping file

## Final checklist

Run through this and report status for each item:

- [ ] Research Summary produced — variants, states, tokens, primitive candidate, a11y role
- [ ] Design interview complete — `docs/decisions.md` written
- [ ] `docs/prd.md` generated and approved
- [ ] A11y spec defined — complex components: `docs/roles-map.md`; non-complex components: `a11ySpecText` in `phase-state.json`
- [ ] `docs/architecture.md` generated (complex components only)
- [ ] Developer checkpoint (spec) passed
- [ ] Task plan generated with step files
- [ ] Developer checkpoint (plan) passed
- [ ] `{prefix}-{name}.component.ts` — OnPush, inject(), input()/output(), host bindings
- [ ] Template uses DS atomics (`<button {prefix}-button>`, `<{prefix}-icon-2>`)
- [ ] Icon keys confirmed — no placeholder `uii_` keys
- [ ] `{prefix}-{name}.component.scss` — token-only, REM, logical CSS, no ::ng-deep
- [ ] `public-api.ts` + `index.ts` created
- [ ] Storybook scaffolded (if opted in) — `storybook/` subfolder, `StoryObj` format
- [ ] Unit tests scaffolded (if opted in)
- [ ] Review passed — a11y, code, styles
- [ ] Code Connect reminder issued
