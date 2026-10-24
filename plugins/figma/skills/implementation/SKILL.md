---
name: implementation
description: "sdlc stage extension for /implementation. Brief UI steps with design.md and node IDs, add the project's skills.ui to their dispatch, and run verify-ui steps inline. Wire it as `stages.implementation.skills: [\"figma:implementation\"]` in .claude/workflow.json."
---

> **Wired into** `/implementation` § 2 Route — `figma:` steps and the `verify-ui` step type, per sdlc's `contracts/stage-skills.md`. No Figma frames on the
> ticket (`state.json` `figma[]` empty, no frame URLs) → say so and do nothing.

# Figma UI — `/implementation`

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

1. Skills: the project's `skills.code` plus `skills.ui` (e.g. `figma-design-to-code`,
   `figma-feature-implementation`, `css-styling`), passed to the implementer.
2. Area rules from `figma-project.json` → `rules[]` (e.g. `frontend/AGENTS.md`).
3. Brief the implementer with:
   - `designPath` — mappings are authoritative
   - Step `figma` node IDs and matching `fileKey` from `figma[]`
   - Instruction: run `figma-feature-implementation` Steps 0–5; **Step 6** runs after the step
     lands unless a `verify-ui` step follows (then Step 6 belongs to verify)

### Implementer dispatch

Pass the usual `stepFilePath`, `workspaceRoot`, `specPath`, `architecturePath`, plus the brief
above. Do not batch Figma fetch for multiple steps.

### After implementer returns

If there is **no** `verify-ui` step later in the plan, run **Visual verify** (below) for this
step's `figma` nodes before marking the step done. If a `verify-ui` step exists, defer full
comparison to it — only ensure `design.md` mappings were applied (no obvious i18n/token leaks in
diff review).

## `verify-ui` steps

Handled **inline by the dispatcher**, not an implementer.

1. Node list = step `figma:` or union of all `figma:` on UI code steps this step `depends_on`.
2. **`get_screenshot`** per node (`fileKey` from `figma[]`) after loading the project's `skills.ui`.
3. **Browser** — screenshot the route/states named in the step's **Do** / issue acceptance
   criteria on the developer's **already running** dev server — the URL the step names, else the
   project's `devUrl`. Use browser MCP / Playwright MCP / built-in browser tools
   available in the session.
4. **Compare** Figma vs app in four groups: **layout**, **token/color**, **typography**, **copy**.
5. **Fix** in-scope mismatches in a new commit (`fix` or `style` per change); **list** pre-existing
   out-of-scope mismatches without fixing.
6. **Never** start, stop, or restart the dev server. If nothing is listening on the expected port,
   (or neither URL is set), stop the step: write a **checklist** of routes/states and frames still to compare manually.

Optional: append a short comparison note to the step report; do not commit node IDs into product
source.

## Motion

When a prior UI step's `get_design_context` flagged motion, load **`figma-implement-motion`**
before implementing that step only.

## Stops (construction vs runtime)

| Condition | Action |
|---|---|
| Missing `designPath` but step has `figma:` | Stop — run `/to-spec` |
| Token in Figma not in `design.md` | Stop — spec gap |
| `figma-project.json` missing in repo | Stop — config error |
| Dev server not running at verify | Degrade to checklist (runtime) |
