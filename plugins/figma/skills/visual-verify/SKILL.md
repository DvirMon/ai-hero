---
name: visual-verify
description: Wired into /implement after figma:implement. Adds a measured pixel-diff to the verify-ui step (and to any UI step's visual verify) - Figma frame vs the running app in ego-browser, using the figma MCP and the figma:figma-pixel-diff skill. Use when a ticket has Figma frames and a UI to verify, or when asked to check visual parity against Figma.
metadata:
  model-tier: implementation
model: sonnet
---

> **Model tier: implementation** (writing code from a written plan, review passes, UI work). Claude Code switches to `sonnet` on its own; in Cursor pick Composer 2.5 (Fast mode off), and set effort to **medium** (`/effort medium` in Claude Code, the model picker in Cursor) before running this skill. <!-- ai-models -->
# Visual verify: Figma frame vs app, measured

Wired into `/implement` (`stages.implement.skills`, after `figma:implement`). It adds a check to the
`verify-ui` step per sdlc `contracts/stage-skills.md`. It does not replace that step.

No Figma frames on the ticket (`state.json` `figma[]` empty) → say so and do nothing.

## What it replaces in `figma:implement` § verify-ui

`figma:implement` step 4 compares layout, token/color, typography and copy by eye. This skill makes
that comparison a number. Steps 1-3 (node list, `get_screenshot`, browser on the running dev server)
and 5-6 (fix in-scope, never start the dev server) stay as written there.

## Steps

1. Node list and `fileKey`: as `figma:implement` § verify-ui steps (step `figma:` or the union of its
   `depends_on` UI steps; `figma[]` / `figma_file`).
2. **Figma side**: `get_screenshot` per node at 1x. Save as `figma-<name>.png`. Read sizes with
   `get_metadata`.
3. **App side**: the **ego-browser** skill, never chrome-devtools. Dev server already running at the
   step's URL or the project `devUrl`; not listening → write the checklist and stop. Never start or
   restart it. Device scale factor 1. Open every state the step names in **one pass**, one
   screenshot per state, cropped to the same region as the frame. The session is already signed in;
   never enter credentials. A state that needs another role → mark `not run` with the reason.
4. **Diff**: the `figma:figma-pixel-diff` skill (its `scripts/figma-pixel-diff.mjs`, or `run-sections.py` for
   several sections of one page). One diff per frame/state.
   A cluster only says **where** pixels differ. It never says **what** the style difference is.
   Never state a style value (font size, colour, width, padding, gap) from a PNG, a diff image, or a
   cluster coordinate. For each cluster, confirm the value on both sides from a real source:
   - **Figma**: `get_metadata` / `get_design_context` for the node (size, font, colour, spacing).
   - **App**: the component's SCSS/template in code, or computed styles and `getBoundingClientRect`
     of that element through ego-browser `page.evaluate`.
   - Whether a component is shared (`v-dialog`, title wrapper, tooltip): open its source, do not infer it.
   A value not confirmed this way is written as `unverified`, never as a number. Position and size
   taken from cluster coordinates are labelled "measured from diff", not as a style rule.
5. **Fix** each cluster that this branch caused, in a new commit; list older differences without
   fixing. Rerun until clean, then look at the Figma, local and diff images.
6. **Report**: write `report.json` and publish it as an **Artifact**. This is the final output; the chat
   gets only a short pointer.
   - `report.json` (schema in `scripts/build-report.py`): per state `diffAreaPct`, the cluster list,
     `sizeMismatch`, and the verdict `matching` / `fixed (commit)` / `older difference` / `not run`;
     plus a fix list for the implement flow.
   - Build: `python3 scripts/build-report.py <workspace>/audit/pixel-diff/report.json <scratchpad>/visual-verify.html`.
     It embeds the Figma, App and Diff images and renders the summary bars, a Figma / App / Diff / Blend
     comparer with a cluster overlay, and the fix list.
   - Publish the HTML with the Artifact tool (`icon: "chart"`). Publish again to the same URL on a re-run.
   - Also keep `audit/step-N-pixel-diff.md` in the workspace for the record.
   - Never write "matches" without the number. A `sizeMismatch` is fixed before the diff counts.

## Notes

- A Figma frame can be stale: when the user says the app is right, record the cluster as an expected
  difference with the reason, not as a fix.
- Dynamic content (dates, ids, user names) differs by design: crop it out or list it as an expected
  cluster with the reason.
- Copy and token checks stay in `figma:implement` step 4; the diff finds position, size, spacing and
  color drift, not wrong wording.
