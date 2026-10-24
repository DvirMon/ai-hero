---
name: ds-scaffold
description: Phase 5 of DS component creation — scaffolds Angular component, styles, Storybook, and tests in sequence. Run after ds-plan, after the phase-end context trim.
portedFrom: 8d7b2d34b6f4
portedSelf: ffe311f70c34
---

# DS Component Builder — Phase 5: Scaffold

There is no subagent dispatch mechanism here — the Claude Code version runs the Angular scaffolder and styles scaffolder in parallel (Phase A), then the Storybook and test scaffolders in parallel (Phase B, only after Phase A's component file exists). Do all of this **yourself, in this same session**, working through Phase A fully before starting Phase B. Each scaffolder's substance is folded in below.

**Framework scope:** this scaffold flow targets Angular only (matching the source skill). React/Vue/Svelte scaffolding is a future extension — do not attempt to generalize the class/template guidance below beyond Angular.

## Config Setup

Discover `{projectPath}/.claude/ds-wayfinder.config.json` (walk up from component path):
- Framework-specific scaffold template path
- Output structure (docs dir)

Read styling guide agnostic: `~/.cursor/skills/css-styling/SKILL.md` (see its "DS Components" section for the stricter rules) — if the css-styling skill isn't installed in this environment, use `~/.cursor/skills/ds-scaffold/references/motion.md` plus the styles references below as the fallback source of DS-specific styling rules.
Read styling guide framework: `~/.cursor/skills/css-styling/references/styles.{framework}.md`
Read test guide: the project's unit-testing conventions (a `testing` skill's `unit-testing.md` + `unit-testing.{framework}.md` references, if installed; otherwise apply the "what to test" rule in Phase B's test-scaffolding section below)
Read file structure agnostic: `~/.cursor/skills/ds-scaffold/references/file-structure.md`
Read file structure framework: `~/.cursor/skills/ds-scaffold/references/file-structure.{framework}.md`

---

## On start

Ask the user for the component name and which version to scaffold (e.g. "V1 Core"), then read `{componentPath}docs/session-handoff.md`.

If the "Task Plan" checklist item is not marked complete → tell the user to finish `ds-plan` first.

From `{componentPath}docs/phase-state.json`, load:
- `planDir` — path to the version subfolder (e.g. `.claude/plans/NNN-atera-{name}/v1-core/`)
- `includeStorybook`, `includeTests` — from Task Plan decisions (user may override now)
- `discoverySummaryPath` — relative path to the discovery summary used to source `figmaTokens` (e.g. `"docs/discovery-summary.md"`)

Ask if they want to confirm or change the storybook/tests choices before starting.

## Pre-scaffold: classify responsibilities

Before starting, classify the component responsibilities from the PRD (`prdPath`) as directive / service / utils / component. This `srpClassification` drives the file-organization decisions in Phase A step 1 below.

Resolve shared inputs once, before either phase:
- `figmaTokens` = design tokens from `{componentPath}{discoverySummaryPath}` — resolve `discoverySummaryPath` from `phase-state.json` and join it to `componentPath`.
- `a11ySpec` = inline accessibility text, sourced from `{componentPath}docs/phase-state.json`: if `a11ySpecText` is set (non-complex), use its value; if `a11ySpecPath` is set (complex), read `{componentPath}{a11ySpecPath}` and use its full content. Always treat this as inline text downstream, never a file path.
- `prdPath` = `{componentPath}docs/prd.md`.
- `apiSpec` = inline API text — read the public API section of `prd.md` (inputs, outputs, content slots) and extract it as inline text.

## Phase A — Component class + styles (do both, in either order, before Phase B)

### Step 1 — Angular component class

**Purpose:** Generate `{prefix}-<name>.component.ts` (class + colocated types) and its template, following DS Angular conventions exactly: signal inputs/outputs, `OnPush`, host-bound classes/ARIA, no `NgModule`, no `standalone: true`.

**Process:**
1. Apply the `angular-developer` skill's baseline conventions (signals, DI, forms, testing patterns) first — DS-specific rules below override it where they conflict (e.g. DS forbids explicit `standalone: true`, generic Angular guidance doesn't). If Angular CLI MCP tooling for this workspace's best-practices is available, check it fresh rather than relying on training-data assumptions.
2. Read `prdPath` — extract selector, Internal DS Components table, Variants & States, Component Overview (complexity, primitive).
3. Read `apiSpec` (inline) — extract every input/output/content-slot with types and defaults.
4. Read `a11ySpec` (inline) — extract semantic element, ARIA role/attributes, keyboard map, focus contract.
5. Confirm `srpClassification` and select the matching API pattern from `~/.cursor/skills/ds-interview/references/component-api.angular.md` (simple component, directive-as-feature, portal, trigger+panel, composable family).
6. Scaffold the `@Component` decorator per `~/.cursor/skills/ds-discovery/references/component-class.angular.md` — selector `{prefix}-<name>`, `imports: []`, `templateUrl`/`styleUrl`, `changeDetection: ChangeDetectionStrategy.OnPush` (non-negotiable), no explicit `standalone: true`, no `NgModule`.
7. Apply the theme element class and selector class to `host`: `'class': '{prefix}-<name> {prefix}-theme-element'`.
8. Declare typed inputs/outputs exactly matching `apiSpec`, using signal APIs (`input()`/`output()`) — no invented inputs, no dropped inputs.
9. Wire variant/state classes as `host` bindings only — never inside the template.
10. Wire ARIA attributes as `host` bindings, sourced from `a11ySpec` — role, aria-* attributes, `aria-disabled` reflecting the disabled state.
11. If a primitive (CDK or ng-primitives) is required, inject and wire it per the import path decided in discovery/architecture — never substitute a different primitive.
12. Define all public types (`<Name>Variant`, `<Name>Size`, `<Name>Color`, etc.) in the `.component.ts` file, then re-export from `public-api.ts` — never define a type only at the re-export layer.
13. Import and use every component listed in the PRD's Internal DS Components table via its exact import path — never reimplement their markup/behavior.
14. Build the template: default content-projection slot, named slots per PRD content slots (prefer attribute selectors), internal structural elements from Figma anatomy, `@if`/`@for` control flow for conditional regions.
15. Update `index.ts` (barrel re-export only, no logic) and `public-api.ts` (component + type exports) per `~/.cursor/skills/ds-scaffold/references/file-structure.angular.md`.
16. Register the component in the design system's root barrel (`{dsPublicApiBarrel}`, resolved from config's `references.publicApiBarrel`, or found by searching the design system root for `index.ts`/`public-api.ts`) if not already present.
17. Split generated code by concern (e.g. separate `.store.ts`, `.utils.ts`) only if the component's logic genuinely grows past a single class+types file — don't cram unrelated concerns into one file.
18. Note the absolute path to the generated `.component.ts` as `componentFilePath` — Phase B needs it.
19. Update the corresponding step file(s) in `planDir` — flip relevant checklist items, set `Status`.

