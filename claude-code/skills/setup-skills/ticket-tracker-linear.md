# Ticket tracker: Linear

Intake tickets for this repo live in Linear. `to-ticket` is the only skill that writes here; every later stage reads the ticket once, then works from the domain-colocated workspace `<domain-path>/docs/work/<slug>/`.

## Configuration

- **Workspace**: `<workspace-slug>`
- **Team**: `<team key, e.g. ENG>`
- **Auth**: `<API key env var, e.g. LINEAR_API_KEY — or the name of a configured Linear MCP server>`

## Conventions

- **Create a ticket**: Linear's GraphQL API, `issueCreate` mutation with `teamId`, `title`, `description` — via an authenticated request with the configured key, or the MCP server's create-issue tool if one is configured.
- **Read a ticket**: `issue(id: "<id>")` query, or search by identifier (`ENG-123`).
- **Comment on a ticket**: `commentCreate` mutation.
- **Ticket URL**: returned as `issue.url` on creation.

## When a skill says "create an intake ticket"

Create a Linear issue on the configured team using the template `to-ticket` provides for the description.

## When a skill says "fetch the intake ticket"

Fetch the Linear issue by identifier using the method configured above.
