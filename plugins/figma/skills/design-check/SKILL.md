---
name: design-check
description: "sdlc stage extension for /grill-with-docs. Add the FE design check aspect to /grill-with-docs — per-frame discovery, design.draft fragments, unmapped-component audit, one question at a time. Wire it as `stages.grill.skills: [\"figma:design-check\"]` in .claude/workflow.json."
---

> **Wired into** `/grill-with-docs` § aspects — adds the FE design check aspect, per sdlc's `contracts/stage-skills.md`. No Figma frames on the
> ticket (`state.json` `figma[]` empty, no frame URLs) → say so and do nothing.

# Design-check aspect (Figma)

Standard **FE design check** aspect for `grill-with-docs`: Figma frames vs the locked product
model and FE behavior. Generalizes manual "aspect 3" passes (e.g. NF-97960). Only run when the
ticket has a UI surface and at least one Figma frame to inspect.

**Hand off to:** FE / design.

**Produces:** `1-decisions.md` section (frames table, gaps closed, handoff summary); factual
fragments under `{workspaceRoot}/design.draft/`; numbered **open gaps** consumed by the one-question
loop. **Does not** write final `design.md` — `/to-spec` promotes the draft after this aspect locks
(see `figma:design-reference`).

## When this aspect exists

Add a row to `## Aspects` in `1-decisions.md`:

| # | Aspect | Hand off to | Status |
|---|--------|-------------|--------|
| … | FE design check (Figma vs model) | FE / design | not started |

Skip the entire aspect when the ticket is headless (no UI) **and** `figma[]` is empty.

## Frame inventory (before MCP)

Read frames from **`state.json` → `figma[]`** (shape per
sdlc's `skills/to-ticket/references/state-schema.md`):

```json
{ "label": "Session row", "fileKey": "g7SaJ3BzmMA4yzStMWV48m", "nodeId": "4275:4279" }
```

If `figma[]` is missing but the ticket or conversation lists Figma URLs, **stop once** and ask
the user to either run `/to-ticket` capture or paste a frame table `{label, fileKey, nodeId}`.
Record that table under this aspect until `figma[]` exists.

Screenshots under `{workspaceRoot}/figma/` are optional evidence; MCP screenshots are the
source of truth during discovery.

## Ordering vs other aspects

When Figma can **reopen** the backend or behavior contract (new row fields, copy that implies API
data), grill this aspect **before** locking those upstream aspects, or mark upstream aspects
`reopened` the moment a frame proves a gap. Default risk order: **design check → backend
contract → FE behavior** when all three apply and nothing is locked yet. If the user already
locked upstream aspects, run design anyway and **reopen** explicitly when a frame contradicts them.

## Step 1 — Parallel frame discovery

For **each** frame in `figma[]`, dispatch one frame-discovery agent in parallel — the repo's own
(e.g. `.claude/agents/figma-frame-discovery.md`); none → do the discovery inline, frame by frame. Pass:

| Argument | Value |
|---|---|
| `repoRoot` | git root that contains `.claude/figma-project.json` |
| `ticketWorkspace` | `state.json` → `workspaceRoot` |
| `frame` | `{ label, fileKey, nodeId }` |
| `modelContext` | Short excerpt of locked aspect-1 / model decisions (if any) |
| `outputPath` | default `{workspaceRoot}/design.draft/{nodeId with : → -}.md` |

Join all agents before step 2. If an agent fails, note which frame and which MCP step failed;
continue with other frames and list the failure as an open gap.

Do not edit product source from this aspect.

## Step 2 — Merge fragments (orchestrator)

1. Read every `design.draft/*.md` fragment.
2. Build a **master gap list** (numbered): union of each fragment's **Open gaps**, **State gap
   checklist** rows marked missing, **Related frames** not in `figma[]`, and **Model impact**
   lines that are not "none".
3. Build a **frames vs model** table for `1-decisions.md` (one row per frame: label, node ID,
   model impact summary — observation only until gaps are closed).
4. Dedupe token rows across frames; keep per-frame copy tables in fragments until `/to-spec`
   merges.

Template for the decisions table:

| Frame | Node | Model impact |
|---|---|---|
| {label} | `{nodeId}` | none / {one line} |

## Step 3 — Unmapped components (audit §3)

From all fragments' **Unmapped elements** tables, run
`~/.claude/skills/figma-to-code/references/unmapped-node-audit.md` **§3** only:

- One structured question per node, up to **four nodes per turn**, still **one question at a time**
  in the grill (each batched call is one AskQuestion with multiple nodes only when the skill's
  batch format fits — prefer one node per turn for product judgment calls).
- Options must show usage snippets (`<v-button>`, …), plus custom markup / new DS component /
  layout wrapper per audit §3.

Record each **confirmed** mapping as a dated bullet under this aspect (node ID → component → why).
Those rows are the input `/to-spec` copies into `design.md`.

## Step 4 — Close gaps (one question at a time)

Work the master gap list in dependency order:

1. **Missing frames** — add to `figma[]` (or table) and re-run discovery for that frame only.
2. **Model impact** — resolves or reopens backend/behavior aspects; do not lock design while a
   model contradiction is open.
3. **State gaps** (loading, error, empty, …) — usually feeds **FE behavior** aspect; cross-link
   the decision there instead of duplicating prose.
4. **Copy / i18n** — exact strings; parameterized patterns with `{placeholder}`.
5. **Token holes** — follow `figma-project.json` → `tokens.missing`; do not invent ramp names
   unless the user chooses the separate SCSS 1:1 ticket path.

When this aspect's `- [ ]` checklist under `## Aspect N: FE design check…` is empty, mark
**locked `<date>`** and post the handoff summary:

- All frames checked against model (or explicit reopen of upstream aspect).
- Frame inventory with node IDs (for to-issues routing).
- Count of decided component mappings vs still-custom markup.
- Pointer: `{workspaceRoot}/design.draft/` for `/to-spec`.

Tell the user explicitly: **Aspect N (FE design check) is locked, ready to hand to FE / design.**

## What not to do

- No node IDs in application code comments (traceability → `design.md` + MR).
- No final token/component decisions without a grill answer (fragments are candidates only).
- No `/to-spec` from here — end with the standard `Next: /to-spec …` only when **all** aspects
  are locked per the main skill.
