# Issue tracker: Jira (sub-tasks)

Work items for this repo live in Jira as **sub-tasks of the intake ticket**. Picked when
`workflow.json` has `stages.to-issues.target: "jira-subtask"`. Site and project come from
`trackers.jira.site` / `trackers.jira.project`; auth is the Jira MCP server if one is configured,
otherwise `curl` with the `JIRA_API_TOKEN` + `JIRA_EMAIL` env vars (basic auth). Every call is
Jira Cloud REST **v3**: `https://<site>/rest/api/3/...`.

Source for every endpoint below: Atlassian's OpenAPI spec,
`https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json`.

## How the pipeline maps onto Jira

| Pipeline | Jira |
|---|---|
| intake item | the ticket (Story / Task) — fetched by `/to-ticket` |
| PR unit (`prUnit: "ticket"`) | the same ticket: one branch, one worktree, one PR |
| `/to-issues` slices | sub-tasks under the ticket — steps on the ticket's branch, not PRs of their own |
| spec | never published (D18) — stays in the repo |

`state.json` `units[]` holds one row for the ticket (`remoteRef: "<KEY>"`, branch, worktree,
PR). Sub-task keys are recorded on the step files that implement them, not as units.

## Setup check — run once, store the result

A wrong issue type or a missing `parent` field is a setup error: it fails on the first create,
every time. Resolve it at setup, never at first use.

1. `GET /rest/api/3/issue/createmeta/<project>/issuetypes` — pick the entry with
   `"subtask": true`. None → stop: sub-tasks are disabled in this project. More than one →
   ask which.
2. `GET /rest/api/3/issue/createmeta/<project>/issuetypes/<subtaskTypeId>` — confirm the
   field list contains `parent`, and read its schema. Do not assume its shape.
3. Run `POST /rest/api/3/search/jql` with `parent = <an existing ticket that has sub-tasks>`
   and check it returns them. If it doesn't, ask the user for the project's working clause.
4. Write `trackers.jira.subtaskTypeId` and `trackers.jira.subtaskJql` (with `<key>` as the
   placeholder) into `workflow.json`.

## Conventions

- **Create a sub-task**: `POST /rest/api/3/issue` with `fields.project.key`,
  `fields.issuetype.id` = `subtaskTypeId`, `fields.summary`, `fields.description` (ADF), and
  `fields.parent` in the shape setup step 2 read. The parent must be in the same project.
- **Read a ticket**: `GET /rest/api/3/issue/<key>`.
- **List a ticket's sub-tasks**: `POST /rest/api/3/search/jql` with the parent clause that
  setup step 3 confirmed. `/rest/api/3/search` is deprecated and being removed — never use it.
- **Comment**: `POST /rest/api/3/issue/<key>/comment`. The body is **ADF**
  (`{"type":"doc","version":1,"content":[...]}`), not plain text or Markdown.
- **Labels**: `PUT /rest/api/3/issue/<key>` with
  `{"update":{"labels":[{"add":"<label>"},{"remove":"<label>"}]}}`.
- **Status**: list with `GET /rest/api/3/issue/<key>/transitions`, then
  `POST /rest/api/3/issue/<key>/transitions` with `{"transition":{"id":"<id>"}}`. Pick the
  transition by its target status name, never a hard-coded id.
- **Blocking**: `POST /rest/api/3/issueLink` with `type.name: "Blocks"`. `outwardIssue` is the
  blocker, `inwardIssue` the blocked one. Link type `Blocks` has outward "Blocks", inward
  "Blocked by".
- **Ticket URL**: `https://<site>/browse/<key>`.

## Issue references

- **Commits**: `Refs: <KEY>` trailer — the sub-task key for a step commit, the ticket key
  otherwise. Jira's development panel picks keys up from commits, branches and PR titles.
- **Branch**: contains the ticket key (e.g. `feat/<KEY>-<slug>`).
- **PR / MR body**: the ticket key and its URL. Closing happens by Jira transition, not a
  closing keyword.

Repo-specific rules (key casing, extra labels) go in `docs/agents/issue-tracker.md`.

## When a skill says "publish to the issue tracker"

`/to-issues`: create one sub-task per slice under the intake ticket. Nothing else publishes —
the spec stays local (D18).

## When a skill says "fetch the relevant ticket"

`GET /rest/api/3/issue/<key>`, or the MCP server's get-issue tool.

## Not supported

Wayfinding (`/wayfinder` map and child tickets) — GitHub only.