**Acceptance check:** `OnPush`, no `standalone: true`, no `NgModule`; theme element class present in `host` alongside the selector class; every input/output in `apiSpec` implemented with matching type/default; variant/state classes and ARIA attributes are `host` bindings only; ARIA contract matches `a11ySpec` exactly; every Internal DS Component imported via its exact path, none reimplemented; public types colocated and re-exported (not redefined); `index.ts` stays a pure barrel; component registered in the root barrel; any file growth beyond class+types is split per the repo's file-organization convention.

### Step 2 — Styles

**Purpose:** Generate `{prefix}-<name>.component.scss` implementing every variant/state from the PRD using DS role tokens exclusively, with a bounded CSS custom property override API and correct motion handling.

**Process:**
1. Read `prdPath` — extract Variants & States table and Component Overview.
2. Read `figmaTokens` — convert every referenced token path to `var(--...)` form (`fill/brand/bold` → `var(--fill-brand-bold)`).
3. Read the styles step file in `planDir` — extract the design token table, override API list, locked tokens, and prior-art findings for this component.
4. Scaffold `:host` base layout (display, alignment, border-radius, etc.) — no wrapper element added purely for styling.
5. Implement each variant class from the PRD using only DS role tokens (`var(--fill-*)`, `var(--content-*)`, `var(--border-*)`, `var(--shadow-*)`, `var(--border-radius-*)`) mapped from `figmaTokens` — never palette tokens or raw hex.
6. Implement each state (`:host:hover`, `:host:focus-visible`, `:host.disabled`, plus error/loading/empty if applicable) as a `:host`-scoped selector, never a template class binding.
7. Never use `::ng-deep`, even `:host`-scoped — expose CSS custom properties instead when a child needs styling influence.
8. Declare the CSS custom property override API on `:host` (5–7 tokens max per the plan's token table) — defaults pointing to role tokens, documented as overridable; leave locked tokens unexposed.
9. Check whether a parent component already owns a styling concern (e.g. a form-field already owning input sizing) noted in the plan's parent-ownership check — skip duplicating it if so.
10. If discovery/PRD notes motion, add transitions using DS `--motion-*` tokens (if present) or the fallback duration/easing table from `~/.cursor/skills/ds-scaffold/references/motion.md`, always paired with a `prefers-reduced-motion` override.
11. Follow logical CSS property conventions per the project's `css-styling` skill (or general logical-property hygiene if that skill isn't installed) — this reference covers DS-specific rules only.
12. Verify no `::ng-deep` usage anywhere in the file.
13. Write `{componentPath}{prefix}-<name>.component.scss`.
14. Note the absolute path as `scssFilePath`.
15. Update the styles step file in `planDir` — flip relevant checklist items, set `Status`.

