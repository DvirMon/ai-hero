# Visual verify — repo facts

Read by `/verify-visual` on every run. Settings (the comparer) live in `.claude/workflow.json` →
`stages.verify-visual`; this file holds facts about the app and the differences the team has
approved. Edit it directly.

## Design system

Only when the repo has no `.claude/design-system.json` — that file owns these values when it
exists.

- Component prefix: `v-`
- Component source: `libs/violet/src/lib/**`

## Accepted differences

Differences between Figma and a design-system component that the team approved for the whole
repo. `/verify-visual` appends a row when the developer picks "approve for the repo". A
difference matches on component, variant, property and value. Where it was approved
(`Seen at`: frame · state · cluster box at 1x), it must also still sit in that box: one that
grows or moves there is asked about again.

| Component | Variant | Property | Value | Seen at | Reason | Approver | Date |
|---|---|---|---|---|---|---|---|
| `v-button` | primary | padding-left | 12px | company-page · default · 840,96,120,36 | component spacing wins over Figma | Dana Levi | 2026-11-26 |

## Crop rules

Dynamic content the diff ignores — one per line, a CSS selector or a region (`x, y, w, h` at
1x), with the reason.

- `.last-updated` — date
- `[data-test=user-menu]` — signed-in user name
