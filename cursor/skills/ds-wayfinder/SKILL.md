---
name: ds-wayfinder
description: Entry point for building a new DS component from a Figma design. Routes to the correct phase skill based on user intent. On first use, collects project config (frameworks, component paths, reference docs).
---

# DS Component Builder — Hub

## Setup (first use only, per-project)

On first invocation, `ds-wayfinder` checks for `{currentProject}/.claude/ds-wayfinder.config.json`.

**If missing:**
1. Detect framework from `package.json` (Angular, React, Vue, Svelte)
2. Prompt for project name (default: folder name from `package.json`)
3. Prompt for design system name and path (e.g., "shared-ds", "../../libs/shared/design-system")
4. Prompt for component path pattern in this project (e.g., "src/lib/components/**")
5. Prompt for reference doc paths (WCAG, ARIA APG, etc. — relative to design system)
6. Validate against `~/.cursor/skills/ds-wayfinder/schema.json`
7. Write `{currentProject}/.claude/ds-wayfinder.config.json`

**If exists:** Skip setup, proceed to intent router.

All subsequent phases (ds-research, ds-interview, ds-spec, etc.) **walk up from component path** to find config.

### Setup Implementation

**Pseudocode:**
```
// Detect current project
projectPath = findProjectRoot()  // walk up to package.json
framework = detectFramework(projectPath)  // read package.json

if NOT fileExists("{projectPath}/.claude/ds-wayfinder.config.json"):
  questions = [
    {header: "Project", question: "Project name?", options: ["text input"], default: projectPath.basename},
    {header: "Framework", question: "Framework?", options: ["angular", "react", "vue", "svelte"], default: framework},
    {header: "Design System", question: "Design system name?", options: ["text input"], default: "shared-ds"},
    {header: "Design System Path", question: "Path to design system (relative)?", options: ["text input"], default: "../../libs/shared/design-system"},
    {header: "Component Path", question: "Component path pattern?", options: ["text input"], default: "src/lib/components/**"},
    {header: "References", question: "WCAG patterns path?", options: ["text input"]},
    ... (ARIA APG, semantic HTML)
  ]

  answers = askQuestions(questions)  // use the AskQuestion tool if available, else ask conversationally, one at a time or grouped
  config = buildConfigFromAnswers(answers)

  if NOT validateAgainstSchema(config, "~/.cursor/skills/ds-wayfinder/schema.json"):
    showError("Config validation failed")
    return

  writeFile("{projectPath}/.claude/ds-wayfinder.config.json", config)
  showSuccess("Setup complete at {projectPath}/.claude/ds-wayfinder.config.json")

proceed to intent router
```

### Config Discovery (Phase Skills)

When a phase skill runs, it needs to find the config. Discovery algorithm:

```
componentPath = "{componentPath}"  // e.g., apps/issa-landing/src/button/button.component.ts

currentDir = dirname(componentPath)
while currentDir != "/" {
  if fileExists("{currentDir}/.claude/ds-wayfinder.config.json"):
    return loadJSON("{currentDir}/.claude/ds-wayfinder.config.json")
  currentDir = dirname(currentDir)
}

// Not found — prompt user to run the ds-wayfinder skill in project root
showError("Config not found. Run the ds-wayfinder skill in your project root first.")
```

---

## Intent router

Router reasons from state, not from matching the user's wording to a fixed phrase table.

1. **Explicit mode request** — "map", "wayfinder", "use wayfinder" → Wayfinder mode (§ Wayfinder map creation). "start", "new component", "build ds component", "ds-wayfinder" with no existing `session-handoff.md` → ask workflow preference (see below).
2. **Otherwise, read state**: `{componentPath}docs/session-handoff.md` and `{componentPath}docs/phase-state.json`.
   - No `session-handoff.md` → treat as case 1 (ask workflow preference).
   - `session-handoff.md` exists → read its "current phase" and "next step" fields, cross-check which artifact files under `{componentPath}docs/` actually exist (§ Artifacts table), and dispatch to the phase skill that produces the next missing artifact for this `workType` (§ Phases). If handoff and artifacts disagree (e.g. handoff says phase 3 done but `prd.md` is missing), trust the artifacts and say so before proceeding.
3. **User names a target directly** ("spec", "plan", "scaffold", "review", "ship") → treat as a request to jump to that phase's skill, but first check its prerequisite artifacts exist (§ Artifacts). If a prerequisite is missing, say so and offer to run the missing phase first instead of silently skipping.
4. **"where am I", "resume", "what phase"** → same state read as case 2, but report the phase/next-step instead of dispatching.

This replaces phrase matching so the router tolerates any phrasing and self-corrects when handoff state drifts from actual files, instead of trusting whatever phrase the user last said.

### Workflow choice

On first invocation (no existing `session-handoff.md`), offer the choice below — use the AskQuestion tool if available, else ask conversationally:

```
Question: "How should we build this DS component?"
Options:
  - "Linear phases (Recommended)" — research → interview → spec → plan → scaffold. Simpler, predictable. Same session — each phase ends with a context trim to drop what's no longer needed.
  - "Wayfinder map" — Chart the work as a frontier map. Prototype tickets can be spawned mid-phase. Useful for high-risk components or exploratory work.
```

Mark "Linear phases" as `(Recommended)` by default — most components follow the same path. Wayfinder mode is opt-in for components with uncertain decisions.

