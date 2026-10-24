# `design.md` — design reference artifact

Locked CSS/UI context for the epic. **`/to-spec` writes it**; `/to-issues`, `/to-tasks`, and
`/implementation` read it via `state.json` → `designPath`. **`2-spec.md` links here** — do not duplicate
these tables in the spec body.

Path: `<workspaceRoot>/design.md` (recorded in `designPath`).

## Inputs to synthesize

1. `state.json` → `figma[]` (frame inventory + screenshot paths).
2. `{workspaceRoot}/design.draft/*.md` — factual fragments from `figma-frame-discovery` (grill).
3. `decisionsPath` — **FE design check** aspect: confirmed component mappings, frame vs model
   table, closed copy/token decisions from the grill.
4. Repo `.claude/figma-project.json` — token naming rule and `tokens.missing` policy only;
   do not restate the whole config.

If `figma[]` is empty and there is no design-check aspect, **skip** `design.md` and leave
`designPath` null.

## Document template

```markdown
# Design reference — {ticketRef or slug}

Traceability: Figma node IDs live here and in MR descriptions, never in product code comments.

## Frames

| Label | Node ID | fileKey | Screenshot |
|---|---|---|---|
| {label} | `{nodeId}` | `{fileKey}` | [{label}]({screenshotPath relative to design.md}) |

## Component map (decided)

| Figma node / region | Component | Notes |
|---|---|---|
| `{nodeId}` or region name | `<v-*>` / app component / custom markup | why (grill decision) |

Only rows **confirmed in grill** or explicitly decided during spec synthesis when grill was
skipped but fragments exist — mark `TBD — return to grill` for any still-open unmapped element.

## Token map

| Figma variable | Code token / class | Status |
|---|---|---|
| nf-blue/100 | `$nf-blue-100` or `tw-…` | matched |
| … | local `$var` in `{file}` | missing ramp — reason |

Apply `figma-project.json` → `tokens.figmaNameRule`. Holes follow `tokens.missing`.

## Typography map

| Figma text style | Code approach | Gap? |
|---|---|---|

## Copy → i18n

| UI string (exact) | Proposed key | Notes |
|---|---|---|

Keys use `figma-project.json` → `i18n.keyCase`. Final keys may shift slightly in implementation;
implementation must not invent English literals.

## States not shown in Figma

From grill FE behavior / design-check (cross-link `decisionsPath` section):

| Surface | State | Behavior source |
|---|---|---|

## Motion

`none` or one paragraph from design fragments — implementation detail deferred to `/implementation` when
flagged in Figma.

## Open items

Numbered list of anything still blocking `/implementation` UI steps (unmapped token, missing frame). Empty
when clean.
```

## Merge rules

- Prefer **grill decisions** over draft **candidates** when they conflict.
- Dedupe token and component rows across frames.
- Do not delete `design.draft/` — keep as audit trail; `design.md` is the contract going forward.
