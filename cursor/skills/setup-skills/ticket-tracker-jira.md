# Ticket tracker: Jira

Intake tickets for this repo live in Jira. `to-ticket` is the only skill that writes here; every later stage reads the ticket once, then works from `docs/tickets/<slug>/`.

## Configuration

- **Base URL**: `<https://yourteam.atlassian.net>`
- **Project key**: `<KEY>`
- **Auth**: `<API token env var, e.g. JIRA_API_TOKEN — or the name of a configured Jira MCP server>`

## Conventions

- **Create a ticket**: `POST <baseUrl>/rest/api/3/issue` with `fields.project.key`, `fields.summary`, `fields.description` (Atlassian Document Format), `fields.issuetype.name` — via `curl` with the configured auth, or the MCP server's create-issue tool if one is configured.
- **Read a ticket**: `GET <baseUrl>/rest/api/3/issue/<key>`.
- **Comment on a ticket**: `POST <baseUrl>/rest/api/3/issue/<key>/comment`.
- **Ticket URL**: `<baseUrl>/browse/<key>`.

## When a skill says "create an intake ticket"

Create a Jira issue in the configured project using the template `to-ticket` provides for the body.

## When a skill says "fetch the intake ticket"

Fetch the Jira issue by key using the method configured above.
