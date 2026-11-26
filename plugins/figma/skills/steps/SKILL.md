---
name: steps
description: "sdlc stage extension for /to-tasks. Bind Figma node IDs to UI code steps (`figma:` frontmatter) and record each frame's route and states in `state.json` `figma_states[]` for `/verify-visual`. Wire it as `stages.to-tasks.skills: [\"figma:steps\"]` in .claude/workflow.json."
---

> **Wired into** `/to-tasks` § 3 and § 5 — step frontmatter and the `figma_states[]` field it owns in `state.json`, per sdlc's `contracts/stage-skills.md`. No Figma frames on the
> ticket (`state.json` `figma[]` empty, no frame URLs) → say so and do nothing.

# Figma-aware task plans

Bind Figma context at plan time so `/implement` does not re-derive node IDs or token decisions.

## Inputs

Read on every UI issue plan:

- `state.json` → `designPath` (required when `figma[]` non-empty)
- `state.json` → `figma[]` (fileKey lookup for MCP)
- The issue's **`## Figma frames`** table (from `figma:slicing`)

## Code steps — optional `figma` frontmatter

When a step renders UI that matches one or more frames, add **node IDs only** (colon form):

```yaml
---
step: 4
type: code
commit: feat
depends_on: [3]
figma:
  - "4275:4279"
  - "4283:12603"
figma_file: UuULlLPwxrsFLPnmxHyF4P
files:
  - app/.../active-sessions-section.component.ts
---
```

Rules:

- Every id must appear in the issue's **Figma frames** table or `design.md` § Frames.
- Omit `figma` on pure service/model/test steps.
- In **Watch out**, point at the rows in `design.md` this step consumes (component map, token
  map, copy keys) — link `designPath`, do not copy tables.

- `figma_file` is the Figma `fileKey` for every node in that step. Write it on every step that has
  `figma:`. `/implement` resolves it from `figma_file`, then `figma[]`, then `design.md` § Frames;
  a node that resolves nowhere is a plan defect.
- Every listed node is a **fetch target**: `/implement` fetches each one from Figma before
  writing UI.

## Frame states

When the issue's **Figma frames** table is non-empty, write one `state.json` `figma_states[]`
entry per frame (shape: sdlc `skills/to-ticket/references/state-schema.md`). No plan step:
`/verify-visual` compares the frames after `/implement`.

- `nodeId`, `fileKey` — from the frames table and `figma[]`.
- `route` — the page the frame renders, from the UI code steps' `files` and the app's routes.
- `states` — `default` plus every state the acceptance criteria and UI code steps name (a
  dialog open, a menu open, an empty list). `open` names controls by visible label, as a
  person would click them. `role` is `null` unless the state needs another role than the
  developer's session.
- Replace this ticket's earlier entries for the same `nodeId`; leave other entries alone.

## Writer brief

Pass `designPath`, the issue's frame table, and this file's rules to the `sonnet` writer in §5.
