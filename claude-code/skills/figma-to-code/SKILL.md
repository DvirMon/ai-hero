---
name: figma-to-code
description: Entry point for all Figma-to-code tasks in any project. Loads the project's .claude/figma-project.json, then routes to the right skill — product feature implementation, design system component creation, Code Connect authoring, or token/styling lookup.
---

# Figma to Code — Orchestrator

## 0. Load the project config (always first)

Read `{repoRoot}/.claude/figma-project.json` per [project-config.md](references/project-config.md).
Missing or incomplete → stop and offer to draft it; never infer it.

Also load the official plugin skill **`figma-design-to-code`** before any `get_design_context`
call — it is mandatory and these skills sit on top of it, not instead of it.

## 1. Route

| Signs | Skill |
|---|---|
| A screen, page, modal, flow or section built from existing DS components | **`figma-feature-implementation`** |
| A new or changed reusable component for the DS (`designSystem.selectorPrefix`) | `config.designSystem.newComponent` (e.g. `figma-ds-component`, or the design-system two-MR flow) |
| Linking a Figma component to code (`.figma.ts`) | **`code-connect-authoring`** — only when `codeConnect.available` is `true` |
| Which token/class to use for a color, border or fill seen in Figma | `css-styling` → [ds-components.md](../css-styling/references/ds-components.md) for the mapping principle, `config.tokens` for this project's names |

## When in doubt

A node holding both product UI and a missing DS component splits in two: the DS component
first (its own flow, often its own repo and MR), then the feature that consumes it.
