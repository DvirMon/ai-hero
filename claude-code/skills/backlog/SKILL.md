---
name: backlog
description: List open GitHub issues grouped by epic and ordered by pipeline readiness (ready-for-agent first). Use for "what's open", "backlog", "what can I work on", or "status of issues".
---

Run the script:

```bash
node .claude/skills/backlog/scripts/backlog.mjs
```

Then relay the tables, replacing the raw `gist` column with a
**What it is** column: one plain-English sentence per issue
saying what is wrong or missing and what changes for a user of
the table. No jargon, no issue numbers, no restating the title.
If the gist is empty or unclear, run `gh issue view <n>` first.
Epics get the same one-sentence line under their heading.

- Groups by epic via native GitHub sub-issues (`parent`). Issues with no parent go under "Standalone".
- Epics: `in-progress` first, then by their best-ranked child.
- Within a group, order is the pipeline rung:
  `ready-for-agent` → `needs:tasks` → `needs:grill` → `needs:triage` → unlabeled.
- The repo has no priority label; the rung is the priority.
- Read-only. Never starts work on an issue — ask which to take.
