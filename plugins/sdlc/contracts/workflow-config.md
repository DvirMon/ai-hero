# Workflow config

`<repo>/.claude/workflow.json` — one per repo, written by `setup`. Every pipeline stage
reads it first.

It holds **values**: which skill, which path, how work is split into PRs, and the repo's
**projects** — the parts of a repo (an app, a server, a library) that each bring their own
skills. It names no tracker. Which tracker a repo uses, and how to talk to it, lives in the
repo's own `docs/agents/ticket-tracker.md` and `docs/agents/issue-tracker.md`, per
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

## Example — single-project library repo

```json
{
  "version": 2,
  "prUnit": "sub-issue",
  "projects": {
    "table": {
      "path": "**",
      "skills": { "code": ["angular-developer"], "test": ["unit-test"] },
      "executors": { "story": "story:implementer" },
      "docs": { "prdWriter": "story:discovery" }
    }
  },
  "stages": { "implementation": { "skills": ["source-docs"] } }
}
```

## Example — monorepo

```json
{
  "version": 2,
  "prUnit": "ticket",
  "capabilities": { "commit": { "skill": "org-commit" } },
  "stages": {
    "review": { "reviewer": "org-review" },
    "implementation": { "skills": ["source-docs"] }
  },
  "projects": {
    "ui": {
      "path": "libs/ui/**",
      "skills": { "code": ["react-developer"], "test": ["unit-test"] },
      "executors": { "story": "story:implementer" },
      "docs": { "prd": "{componentDir}/docs/prd.md", "prdWriter": "story:discovery" }
    },
    "web": {
      "path": "apps/web/**",
      "skills": {
        "code": ["react-developer"],
        "test": ["unit-test"],
        "ui": ["figma-feature-implementation", "css-styling"]
      },
      "typecheck": "nx run web:typecheck",
      "devUrl": "http://localhost:4200",
      "stages": {
        "to-ticket": { "skills": ["figma:capture"] },
        "grill": { "skills": ["figma:design-check"] },
        "to-spec": { "skills": ["figma:design-reference"] },
        "to-issues": { "skills": ["figma:slicing"] },
        "to-tasks": { "skills": ["figma:steps"] },
        "implementation": { "skills": ["figma:implementation"] }
      }
    },
    "api": {
      "path": "apps/api/**",
      "skills": { "code": ["nodejs-developer"], "test": ["unit-test"] },
      "stages": { "review": { "reviewer": "code-review:review" } }
    }
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
| `version` | `2` | required |
| `projects` | map of name → project (below) | required; setup writes one per project it finds |
| `intake.epic` | `link` · `create` · `none` | — (`/to-intake` asks each time) |
| `prUnit` | `sub-issue` · `ticket` | `sub-issue` |
| `isolation` | `worktree` · `branch` | `worktree` |
| `baseBranch` | branch name | the remote's default |
| `stages.<stage>.skill` | skill name · `none` | the built-in stage skill |
| `stages.<stage>.skills` | array of skill names | `[]` |
| `stages.review.reviewer` | skill name | `code-review:review` |
| `capabilities.commit.skill` | skill name | — (stages commit plain conventional) |

`<stage>`: `to-intake` · `to-ticket` · `grill` · `to-spec` · `to-issues` · `to-tasks` · `implementation` · `review` ·
`ship`.

- **`intake.epic`** — what `/to-intake` does with the new item's parent epic: link an existing
  one, create a new one, or none.
- **`capabilities.commit.skill`** — the skill every stage hands its commits to, e.g.
  `atomic-commit`. Unset: stages commit plain conventional. See [`commit.md`](commit.md).
- **`prUnit`** — what one PR covers. `sub-issue`: each sub-issue gets its own branch (+ worktree).
  `ticket`: one branch per ticket; Jira sub-tasks are steps on it.
- **`stages.<stage>.skills`** — skills wired into a stage without replacing it: Figma capture at
  intake, a docs pass after implementation. Contract: [`stage-skills.md`](stage-skills.md).
- **`stages.review.reviewer`** — the skill the built-in `/review` stage runs. Swapping it keeps
  the stage's commits, record and routing; `stages.review.skill` replaces the whole stage.
  What a reviewer receives and returns: [`review-stage.md`](review-stage.md).

### Projects

| Key | Values | Default |
|---|---|---|
| `path` | glob, or array of globs, relative to the repo root | required |
| `skills.<type>` | array of skill names, loaded by the step's executor | `[]` |
| `skills.<other>` | extra skill lists a wired stage skill reads, e.g. `skills.ui` for `figma:implementation` | — |
| `executors.<type>` | agent name that executes steps of that type | `/implementation` § Route's built-in executor |
| `typecheck` | command | — (what the project's code skills say; none → skipped and reported) |
| `test` | command, `{files}` = the spec files to run | — (what the project's test skills say) |
| `devUrl` | URL of the developer's running dev server, for wired skills that check the UI | — |
| `docs.prd` | path template | `{domainDir}/docs/prd.md` |
| `docs.prdWriter` | `to-ticket` · a skill name | `to-ticket` |
| `stages` | same shape as top-level `stages` | — |

`<type>` is a step type from `/to-tasks`: `code` · `test` · `story` · `docs` · `chore`.

- **Matching.** A path belongs to the first project, in listed order, whose `path` matches it.
  List the more specific project first. A single-project repo uses `"path": "**"`.
- **A step's project** is the one its `files` match. A step whose files span projects is a plan
  defect — `/to-tasks` splits it. A ticket may span projects; its steps don't.
- **A ticket's project** is the one its `domainPath` matches. It picks the ticket's `docs.*`
  and `stages` overrides.
- **`skills`** are conventions, not executors: the stage's executor agent loads them before it
  writes anything. `/implementation` § Route has the executor for each type.
- **`executors.<type>`** — swaps the agent for one step type, e.g.
  `"story": "story:implementer"` from the `story` plugin. The named agent receives the same
  inputs as the built-in one and resolves its own conventions (the story implementer reads
  `.claude/story.json`), so `skills.<type>` is not passed and the stack is never repeated
  here. Named agent not installed → stop and name it. sdlc depends on no plugin it names here.
- **`docs.prdWriter`** — `to-ticket` writes the feature PRD at `docs.prd` from the ticket. A
  skill name means that skill owns the PRD (e.g. `story:discovery` for library components);
  `/to-ticket` only links it when the file exists.
- **`stages`** merge over the top-level `stages` for that project's tickets — except
  `stages.<stage>.skills`, which appends to the top-level list.

The spec is never published to a tracker. `/to-issues` creates children directly under the
intake item, through `issue-tracker.md`'s create-child operation.

## Reading it

Every stage resolves the config first: read the three layers, merge, apply defaults.

- **No `workflow.json`:** `/to-ticket` runs setup and writes it. Any other stage stops and
  points to `/to-ticket`.
- **`version: 1`** (`projectKind`, no `projects`): stop and point to `/sdlc:setup`, which
  rewrites it as version 2.
- **Unknown key or value:** stop and name it. A misconfigured value is a setup error, not
  a runtime one — it fires on first run, every run.
- **A path no project matches**, or a skill a project names that isn't installed: stop, name the
  path or skill and the project.
- **`stages.<stage>.skill` set:** run that skill instead, with the same `state.json`.
- **`skill: "none"`:** the stage is skipped; the next stage reads `state.json` as the skipped
  one would have left it. Per-ticket skipping stays with the readiness rung.