> **Getting started (Linear):** Just say "start" — `ds-research` collects the component name, Figma URL, and work type, then runs research. Phases stay in the **same session** — each phase ends by naming what to drop from working context and what to keep, scoped to what the next phase needs, then names the next skill to invoke. Context also flows on disk via `session-handoff.md` and `phase-state.json`, so a fresh session works too if the user starts one anyway.
>
> **Getting started (Wayfinder):** Say "map" or "use wayfinder" — the `wayfinder` skill creates a DS component map with Phase 1–7 tickets. Prototype tickets spawn as needed. Map lives in the issue tracker.
>
> **`{componentPath}`** is the component's working directory, derived from the project's `ds-wayfinder.config.json` (`designSystem.path` + `componentPathPattern` + `{prefix}-<name>/`) — e.g. for a repo with `designSystem.path: "libs/shared/ui-core"` and prefix `atera`, that resolves to `libs/shared/ui-core/src/lib/components/2.0/atera-<component-name>/`. All docs (e.g. `docs/session-handoff.md`) are written relative to that path.

## Wayfinder map creation (Option A)

When user chooses wayfinder mode:

1. **Setup** (same as Linear): Config discovery, component name, Figma URL, work type collection via `ds-research`'s setup prompts.

2. **Create map** via the `wayfinder` skill:
   - Destination: "DS component {prefix}-{name} (work type: {workType}) specification and implementation plan complete"
   - Notes: "Framework: {framework}. Design system: {dsName}. Reference docs: {paths}. Prototype tickets spawn mid-phase for UX/async decisions. Tickets are: Phase 1 research, Phase 2 design interview (with prototype sub-tickets), Phase 3 spec, Phase 4 plan, Phase 5+ impl."
   - Frontier tickets:
     - `wayfinder:research` — Phase 1 (Figma/primitives/codebase)
     - `wayfinder:prototype` (optional) — Pre-interview UX/behavior validation if needed
     - `wayfinder:grilling` — Phase 2 (Design decisions via ds-interview)
     - `wayfinder:prototype` (optional, spawned during grilling) — Mid-interview UX/async validation
     - `wayfinder:task` — Update decisions.md with prototype learnings (if prototypes ran)
   - Fog: Phase 3 spec, Phase 4 plan, Phase 5+ implementation (unfold as preceding tickets close)

3. **Ticket detail:**
   - Research ticket body: "Run Phase 1 via `ds-research` — Figma research, primitive survey, codebase patterns, a11y background. Resolves with research-summary.md and decisions.md initial content."
   - Grilling ticket body: "Run Phase 2 via `ds-interview` — grill API, accessibility, edge cases. Prototype sub-tickets spawn here if UX/async uncertain. Resolves with complete decisions.md."
   - Prototype sub-ticket (if spawned): "Body: specific UX/async question. Resolves with prototype branch deleted and learnings in decisions.md."
   - Update-decisions task: "Merge prototype learnings into decisions.md. Resolves when task done."
   - Spec ticket (foggy, graduates after grilling closes): "Run Phase 3 via `ds-spec` — PRD, a11y spec, architecture. Resolves with prd.md (+ roles-map.md/architecture.md if isComplex)."

4. **Workflow:** Users work through the frontier one ticket at a time. Prototypes don't block; they explore and update decisions. Once a ticket closes, new ones graduate from fog.

## Workflow

`workType` (`new` | `variant` | `modify` | `tokens`) is collected in Phase 1 (research) and persisted to `{componentPath}docs/phase-state.json` — it drives the track within the pipeline.

### Phases

| # | Skill | What it does |
|---|---|---|
| 1 | `ds-research` | Collects component name/Figma URL/work type, then sequential research — Figma, primitives, codebase, a11y |
| 2 | `ds-interview` | **Design interview**: grills API/a11y/edge cases against research → writes decisions.md |
| 3 | `ds-spec` | PRD + a11y spec + architecture |
| 4 | `ds-plan` | Versioned implementation task plan |
| 5 | `ds-scaffold` | Scaffolds real component, styles, Storybook, tests |
| 6 | `ds-review` | A11y, code, and styles review |
| 7 | `ds-ship` | Export, Code Connect, final checklist |

## Prerequisites

- Component name + Figma URL (preferred)
- Figma access (view permissions)
- Storybook running locally (`npm run sb`) — needed for review/QA phases
- ADO access (to create work items)
- MCP tools (if configured in this environment): a UI/Figma MCP server, `ng-primitives` MCP (`ngp-mcp`)

## Artifacts

| File | Written by |
|---|---|
| `docs/session-handoff.md` | All phases — current phase + next step only |
| `docs/research-summary.md` | Phase 1 |
| `docs/decisions.md` | Phase 2 |
| `docs/prd.md`, `docs/roles-map.md` (only when isComplex = true), `docs/architecture.md` | Phase 3 |
| `.claude/plans/` | Phase 4 |

## Shared references

All phase skills read from `~/.cursor/skills/ds-wayfinder/references/`:

| File | Used by |
|---|---|
| `session-handoff-template.md` | All phases |
| `component-api.md` (in `ds-interview/references/`) | Phase 2 |
| `architecture.md` + `architecture.{framework}.md` | Phases 2, 3 |
| `prd.md` (in `ds-spec/references/`) | Phase 3 |
| `styles.md` + `styles.{framework}.md` (in `css-styling/references/`, if installed) | Phase 5 |
| `unit-testing.md` + `unit-testing.{framework}.md` (in a testing skill's references, if installed) | Phase 5 |
| `primitives.md` + `primitives.{framework}.md` (in `ds-research/references/`) | Phase 1 |
| `file-structure.md` + `file-structure.{framework}.md` (in `ds-scaffold/references/`) | Phases 4, 5 |
| `tasks.md` + `tasks.{framework}.md` (in `ds-plan/references/`) | Phase 4 |
| `step-strategy.md` (in `ds-plan/references/`) | Phase 4 |