**Acceptance check:** `:host` is the sole styling root; every color/shadow/radius value is a role token, zero raw hex/palette tokens; every Figma token mapped and used; every variant/state styled; no `::ng-deep`; override API bounded (5–7 tokens) and matches the plan's token table; parent-ownership respected; motion (if any) paired with `prefers-reduced-motion` and uses `--motion-*` tokens or documented fallback values.

Wait until both Step 1 and Step 2 are done before moving to Phase B.

## Phase B — Storybook + tests (only after Phase A's `componentFilePath` exists)

### Step 3 — Storybook (only if `includeStorybook`)

**Purpose:** Generate the full `storybook/` subfolder for the component — designer stories, dev stories, styles/token stories, API stories, and MDX documentation — from the component's real, now-scaffolded public API (not a guess).

**Inputs:** componentApiSummary — a concise summary of the PRD's public API section (inputs, outputs, content slots), extracted before this step.

**Files to produce**, into `{componentPath}storybook/`:
- `{prefix}-<name>.designer.stories.ts` — designer-facing stories, sidebar visible
- `{prefix}-<name>-styles.stories.ts` — token table story, hidden (`tags: ['!dev']`)
- `{prefix}-<name>.dev.stories.ts` — dev stories for MDX Canvas embedding, hidden
- `{prefix}-<name>-doc-tabs.stories.ts` — doc-tabs navigation story, hidden
- `{prefix}-<name>-api.stories.ts` — API table story, hidden
- `{prefix}-<name>-design-tokens.stories.ts` — interactive token playground, optional, hidden
- `{prefix}-<name>-overview.mdx`, `{prefix}-<name>-api.mdx` (`docs-only`), `{prefix}-<name>-styles.mdx` (`docs-only`), `{prefix}-<name>-examples.mdx` (`docs-only`)
- `examples/` — helper components/snippet files, only for complex multi-part examples

**Process:**
1. Read `prdPath` — extract Variants & States, API Summary, Internal DS Components.
2. Read `componentApiSummary` — confirm it matches the PRD; flag any discrepancy rather than silently reconciling.
3. Read the Storybook step in `planDir` for component-specific coverage requirements.
4. Generate `.designer.stories.ts` with one story per meaningful variant/state combination (not an exhaustive cross-product — cover what a consumer would realistically reach for), sidebar-visible.
5. Generate `.dev.stories.ts` for MDX Canvas embedding, hidden.
6. Generate `-styles.stories.ts` presenting the token table from the scaffolded SCSS override API, hidden.
7. Generate `-api.stories.ts` directly from the PRD's Inputs/Outputs/Content slots tables — no invented or missing props.
8. Generate `-design-tokens.stories.ts` only if an interactive token playground adds value beyond the static styles story.
9. Generate `-doc-tabs.stories.ts` wiring navigation between the MDX docs.
10. Write the four MDX docs, `docs-only` tagged where specified.
11. Add `examples/` helper files only for examples requiring supporting code.
12. In every story template: use `@if`/`@for`/`@switch` (never `*ngIf`/`*ngFor`/`CommonModule`), `input()`/`input.required()` (never the `@Input()` decorator), and Signal Forms `form()`/`[formField]` (never `ReactiveFormsModule`/`FormControl`) — this is mandatory per the `angular-developer` skill. `form()` calls `inject()` internally — never call it inside a story's `args` object (module scope, no injector); build it in a host component's constructor/field initializer instead.
13. Write all files into `{componentPath}storybook/`.
14. Update the Storybook step file in `planDir` — flip relevant checklist items, set `Status`.

