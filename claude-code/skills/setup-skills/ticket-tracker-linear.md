# Ticket tracker: Linear

Intake items for this repo live in Linear. Picked when `workflow.json` has
`intake.source: "linear"`. `/to-intake` creates items, `/to-ticket` fetches them,
`grill-with-docs` posts comments. No stage edits an issue description. Every later stage works
from the domain-colocated workspace `<domain-path>/docs/work/<slug>/`.

## Configuration

- **Workspace**: `<workspace-slug>`
- **Team**: `<team key, e.g. ENG>`
- **Auth**: `<API key env var, e.g. LINEAR_API_KEY — or the name of a configured Linear MCP server>`

Every call is Linear's GraphQL API, via an authenticated request with the configured key, or the
MCP server's matching tool if one is configured. Source for the fields below: Linear's published
schema, `packages/sdk/src/schema.graphql` in `github.com/linear/linear`.

## Fetch

`issue(id: "<id>")` query — `id` takes the UUID or the identifier (`ENG-123`). When
`intake.fetch` names a skill or agent, run that instead; this section is the fallback.

## Create an intake item

`issueCreate` mutation with `teamId`, `title`, `description`, using the template `/to-intake`
provides for the description.

Linear has no epic issue type; the epic is a Linear **project**. Per `intake.epic` (unset → ask):

- **link** — pass the project's id as `projectId` on `issueCreate`.
- **create** — first `projectCreate` with `name` and `teamIds`, then pass its id as `projectId`.
- **none** — no project.

Return the identifier and `issue.url`.

## Post a comment

`commentCreate` mutation with the issue id and a Markdown body.
