---
name: ds-discovery
description: Phase 1 of DS component creation — runs Figma, primitive, codebase, and a11y discovery agents in parallel. Use when starting a new DS component. Run before ds-interview.
---

# DS Component Builder — Phase 1: Discovery

## Config

Resolve the config per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md` and read `{conventions}`.
Missing either → run `/ds-setup` first. Placeholders are defined in `ds-config.md`
§ Placeholders; phase state in `${CLAUDE_PLUGIN_ROOT}/contracts/phase-state.md`.

Pass every agent the resolved config values it needs and the path to `{conventions}` — agents
never resolve the config themselves.

---

## On start

Check `{docsDir}session-handoff.md` once the component name is known:
- **Exists, Phase 1 complete** → say so and suggest `ds-interview`.
- **Exists, Phase 1 incomplete** → resume where it left off.
- **Missing** → Setup.

## Setup

1. **Component name** (e.g. `stepper`, `autocomplete`) — if not given as an argument
2. **Figma URL** (frame or component — optional but preferred)
3. **Work type** (`new` · `variant` · `modify` · `tokens`) — via `AskUserQuestion`
4. **Sibling component** (optional): "Is there a similar component in `{componentsRoot}` to
   reference? Skip if unsure." Offer `sources.siblings` as the options when set.
5. **Primitive hint** (optional): "Do you know which primitive layer this uses? Skip if unsure."
   Offer `sources.primitives` as the options.
6. **Codebase discovery** (optional): "Scan existing DS components for patterns? Recommended for
   new components."

Derive `{componentPath}` from the config.

### `workType: tokens` fast path

A design-token-only change to an existing component — no API, no primitive question. Skip steps
4–6, the pre-flight and the agent fan-out:

1. Ask which tokens change and to what values.
2. Confirm the component exists at `{componentPath}`.
3. Write `{docsDir}discovery-summary.md` with only the token diff.
4. Skip Verdict confirmation; set `verdictChoice: "extend"`.
5. Go to **Write session handoff**.

## Pre-flight — tool availability

For each library in `sources.primitives` and each Figma tool in `{figmaTools}` (`${user_config.figma_tools}`), check whether an
MCP server serves it (`ToolSearch(query: "<library or tool>")`). A missing one is not a blocker:
tell the user which agents will fall back to `WebFetch` / the Figma REST flow, and how to add the
server if they want it. Continue unless they say to stop.

## Launch agents (parallel)

| Agent | subagent_type | When | Inputs |
|---|---|---|---|
| Figma discovery | `design-system:ds-figma-discovery` | Always | componentName, figmaUrl, `{figmaTools}`, `tokens`, `{componentsRoot}`, `{conventions}` |
| Primitive discovery | `design-system:ds-discovery` | Always | componentName, componentBehaviour (infer from name), primitiveHint, `framework`, `sources.primitives`, `sources.references` |
| Codebase discovery | `design-system:ds-codebase-discovery` | User opted in | componentName, componentBehaviour, siblingComponentPath, `{componentsRoot}`, `naming`, `{conventions}` |
| A11y discovery | `design-system:ds-a11y-discovery` | Always | componentName, componentBehavior, componentType (coarse category), `a11y.wcag`, `sources.a11y` |

Pass all inputs in the `prompt`. Call `Agent` several times in one response to run them in
parallel.

## After agents return

### Deduplication gate (codebase discovery ran)

- **DUPLICATE** → stop and ask: "`{selector}` already exists at `{path}`. Extend it, or create
  new?"
- **CLEAR** → proceed.

### Internal wrapper consolidation

An internal wrapper found by codebase discovery **overrides** a raw library recommendation from
primitive discovery. Note the final primitive decision in the Discovery Summary.

### Internal DS components inventory

Before writing the summary, list the **existing DS components that appear inside the new one**
(e.g. a filter bar contains the DS button; a form field contains the DS input). Start from
`{conventions}` § Building blocks, then the Figma output.

For each:
1. Confirm it exists under `{componentsRoot}`.
2. Read its selector/name from source and its import path from its export (or `{importPath}`).

Record `internalDsComponents` in the summary — `none` when empty. It is mandatory input for the
PRD. **Rule:** a Figma element that matches an existing DS component MUST be listed; the
scaffolder imports it, never re-implements it.

### Discovery Summary

Synthesize every output into `{docsDir}discovery-summary.md` (shape:
`references/discovery.md` § Output) and link it to the user.

**Mandatory section "A11y Patterns"** — `ds-a11y-discovery`'s output verbatim (APG pattern(s) +
URLs, WCAG SCs, semantic HTML, keyboard/focus/SR/touch-target options, fetch dates). Never
summarized away — Phases 2 and 3 depend on it.

## Verdict confirmation

Determine the verdict (`build-new` · `extend` · `reuse`) from the summary and offer it as a
3-way choice.

| Option | Label template | Recommended when |
|---|---|---|
| Build new | `Build a new {selector}` | No existing component covers this. Always available. |
| Extend existing | `Extend <sibling> to add this behaviour` | A sibling could absorb it; describe the contract risk. No sibling found → `Extend a related component`, and why the pool is thin. |
| Not needed | `Skip — reuse <sibling> as-is` | An existing component covers the full spec with zero gaps; otherwise explain the gap. |

Each description is 2–3 sentences specific to this component — real component names, tokens and
trade-offs from discovery. Never placeholder copy. Mark `(Recommended)` on the verdict.

```
AskUserQuestion({
  questions: [{
    question: "How should we approach {selector}?",
    header: "Approach",
    multiSelect: false,
    options: [ <build-new>, <extend>, <reuse> ]
  }]
})
```

Store the answer as `verdictChoice` in `{docsDir}phase-state.json` before any other handoff
file.

## Write session handoff

Merge into `{docsDir}phase-state.json`: `componentName`, `figmaUrl`, `workType`,
`discoverySummaryPath` (`"<paths.docs>/discovery-summary.md"`, relative to `{componentPath}`),
`verdictChoice`.

Write `{docsDir}session-handoff.md` from
`${CLAUDE_PLUGIN_ROOT}/skills/ds-wayfinder/references/session-handoff-template.md`: Phase 1
checked, Figma URL, component path, next step.

## Continuation

```
Discovery complete.

/compact Keep: componentPath, config values, workType, verdictChoice, paths to discovery-summary.md and session-handoff.md. Drop: Figma/primitive/codebase/a11y agent raw outputs — synthesized into discovery-summary.md already.

Then run `ds-interview <name>` next.
```