**Acceptance check:** every file from the file-structure reference present (or correctly omitted); designer stories sidebar-visible, all others hidden; API story/MDX exactly matches the PRD; styles MDX documents the real scaffolded override API; stories cover every variant/state without unnecessary cross-product explosion; `examples/` only when needed; ran only after Step 1's `componentFilePath` exists.

### Step 4 — Unit tests (only if `includeTests`)

**Purpose:** Generate `{prefix}-<name>.component.spec.ts` covering only the component's actual logic — computed state, guarded event emissions, observer-driven calculations, multi-input precedence, guard clauses. Test what's really implemented at `componentFilePath`, not what the PRD describes in the abstract.

**Process:**
1. Read `componentFilePath` — inventory every computed signal, guarded output, observer usage, and multi-input derivation actually implemented.
2. Read `prdPath` and the tests step in `planDir` for named logical units expected to be covered.
3. Apply the test/skip rule to every candidate: "Would this catch a bug in the component's logic?" — yes → write it, no → skip it.
4. For computed state: assert the derived value for each meaningfully distinct input combination.
5. For guarded output emissions: write both the emitting case and the suppressed case (e.g. `disabled` blocking `dismissed`).
6. For observer-based calculations: trigger the observer callback with representative measurements and assert the derived state.
7. For multi-input precedence: assert which input wins when they conflict, and that explicit values aren't silently overridden.
8. For guard logic: assert the early-return/no-op path doesn't produce side effects (e.g. calling `open()` twice doesn't double-emit).
9. Explicitly do NOT write tests for CSS class presence with no logic behind it, content projection, static structure, or unconditional passthrough bindings.
10. Drive signal inputs via `fixture.componentRef.setInput(...)`, not direct property assignment.
11. Write `{componentPath}{prefix}-<name>.component.spec.ts`.
12. Update the tests step file in `planDir` — flip relevant checklist items, set `Status`.

**Acceptance check:** every test traces to real logic in `componentFilePath`, none invented from the PRD's abstract description; computed/derived state covered per meaningfully distinct input combination; guarded outputs have both emitting and suppressed test cases; observer-based calculations tested via triggered callbacks, not timing hacks; multi-input precedence explicitly tested; guard clauses tested for early-return/no-op behavior; zero tests for CSS-class-only/content-projection/static-structure/logic-free passthrough; signal inputs driven via `setInput(...)`; ran only after Step 1's `componentFilePath` exists.

## After scaffolding

### Update progress tracking

For each step completed above, update the corresponding step plan files — change `Status: pending` → `Status: completed`.

Update `progress.md` — mark each completed step row with ✅ `completed`. Mark failed steps with ❌ `failed`.

Report all generated files to the user with their file paths.

## Write handoff

Merge `componentFilePath` and `scssFilePath` into `{componentPath}docs/phase-state.json` (preserve existing keys):

```json
{
  "componentFilePath": "<absolute path to the generated .ts component file>",
  "scssFilePath": "<absolute path to the generated .scss styles file>"
}
```

Update `{componentPath}docs/session-handoff.md` — mark the "Scaffold" checklist item complete, update "What to do next". List all generated files to the user with their file paths.

## Continuation

Print:

```
Scaffold complete.

Before continuing, drop the raw code-generation narration and progress.md play-by-play from working context — the generated code and progress state live on disk already. Keep: componentPath, phase-state.json values (componentFilePath, scssFilePath, planDir), prdPath.

Then run the ds-review skill for <name> next.
```
