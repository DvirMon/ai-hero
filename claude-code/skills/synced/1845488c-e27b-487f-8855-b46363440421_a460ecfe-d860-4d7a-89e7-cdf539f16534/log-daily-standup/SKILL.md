---
name: log-daily-standup
description: Turns a pasted or dictated free-text end-of-day recap (what I did today, what's still open, what's next) into a populated Notion Standup entry and updated Tasks. On first use it runs a one-time setup that connects Notion and writes a config file. Use whenever the user pastes or dictates a summary of their day, says "log my standup", "update my tasks from this", "here's what I did today", "set up standup logging", or gives a messy brain-dump of work done and work remaining, even if they don't mention Notion or standup explicitly.
compatibility: Requires the Notion MCP server (https://mcp.notion.com/mcp) with read and write access to the user's Standups and Tasks databases.
---

# Log daily standup from free text

Take a free-text recap of the day and reflect it in Notion: one Standup page for the date, existing Tasks updated, genuinely new Tasks created.

Nothing workspace-specific is hard-coded. Everything comes from the config file.

## Config

Path: `~/.config/log-daily-standup/config.json` (shared by Claude and Cursor; survives skill reinstalls).

```json
{
  "standups": {
    "dataSource": "collection://...",
    "templateUrl": "https://www.notion.so/...",
    "props": { "title": "Standup item", "date": "Date", "type": "Type", "tasks": "Tasks" },
    "titleValue": "Standup",
    "typeValue": "Standup"
  },
  "tasks": {
    "dataSource": "collection://...",
    "props": {
      "name": "Name", "status": "Status", "section": "Section",
      "dueDate": "Due date", "standup": "Standup"
    },
    "statuses": { "notStarted": "Not started", "next": "Up next", "inProgress": "In progress", "done": "Done" },
    "todaySection": "Today"
  },
  "timezone": "Asia/Jerusalem"
}
```

`props` and values map this skill's concepts to the user's actual Notion property and option names, so a renamed column doesn't break it.

## Step 0: load config or run setup

1. Read the config file. If it exists, validate it (see "Validate") and go to "Log a standup".
2. If missing, or the user says "set up" / "reconfigure", run **Setup**. After setup, continue with the recap if one was given.

## Setup

### 1. Notion connection

Check whether Notion tools are available (search, fetch, query data source, create pages, update page). Tool names differ by client.

If not, stop and tell the user to connect. Never pretend to write to Notion, and don't try to run the OAuth flow yourself.

**Claude Code:**
```
! claude mcp add --transport http notion https://mcp.notion.com/mcp
```
Then run `/mcp`, select `notion`, and complete the browser sign-in. Choose the right workspace. Restart or re-invoke the skill afterward.

**Claude.ai / Desktop:** Settings > Connectors > Notion.

**Cursor:** add to `.cursor/mcp.json` (or Settings > MCP), then complete sign-in:
```json
{ "mcpServers": { "notion": { "url": "https://mcp.notion.com/mcp" } } }
```

### 2. Find the databases

1. Search Notion for "Standups" and "Tasks". Fetch each candidate.
2. A Standups candidate has a date property and a relation to Tasks. A Tasks candidate has a status property, a section/select property and a relation to Standups.
3. If several candidates match or none do, ask the user to pick or paste the database URL. One question at a time.
4. Ask for the default standup page template URL (optional; skip if the database has a built-in default template).

### 3. Map properties

From the fetched schemas, fill `props`, `statuses`, `todaySection` with the real names. Auto-map exact or obvious matches. Ask only about ones you can't resolve.

### 4. Confirm and write

Show the resolved config summary (database names, mapped properties, timezone, template) and ask for a yes. Then create the directory and write the file. Do not write any Notion data during setup.

## Validate

Before each run, fetch both data sources and check every mapped property still exists. If the data source no longer resolves or a property is missing, say exactly what's off and re-run the relevant Setup step. Don't guess.

## Log a standup

A standup page body contains inline linked-database blocks (e.g. "Today's tasks", "Carried over", "Open items") plus Summary and Weekly sync text sections.

- Preserve the `<database ...>` blocks exactly. Never recreate or reorder them. Edit only the surrounding text.
- "Today's tasks" = Tasks whose Standup relation contains this standup page.
- "Carried over" = Tasks in the today section, not Done, whose Standup relation does not yet contain this standup page.

### Steps

1. **Date.** Use today in `config.timezone` unless the user names another date. Query Standups by date. If no page exists, create one from `templateUrl` with the date, title and type values set.
2. **Load context.** Query all Tasks where status != done so you can match against them.
3. **Parse the recap into:**
   - (a) a 2-4 sentence Summary of the day's work
   - (b) items finished or progressed
   - (c) items still open or planned next
4. **Show the plan and wait for a yes.** Before writing anything, list:
   - Tasks to mark Done / In progress (existing, with old and new status)
   - Existing tasks to carry over (link to today's standup)
   - New tasks to create (name, status, section, due date)
   - The Summary text

   Ask the user to confirm or correct. Do not write until they confirm.
5. **Write the Summary** into the Summary section of the page body. Don't touch the linked-database blocks. Match the tone and length of previous standups.
6. **Update matched tasks.** For finished or progressed items matching an existing open Task, update status (done, in progress, next).
7. **Carry-overs.** For still-open items matching an existing Task, append today's standup to its Standup relation. Fetch the current relation first and send the full list plus today's page, so earlier standups are not dropped. Keep section and status unchanged unless the user said otherwise. Do not create a duplicate row.
8. **New tasks.** For items with no matching row, create a Task with name, section = `todaySection`, status = not started (or next if the user says it's next), Standup = [today's standup], and due date if mentioned.
9. **Weekly sync.** Only touch it if the recap is explicitly weekly or the user asks.
10. **Report back.** Link today's standup page and list which tasks were created, updated, and carried over.

### Edge cases

- If it isn't clear whether an item is done or still open, ask. Do not guess status.
- If an item could match several existing Tasks, ask which one before changing anything.
- Prefer matching an existing Task over creating a new one. Match on meaning, not exact wording.
- Never delete or archive a Task. Carry-over is always a relation update, never a new row.
- Do not edit Done tasks unless the user says one was reopened.
- Dictated text contains filler and repeats ("um", restated sentences). Ignore filler, merge repeats.
