# Workspace links

Every Markdown file in a ticket workspace (`<workspaceRoot>/`, `docs/work/<slug>/`) can be
reached from every other, and the files that depend on each other link to each other.
Script: `${CLAUDE_PLUGIN_ROOT}/scripts/workspace-links.mjs`.

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/workspace-links.mjs <workspaceRoot> --write   # idempotent
node ${CLAUDE_PLUGIN_ROOT}/scripts/workspace-links.mjs <workspaceRoot> --check   # exit 1 on a problem
```

## File names

No number prefixes: `decisions.md`, `spec.md`, `prd.md`, `design.md`, `index.md`,
`tasks/progress.md`, `tasks/step-N-<slug>.plan.md`, `tasks/step-N-<slug>.test-plan.md`,
`discovery/<topic>.md`.

## What every file carries

- **Nav line**, directly under the title: `[Index] · [PRD] · [Decisions] · [Spec] · [Design] · [Progress]`,
  relative paths, ending with the marker `<!-- nav -->`. The marker goes at the **end** of the
  line, never the start: a line that starts with `<!--` is raw HTML and its links do not render.
- **Step nav line** (step plans and test plans), after it: `Step N · Plan · Test plan · ← Step N-1 · Step N+1 → · Needs: <depends_on steps>`,
  ending with `<!-- nav-step -->`. A neighbour with no test plan is linked to its plan.
- Both lines are written by the script. Never write or edit them by hand.

## `index.md` (generated)

Lists every file: core, steps with their test plans, discovery notes, design images, audit
reports. Never edit by hand; `--write` rebuilds it.

## Anchors

- Each decision: `- <a id="d12"></a>**D12** …` (written by `/grill-with-docs` and every later
  stage that appends a decision; the script adds a missing anchor).
- Each acceptance criterion in `prd.md`: `- <a id="ac-12"></a>…`, numbered in file order.
  Numbers are not stable across a rewrite of the criteria list; link by number only after
  `--write`, and re-run it after any edit to the list.

## Relations (one owner writes each link)

| Relation | Owner writes it in | Points to |
|---|---|---|
| Step ↔ its test plan | step plan and test plan header | each other |
| Step → criteria it covers | step plan | `prd.md#ac-N` |
| Step → decisions it follows | step plan | `decisions.md#dN` |
| Step → spec section | step plan | `spec.md#heading` |
| Step → steps it waits for | `depends_on` (the script links them in `Needs:`) | step plans |
| Progress row → step and test plan | `progress.md` | both files |
| Progress coverage table → criterion | `progress.md` | `prd.md#ac-N` |
| Decision → its proof | the decision line | `discovery/<topic>.md#section` |
| Decision replaced or replacing | the decision line | the other decision |
| Any `D<n>` in any file | the script links it | `decisions.md#dN` |
| Discovery note → decisions it backs | note header | `decisions.md#dN` |
| Review → steps and criteria | `review.md` | step plan, `prd.md#ac-N` |

The reverse direction is never hand-written; `index.md` is the one place that reaches all.

## When

| Stage | Action |
|---|---|
| `/to-ticket` creates the workspace | run `--write` |
| any stage that adds or edits a workspace `.md`, or adds a decision / criterion / step | run `--write` before its commit |
| `/review`, `/ship`, `/audit-ticket` | run `--check`; a problem blocks, fix with `--write` or the missing link by hand |

Never run `--write` on a file outside the workspace.
