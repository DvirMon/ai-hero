---
name: visual-verify
description: Visual comparer for sdlc `/verify-visual` (`stages.verify-visual.comparer`) — compare and render, per sdlc `contracts/visual-comparer.md`.
metadata:
  model-tier: implementation
model: sonnet
---

> **Model tier: implementation** (writing code from a written plan, review passes, UI work). Claude Code switches to `sonnet` on its own; in Cursor pick Composer 2.5 (Fast mode off), and set effort to **medium** (`/effort medium` in Claude Code, the model picker in Cursor) before running this skill. <!-- ai-models -->
# Visual verify: Figma frame vs app, measured

The comparer behind sdlc `/verify-visual`, per sdlc `contracts/visual-comparer.md`. Two calls:
`compare <input.json>` and `render <report.json> <out.html>`. It compares and reports. It never
edits source, commits, writes verdicts (except `not run`), or publishes; those are the stage's.

Invoked with no args (wired on a stage, e.g. `stages.implement.skills`) → stop:
"`visual-verify` is no longer a wired skill — set `stages.verify-visual.comparer` and drop it
from `stages.implement.skills`."

## compare

Input fields: `outDir`, `devUrl`, `componentPrefix`, `frames[]`, `states[]`, `crop[]` (see the
contract). One image dir per state: `<outDir>/<frame>-<state>/` with `figma.png`, `local.png`,
`diff.png`, `res.json`.

1. **Figma side**: `get_screenshot` per frame node at 1x, saved as that state dir's
   `figma.png`. Read sizes with `get_metadata`.
2. **App side**: the **ego-browser** skill, never chrome-devtools. The dev server is already
   running at `devUrl`; not listening → stop and report it (the stage writes the checklist).
   Never start, stop or restart it. Device scale factor 1. Open every state in **one pass**
   (`route`, then `open` by visible label), one screenshot per state, cropped to the frame's
   region. The session is already signed in; never enter credentials. A state whose `role` is
   not the signed-in one, or whose control cannot be found → section `verdict: "not run"` with
   the reason in `note`, no images. Apply `crop[]` before the diff.
3. **Diff**: the `figma:figma-pixel-diff` skill (its `scripts/figma-pixel-diff.mjs`, or
   `run-sections.py` for several sections of one page). One diff per frame/state, output to the
   state dir; its printed JSON is `res.json`. Copy `diffAreaPct` and `sizeMismatch` into the
   section.
   A cluster only says **where** pixels differ. It never says **what** the style difference is.
   Never state a style value (font size, colour, width, padding, gap) from a PNG, a diff image, or a
   cluster coordinate. For each cluster, confirm the value on both sides from a real source:
   - **Figma**: `get_metadata` / `get_design_context` for the node (size, font, colour, spacing).
   - **App**: the component's SCSS/template in code, or computed styles and `getBoundingClientRect`
     of that element through ego-browser `page.evaluate`.
   - Whether a component is shared (`v-dialog`, title wrapper, tooltip): open its source, do not infer it.
   A value not confirmed this way is written as `unverified`, never as a number. Position and size
   taken from cluster coordinates are labelled "measured from diff", not as a style rule.
   Each cluster gets `property`, `figmaValue`, `appValue`, `fromComponent`, `component`,
   `variant`.
4. **`fromComponent`** (Angular emulated encapsulation): for the element at each cluster's
   centre, `page.evaluate` finds the nearest ancestor-or-self whose tag starts with
   `componentPrefix`.
   - The element is that host, or carries `_ngcontent-<id>` equal to that host's
     `_nghost-<id>` → the value is the component's own style → `fromComponent: "<tag>"`,
     `component: "<tag>"`, `variant` from its inputs/classes (e.g. `primary`).
   - The element carries the page component's `_ngcontent-<id>` → `fromComponent: null`.
   - No encapsulation attributes found → `fromComponent: "unverified"`. The stage treats it as
     a component difference.
5. **Copy check** (by eye, moved here from `figma:implement`): compare the visible text of each
   state with the Figma text nodes (`get_design_context`). Each difference →
   `copy: [{ figma, app }]`. Wording is not something the pixel diff finds.
6. Write `<outDir>/report.json`: `title`, `meta`, and one section per frame × state with `id`,
   `name`, `dir`, `res`, `diffAreaPct`, `sizeMismatch`, `copy`, `clusters`, `verdict` (empty,
   or `not run`), `note`. Schema: `scripts/build-report.py`.

Never "matches" without the number. A `sizeMismatch` is reported, never smoothed over: the
diff only compares the top-left overlap.

## render

`python3 scripts/build-report.py <report.json> <out.html>`; return the HTML path. The page
embeds the Figma, App and Diff images and shows per-state verdict bars, a Figma / App / Diff /
Blend comparer with a cluster overlay, the differences (property, values, source) and the fix
list. `build-report.py` accepts exactly the verdicts `matching` · `fixed` · `accepted` ·
`needs approval` · `older difference` · `not run`; anything else is an error. Publishing is the
stage's.

## Notes

- A Figma frame can be stale. Report the cluster with both values; the stage decides.
- Dynamic content (dates, ids, user names) differs by design: `crop[]` removes it.
- Tests: `python3 -m unittest scripts/test_build_report.py`.
