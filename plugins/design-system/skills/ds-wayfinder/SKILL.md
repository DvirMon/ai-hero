---
name: ds-wayfinder
description: Entry point for building a new DS component from a Figma design. Routes to the correct phase skill based on user intent and on-disk state. Runs `/ds-setup` first when the project has no `.claude/design-system.json`.
---

# DS Component Builder — Hub

## Config

Resolve the design-system config per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md` (walk up to
`.claude/design-system.json`, apply defaults) and read `{conventions}`.

- **Missing config or conventions doc** → run `/ds-setup`, then continue here.
- **Present** → go to the intent router.

Every phase skill resolves the same config the same way. Placeholders (`{prefix}`,
`{componentPath}`, `{conventions}`, …) are defined in `ds-config.md` § Placeholders.

---

## Intent router

The router reasons from state, not from matching the user's wording to a fixed phrase table.

1. **Explicit mode request** — "map", "wayfinder" → Wayfinder mode (§ Wayfinder map). "start",
   "new component", with no existing `session-handoff.md` → ask the workflow preference.
2. **Otherwise, read state**: `{docsDir}session-handoff.md` and `{docsDir}phase-state.json`
   (`${CLAUDE_PLUGIN_ROOT}/contracts/phase-state.md`).
   - No `session-handoff.md` → case 1.
   - It exists → read its current phase and next step, cross-check which artifacts actually
     exist (`phase-state.md` § Artifacts), and dispatch to the phase skill that produces the next
     missing artifact for this `workType`. When handoff and artifacts disagree, trust the
     artifacts and say so.
3. **User names a phase** ("spec", "plan", "scaffold", "review", "ship") → jump to it, after
   checking its prerequisite artifacts exist. If one is missing, say so and offer the missing
   phase first.
4. **"where am I", "resume", "what phase"** → same state read as case 2; report instead of
   dispatching.

### Workflow choice

On first invocation (no `session-handoff.md`):

```
AskUserQuestion({
  questions: [{
    question: "How should we build this DS component?",
    header: "Workflow",
    options: [
      { label: "Linear phases (Recommended)",
        description: "discovery → interview → spec → plan → scaffold → review → ship. Same session; each phase ends with a /compact." },
      { label: "Wayfinder map",
        description: "Chart the work as a frontier map with prototype tickets. For high-risk or exploratory components." }
    ]
  }]
})
```

> **Linear:** say "start" — `ds-discovery` collects the component name, Figma URL and work type.
> Each phase ends by printing a `/compact` line scoped to what the next phase needs, then names
> the next skill. State also lives on disk (`session-handoff.md`, `phase-state.json`), so a fresh
> session resumes cleanly.

## Wayfinder map

Requires `capabilities.map.skill` (`ds-config.md` § Slots). Unset → don't offer map mode in the
workflow choice; a user who asks for it is told to set the slot, and offered Linear.

1. **Setup** as Linear: config, component name, Figma URL, work type (via `ds-discovery`'s setup
   prompts).
2. **Create map** via `capabilities.map.skill`:
   - Destination: "DS component `{selector}` (work type: {workType}) specified and planned"
   - Notes: framework, design-system `name`, `sources` lists.
   - Frontier tickets: discovery (Phase 1), optional prototype, design interview (Phase 2,
     prototype sub-tickets spawn here), update-decisions task (when prototypes ran).
   - Fog: spec, plan, implementation — they graduate as earlier tickets close.
3. One ticket at a time; prototypes never block, they feed `decisions.md`.

## Phases

`workType` (`new` · `variant` · `modify` · `tokens`) is collected in Phase 1 and drives the track.

| # | Skill | What it does |
|---|---|---|
| 0 | `ds-setup` | Once per design system — config + conventions doc |
| 1 | `ds-discovery` | Figma, primitive, codebase and a11y discovery in parallel |
| 2 | `ds-interview` | Grills API/a11y/edge cases → `decisions.md` |
| 3 | `ds-spec` | PRD + a11y spec + architecture |
| 4 | `ds-plan` | Versioned implementation plan |
| 5 | `ds-scaffold` | Component, styles, Storybook, tests |
| 6 | `ds-review` | A11y, code and styles review via `code-review:*-reviewer`, or `stages.review.skill`; skipped when `none` |
| 7 | `ds-ship` | Exports, Code Connect, final checklist |

## Prerequisites

- `design-system.json` + `{conventions}` (`/ds-setup`)
- Figma access and a Figma MCP (`figma_tools` in `/config`, or found by search), or the REST
  fallback in discovery
- The `code-review` plugin (Phase 6) — a declared dependency, installed with this one
- Slot skills, when set (`ds-config.md` § Slots) — the config must name only installed skills
- `commands.storybook` / `commands.test` — run by the user, never by a phase

## Shared references

| File | Used by |
|---|---|
| `references/session-handoff-template.md` | all phases |
| `references/architecture.md` + `architecture.{framework}.md` | Phases 2, 3 |
| `ds-interview/references/component-api.md` + `.{framework}.md` | Phases 2, 5 |
| `ds-discovery/references/primitives.md` + `.{framework}.md` | Phases 1, 3, 5 |
| `ds-spec/references/prd.md` | Phase 3 |
| `ds-plan/references/tasks.md` + `.{framework}.md`, `step-strategy.md` | Phase 4 |
| `ds-scaffold/references/motion.md` | Phases 5, 6 |
| `ds-review/references/ds-code-rules.md`, `ds-styles-rules.md` | Phase 6 |
