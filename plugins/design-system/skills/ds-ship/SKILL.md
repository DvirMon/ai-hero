---
name: ds-ship
description: Phase 7 of DS component creation — checks the component's exports and registration, issues the Code Connect reminder, and runs the final checklist. Runs after ds-review.
---

# DS Component Builder — Phase 7: Ship

## Config

Resolve the config per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md` and read `{conventions}`.
Missing either → stop and point to `/ds-setup`.

---

## On start

Ask the user for the component name, then read `{docsDir}session-handoff.md`.

Previous phase must be `ds-review`. If not complete → tell the user to run it first.

## Ship steps

1. **Exports** — the component's exports match `{conventions}` § Types and exports:
   - `publicApi.perComponent: true` → `{componentPath}public-api.ts` and `index.ts` exist.
   - `publicApi.rootBarrel` set → `{publicApiBarrel}` contains the `publicApi.rootExport` line
     for this component.
   - `paths.importPath` set → `{importPath}` resolves to the component (tsconfig `paths` /
     package `exports`).
2. **Code Connect** — if the Figma project config (`figma.project`) has
   `codeConnect.available: true`, remind the user to run the `code-connect-authoring` skill.

## Final checklist

Report status for each item:

- [ ] Discovery Summary — variants, states, tokens, primitive, a11y role
- [ ] Design interview complete — `decisions.md` written
- [ ] `prd.md` generated and approved
- [ ] A11y spec — complex: `roles-map.md`; otherwise `a11ySpecText` in `phase-state.json`
- [ ] `architecture.md` (complex components only)
- [ ] Developer checkpoints passed (spec, plan)
- [ ] Task plan generated with step files
- [ ] Component file matches `{conventions}` § Component shape
- [ ] Internal DS components used, none re-implemented (PRD table)
- [ ] Building-block conventions met (`{conventions}` § Building blocks — e.g. real icon keys, no placeholders)
- [ ] Styles file — tokens only, logical CSS, `{conventions}` § Styling
- [ ] Exports per step 1
- [ ] Storybook scaffolded (if opted in) — `{conventions}` § Storybook
- [ ] Unit tests scaffolded (if opted in)
- [ ] Review passed — a11y, code, styles
- [ ] Code Connect reminder issued (when available)
