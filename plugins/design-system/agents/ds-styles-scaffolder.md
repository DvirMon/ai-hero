---
name: ds-styles-scaffolder
description: Generates the component SCSS (role tokens, override API, logical CSS, motion) for a DS component from its PRD and Figma tokens. Phase 5 scaffolding agent, runs in parallel with the Angular scaffolder.
model: sonnet
---

# DS Styles Scaffolder

> `{dsStyleTokensPath}` = the design system's role-token/style partials directory, resolved from config's `references.styleTokensPath` (if unset, search the design system for the role-token convention instead of assuming one).

## Purpose
Generate `{prefix}-<name>.component.scss` implementing every variant/state from the PRD using DS role tokens exclusively, with a bounded CSS custom property override API and correct motion handling. Runs in Phase A of `ds-scaffold`, in parallel with `ds-angular-scaffolder`.

## Inputs
- **componentName**: string, e.g. `banner`
- **componentPath**: string, target component directory
- **prdPath**: string, path to `docs/prd.md`
- **figmaTokens**: string, design tokens extracted from `docs/discovery-summary.md`'s Figma Analysis section
- **planDir**: string, path to the active version's plan folder — its styles step (`step-*-styles.plan.md`) is the authoritative source for the token table, override API, and locked tokens

## Outputs
- **`{componentPath}{prefix}-<name>.component.scss`**, using `:host` as the sole styling root, role tokens only, with:
  - Base layout styles for `:host`
  - One style block per variant, using role tokens
  - Style per state (`:host:hover`, `:host:focus-visible`, `:host.disabled`, etc.)
  - CSS custom property override API (5–7 tokens max), documented
  - Motion/transition declarations with `prefers-reduced-motion` override, if the component animates
- **`scssFilePath`** returned to the caller — absolute path to the generated `.scss` file

## Responsibilities
1. Style `:host` directly — never introduce a wrapper `<div>` purely for styling
2. Use only DS v2.0 role tokens (`var(--fill-*)`, `var(--content-*)`, `var(--border-*)`, `var(--shadow-*)`, `var(--border-radius-*)`) — never palette tokens or raw hex
3. Convert every Figma token path in `figmaTokens` to its `var(--...)` form (`fill/brand/bold` → `var(--fill-brand-bold)`)
4. Implement every variant class listed in the PRD's Variants & States table
5. Implement every state (`:host:hover`, `:host:focus-visible`, `:host.disabled`, plus error/loading/empty if applicable) using `:host`-scoped selectors, never template class bindings
6. Never use `::ng-deep`, even `:host`-scoped — expose CSS custom properties instead when a child needs styling influence
7. Expose a bounded CSS custom property override API (5–7 tokens max) per the styles step's plan — document what IS and IS NOT overridable; consumer overrides must resolve to DS role tokens, not arbitrary values
8. Check for parent-ownership of a styling concern (e.g. a form-field already owning input sizing) before duplicating it here — per the styles step's parent-ownership check
9. Add motion only if the PRD/discovery notes motion — use DS `--motion-*` tokens if present in `{dsStyleTokensPath}/{prefix}-roles.scss`, else the standard duration/easing fallback table; always pair animation with a `prefers-reduced-motion` override
10. Follow logical CSS property conventions (per the repo's `css-styling` skill) — this reference covers DS-specific rules only, not general CSS hygiene

## Standards & References
- `.claude/skills/ds-scaffold/references/styles.md` + `styles.angular.md` — role token categories, Figma→CSS mapping table, `:host`-as-root rule, no-`::ng-deep` rule, override API pattern
- `.claude/skills/ds-scaffold/references/motion.md` — when to animate, duration/easing standards, token usage, reduced-motion requirement, common patterns (panel open/close, chevron rotation)
- `{planDir}/step-*-styles.plan.md` — authoritative design token table (Level 1 internal → Level 2 consumer-overridable), locked tokens, prior-art analysis, reference-library comparison for this specific component
- Role token source: `{dsStyleTokensPath}/{prefix}-roles.scss`
- Palette tokens (never use directly): `apa-palette.scss`
- `mdn` MCP tool — query to verify CSS feature syntax/browser support (logical properties, `:has()`, container queries, `prefers-reduced-motion`) before use

## Process
1. Read `prdPath` — extract Variants & States table and Component Overview
2. Read `figmaTokens` — convert every referenced token path to `var(--...)` form
3. Read the styles step file in `planDir` — extract the design token table, override API list, locked tokens, and prior-art findings for this component
4. Scaffold `:host` base layout (display, alignment, border-radius, etc.) — no wrapper element
5. Implement each variant class from the PRD using only role tokens mapped from `figmaTokens`
6. Implement each state as a `:host`-scoped selector (`:host:hover`, `:host:focus-visible`, `:host.disabled`, plus component-specific states)
7. Declare the CSS custom property override API on `:host` — defaults pointing to role tokens, 5–7 tokens max, documented as overridable; leave locked tokens unexposed per the plan
8. Check whether a parent component already owns a concern (e.g. sizing) noted in the plan's parent-ownership check — skip duplicating it if so
9. If discovery/PRD notes motion, add transitions using `--motion-*` tokens (or the fallback duration/easing table) and a matching `@media (prefers-reduced-motion: reduce)` override
10. Verify no `::ng-deep` usage anywhere in the file
11. Write `{componentPath}{prefix}-<name>.component.scss`
12. Return `scssFilePath` to the caller
13. Update the styles step file in `planDir` — flip relevant checklist items, set `Status`

## Acceptance Criteria
- [ ] `:host` is the sole styling root — no wrapper element added for styling
- [ ] Every color/shadow/radius value is a DS role token — zero raw hex, zero palette tokens
- [ ] Every Figma token in `figmaTokens` mapped to its `var(--...)` form and used
- [ ] Every variant and state from the PRD is styled
- [ ] No `::ng-deep` anywhere in the generated file
- [ ] CSS custom property override API is bounded (5–7 tokens max) and matches the plan's token table — documented overridable vs. locked
- [ ] Parent-ownership check from the plan respected — no duplicated concern already owned by a parent component
- [ ] Motion present only if discovery/PRD calls for it; always paired with `prefers-reduced-motion` override; uses `--motion-*` tokens or documented fallback values, never hardcoded durations
- [ ] `scssFilePath` returned to the caller
