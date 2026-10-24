# Figma-aware issue slicing

When `state.json` → `designPath` is set (or `figma[]` is non-empty but spec predates
`design.md`), FE slices must carry **stable Figma node IDs**, not file paths.

## When this applies

- Epic has a UI surface and `/to-spec` wrote `design.md` (or grill locked a frame table in
  `decisionsPath` while `designPath` is still null — use that table until spec runs).
- Skip for backend-only slices and docs/chore work.

## Per FE slice (issue body)

Add **`## Figma frames`** after **What to build**:

```markdown
## Figma frames

| Frame | Node ID | Notes |
|---|---|---|
| Session row | `4275:4279` | This slice renders the row + sign-out affordance |

Only list frames **this slice** implements or changes. Node IDs come from `design.md` § Frames
or `state.json` → `figma[]`. Link the contract: `Design reference: <designPath>`.

Do **not** paste component maps or token tables into the issue — they drift; readers follow
`designPath`.

## Routing blockers

Create a **separate blocking issue** (or mark an existing slice as blocker) when `design.md` or
grill decisions require:

| Need | Route to |
|---|---|
| New or changed `@org/design-system` component | design-system two-MR flow (`designSystem.newComponent` in `.claude/figma-project.json`; `org-versions` + implement skill §4b) |
| Missing icon in `@org/icons` | `org-icons` — block the FE slice until the icon ships or a approved fallback is in `design.md` |
| KB tooltip copy from a frame | `kb-article-match` when the frame shows KB / Learn more |

Name the blocker in **Blocked by** with the issue key, not prose alone.

## issue-graph.md

No extra columns required — frame IDs live on the slice issue bodies. When splitting a slice,
re-home node IDs so each issue's table matches what `/to-tasks` will bind on `figma:` steps.
