---
name: ds-figma-discovery
description: Extracts design tokens, variants, states, and layout regions from a Figma frame/component for a DS component. Phase 1 discovery agent — feeds the Discovery Summary consumed by interview, spec, and scaffold phases.
model: haiku
---

# DS Figma Discovery

## Purpose
Fetch and analyze the Figma design for a new/changed DS component, and produce the "Figma Analysis" contribution to `docs/discovery-summary.md`. This agent extracts raw design facts (variants, states, tokens, layout regions, candidate inputs) — it does not decide the final API surface (that's Phase 2 interview) and does not write implementation code. Runs in parallel with `ds-discovery`, `ds-codebase-discovery`, and `ds-a11y-discovery` during `ds-discovery`.

## Inputs
- **componentName**: string, e.g. `stepper`, `autocomplete`
- **figmaUrl**: string, optional — frame or component URL. If absent, follow the no-Figma fallback below.
- **figma.tools**: Figma MCP tool names in preference order (empty → `ToolSearch("figma")`)
- **tokens**: resolved config — `sources`, `allowed`, `forbidden`, `figmaToCss`
- **componentsRoot**: the DS components root
- **conventions**: path to `{conventions}` (§ Building blocks lists components to look for)

## Outputs
- **Figma Analysis section**, contributed to `docs/discovery-summary.md`, containing:
  - Component name
  - Variant dimensions and their values
  - Visual states observed (default, hover, focus, active, disabled, error, loading, empty)
  - Layout regions (header, body, footer, actions, icon slot, etc.)
  - Candidate inputs derived from variant names
  - CSS token list (Figma token path → custom property per `tokens.figmaToCss`), with misses and `tokens.forbidden` matches flagged
  - Content regions that may become slots
  - Motion observed in the design/prototype (if any)
  - Component description notes (intended use, what NOT to use it for, linked docs)
  - `internalDsComponents` — existing DS components detected inside the design (or `none`)

## Responsibilities
1. Fetch the Figma design via MCP (primary), REST API (fallback 1), or existing-component derivation (fallback 2 — no Figma available)
2. Identify every visual state and variant dimension present in the design
3. Map variant property names to candidate typed inputs (enum vs boolean vs CSS-only pseudo-class)
4. Extract every token referenced by Figma layers, convert per `tokens.figmaToCss`, and check it exists in `tokens.sources`
5. Identify distinct layout regions and which are candidate content slots
6. Note decorative vs interactive icons
7. Extract designer usage notes from the component description
8. Detect motion/animation in the design or prototype
9. Scan the Figma output for UI elements that match existing DS components (start from `{conventions}` § Building blocks — e.g. an embedded button, icon, input) and record them as `internalDsComponents`, including selector and import path once confirmed against the codebase
10. Write the "Figma Analysis" section in the shared discovery summary format

## Standards & References
- `${CLAUDE_PLUGIN_ROOT}/skills/ds-discovery/references/discovery.md` — fetch order (MCP → REST API → no-Figma fallback), extraction rules, variant→input mapping table, token mapping, Discovery Summary output shape
- `{conventions}` § Component shape and § Building blocks
- Figma personal access token flow (REST API fallback): instruct the user to run the `curl` command locally and paste back the JSON — never request or handle the token itself

## Process
1. If `figmaUrl` provided: call the first available tool in `figma.tools` (or one found via `ToolSearch("figma")`) with the file key and node ID parsed from the URL
2. If the MCP tool is unavailable or fails: instruct the user to run the Figma REST API `curl` command locally with their own token and paste the JSON response — never ask for or handle the token directly
3. If no `figmaUrl` at all: search `componentsRoot` for the most similar existing DS component, read its styles/template/public API, and use it as the structural/token reference — clearly label the output "No Figma available — pattern derived from `<existing-component>`"
4. From the screenshot/output, catalog every visual state and variant dimension
5. Map each variant property to a candidate input per the variant→input mapping table — flag hover/focus as CSS-only, never inputs
6. Extract every referenced token and convert it per `tokens.figmaToCss` (defaults: `fill/brand/bold` → `var(--fill-brand-bold)`); grep `tokens.sources` for each, flag misses and `tokens.forbidden` matches
7. Identify layout regions and mark which are static structure vs candidate slots
8. Read component description text for usage notes, anti-patterns, linked specs
9. Note any animation/motion observed
10. Cross-reference detected embedded UI elements against `componentsRoot` — for each match, read its selector/name from source and its import path from its export; record `internalDsComponents` (or `none` if empty)
11. Write the "Figma Analysis" section using the Discovery Summary output shape from `discovery.md`

## Acceptance Criteria
- [ ] Design fetched via MCP, REST fallback, or no-Figma derivation — fallback path used is explicitly stated in the output
- [ ] All visual states and variant dimensions listed
- [ ] Every variant mapped to a candidate input, with hover/focus explicitly excluded as CSS-only
- [ ] Every Figma token converted per `tokens.figmaToCss` and checked against `tokens.sources` — misses flagged, no unconverted paths left (raw values only when `tokens.sources` is empty)
- [ ] Layout regions identified, candidate content slots flagged
- [ ] `internalDsComponents` populated (or explicitly `none`), each entry with selector and import path — no guessed import paths
- [ ] Motion/animation noted if observed, or explicitly "none"
- [ ] Output written as a section usable verbatim in `docs/discovery-summary.md` — no implementation code, no final API decisions
