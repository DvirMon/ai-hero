---
name: ds-spec
description: Phase 3 of DS component creation — generates PRD, a11y spec, and architecture doc from interview decisions. Run after ds-interview, after the phase-end /compact.
---

# DS Component Builder — Phase 3: Spec

## Config

Resolve the config per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md` and read `{conventions}`.
Missing either → stop and point to `/ds-setup`.

Spec template: `references/prd.md`.

---

## On start

Ask the user for the component name, then read `{docsDir}session-handoff.md`.

If the "Design Interview" checklist item is not marked complete → tell the user to finish `ds-interview` first.

Read `{docsDir}phase-state.json` — load `isComplex`, `scopeTriage`, and `discoverySummaryPath`.
`discoverySummaryPath` is relative to `{componentPath}`, which always ends with `/`, so
`{componentPath}{discoverySummaryPath}` is always a valid joined path.
Read `{docsDir}decisions.md` — load its **full content**.
Read the discovery summary from `{componentPath}{discoverySummaryPath}`.

## Pre-launch: Prototype check

Before launching agents, scan `decisions.md` for async/timing/state-machine complexity:
- Are there decision sections describing async flows, loading states, or complex state transitions?
- Do any decisions mention "order of operations", "race conditions", or "unclear timing"?

If yes, offer: *"Your state/async logic looks complex. Should I prototype a minimal reducer or state-machine scaffold to validate the sequence before locking the spec?"*

If yes:
1. Create throwaway branch `prototype/logic-{component-name}`
2. Invoke `/prototype` with the async/state challenge and design-decisions context
3. Wait for prototype to land
4. Review: Does the logic flow match expectations? Any race conditions exposed?
5. Update `decisions.md` with learnings (e.g., "Async order confirmed via prototype: fetch → error check → state update")
6. Delete prototype branch
7. Proceed to launch agents below

## Launch agents (parallel)

| Agent | subagent_type | model | When | Inputs |
|---|---|---|---|---|
| PRD writer | `design-system:ds-prd-writer` | opus | Always | componentName, componentPath, selector, `{conventions}`, `tokens`, `figma.project`, discoverySummary (file content), designDecisions (full file content) |
| A11y speccer | `design-system:ds-a11y-speccer` | sonnet | Always | componentName, componentPath, selector, `a11y.wcag`, discoverySummary (file content, including the "A11y Patterns" section), designDecisions (full file content, including the "Accessibility Contract" decisions), isComplex |
| Architect | `design-system:ds-architect` | opus | `isComplex = true` only | componentName, componentPath, `framework`, `naming`, `{conventions}`, discoverySummary, designDecisions (full file content) |

Pass `designDecisions` as the **full text content** of `decisions.md` inline in the prompt — not a file path.

Pass all inputs in the `prompt` parameter. Call `Agent` multiple times in the same response to run in parallel.

## After agents return

Present the generated docs to the user as clickable links:
- `docs/prd.md` (always)
- `docs/roles-map.md` (if `isComplex = true` — for non-complex components the a11y spec is returned inline, not written to a file)
- `docs/architecture.md` (if `isComplex = true`)

## Developer checkpoint

If `isComplex = false`, print the inline a11y spec returned by `ds-a11y-speccer` here so the user can review it before approving:

```
**A11y spec (inline):**
{a11ySpecText returned by ds-a11y-speccer}
```

> "Please review the spec files above and confirm before I generate the implementation plan."

Wait for explicit approval before continuing.

## Write handoff

Merge a11y spec data into `{docsDir}phase-state.json` (preserve all existing keys):

- If `isComplex = false`: set `a11ySpecText` to the full inline spec, set `a11ySpecPath` to `null`
- If `isComplex = true`: set `a11ySpecPath` to `"<paths.docs>/roles-map.md"` and set `a11ySpecText` to `null`

`phase-state.json` is the source of truth for downstream phases for both `a11ySpecText` and `a11ySpecPath`.

Update `{docsDir}session-handoff.md` — mark the "Spec" checklist item complete and update "What to do next", but do **not** persist the a11y spec there or instruct downstream phases to read `a11ySpecText` from the handoff.

Print:

```
Spec complete.

/compact Keep: componentPath, phase-state.json values (isComplex, a11ySpecText/a11ySpecPath), paths to prd.md, roles-map.md, architecture.md. Drop: PRD/a11y/architecture agent raw generation output and any prototype exploration — fully written to those docs already.

Then run `ds-plan <name>` next.
```
