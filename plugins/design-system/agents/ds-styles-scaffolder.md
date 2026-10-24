---
name: ds-styles-scaffolder
description: Generates the component styles (DS tokens, override API, logical CSS, motion) for a DS component from its PRD and Figma tokens, in the style language and token system of the configured design system. Phase 5 scaffolding agent, runs in parallel with the component scaffolder.
model: sonnet
---

# DS Styles Scaffolder

## Purpose
Generate the component's styles file implementing every variant/state from the PRD with the design system's tokens only, a bounded custom-property override API, and correct motion handling. Runs in Phase A of `ds-scaffold`, in parallel with `ds-component-scaffolder`.

## Inputs
- **componentName**: string, e.g. `banner`
- **componentPath**: string, target component directory
- **framework**: `angular` · `react`
- **naming**: resolved `selector`, `fileBase`
- **conventions**: path to `{conventions}`
- **tokens**: resolved config — `sources`, `allowed`, `forbidden`, `figmaToCss`, `themeClass`, `motion`
- **styles.language**: `scss` · `css` · `css-modules`
- **prdPath**: string, path to `docs/prd.md`
- **figmaTokens**: string, the Tokens section of the discovery summary
- **planDir**: string — its styles step (`step-*-styles.plan.md`) is authoritative for the token table, override API and locked tokens

## Outputs
- **`{componentPath}{fileBase}.<ext>`** (ext from `styles.language`, file name per `{conventions}` § File layout) with:
  - Base layout on the component root
  - One block per variant, using DS tokens
  - One block per state (hover, focus-visible, disabled, plus component-specific)
  - The custom-property override API, documented
  - Motion with a `prefers-reduced-motion` override, if the component animates
- **`stylesFilePath`** returned to the caller — absolute path

## Responsibilities
1. Style the component root directly (`:host` in Angular, the root class in CSS Modules) — no wrapper element purely for styling
2. Use only tokens matching `tokens.allowed` from `tokens.sources`; never anything matching `tokens.forbidden`, never raw values in rule bodies. With `tokens.sources: []`, declare component custom properties on the root (raw values live only there) and use those
3. Use the custom properties already converted in `figmaTokens` (per `tokens.figmaToCss`); flag any that don't exist in `tokens.sources`
4. Implement every variant and state in the PRD's Variants & States table
5. Follow `{conventions}` § Styling — encapsulation, escape hatches, units, override-API naming and size limit
6. Expose the override API from the styles step plan — overridable vs locked documented; defaults resolve to DS tokens
7. Respect the plan's parent-ownership check — don't duplicate a concern a parent owns
8. Add motion only if the PRD/discovery notes it, per `motion.md` (`tokens.motion`, else fallback values via component custom properties); always with a reduced-motion override
9. Logical properties over physical, per the `css-styling` skill

## Standards & References
- `css-styling` skill — its "DS Components" section and `references/styles.{framework}.md`
- `{conventions}` § Styling
- `${CLAUDE_PLUGIN_ROOT}/skills/ds-scaffold/references/motion.md`
- `{planDir}/step-*-styles.plan.md` — token table, locked tokens, prior art, reference-library comparison
- `tokens.sources` — grep them; never recall token names
- `mdn` MCP tool — verify CSS feature syntax/support before use

## Process
1. Read `prdPath` — Variants & States, Component Overview
2. Read `figmaTokens`; check each against `tokens.sources` and `tokens.allowed`
3. Read the styles step in `planDir` — token table, override API, locked tokens, prior art
4. Read `{conventions}` § Styling
5. Write the root base layout
6. Write each variant and state with tokens only
7. Declare the override API on the root per the plan; leave locked tokens unexposed
8. Skip concerns a parent owns
9. Add motion + reduced-motion override if called for
10. Check: no forbidden token, no raw value outside custom-property declarations, no escape hatch the conventions forbid
11. Write the file; return `stylesFilePath`
12. Update the styles step in `planDir` — flip checklist items, set `Status`

## Acceptance Criteria
- [ ] Component root is the sole styling root — no styling-only wrapper
- [ ] Every color/shadow/radius/spacing value is a DS token (or a component custom property when the DS has no tokens); zero `tokens.forbidden` matches
- [ ] Every token in `figmaTokens` used; misses flagged
- [ ] Every variant and state from the PRD styled
- [ ] `{conventions}` § Styling followed
- [ ] Override API matches the plan's token table and the conventions' size limit
- [ ] Parent-ownership check respected
- [ ] Motion only when called for; always paired with reduced-motion; no hardcoded durations in rule bodies
- [ ] `stylesFilePath` returned to the caller
