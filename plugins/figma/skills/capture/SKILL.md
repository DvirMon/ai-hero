---
name: capture
description: "sdlc stage extension for /to-ticket. Capture a ticket's Figma frames and screenshots into the workspace and set `state.json` figma[] — no design analysis. Wire it as `stages.to-ticket.skills: [\"figma:capture\"]` in .claude/workflow.json."
---

> **Wired into** `/to-ticket` § 4, before the writer finishes `state.json`, per sdlc's `contracts/stage-skills.md`. No Figma frames on the
> ticket (`state.json` `figma[]` empty, no frame URLs) → say so and do nothing.

# Figma capture at intake

`/to-ticket` records frames and screenshots **without analysis**. Grill and `/to-spec` consume
the result.

## When to run

- Ticket type is **feature** (or any ticket with a UI surface) **and** the intake material
  includes Figma links, attached frames, or the user names frames in conversation.
- **Headless / backend-only** tickets: set `figma: []` and skip this file.

## Frame list

Each frame is one row:

| Field | Required | Meaning |
|---|---|---|
| `label` | yes | Short name for humans (`Session row`, `Bulk modal`) |
| `fileKey` | yes | Figma file key from the URL |
| `nodeId` | yes | Node id with colon (`4275:4279`) |
| `screenshotPath` | after capture | Path relative to `workspaceRoot`, e.g. `figma/session-row.png` |

### Parsing URLs

- `figma.com/design/{fileKey}/…?node-id=4275-4279` → `nodeId`: `4275:4279` (replace `-` with `:` in the id segment only).
- Branch URLs: use `branchKey` as `fileKey` when the URL is `…/design/{fileKey}/branch/{branchKey}/…`.

If the ticket lists one file with many frames, still emit **one object per frame**. Same
`fileKey` across rows is normal.

When links are incomplete, ask once for `{label, url}` per frame — do not guess node ids.

## Screenshots

For each frame, call Figma MCP **`get_screenshot`** with `fileKey` and `nodeId`.

1. Create `{workspaceRoot}/figma/` if missing.
2. Save PNG as `{workspaceRoot}/figma/{slugified-label}.png` — lowercase, spaces → hyphens,
   strip unsafe characters. Collisions → append `-2`, `-3`, …
3. Set `screenshotPath` on the matching `figma[]` entry.

If MCP is unavailable or a frame fails, still record `{label, fileKey, nodeId}` with
`screenshotPath` omitted and note the failure in the hand-off message. Do not block workspace
creation.

## state.json

After capture, `figma[]` holds the frame rows. Initial creation uses `figma: []` when there
are no designs. **`designPath`** stays `null` until `/to-spec` writes `design.md`.

Grill may append frames later — update `figma[]` and re-run screenshot capture for new rows only.
