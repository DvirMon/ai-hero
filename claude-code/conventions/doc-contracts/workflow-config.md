# Workflow config

`<repo>/.claude/workflow.json` — one per repo, written by `setup-skills`. Every pipeline stage
reads it first.

It holds **values**: which tracker, which skill, which path. **How** to talk to a tracker stays
in the adapter files (`setup-skills/issue-tracker-*.md`, `ticket-tracker-*.md`), picked by these
values. Repo-only prose rules (issue reference format, epics, triage) live in the optional
`docs/agents/*.md`; the tracker choice is never restated there.

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

## Example — personal library repo (GitHub)

```json
{
  "version": 1,
  "projectKind": "library",
  "trackers": {
    "github": { "repo": "DvirMon/ng-table" }
  },
  "intake": { "source": "github", "epic": "link" },
  "prUnit": "sub-issue",
  "isolation": "worktree",
  "stages": {
    "to-issues": { "target": "github-sub-issue" },
    "ship":      { "target": "github-pr" }
  }
}
```

## Example — org app repo (Jira + GitLab)

```json
{
  "version": 1,
  "projectKind": "app",
  "trackers": {
    "jira":   { "site": "org.atlassian.net", "project": "PROJ" },
    "gitlab": { "project": "org/web" }
  },
  "intake": { "source": "jira", "fetch": "skill:jira-research" },
  "prUnit": "ticket",
  "stages": {
    "grill":     { "skill": "grill-with-docs" },
    "to-issues": { "target": "jira-subtask" },
    "ship":      { "target": "gitlab-mr" }
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
| `trackers.github.repo` | `owner/name` | from `git remote` |
| `trackers.gitlab.project` | `group/name` | from `git remote` |
| `trackers.jira.site` / `.project` | host / project key | — (setup asks) |
| `trackers.jira.subtaskTypeId` | issue type id | written by the setup check |
| `trackers.jira.subtaskJql` | JQL with `<key>` | written by the setup check |
| `intake.source` | `jira` · `linear` · `github` · `gitlab` · `local` | `local` |
| `intake.fetch` | `skill:<name>` · `agent:<name>` | the source's adapter |
| `intake.epic` | `link` · `create` · `none` | — (`/to-intake` asks each time) |
| `prUnit` | `sub-issue` · `ticket` | `sub-issue` |
| `isolation` | `worktree` · `branch` | `worktree` |
| `baseBranch` | branch name | the remote's default |
| `docs.prd` | path template | by `projectKind` (below) |
| `stages.<stage>.skill` | skill name · `none` | the built-in stage skill |
| `stages.<stage>.target` | per stage (below) | per stage (below) |

`<stage>`: `to-ticket` · `grill` · `to-spec` · `to-issues` · `to-tasks` · `impel` · `ship`.

- **`intake.epic`** — what `/to-intake` does with the new item's parent epic: link an existing
  one, create a new one, or none.
- **`prUnit`** — what one PR covers. `sub-issue`: each sub-issue gets its own branch (+ worktree).
  `ticket`: one branch per ticket; Jira sub-tasks are steps on it.
- **`trackers.jira.subtask*`** — the sub-task type id and parent JQL differ per Jira project, so
  setup resolves them once and stores them; nothing hard-codes `Sub-task` or `parent = KEY`.

### `docs.prd` defaults

| `projectKind` | Default |
|---|---|
| `library`, `design-system` | `{componentDir}/docs/prd.md` |
| `app` | `{domainDir}/docs/prd.md` |

### `stages.<stage>.target`

| Stage | Values | Default |
|---|---|---|
| `to-issues` | `github-sub-issue` · `gitlab-issue` · `jira-subtask` · `local` | matches `prUnit` and the intake tracker |
| `ship` | `github-pr` · `gitlab-mr` | from `git remote` |

`to-ticket`, `grill`, `to-spec`, `to-tasks` and `impel` write only local files. They take
`skill`, not `target`. The spec is never published to a tracker; `/to-issues` creates children
directly under the intake item.

## Reading it

Every stage resolves the config first: read the three layers, merge, apply defaults.

- **No `workflow.json`:** `/to-ticket` runs setup and writes it. Any other stage stops and
  points to `/to-ticket`.
- **Unknown key or value:** stop and name it. A misconfigured target is a setup error, not
  a runtime one — it fires on first run, every run.
- **`stages.<stage>.skill` set:** run that skill instead, with the same `state.json`.
- **`skill: "none"`:** the stage is skipped; the next stage reads `state.json` as the skipped
  one would have left it. Per-ticket skipping stays with the readiness rung.
