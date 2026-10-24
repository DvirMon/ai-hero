---
name: ds-discovery
description: Phase 1 of DS component creation — runs Figma, primitive, codebase, and a11y discovery in sequence. Use when starting a new DS component. Run before ds-interview.
portedFrom: 20b1844f1540
portedSelf: db681b2ca770
---

# DS Component Builder — Phase 1: Discovery

> `{dsComponentsRoot}` = the design system's shared components root (resolved from `designSystem.path` + `componentPathPattern` in the project's `ds-wayfinder.config.json`). `{componentPath}` = this component's own working directory within it.

There is no subagent dispatch mechanism here — the four discovery passes below (Figma, primitives, codebase, a11y) that the Claude Code version runs in parallel as separate subagents must instead be done **one at a time, in this same session**, in the order given. Each pass's substance (inputs, responsibilities, process, acceptance criteria) is folded in below so nothing from the original agent instructions is lost.

## Config Setup

Discover `{projectPath}/.claude/ds-wayfinder.config.json` by walking up from component path:
- Starts at component directory
- Walks up until finding `.claude/ds-wayfinder.config.json`
- Reads framework, component paths, reference doc locations, output structure

**If config missing:** Prompt user to run the `ds-wayfinder` skill in project root.

---

## On start

Check if `{componentPath}docs/session-handoff.md` exists (you won't know the path until setup — check after collecting the component name):
- **Exists and Phase 1 already complete** → tell the user and suggest running `ds-interview` next.
- **Exists and Phase 1 incomplete** → resume from where it left off
- **Does not exist** → proceed with setup

## Setup

Ask for what's needed to begin:

1. **Component name** (e.g. `stepper`, `autocomplete`) — if not provided as an argument
2. **Figma URL** (frame or component — optional but preferred)
3. **Work type** (`new` | `variant` | `modify` | `tokens`) — ask conversationally, or with the AskQuestion tool if available
4. **Sibling component** (optional): "Do you know of a similar existing component in `{dsComponentsRoot}` to reference? (e.g. `{prefix}-banner`, `{prefix}-dialog`) — skip if unsure."
5. **CDK/primitive hint** (optional): "Do you know which primitive layer this component uses? (e.g. `ng-primitives`, `CdkOverlay`, `@angular/cdk/a11y`) — skip if unsure."
6. **Codebase discovery** (optional): "Should I scan existing DS components for patterns and conventions? Recommended for new components; skip if you already know them. (yes/no)"

Derive: `componentPath` = resolved from config (`designSystem.path` + `componentPathPattern` + `{prefix}-{name}/`) — e.g. `libs/shared/ui-core/src/lib/components/2.0/atera-{name}/` for this repo's config.

### `workType: tokens` fast path

If Setup step 3 returns `tokens`, this is a design-token-only change to an existing component — no new API surface, no primitive/behavior question. Skip steps 4–6, Pre-flight, and the full discovery pass below entirely. Instead:

1. Ask: "Which design tokens are changing, and to what values? (e.g. `--color-surface-brand`: `#1a1a1a` → `#0f0f0f`)"
2. Confirm the target component exists at `{componentPath}` (it must — `tokens` edits an existing component, it doesn't create one).
3. Write `{componentPath}docs/discovery-summary.md` containing only the token diff — skip the Figma/primitive/codebase/a11y sections.
4. Skip **Verdict confirmation** below — there's no build-new/extend/reuse question for a token edit. Set `verdictChoice: "extend"` directly in `phase-state.json`.
5. Skip to **Write session handoff**.

## Pre-flight — ng-primitives check

Verify whether an Angular Primitives MCP server (`ngp-mcp`) is available in this environment.

**If available** → proceed, and prefer it for primitive lookups below.

**If not available** → note that primitive discovery will fall back to fetching `https://angularprimitives.com` pages directly, and proceed on that basis (no need to block on installing the MCP server unless the user wants to).

## Discovery passes (run sequentially, in this order)

### Pass 1 — Figma discovery (always)

**Purpose:** Fetch and analyze the Figma design for the component, and produce the "Figma Analysis" contribution to `docs/discovery-summary.md`. Extract raw design facts (variants, states, tokens, layout regions, candidate inputs) — do not decide the final API surface (that's Phase 2 interview) and do not write implementation code.

**Inputs:** componentName, figmaUrl (optional).

**Process:**
1. If `figmaUrl` provided: use the project's Figma MCP tools (e.g. `getFigmaData` / `getFigmaFileNodes`) with the file key and node ID parsed from the URL.
2. If no Figma MCP tool is available or it fails: instruct the user to run the Figma REST API `curl` command locally with their own token and paste the JSON response back — never ask for or handle the token directly.
3. If no `figmaUrl` at all: search the codebase for the most similar existing DS component, read its styles/template/public API, and use it as the structural/token reference — clearly label the output "No Figma available — pattern derived from `<existing-component>`".
4. From the screenshot/output, catalog every visual state and variant dimension.
5. Map each variant property to a candidate input per the variant→input mapping table in `~/.cursor/skills/ds-discovery/references/discovery.md` — flag hover/focus as CSS-only, never inputs.
6. Extract every referenced CSS token, convert `fill/brand/bold` style paths to `var(--fill-brand-bold)` form.
7. Identify layout regions and mark which are static structure vs candidate content-projection slots.
8. Read component description text for usage notes, anti-patterns, linked specs.
9. Note any animation/motion observed.
10. Cross-reference detected embedded UI elements against `{dsComponentsRoot}` — for each match, extract selector and import path from the component's decorator and `public-api.ts`; record as `internalDsComponents` (or `none` if empty).
11. Write the "Figma Analysis" section using the Discovery Summary output shape from `~/.cursor/skills/ds-discovery/references/discovery.md`, aligned with the theme-element/root-variant-class conventions in `component-class.md` / `component-class.{framework}.md`.

**Acceptance check before moving on:** design fetched via MCP/REST/no-Figma derivation (fallback path stated explicitly); all visual states and variant dimensions listed; every variant mapped to a candidate input with hover/focus excluded as CSS-only; every Figma token converted to `var(--...)` form; layout regions identified with candidate content slots flagged; `internalDsComponents` populated or explicitly `none`, no guessed import paths; motion noted or explicitly "none".

### Pass 2 — Primitive discovery (always)

**Purpose:** Determine which framework-native behavior library and/or unstyled primitive collection already solves this component's interaction pattern, before any interaction logic gets written from scratch. Feeds the "Primitives" section of the Discovery Summary, which downstream phases (interview, architecture, scaffold) treat as the primitive decision unless Pass 3 (codebase discovery) finds an internal wrapper that overrides it.

**Inputs:** componentName, componentBehaviour (infer from name if not given), cdkHint (optional).

**Process (fixed order: CDK → ng-primitives → Material inspiration → ARIA APG fallback):**
1. Match `componentBehaviour` against the CDK Selection Table in `~/.cursor/skills/ds-discovery/references/primitives.{framework}.md` (dropdown/select/combobox, menu, dialog, tooltip/popover, accordion, drag-drop, tree, table, virtual scroll, focus management, focus trap, live announcer).
2. If a CDK primitive matches, record its import path(s) and stop the primitive search there.
3. If no CDK primitive fits, check the ng-primitives selection table (via the `ngp-mcp` MCP tools if available, else by fetching `https://angularprimitives.com/primitives/{primitive-name}`); record its import path.
4. If neither fits, note "no primitive available" and fetch the relevant ARIA APG pattern page; document that keyboard handling must be hand-rolled via the `host` property (never a raw event-listener decorator), with a comment explaining why no primitive was used.
5. Identify the Angular Material equivalent component (if any) as inspiration only — never as code to copy. Fetch its source files (`.ts`, `.html`, `.scss`, harness) via their GitHub raw URLs, skipping any that 404.
6. For each legacy Material pattern found, note the current-idiom translation using the adaptation table (`@Input()` → `input()`, `NgModule` → standalone, `ngOnInit` → `effect()`/`computed()`, etc.) — do not carry the legacy pattern into the recommendation.
7. If `cdkHint` was supplied, verify it against the actual selection tables rather than accepting it uncritically — flag if the hint doesn't match the behavior.
8. Write the "Primitives" section for the Discovery Summary — final primitive decision, supporting evidence, translation notes.

**Acceptance check:** discovery order followed (CDK → ng-primitives → Material inspiration → ARIA APG fallback); final primitive decision stated explicitly; import path(s) recorded; Material discovery (if any) explicitly labeled "inspiration only"; every legacy pattern paired with its translation; `cdkHint` verified rather than blindly accepted.

### Pass 3 — Codebase discovery (only if user opted in during Setup)

**Purpose:** Check whether the component being requested already exists (fully or partially) in the DS, and surface internal conventions/wrappers the new component should reuse instead of reinventing. Its "Duplicate Check" verdict gates the rest of the pipeline — a `DUPLICATE` finding stops discovery and forces a build-new/extend/reuse decision before any further work happens.

**Inputs:** componentName, componentBehaviour, siblingComponentPath (optional).

**Process:**
1. Search `{dsComponentsRoot}` for a component matching `componentName` or its close synonyms/aliases.
2. If found, read its full source and classify overlap with `componentBehaviour`: full duplicate, partial overlap, or no overlap.
3. If `siblingComponentPath` provided, read it in full regardless of the name-search result, and use it as the conventions reference.
4. Set the Duplicate Check verdict: `DUPLICATE` only for full/near-full behavioral overlap; partial overlap is a note but still verdict `CLEAR` (a partial match is an "extend" candidate, not a duplicate block).
5. Search for internal overlay/portal/behavior-unit wrappers (e.g. an internal `{prefix}-overlay` service) used by existing components with similar interaction patterns — these override Pass 2's raw primitive recommendation when both ran.
6. For each DS v2 component the design appears to reference internally, confirm existence and extract selector/import path from source (`@Component`/`@Directive` decorator, `public-api.ts`/index exports) — never guess an import path. Record as a contribution to `internalDsComponents`.
7. Note file-structure, naming, and token-usage conventions from the closest sibling(s), per `~/.cursor/skills/ds-scaffold/references/file-structure.md` / `.{framework}.md`, for consistency.
8. Write the "Duplicate Check" section (verdict first, details after) plus wrapper/pattern findings.

**Acceptance check:** verdict explicitly `DUPLICATE` or `CLEAR`; `DUPLICATE` includes existing component's path and concrete overlap/gap description; `siblingComponentPath` (if given) read in full and used as the conventions reference; any internal wrapper found flagged as an override candidate for Pass 2's recommendation; every `internalDsComponents` contribution has a source-verified selector and import path.

### Pass 4 — A11y discovery (always)

**Purpose:** Discovery (not decide, not spec) which accessibility patterns apply to this component type, grounded live against ARIA APG and WCAG — before any design decisions are made. Feeds `ds-interview`'s grilling and Phase 3's a11y spec writing. Never invent roles/attributes/SCs and never fill in a spec — surface the applicable pattern space for the interview to decide against.

**Inputs:** componentName, componentBehavior (from Pass 1), componentType (coarse category — button, dialog, stepper, list, form-input, etc.).

**Valid APG pattern names** (match componentType's behavior to one of these — never invent a pattern): Accordion, Alert, Alert and Message Dialogs, Breadcrumb, Button, Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid, Landmarks, Link, Listbox, Menu and Menubar, Menu Button, Meter, Radio Group, Slider, Slider (Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar, Tooltip, Tree View, Treegrid, Window Splitter.

If componentType doesn't map to any pattern above (e.g. **stepper**, **date range picker**, **rating**), it's a composite/non-APG component — don't force-fit a name. Decompose into the closest sub-patterns (e.g. stepper ≈ Tabs-style navigation + status region for current-step announcement + Button pattern for nav controls), discovery each sub-part against its own pattern, and label the output as composed.

**Process:**
1. Fetch the live WCAG 2.1 AA quickref (`https://www.w3.org/WAI/WCAG21/quickref/`) and live ARIA APG patterns index (`https://www.w3.org/WAI/ARIA/apg/patterns/`); note the fetch date. If you notice a delta from what you know (added/withdrawn SC, added/renamed pattern), flag it.
2. Match componentType/componentBehavior to an APG pattern name from the list above. If no direct match, decompose into sub-patterns per the composite rule.
3. Fetch the live APG pattern page(s) for the matched name(s) — pull the actual keyboard table, states/properties table, structure example. Don't rely on memorized pattern details.
4. Recommend semantic HTML element (native > custom+role) per the fetched page.
5. List which WCAG SCs are typically applicable to this component type (discovery-level applicability, not final disposition — that's Phase 3's job once real decisions exist). Component-scoped WCAG 2.1 A/AA SCs to check against: 1.1.1, 1.3.1, 1.3.2, 1.3.3, 1.3.4, 1.3.5, 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 1.4.13, 2.1.1, 2.1.2, 2.1.4, 2.2.1/2.2.2, 2.3.1, 2.4.3, 2.4.6, 2.4.7, 2.5.1, 2.5.2, 2.5.3, 2.5.4, 3.2.1, 3.2.2, 3.3.1, 3.3.2, 3.3.3, 4.1.2, 4.1.3 — mark page-level SCs (1.2.x media, 2.4.1/2.4.2/2.4.4/2.4.5, 3.1.1/3.1.2, 3.2.3/3.2.4, 3.3.4/3.3.5, 2.2.3–2.2.6) as N/A (page-level), not evaluated per-component.
6. Surface keyboard nav pattern options from the fetched APG page — if the pattern supports more than one valid keyboard model, present the options rather than picking one; this is interview fodder.
7. Surface focus management pattern needs (trap needed for this component type? restoration? initial focus candidates?).
8. Surface screen reader announcement pattern (what typically gets announced, when, for this component type).
9. Recommend touch target baseline (44x44px) and flag likely exception candidates for this component type (e.g. inline text links).
10. Append the "A11y Patterns" section to `docs/discovery-summary.md`, including fetch dates and source URLs for every claim. This section is mandatory and never summarized away — later phases depend on it being present in full.

Output describes markup semantics and interaction patterns only — never framework APIs; that translation happens in the scaffold phase.

**Acceptance check:** APG pattern matched and cited with live-fetched source URL, or explicitly flagged composite/non-APG with sub-pattern decomposition; WCAG quickref/APG index checked live, deltas flagged with fetch date; semantic HTML recommendation traced to the fetched APG page; applicable WCAG SCs listed for this component type; keyboard nav pattern(s) surfaced as options (not silently decided) when more than one approach applies; focus/SR/touch-target patterns surfaced as interview-ready findings.

## After discovery passes complete

### Deduplication gate (only if Pass 3 ran)

Check its "Duplicate Check" field:
- **DUPLICATE** → stop and ask: "A component named `{prefix}-{name}` already exists at `{path}`. Extend it, or create new?"
- **CLEAR** → proceed

### Internal wrapper consolidation

If both Pass 2 and Pass 3 ran: an internal wrapper finding from Pass 3 **overrides** any raw CDK recommendation from Pass 2.
If only Pass 2 ran: use its wrapper findings directly.

Note the final primitive decision in the Discovery Summary.

### Internal DS components inventory

Before writing the Discovery Summary, scan the Figma output and the codebase to identify **existing DS v2 components that appear inside the new component** (e.g. a filter bar contains `atera-button`; a form field contains `atera-input`).

For each found component:
1. Confirm the component exists under `{dsComponentsRoot}`
2. Extract the selector from the component/directive source (`@Component`/`@Directive({ selector: ... })`) and the import path from the relevant `public-api.ts` or exports

Record the result as `internalDsComponents` in the Discovery Summary — even if the list is empty (write `none`). This list is mandatory input for the PRD in the Spec phase (`ds-spec`).

**Rule:** If the Figma design contains a UI element that matches an existing DS component, that component MUST be listed here. Scaffolding will not reimplement it — it will import and use it.

### Discovery Summary

Synthesize all pass outputs into a **Discovery Summary** and write it to `{componentPath}docs/discovery-summary.md`. Present it to the user with its file path.

**Mandatory section: "A11y Patterns"** — append Pass 4's full output verbatim (matched APG pattern(s) + source URLs, applicable WCAG SCs, semantic HTML recommendation, keyboard/focus/SR/touch-target pattern options, fetch dates). Never omitted, never summarized away — `ds-interview` (Phase 2) and the a11y spec (Phase 3) both depend on it being present in full.

## Verdict confirmation

Before writing any handoff files, determine the verdict (`build-new` | `extend` | `reuse`) from the Discovery Summary, then surface it to the user as an interactive 3-way choice.

### Reason about the three paths

From the Discovery Summary, synthesize a 2–3 sentence description for each option — be specific: name real components, tokens, and trade-offs found during discovery. Each description answers "what would this mean for `{prefix}-{name}` specifically?".

| Option | Label template | Recommended when |
|---|---|---|
| **Build new** | `Build a new {prefix}-{name}` | No existing component covers this behaviour. Always available. |
| **Extend existing** | `Extend {prefix}-{sibling} to add this behaviour` | A sibling component exists that could absorb this behaviour; describe the cost/risk of muddying its contract. If no sibling was found, label it `Extend a related component` and explain why the candidate pool is thin. |
| **Not needed** | `Skip — reuse {prefix}-{sibling} as-is` | An existing component already satisfies the full spec with zero gaps. If no such component exists, label it `Skip — an existing component already covers this` and explain the gap. |

Mark `(Recommended)` on whichever option matches the verdict you determined above.

### Ask the user

Use the AskQuestion tool if available (single-select, three options as above, each carrying its specific rationale as the description); otherwise ask conversationally, presenting the same three options and rationale, and wait for the user to pick one.

> **Never use placeholder text.** Every label and description must be populated from the actual discovery output — component names, token names, behaviours. Generic copy like "this option is recommended" is not acceptable.

### Record the user's choice

Store the answer in `{componentPath}docs/phase-state.json` as `verdictChoice`, mapped to `"build-new"` | `"extend"` | `"reuse"`, before writing any other handoff files.

## Write session handoff

Using the already-written Discovery Summary as input (CDK decision, similar components, tokens, codebase patterns), create the handoff files below.

**Update** `{componentPath}docs/phase-state.json` — preserve `workType` and `figmaUrl` collected in Setup; add `discoverySummaryPath` and `verdictChoice`:
```json
{
  "figmaUrl": "...",
  "workType": "new|variant|modify|tokens",
  "discoverySummaryPath": "docs/discovery-summary.md",
  "verdictChoice": "build-new|extend|reuse"
}
```

Write `{componentPath}docs/session-handoff.md` using the template at `~/.cursor/skills/ds-wayfinder/references/session-handoff-template.md`. Fill in: Phase 1 checked off, Figma URL, component path, "What to do next".

## Continuation

Print:

```
Discovery complete.

Before continuing, drop Figma/primitive/codebase/a11y raw discovery output and transcripts from working context — fully synthesized into discovery-summary.md already. Keep: componentPath, config values, workType, verdictChoice, path to discovery-summary.md and session-handoff.md.

Then run the ds-interview skill for <name> next.
```
