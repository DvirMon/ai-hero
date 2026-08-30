---
name: ds-research
description: Phase 1 of DS component creation — runs Figma, primitive, codebase, and a11y research agents in parallel. Use when starting a new DS component. Run before ds-interview.
---

# DS Component Builder — Phase 1: Research

> `{dsComponentsRoot}` = the design system's shared components root (resolved from `designSystem.path` + `componentPathPattern` in the project's `ds-wayfinder.config.json`). `{componentPath}` = this component's own working directory within it.

## Config Setup

Discovers `{projectPath}/.claude/ds-wayfinder.config.json` by walking up from component path:
- Starts at component directory
- Walks up until finding `.claude/ds-wayfinder.config.json`
- Reads framework, component paths, reference doc locations, output structure

**If config missing:** Prompt user to run `/ds-wayfinder` in project root.

Pass config to agents: `Agent("ds-figma-researcher", { config })`

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
3. **Work type** (`new` | `variant` | `modify` | `tokens`) — via the `AskUserQuestion` tool
4. **Sibling component** (optional): "Do you know of a similar existing component in `{dsComponentsRoot}` to reference? (e.g. `{prefix}-banner`, `{prefix}-dialog`) — skip if unsure."
5. **CDK/primitive hint** (optional): "Do you know which primitive layer this component uses? (e.g. `ng-primitives`, `CdkOverlay`, `@angular/cdk/a11y`) — skip if unsure."
6. **Codebase research** (optional): "Should I scan existing DS components for patterns and conventions? Recommended for new components; skip if you already know them. (yes/no)"

Derive: `componentPath` = resolved from config (`designSystem.path` + `componentPathPattern` + `{prefix}-{name}/`) — e.g. `libs/shared/ui-core/src/lib/components/2.0/atera-{name}/` for this repo's config.

### `workType: tokens` fast path

If Setup step 3 returns `tokens`, this is a design-token-only change to an existing component — no new API surface, no primitive/behavior question. Skip steps 4–6, Pre-flight, and the full agent fan-out below entirely. Instead:

