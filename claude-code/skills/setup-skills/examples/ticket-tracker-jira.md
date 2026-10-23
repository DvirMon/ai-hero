# Ticket tracker: Jira

Intake items for this repo live in Jira. `/to-intake` creates items, `/to-ticket` fetches them, `grill-with-docs` posts comments. No stage
edits a ticket description. Every later stage works from the domain-colocated workspace
`<domain-path>/docs/work/<slug>/`.

## Fetch

`GET /rest/api/3/issue/<key>`, or the MCP server's get-issue tool.

## Create an intake item

`POST /rest/api/3/issue` with `fields.project.key`, `fields.summary`, `fields.description`
(Atlassian Document Format) and `fields.issuetype` (Story / Task), using the template `/to-intake`
provides for the body. Or the MCP server's create-issue tool.

Parent epic, per `intake.epic` (unset → ask):

- **link** — set `fields.parent` to the existing epic. Read the field's shape from
  `GET /rest/api/3/issue/createmeta/<project>/issuetypes/<typeId>` for the item's type; do not
  assume it. No `parent` field there → stop: this type cannot sit under an epic in this project.
- **create** — first create the epic: pick its type from
  `GET /rest/api/3/issue/createmeta/<project>/issuetypes` (ask if it isn't clear by name), create
  it with `POST /rest/api/3/issue`, then link the item to it as above.
- **none** — no parent.

Return the item's key and `https://<site>/browse/<key>`.

## Post a comment

`POST /rest/api/3/issue/<key>/comment`. The body is **ADF**
(`{"type":"doc","version":1,"content":[...]}`), not plain text or Markdown.

## Configuration

Site: `<site>`. Project: `<PROJECT>`. Auth is the Jira MCP
server if one is configured, otherwise `curl` with the `JIRA_API_TOKEN` + `JIRA_EMAIL` env vars
(basic auth). Every call is Jira Cloud REST **v3**: `https://<site>/rest/api/3/...`.

Source for every endpoint below: Atlassian's OpenAPI spec,
`https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json`.
