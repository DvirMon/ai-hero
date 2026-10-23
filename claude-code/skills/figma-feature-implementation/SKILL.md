---
name: figma-feature-implementation
description: Implement a product feature UI from a Figma design in any project — fetch design context, map every node to an existing design system component (Code Connect or developer-confirmed), translate Figma tokens to the project's token system, generate code, wire translations. Reads .claude/figma-project.json for all project specifics.
---

# Figma Feature Implementation

Build a feature from a Figma node using the project's existing design system. Every
project-specific value below (`config.*`) comes from `.claude/figma-project.json` — see
[project-config.md](../figma-to-code/references/project-config.md). Loaded through
`figma-to-code`, or directly by `/impel` on a UI step.

## Step 0 — Load context

1. The config. Missing → stop (construction error, see project-config.md).
2. Every file in `config.rules[]`. They win over this skill on conflict.
3. Skills: `figma-design-to-code` (plugin, mandatory), `css-styling`, and the developer skill for
   `config.stack`.
4. Inside a pipeline ticket: read `design.md` via `state.json` → `designPath` (written by
   `/to-spec`). Component, token and copy mappings recorded there are **already decided** —
   apply them, don't re-derive or re-ask.

## Step 1 — Fetch the design

`get_design_context` with the node ID and file key (from the URL, or the ticket's
`state.json` `figma[]`). Read the screenshot first, then component annotations, then variable
references.

## Step 2 — Audit unmapped nodes (before any code)

Run the [unmapped-node audit](../figma-to-code/references/unmapped-node-audit.md). Skip nodes
`design.md` already maps. With `config.codeConnect.available: false` there are no
`CodeConnectSnippet`s, so every named, visually tokenized node goes through it.

Precedence for a node's component: Code Connect hit = developer confirmation = `design.md` row
> `config.designSystem.componentMap` > fresh lookup. A node with a decided component never falls
back to a raw `<div>`.

No fitting component → `config.designSystem.newComponent`. Stop that node there; don't build a
local look-alike.

## Step 3 — Translate tokens

Apply `config.tokens.figmaNameRule`, then **confirm the name exists** by grepping
`config.tokens.sources` — a translated name that isn't defined compiles to nothing (CSS var) or
fails the build (SCSS var).

- `tokens.system: css-vars` — output `var(--…)`; run `config.tokens.tierCheck` when present and
  upgrade palette tokens to the role token whose intent matches the element.
- `tokens.system: scss-vars` — output `$var` in SCSS or the utility class in templates. Never
  emit CSS custom properties.

No match → follow `config.tokens.missing`:

| Value | Do |
|---|---|
| `local-scss-var` | Named `$var` at the top of the file, one-line source comment, never an inline literal |
| `role-upgrade` | The tier-check upgrade path in the config |
| `ask` | Ask the developer; don't pick the nearest hex |

**Layout in utilities, visuals in styles.** Flex/grid/gap/padding go on the element as utility
classes with `config.utilities.prefix`; spacing follows the scale in `config.utilities.config`
(off-scale px → arbitrary value). A style class holds only colors, borders, states, logical
borders and widths the scale lacks — never a class that only sets layout.

## Step 4 — Typography

Per `config.typography.kind`: named `classes` → use them, no custom font-size/weight; `mixins`
→ include the mixin; `utility-sizes` → the size utility, override weight only when Figma
differs. Never declare `font-family` unless a rule file allows it.

`status: "partial"` → a Figma text style may have no 1:1 name. Pick the nearest and list it in
the step report as a typography gap; don't invent a new style locally.

## Step 5 — Generate code

The developer skill for `config.stack` is the authority on component patterns. Feature-specific
points:

- Text → `config.i18n.pipe`, keys in `config.i18n.file` with `config.i18n.keyCase`
  (`config.i18n.skill` if set). Includes error/empty/loading copy.
- Icons → `config.icons.usage`; missing glyph → `config.icons.missing`.
- Every `config.extraChecks[]` item applies.
- No Figma node IDs in code. Record them per `config.traceability`.

## Step 6 — Verify against the design

Compare the rendered UI to `get_screenshot` of the same node: layout, token/color,
typography, copy. Fix in-scope mismatches; list pre-existing ones without fixing. Use an
already-running app — never start or restart a dev server yourself; if none is running, stop
at a written checklist.

## Checklist

- [ ] Every candidate node mapped (Code Connect, `design.md`, or confirmed) before code
- [ ] Only `config.designSystem.selectorPrefix` DS components; no local reimplementation
- [ ] Every token grepped in `config.tokens.sources`; misses handled per `tokens.missing`
- [ ] Layout via utilities; style files hold visuals only
- [ ] Typography per `config.typography`; gaps listed, not invented
- [ ] All copy through i18n, including failure paths
- [ ] `config.extraChecks[]` satisfied
- [ ] No node-ID comments; traceability recorded
- [ ] Visual comparison done or checklist written