1. Ask: "Which design tokens are changing, and to what values? (e.g. `--color-surface-brand`: `#1a1a1a` → `#0f0f0f`)"
2. Confirm the target component exists at `{componentPath}` (it must — `tokens` edits an existing component, it doesn't create one).
3. Write `{componentPath}docs/research-summary.md` containing only the token diff — skip the Figma/primitive/codebase/a11y sections.
4. Skip **Verdict confirmation** below — there's no build-new/extend/reuse question for a token edit. Set `verdictChoice: "extend"` directly in `phase-state.json`.
5. Skip to **Write session handoff**.

## Pre-flight — ng-primitives check

Verify the Angular Primitives MCP server is available:

```
ToolSearch(query: "list_primitives", max_results: 3)
```

**If tools returned** → proceed.

**If no tools returned** → add to `~/.claude/settings.json` under `mcpServers`:
```json
"ng-primitives": {
  "type": "stdio",
  "command": "{absolute-path-to-project}/node_modules/.bin/ngp-mcp"
}
```
Tell the user to restart Claude Code. Do not proceed until restarted (unless they say "continue anyway" — then note WebFetch fallback and proceed).

## Launch agents (parallel)

Use the `Agent` tool with `subagent_type` matching the agent's filename:

| Agent | subagent_type | model | When | Inputs |
|---|---|---|---|---|
| Figma researcher | `ds-figma-researcher` | sonnet | Always | componentName, figmaUrl |
| Primitive researcher | `ds-researcher` | sonnet | Always | componentName, componentBehaviour (infer from name), cdkHint (if provided) |
| Codebase researcher | `ds-codebase-researcher` | sonnet | User opted in | componentName, componentBehaviour, siblingComponentPath (if provided) |
| A11y researcher | `ds-a11y-researcher` | sonnet | Always | componentName, componentBehavior (infer from name), componentType (coarse category inferred from name, e.g. button/dialog/stepper/list/form-input) |

Pass all inputs in the `prompt` parameter. Call `Agent` multiple times in the same response to run in parallel.

## After agents return

### Deduplication gate (only if codebase researcher ran)

Check its "Duplicate Check" field:
- **DUPLICATE** → stop and ask: "A component named `{prefix}-{name}` already exists at `{path}`. Extend it, or create new?"
- **CLEAR** → proceed

### Internal wrapper consolidation

If both researchers ran: an internal wrapper finding **overrides** any raw CDK recommendation.
If only `ds-researcher` ran: use its wrapper findings directly.

Note the final primitive decision in the Research Summary.

### Internal DS components inventory

Before writing the Research Summary, scan the Figma output and the codebase to identify **existing DS v2 components that appear inside the new component** (e.g. a filter bar contains `atera-button`; a form field contains `atera-input`).

For each found component:
1. Confirm the component exists under `{dsComponentsRoot}`
2. Extract the selector from the component/directive source (`@Component`/`@Directive({ selector: ... })`) and the import path from the relevant `public-api.ts` or exports

Record the result as `internalDsComponents` in the Research Summary — even if the list is empty (write `none`). This list is mandatory input for the PRD in the Spec phase (`ds-spec`).

**Rule:** If the Figma design contains a UI element that matches an existing DS component, that component MUST be listed here. The scaffolder will not reimplement it — it will import and use it.

### Research Summary

Synthesize all outputs into a **Research Summary** and write it to `{componentPath}docs/research-summary.md`. Present it to the user as a clickable link.

**Mandatory section: "A11y Patterns"** — append `ds-a11y-researcher`'s full output verbatim (matched APG pattern(s) + source URLs, applicable WCAG SCs, semantic HTML recommendation, keyboard/focus/SR/touch-target pattern options, fetch dates). Never omitted, never summarized away — `ds-interview` (Phase 2) and `ds-a11y-speccer` (Phase 3) both depend on it being present in full.

## Verdict confirmation

Before writing any handoff files, determine the verdict (`build-new` | `extend` | `reuse`) from the Research Summary, then surface it to the user as an interactive 3-way choice.

### Reason about the three paths

From the Research Summary, synthesize a 2–3 sentence description for each option — be specific: name real components, tokens, and trade-offs found during research. Each description answers "what would this mean for `{prefix}-{name}` specifically?".

| Option | Label template | Recommended when |
|---|---|---|
| **Build new** | `Build a new {prefix}-{name}` | No existing component covers this behaviour. Always available. |
| **Extend existing** | `Extend {prefix}-{sibling} to add this behaviour` | A sibling component exists that could absorb this behaviour; describe the cost/risk of muddying its contract. If no sibling was found, label it `Extend a related component` and explain why the candidate pool is thin. |
| **Not needed** | `Skip — reuse {prefix}-{sibling} as-is` | An existing component already satisfies the full spec with zero gaps. If no such component exists, label it `Skip — an existing component already covers this` and explain the gap. |

Mark `(Recommended)` on whichever option matches the verdict you determined above.

### Call AskUserQuestion

```
AskUserQuestion({
  questions: [{
    question: "How should we approach the {prefix}-{name} component?",
    header: "Approach",
    multiSelect: false,
    options: [
      {
        label: "<Build a new {prefix}-{name}> OR append \" (Recommended)\" if verdict.action === 'build-new'",
        description: "<specific rationale: what tokens/patterns it reuses, why this is the cleanest path for this component>"
      },
      {
        label: "<Extend {prefix}-{sibling}> OR append \" (Recommended)\" if verdict.action === 'extend'",
        description: "<trade-offs: what bolting this onto the sibling means, blast-radius, contract risks>"
      },
      {
        label: "<Skip — reuse {prefix}-{sibling} as-is> OR append \" (Recommended)\" if verdict.action === 'reuse'",
        description: "<why this is or isn't viable: specific gaps in the existing component, or confirmation of zero-gap>"
      }
    ]
  }]
})
```

> **Never use placeholder text.** Every label and description must be populated from the actual research output — component names, token names, behaviours. Generic copy like "this option is recommended" is not acceptable.

### Record the user's choice

Store the answer in `{componentPath}docs/phase-state.json` as `verdictChoice` before writing any other handoff files. Map the user's selected option to:
- Option 0 selected → `"build-new"`
- Option 1 selected → `"extend"`
- Option 2 selected → `"reuse"`

## Write session handoff

Using the already-written Research Summary as input (CDK decision, similar components, tokens, codebase patterns), create the handoff files below.

**Update** `{componentPath}docs/phase-state.json` — preserve `workType` and `figmaUrl` collected in Setup; add `researchSummaryPath` and `verdictChoice`:
```json
{
  "figmaUrl": "...",
  "workType": "new|variant|modify|tokens",
  "researchSummaryPath": "docs/research-summary.md",
  "verdictChoice": "build-new|extend|reuse"
}
```

Write `{componentPath}docs/session-handoff.md` using the template at `.claude/skills/ds-wayfinder/references/session-handoff-template.md`. Fill in: Phase 1 checked off, Figma URL, component path, "What to do next".

## Continuation

Print:

```
Research complete.

/compact Keep: componentPath, config values, workType, verdictChoice, path to research-summary.md and session-handoff.md. Drop: Figma/primitive/codebase/a11y agent raw tool outputs and transcripts — fully synthesized into research-summary.md already.

Then run `ds-interview <name>` next.
```
