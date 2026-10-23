# Frame discovery output shape

One `figma-frame-discovery` agent run produces **one Markdown fragment** per Figma frame. The
grill orchestrator merges fragments into the ticket's draft design reference (later locked as
`design.md` by to-spec). Fragments are **facts and candidates only** — no component or token
**decisions** (those come from grill questions and land in the merged `design.md`).

Default path: `{ticketWorkspace}/design.draft/{nodeId-with-colons-as-dashes}.md`
(e.g. `4275:4279` → `design.draft/4275-4279.md`).

## Fragment template

Replace `{…}` placeholders. Omit subsections that don't apply; keep the heading.

```markdown
## {frameLabel} (`{nodeId}`)

| Field | Value |
|---|---|
| fileKey | `{fileKey}` |
| Figma URL | `https://www.figma.com/design/{fileKey}/…?node-id={nodeId-dashed}` |
| MCP pass | metadata, screenshot, variable_defs, design_context ({ISO date}) |

### Model impact (observation)

One paragraph: which locked model fields this frame touches, or **none** if purely presentational.
Flag anything that would **reopen** an upstream aspect — don't resolve it here.

### States in Figma

Bullet list of states/variants actually present in the file (including component-set variants).

### State gap checklist

| State | In Figma? | Notes for grill |
|---|---|---|
| loading | yes / no / n/a | |
| error | | |
| empty | | |
| disabled | | |
| long text / overflow | | |
| in-flight (disabled control, spinner) | | |
| permission / unlicensed | | |

### Copy (exact)

| String as in Figma | Element / region | Draft i18n key (snake_case, not decided) |
|---|---|---|

User-visible strings only. Parameterized copy → show the pattern with `{placeholder}`.

### Tokens / variables

Apply `config.tokens.figmaNameRule`, then **grep** `config.tokens.sources` for each candidate
name. Never assume a name exists.

| Figma variable | Resolved value | Code candidate | Grep result |
|---|---|---|---|
| | | `$…` or `tw-…` | found / missing / semantic alias only |

`missing` → note `config.tokens.missing` (e.g. local-scss-var until ramp ticket lands).

### Typography

| Figma text style | Sample usage | Nearest code match (`config.typography`) | Gap? |
|---|---|---|---|

If `config.typography.status` is `partial`, default **gap yes** unless grep proves a 1:1 name.

### Layout regions

| Region | Structure (flex/grid, notable spacing) | Candidate DS / app component |
|---|---|---|

"Candidate" = up to 3 from [unmapped-node audit](unmapped-node-audit.md) §1–2, not a decision.

### Unmapped elements (candidates only)

| Child node ID | data-name | Role | Candidates (≤3, with snippet) | If none |
|---|---|---|---|---|

Rows here feed grill's batched questions (audit §3). Do **not** ask the user from this agent.

### Icons

| Glyph / description | In `@org/icons` or `org-icon-*`? | Notes |
|---|---|---|

Route probable misses to `config.icons.missing`.

### Motion

`none` or brief description from `get_design_context` / metadata. Do not spec implementation.

### Related frames

Other node IDs in the same flow (modals, toasts, empty) that this frame implies but does not
include — **missing frame** candidates for grill.

### Open gaps (numbered)

1. One line per grill question this fragment needs answered. No recommendations disguised as facts.
```

## Merge rules (orchestrator, not this agent)

1. Sort sections by the frame order in `state.json` `figma[]` (or ticket table).
2. Dedupe token rows across frames; keep per-frame copy rows.
3. Union `Open gaps` into the Design-check aspect checklist; ask **one at a time** in grill.
4. After all answers, to-spec promotes the merge to `design.md` and fills the **decided** component
   and token columns (audit §4).
