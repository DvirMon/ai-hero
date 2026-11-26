---
name: implement
description: "sdlc stage extension for /implement. Brief UI steps with design.md and node IDs, and add the project's skills.ui to their dispatch. Wire it as `stages.implement.skills: [\"figma:implement\"]` in .claude/workflow.json."
---

> **Wired into** `/implement` § 2 Route — `figma:` steps, per sdlc's `contracts/stage-skills.md`. No Figma frames on the
> ticket (`state.json` `figma[]` empty, no frame URLs) → say so and do nothing.

# Figma UI — `/implement`

Consumes `state.json` → `designPath`, `figma[]`, and step frontmatter → `figma` (node IDs).
**No new token or component decisions** — an unmapped row in `design.md` is a **stop**; send
the user back to `/to-spec` or grill.

## Gather (once per issue run)

When `designPath` is non-null, read it before the first UI step. When a step lists `figma:` but
`designPath` is null, stop: spec/grill did not lock the CSS context.

Load repo `.claude/figma-project.json` when the workspace is under a repo that has one.

## UI `code` steps

Applies when the step has non-empty `figma:` **or** (no `figma` key but `designPath` is set and
the step's `files` include UI templates/styles under the frontend app).

### Before dispatching the implementer

1. Skills: the project's `skills.code` plus `skills.ui` (conventions only, e.g.
   `css-styling`), passed to the implementer. The Figma fetch does **not** depend on
   `skills.ui`: it always runs for these steps.
   Resolve each node's `fileKey` in this order: the step's `figma_file`, then `state.json`
   `figma[]` (match `nodeId`), then `design.md` § Frames. None resolves → stop.
2. Area rules from `figma-project.json` → `rules[]` (e.g. `frontend/AGENTS.md`).
3. Brief the implementer with:
   - `designPath` — mappings are authoritative
   - Step `figma` node IDs and matching `fileKey` from `figma[]`
   - Pass `figma: [{ fileKey, nodeId }, ...]` as the structured `figma` input (not prose).
     The implementer's Figma gate fetches every frame (`create_session`, `get_screenshot`,
     `get_metadata`, `get_design_context`) and diffs its markup against it.
   - Instruction: no browser visual verify. `/verify-visual` compares the frames against the
     running app after `/implement`.

### Implementer dispatch

Pass the usual `stepFilePath`, `workspaceRoot`, `specPath`, `architecturePath`, plus the brief
above. On a test-first step pass `figma` on the **green** dispatch (the red phase ignores it). Do not batch Figma fetch for multiple steps.

### After implementer returns

Check the report first: no `Figma: fetched …` line, or `layout drift` unlisted → the step is
**not done**; send it back. Then review the diff against the implementer's metadata diff
(structure, order, spacing) and `design.md` mappings (no i18n/token leaks). The browser
comparison is `/verify-visual`'s.

## Old plans

A step with `type: verify-ui` (a plan written before `/verify-visual`) → report "moved to
`/verify-visual`" and mark it `⏭ skipped`.

## Stops (construction vs runtime)

| Condition | Action |
|---|---|
| Missing `designPath` but step has `figma:` | Stop — run `/to-spec` |
| Step has `figma:` and no `fileKey` resolves (`figma_file`, `figma[]`, `design.md` § Frames) | Stop — fix the plan |
| Figma MCP tools unavailable to the implementer (`Figma: blocked`) | Stop — never build from `design.md` text alone |
| Implementer returns without a `Figma: fetched` line | Not done — send the step back |
| Token in Figma not in `design.md` | Stop — spec gap |
| `figma-project.json` missing in repo | Stop — config error |
