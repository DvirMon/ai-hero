---
name: slicing
description: "sdlc stage extension for /to-issues. Give each UI slice a Figma frames table (node IDs) and route design-system blockers to their own flow. Wire it as `stages.to-issues.skills: [\"figma:slicing\"]` in .claude/workflow.json."
---

> **Wired into** `/to-issues` the slice body, per sdlc's `contracts/stage-skills.md`. No Figma frames on the
> ticket (`state.json` `figma[]` empty, no frame URLs) → say so and do nothing.

# Figma-aware issue slicing

When `state.json` → `designPath` is set (or `figma[]` is non-empty but spec predates
`design.md`), FE slices must carry **stable Figma node IDs**, not file paths.

## When this applies

- Epic has a UI surface and `/to-spec` wrote `design.md` (or grill locked a frame table in
  `decisionsPath` while `designPath` is still null — use that table until spec runs).
- Skip for backend-only slices and docs/chore work.

## Per FE slice (issue body)

Add **`## Figma frames`** after **What to build**:

```markdown
## Figma frames

| Frame | Node ID | Notes |
|---|---|---|
| Session row | `4275:4279` | This slice renders the row + sign-out affordance |

Only list frames **this slice** implements or changes. Node IDs come from `design.md` § Frames
or `state.json` → `figma[]`. Link the contract: `Design reference: <designPath>`.

Do **not** paste component maps or token tables into the issue — they drift; readers follow
`designPath`.

## Routing blockers

Create a **separate blocking issue** (or mark an existing slice as blocker) when `design.md` or
grill decisions require:

| Need | Route to |
|---|---|
| New or changed design-system component | the flow `designSystem.newComponent` names in `.claude/figma-project.json` |
| Missing icon | the repo's icon flow from `figma-project.json` — block the FE slice until the icon ships or an approved fallback is in `design.md` |
| Copy owned by another system (help/KB text) | the skill `figma-project.json` names for it, if any |

No route configured for a need → list it as an open blocker in the report, don't invent a flow.

Name the blocker in **Blocked by** with the issue key, not prose alone.

## issue-graph.md

No extra columns required — frame IDs live on the slice issue bodies. When splitting a slice,
re-home node IDs so each issue's table matches what `/to-tasks` will bind on `figma:` steps.
