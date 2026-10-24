# Figma-aware task plans

Bind Figma context at plan time so `/impel` does not re-derive node IDs or token decisions.

## Inputs

Read on every UI issue plan:

- `state.json` → `designPath` (required when `figma[]` non-empty)
- `state.json` → `figma[]` (fileKey lookup for MCP)
- The issue's **`## Figma frames`** table (from `${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/figma-slicing.md`)

## Code steps — optional `figma` frontmatter

When a step renders UI that matches one or more frames, add **node IDs only** (colon form):

```yaml
---
step: 4
type: code
commit: feat
depends_on: [3]
figma:
  - "4275:4279"
  - "4283:12603"
files:
  - app/.../active-sessions-section.component.ts
---
```

Rules:

- Every id must appear in the issue's **Figma frames** table or `design.md` § Frames.
- Omit `figma` on pure service/model/test steps.
- In **Watch out**, point at the rows in `design.md` this step consumes (component map, token
  map, copy keys) — link `designPath`, do not copy tables.

Resolve `fileKey` at `/impel` time from `figma[]` by matching `nodeId`.

## Final step — visual verify

When the issue's **Figma frames** table is non-empty, add a **terminal** step:

```yaml
---
step: N
type: verify-ui
commit: chore
depends_on: [<all UI code steps for this slice>]
figma:
  - "4275:4279"
files: []
---
# Step N — Visual verify (Figma)

Compare rendered UI on the developer's running app to Figma for this slice's frames.

## Do

Follow `/impel` `references/figma-ui.md` § Visual verify. Route and states come from the issue
acceptance criteria and the preceding code steps.

## Done when

- [ ] Comparison recorded (pass, or in-scope fixes committed; pre-existing mismatches listed)
- [ ] No dev server was started or restarted by the agent
```

- One `verify-ui` step per issue slice (not per frame), unless frames land in separate issues.
- `files: []` — verify may touch only screenshots/checklist markdown under the tasks folder if
  the plan asks to persist evidence; default is report-only in `/impel` final summary.

## Writer brief

Pass `designPath`, the issue's frame table, and this file's rules to the `sonnet` writer in §5.
