# Workflow config

`<repo>/.claude/workflow.json` — one per repo, written by `setup-skills`. Every pipeline stage
reads it first.

It holds **values**: which skill, which path, how work is split into PRs. It names no tracker.
Which tracker a repo uses, and how to talk to it, lives in the repo's own
`docs/agents/ticket-tracker.md` and `docs/agents/issue-tracker.md`, per
[`tracker.md`](tracker.md). Setup writes them; a stage never branches on a tracker name.

## Files and layering

| Layer | Path | Owner | Git |
|---|---|---|---|
| 1. team | `<repo>/.claude/workflow.json` | the repo | committed |
| 2. user | `<repo>/.claude/workflow.local.json` | one teammate | gitignored |
| 3. env | `SDLC_*` | CI / one run | — |

Later layers win. **Merge:** objects merge key by key; arrays and scalars replace.

**Env:** `SDLC_` + the key path in upper case, `__` between levels, `-` → `_`. The value is
parsed as JSON when it parses, otherwise it is a string.

    SDLC_PR_UNIT=ticket
    SDLC_STAGES__TO_ISSUES__TARGET=jira-subtask

## Example — personal library repo

```json
{
  "version": 1,
  "projectKind": "library",
  "intake": { "epic": "link" },
  "prUnit": "sub-issue",
  "isolation": "worktree"
}
```

## Example — org app repo

```json
{
  "version": 1,
  "projectKind": "app",
  "prUnit": "ticket",
  "stages": {
    "grill": { "skill": "org-grill" },
    "review": { "reviewer": "org-review" }
  }
}
```

A teammate's `workflow.local.json` changes only what differs:

```json
{ "isolation": "branch" }
```

## Keys

| Key | Values | Default |
|---|---|---|
| `version` | `1` | required |
| `projectKind` | `library` · `design-system` · `app` | required; setup asks |
| `intake.epic` | `link` · `create` · `none` | — (`/to-intake` asks each time) |
| `prUnit` | `sub-issue` · `ticket` | `sub-issue` |
| `isolation` | `worktree` · `branch` | `worktree` |
| `baseBranch` | branch name | the remote's default |
| `docs.prd` | path template | by `projectKind` (below) |
| `stages.<stage>.skill` | skill name · `none` | the built-in stage skill |
| `stages.review.reviewer` | skill name | `code-review:review` |

`<stage>`: `to-ticket` · `grill` · `to-spec` · `to-issues` · `to-tasks` · `impel` · `review` ·
`ship`.

- **`stages.review.reviewer`** — the skill the built-in `/review` stage runs. Swapping it keeps
  the stage's commits, record and routing; `stages.review.skill` replaces the whole stage.
  What a reviewer receives and returns: [`review-stage.md`](review-stage.md).

- **`intake.epic`** — what `/to-intake` does with the new item's parent epic: link an existing
  one, create a new one, or none.
- **`prUnit`** — what one PR covers. `sub-issue`: each sub-issue gets its own branch (+ worktree).
  `ticket`: one branch per ticket; Jira sub-tasks are steps on it.

### `docs.prd` defaults

| `projectKind` | Default |
|---|---|
| `library`, `design-system` | `{componentDir}/docs/prd.md` |
| `app` | `{domainDir}/docs/prd.md` |

The spec is never published to a tracker. `/to-issues` creates children directly under the
intake item, through `issue-tracker.md`'s create-child operation.

## Reading it

Every stage resolves the config first: read the three layers, merge, apply defaults.

- **No `workflow.json`:** `/to-ticket` runs setup and writes it. Any other stage stops and
  points to `/to-ticket`.
- **Unknown key or value:** stop and name it. A misconfigured value is a setup error, not
  a runtime one — it fires on first run, every run.
- **`stages.<stage>.skill` set:** run that skill instead, with the same `state.json`.
- **`skill: "none"`:** the stage is skipped; the next stage reads `state.json` as the skipped
  one would have left it. Per-ticket skipping stays with the readiness rung.
